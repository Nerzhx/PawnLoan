# PawnLoan

**Trustless, collateralized peer-to-peer lending on [Stellar](https://stellar.org).**

PawnLoan is a lending protocol built as a [Soroban](https://developers.stellar.org/docs/build/smart-contracts)
smart contract. A borrower locks a token as **collateral** and requests a loan
denominated in another token. A lender funds the request; the principal is sent
to the borrower while the collateral stays escrowed **inside the contract**. The
borrower repays principal + fixed interest before the due time to reclaim the
collateral — otherwise the lender may liquidate and seize it.

Every value transfer is a real on-chain [SEP-41 token](https://developers.stellar.org/docs/tokens/token-interface)
movement executed by the contract, so the escrow is fully trustless: **neither
party ever custodies the other's assets.**

```
 request_loan ─▶ Pending ─fund_loan─▶ Funded ─repay─▶ Repaid
                    │                    │
                 cancel             liquidate (after due_time)
                    ▼                    ▼
                Cancelled            Defaulted
```

## Repository layout

```
.
├── contracts/                 # Soroban smart contract (Rust)
│   ├── pawnloan/
│   │   └── src/
│   │       ├── lib.rs         # contract entry points & lifecycle logic
│   │       ├── types.rs       # Loan, LoanStatus, storage keys
│   │       ├── error.rs       # typed contract errors
│   │       └── test.rs        # 14-test suite (full lifecycle + guards)
│   ├── Makefile               # build / test / lint / optimize
│   └── README.md              # contract interface & deployment guide
└── src/                       # React + Vite frontend
    ├── services/stellar/      # on-chain integration layer
    │   ├── network.js         # network config (RPC, passphrase, explorer)
    │   ├── wallet.js          # multi-wallet connect/sign (Stellar Wallets Kit)
    │   └── pawnloanClient.js  # typed contract reads & writes
    ├── hooks/useWallet.js     # wallet connection hook
    └── pages/dashboard/WalletPage.jsx  # on-chain loan dApp UI
```

## Smart contract

The contract is the source of truth. Its interface:

| Function | Auth | Description |
|---|---|---|
| `initialize(admin)` | — | One-time init. |
| `request_loan(borrower, collateral_token, collateral_amount, loan_token, principal, interest_rate_bps, duration)` | borrower | Escrows collateral, opens a `Pending` loan, returns its id. |
| `fund_loan(lender, loan_id)` | lender | Sends principal to the borrower, marks `Funded`, starts the clock. |
| `repay(loan_id)` | borrower | Pays principal + interest to the lender, returns collateral, marks `Repaid`. |
| `liquidate(loan_id)` | lender | After `due_time`, seizes collateral, marks `Defaulted`. |
| `cancel(loan_id)` | borrower | Cancels an unfunded request and returns collateral. |
| `get_loan` / `amount_owed` / `loans_of_borrower` / `loan_count` / `admin` | — | Read-only views. |

Interest is fixed and expressed in **basis points** (1% = 100 bps):
`repayment = principal + principal * interest_rate_bps / 10_000`.

Full details, storage model, and per-function docs are in
[`contracts/README.md`](contracts/README.md).

### Build & test the contract

```bash
cd contracts
make test      # 14 tests: escrow, funding, repay-with-interest, liquidation, guards
make build     # produce target/wasm32-unknown-unknown/release/pawnloan.wasm
```

```
test result: ok. 14 passed; 0 failed
```

The suite deploys a real Stellar Asset Contract as the SEP-41 token and
exercises the entire lifecycle, including time-advanced liquidation and every
guard (`SelfFunding`, `NotDueYet`, double-fund, zero amounts, invalid rate…).

## Frontend

A React 19 + Vite dApp that talks to the deployed contract over Soroban RPC and
signs transactions with the user's Stellar wallet.

- **Wallet** — [@creit.tech/stellar-wallets-kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
  supports Freighter, xBull, Albedo, Lobstr, and more.
- **Contract client** — [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk):
  reads via `simulateTransaction`, writes via `prepareTransaction` → wallet-sign
  → submit → poll to finality.
- **UI** — the [Wallet & Loans page](src/pages/dashboard/WalletPage.jsx) lets a
  connected account request, fund, repay, cancel, and liquidate loans, with
  live status and explorer links.

### Getting started

```bash
npm install
cp .env.example .env.local     # then set VITE_PAWNLOAN_CONTRACT_ID (see below)
npm run dev                    # http://localhost:5173
```

### Configure the deployed contract

After deploying (steps in [`contracts/README.md`](contracts/README.md)), set in
`.env.local`:

```bash
VITE_STELLAR_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_PAWNLOAN_CONTRACT_ID=C...     # your deployed contract id
VITE_LOAN_TOKEN_ID=C...            # default loan token (e.g. testnet USDC or XLM SAC)
```

Until a contract id is set, the Wallet page shows a "not configured" notice
instead of failing.

### Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint
npm run test     # vitest unit tests
```

## Tech stack

| Layer | Tech |
|---|---|
| Smart contract | Rust, `soroban-sdk` 22, SEP-41 token interface |
| Chain access | `@stellar/stellar-sdk` (Soroban RPC) |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| Frontend | React 19, Vite 7, Redux Toolkit, Tailwind CSS |

## License

[MIT](LICENSE)
