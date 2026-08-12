import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';
import {
  getAllLoans,
  requestLoan,
  fundLoan,
  repay,
  liquidate,
  cancel,
  amountOwed,
} from '../../services/stellar/pawnloanClient';
import {
  isContractConfigured,
  contractId,
  loanTokenId,
  network,
  txExplorerUrl,
  contractExplorerUrl,
} from '../../services/stellar/network';
import { toastSuccess, toastError } from '../../utils/toast';
import { Button } from '../../components/common/button';
import Input from '../../components/common/input';

// Stellar Asset Contracts (incl. native XLM) use 7 decimals. Amounts are
// entered/displayed in whole tokens and converted to i128 base units here.
const DECIMALS = 7;
const SCALE = 10n ** BigInt(DECIMALS);

function toBaseUnits(amount) {
  const [whole, frac = ''] = String(amount).trim().split('.');
  const fracPadded = (frac + '0'.repeat(DECIMALS)).slice(0, DECIMALS);
  return (BigInt(whole || '0') * SCALE + BigInt(fracPadded || '0')).toString();
}

function fromBaseUnits(base) {
  const value = BigInt(base || '0');
  const whole = value / SCALE;
  const frac = (value % SCALE).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : `${whole}`;
}

const shortAddr = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '');
const nowSeconds = () => Math.floor(Date.now() / 1000);
const fmtTime = (t) => (t ? new Date(t * 1000).toLocaleString() : '—');

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800',
  Funded: 'bg-blue-100 text-blue-800',
  Repaid: 'bg-green-100 text-green-800',
  Defaulted: 'bg-red-100 text-red-800',
  Cancelled: 'bg-slate-200 text-slate-600',
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

const EMPTY_FORM = {
  collateralToken: loanTokenId || '',
  collateralAmount: '',
  loanToken: loanTokenId || '',
  principal: '',
  interestRatePercent: '',
  durationDays: '',
};

