import {
  rpc,
  Contract,
  Account,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { network, contractId, isContractConfigured } from './network';
import { signTransaction } from './wallet';

/**
 * Thin client around the deployed PawnLoan Soroban contract.
 *
 * Reads go through `simulateTransaction` (no signing, no fee). Writes are
 * built, prepared (simulation assembles the Soroban footprint + auth), signed
 * by the connected wallet, submitted, and polled to finality.
 */

const server = new rpc.Server(network.rpcUrl, {
  allowHttp: network.rpcUrl.startsWith('http://'),
});

// A valid but unfunded account used only as the source for read simulations —
// simulation never checks existence or sequence, so the all-zero account works.
// This is the canonical strkey for the all-zeros ed25519 public key.
const READ_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

// Comfortable inclusion fee; prepareTransaction adds the computed resource fee.
const FEE = '1000000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function requireConfigured() {
  if (!isContractConfigured) {
    throw new Error(
      'PawnLoan contract is not configured. Set VITE_PAWNLOAN_CONTRACT_ID in ' +
        '.env.local — see contracts/README.md to deploy.'
    );
  }
}

function contract() {
  return new Contract(contractId);
}

// ----- ScVal encoding helpers -----

const toAddress = (a) => nativeToScVal(a, { type: 'address' });
const toI128 = (v) => nativeToScVal(typeof v === 'bigint' ? v : BigInt(v), { type: 'i128' });
const toU64 = (v) => nativeToScVal(typeof v === 'bigint' ? v : BigInt(v), { type: 'u64' });
const toU32 = (v) => nativeToScVal(Number(v), { type: 'u32' });

// ----- result normalization -----

/** Unit-variant contract enums decode as `["Pending"]`; flatten to the tag. */
function normalizeStatus(status) {
  if (Array.isArray(status)) return status[0];
  if (status && typeof status === 'object') return Object.keys(status)[0];
  return String(status);
}

/**
 * Convert a decoded on-chain Loan into a plain, serializable object.
 * BigInts become strings so the value is safe to keep in Redux state.
 */
function normalizeLoan(raw) {
  if (!raw) return null;
  return {
    id: Number(raw.id),
    borrower: raw.borrower,
    lender: raw.lender ?? null,
    collateralToken: raw.collateral_token,
    collateralAmount: (raw.collateral_amount ?? 0n).toString(),
    loanToken: raw.loan_token,
    principal: (raw.principal ?? 0n).toString(),
    interestRateBps: Number(raw.interest_rate_bps),
    duration: Number(raw.duration),
    startTime: Number(raw.start_time),
    dueTime: Number(raw.due_time),
    status: normalizeStatus(raw.status),
  };
}

// ----- core read / write -----

/** Simulate a read-only contract call and return the decoded native value. */
async function read(method, ...args) {
  requireConfigured();
  const source = new Account(READ_SOURCE, '0');
  const tx = new TransactionBuilder(source, {
    fee: FEE,
    networkPassphrase: network.passphrase,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new Error(`Simulation of ${method} failed: ${sim.error || 'unknown error'}`);
  }
  return scValToNative(sim.result.retval);
}

/**
 * Build, prepare, sign (via the connected wallet), submit, and confirm a
 * state-changing contract call. `from` is the wallet address paying fees and
 * providing authorization; it must match the address the contract method
 * requires auth from, so a single envelope signature covers the whole call.
 *
 * Resolves to `{ hash, returnValue }` where returnValue is the decoded result
 * (or null if the method returns nothing).
 */
async function write(from, method, ...args) {
  requireConfigured();
  const account = await server.getAccount(from);
  const built = new TransactionBuilder(account, {
    fee: FEE,
    networkPassphrase: network.passphrase,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(built);
  const signedXdr = await signTransaction(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, network.passphrase);

  const sent = await server.sendTransaction(signedTx);
  if (sent.status === 'ERROR') {
    throw new Error(`Failed to submit ${method}: ${JSON.stringify(sent.errorResult)}`);
  }

  let result = await server.getTransaction(sent.hash);
  for (let i = 0; result.status === rpc.Api.GetTransactionStatus.NOT_FOUND && i < 30; i++) {
    await sleep(1000);
    result = await server.getTransaction(sent.hash);
  }

  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction ${sent.hash} did not succeed: ${result.status}`);
  }

  const returnValue =
    result.returnValue != null ? scValToNative(result.returnValue) : null;
  return { hash: sent.hash, returnValue };
}

// ----- reads -----

/** Fetch a single loan by id, or null if it does not exist. */
export async function getLoan(id) {
  try {
    return normalizeLoan(await read('get_loan', toU64(id)));
  } catch {
    // LoanNotFound surfaces as a simulation error — treat as "no such loan".
    return null;
  }
}

/** Highest loan id issued so far (also the total loan count). */
export async function loanCount() {
  return Number(await read('loan_count'));
}

/** Principal + interest currently owed on a loan, as a string. */
export async function amountOwed(id) {
  return (await read('amount_owed', toU64(id))).toString();
}

/** Every loan belonging to a borrower address. */
export async function loansOfBorrower(address) {
  const loans = await read('loans_of_borrower', toAddress(address));
  return (loans || []).map(normalizeLoan);
}

/** All loans, newest id first. Convenience over loanCount + getLoan. */
export async function getAllLoans() {
  const count = await loanCount();
  const ids = Array.from({ length: count }, (_, i) => count - i);
  const loans = await Promise.all(ids.map((id) => getLoan(id)));
  return loans.filter(Boolean);
}

/** The contract administrator address. */
export async function getAdmin() {
  return read('admin');
}

// ----- writes -----

/**
 * Request a loan: escrows `collateralAmount` of the collateral token and opens
 * a pending request. Resolves to `{ hash, loanId }`.
 */
export async function requestLoan(from, params) {
  const {
    collateralToken,
    collateralAmount,
    loanToken,
    principal,
    interestRateBps,
    duration,
  } = params;
  const { hash, returnValue } = await write(
    from,
    'request_loan',
    toAddress(from),
    toAddress(collateralToken),
    toI128(collateralAmount),
    toAddress(loanToken),
    toI128(principal),
    toU32(interestRateBps),
    toU64(duration)
  );
  return { hash, loanId: returnValue != null ? Number(returnValue) : null };
}

/** Fund a pending loan; principal flows to the borrower. */
export async function fundLoan(from, loanId) {
  return write(from, 'fund_loan', toAddress(from), toU64(loanId));
}

/** Repay a funded loan (principal + interest) and reclaim collateral. */
export async function repay(from, loanId) {
  return write(from, 'repay', toU64(loanId));
}

/** Liquidate a defaulted loan after its due time; seizes collateral. */
export async function liquidate(from, loanId) {
  return write(from, 'liquidate', toU64(loanId));
}

/** Cancel an unfunded loan request and return the escrowed collateral. */
export async function cancel(from, loanId) {
  return write(from, 'cancel', toU64(loanId));
}

export { server };