export default function WalletPage() {
  const { address, isConnected, connecting, restoring, connect, disconnect } = useWallet();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null); // `${action}:${loanId}` while a tx runs
  const [form, setForm] = useState(EMPTY_FORM);
  const [owed, setOwed] = useState({}); // loanId -> base units owed

  const refresh = useCallback(async () => {
    if (!isContractConfigured) return;
    setLoading(true);
    try {
      const all = await getAllLoans();
      setLoans(all);
      // Fetch amount owed for funded loans so borrowers see the payoff figure.
      const funded = all.filter((l) => l.status === 'Funded');
      const owedEntries = await Promise.all(
        funded.map(async (l) => [l.id, await amountOwed(l.id).catch(() => l.principal)])
      );
      setOwed(Object.fromEntries(owedEntries));
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const runTx = async (key, label, fn) => {
    setBusy(key);
    try {
      const { hash } = await fn();
      toastSuccess(`${label} confirmed`);
      if (hash) {
        // Surface the explorer link for reviewers/users.
        console.info(`${label}:`, txExplorerUrl(hash));
      }
      await refresh();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!isConnected) return toastError('Connect a wallet first.');
    const { collateralToken, collateralAmount, loanToken, principal, interestRatePercent, durationDays } = form;
    if (!collateralToken || !loanToken || !collateralAmount || !principal || !durationDays) {
      return toastError('Fill in token addresses, amounts and duration.');
    }
    const ok = await runTx('request:new', 'Loan request', async () => {
      const res = await requestLoan(address, {
        collateralToken: collateralToken.trim(),
        collateralAmount: toBaseUnits(collateralAmount),
        loanToken: loanToken.trim(),
        principal: toBaseUnits(principal),
        interestRateBps: Math.round(Number(interestRatePercent || 0) * 100),
        duration: Math.round(Number(durationDays) * 86400),
      });
      return res;
    });
    if (ok) setForm(EMPTY_FORM);
  };

  // ----- render -----

  if (!isContractConfigured) {
    return (
      <div>
        <Header />
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">Contract not configured</h2>
          <p className="mt-1 text-sm text-amber-800">
            Set <code className="rounded bg-amber-100 px-1">VITE_PAWNLOAN_CONTRACT_ID</code> (and
            optionally <code className="rounded bg-amber-100 px-1">VITE_LOAN_TOKEN_ID</code>) in
            <code className="rounded bg-amber-100 px-1">.env.local</code> after deploying the
            Soroban contract. See <code className="rounded bg-amber-100 px-1">contracts/README.md</code>
            for the deploy steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      {/* Wallet connection bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm">
          <div className="text-slate-500">Contract</div>
          <a
            href={contractExplorerUrl(contractId)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-blue-700 hover:underline"
          >
            {shortAddr(contractId)}
          </a>
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
            {network.name}
          </span>
        </div>
        {restoring ? (
          <span className="text-sm text-slate-400">…</span>
        ) : isConnected ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-slate-700">{shortAddr(address)}</span>
            <Button variant="secondary" fullWidth={false} onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button fullWidth={false} loading={connecting} onClick={connect}>
            Connect Wallet
          </Button>
        )}
      </div>

      {isConnected && (
        <RequestForm
          form={form}
          onField={onField}
          onSubmit={handleRequest}
          submitting={busy === 'request:new'}
        />
      )}

      {/* Loans list */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Loans</h2>
        <Button variant="secondary" fullWidth={false} loading={loading} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {loans.length === 0 && !loading ? (
        <p className="mt-4 text-sm text-slate-500">
          No loans yet. {isConnected ? 'Create one above.' : 'Connect a wallet to get started.'}
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              address={address}
              owed={owed[loan.id]}
              busy={busy}
              onFund={() => runTx(`fund:${loan.id}`, 'Fund', () => fundLoan(address, loan.id))}
              onRepay={() => runTx(`repay:${loan.id}`, 'Repayment', () => repay(address, loan.id))}
              onCancel={() => runTx(`cancel:${loan.id}`, 'Cancellation', () => cancel(address, loan.id))}
              onLiquidate={() =>
                runTx(`liquidate:${loan.id}`, 'Liquidation', () => liquidate(address, loan.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Wallet &amp; Loans</h1>
      <p className="mt-1 text-slate-500">
        Connect a Stellar wallet to request, fund, repay, and liquidate on-chain pawn loans.
      </p>
    </div>
  );
}

function RequestForm({ form, onField, onSubmit, submitting }) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Request a loan</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="collateralToken"
          label="Collateral token (C…)"
          placeholder="Contract address"
          value={form.collateralToken}
          onChange={onField('collateralToken')}
        />
        <Input
          id="collateralAmount"
          label="Collateral amount"
          type="number"
          placeholder="e.g. 100"
          value={form.collateralAmount}
          onChange={onField('collateralAmount')}
        />
        <Input
          id="loanToken"
          label="Loan token (C…)"
          placeholder="Contract address"
          value={form.loanToken}
          onChange={onField('loanToken')}
        />
        <Input
          id="principal"
          label="Principal"
          type="number"
          placeholder="e.g. 50"
          value={form.principal}
          onChange={onField('principal')}
        />
        <Input
          id="interestRatePercent"
          label="Interest rate (%)"
          type="number"
          placeholder="e.g. 5"
          value={form.interestRatePercent}
          onChange={onField('interestRatePercent')}
        />
        <Input
          id="durationDays"
          label="Duration (days)"
          type="number"
          placeholder="e.g. 30"
          value={form.durationDays}
          onChange={onField('durationDays')}
        />
      </div>
      <div className="mt-5 w-44">
        <Button type="submit" loading={submitting}>
          Request Loan
        </Button>
      </div>
    </form>
  );
}

function LoanCard({ loan, address, owed, busy, onFund, onRepay, onCancel, onLiquidate }) {
  const isBorrower = address && loan.borrower === address;
  const isLender = address && loan.lender === address;
  const pastDue = loan.dueTime && nowSeconds() >= loan.dueTime;
  const anyBusy = busy && busy.endsWith(`:${loan.id}`);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Loan #{loan.id}</span>
            <StatusBadge status={loan.status} />
          </div>
          <div className="mt-2 grid gap-x-8 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
            <span>
              Principal: <strong>{fromBaseUnits(loan.principal)}</strong>
            </span>
            <span>
              Collateral: <strong>{fromBaseUnits(loan.collateralAmount)}</strong>
            </span>
            <span>Interest: {(loan.interestRateBps / 100).toFixed(2)}%</span>
            <span>Duration: {Math.round(loan.duration / 86400)}d</span>
            <span>Borrower: <span className="font-mono">{shortAddr(loan.borrower)}</span></span>
            <span>Lender: <span className="font-mono">{loan.lender ? shortAddr(loan.lender) : '—'}</span></span>
            {loan.status === 'Funded' && (
              <>
                <span>Due: {fmtTime(loan.dueTime)}</span>
                {owed != null && (
                  <span>
                    Owed: <strong>{fromBaseUnits(owed)}</strong>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {loan.status === 'Pending' && !isBorrower && (
          <div className="w-32">
            <Button loading={busy === `fund:${loan.id}`} onClick={onFund}>
              Fund
            </Button>
          </div>
        )}
        {loan.status === 'Pending' && isBorrower && (
          <div className="w-32">
            <Button
              variant="secondary"
              loading={busy === `cancel:${loan.id}`}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
        {loan.status === 'Funded' && isBorrower && (
          <div className="w-32">
            <Button loading={busy === `repay:${loan.id}`} onClick={onRepay}>
              Repay
            </Button>
          </div>
        )}
        {loan.status === 'Funded' && isLender && pastDue && (
          <div className="w-32">
            <Button
              variant="secondary"
              loading={busy === `liquidate:${loan.id}`}
              onClick={onLiquidate}
            >
              Liquidate
            </Button>
          </div>
        )}
        {loan.status === 'Funded' && isLender && !pastDue && (
          <span className="self-center text-xs text-slate-400">
            Liquidation available after due date
          </span>
        )}
        {anyBusy && <span className="self-center text-xs text-slate-400">Submitting…</span>}
      </div>
    </div>
  );
}
