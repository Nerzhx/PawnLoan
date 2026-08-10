# PawnLoan — Soroban Smart Contract

The on-chain core of PawnLoan: a **collateralized peer-to-peer lending protocol**
on Stellar. Borrowers escrow a token as collateral and request a loan denominated
in another token; lenders fund requests; borrowers repay principal + fixed
interest to reclaim collateral, or the lender liquidates the collateral after the
loan's due time.

Every value movement is a real on-chain [SEP-41 token](https://developers.stellar.org/docs/tokens/token-interface)
transfer executed by the contract, so the escrow is fully trustless — neither
party ever custodies the other's assets.

## Contract interface

| Function | Auth | Description |
|---|---|---|
| `initialize(admin)` | — | One-time init, sets the admin. |
| `request_loan(borrower, collateral_token, collateral_amount, loan_token, principal, interest_rate_bps, duration)` | borrower | Escrows collateral, creates a `Pending` loan, returns its id. |
| `fund_loan(lender, loan_id)` | lender | Sends principal to borrower, marks loan `Funded`, starts the clock. |
| `repay(loan_id)` | borrower | Pays principal + interest to lender, returns collateral, marks `Repaid`. |
| `liquidate(loan_id)` | lender | After `due_time`, seizes collateral, marks `Defaulted`. |
| `cancel(loan_id)` | borrower | Cancels an unfunded loan and returns collateral. |
| `get_loan(loan_id)` | — | Read a single loan. |
| `amount_owed(loan_id)` | — | Principal + interest currently owed. |
| `loans_of_borrower(borrower)` | — | All loans for an address. |
| `loan_count()` / `admin()` | — | Protocol metadata. |

Interest is fixed and expressed in **basis points** (1% = 100 bps): the repayment
is `principal + principal * interest_rate_bps / 10_000`.

### Loan lifecycle

```
request_loan ─▶ Pending ─fund_loan─▶ Funded ─repay─▶ Repaid
                   │                    │
                cancel             liquidate (after due_time)
                   ▼                    ▼
               Cancelled            Defaulted
```

## Prerequisites

- Rust (stable) with the Wasm target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
  for deployment (`cargo install --locked stellar-cli`, or `soroban` in older setups).

## Build & test

```bash
cd contracts
make test      # run the 14-test suite
make build     # produce target/wasm32-unknown-unknown/release/pawnloan.wasm
```

> **Windows note:** if your machine lacks the MSVC Windows SDK, build with the
> self-contained GNU toolchain, which bundles its own linker and import libs:
> ```bash
> rustup toolchain install stable-x86_64-pc-windows-gnu
> rustup target add wasm32-unknown-unknown --toolchain stable-x86_64-pc-windows-gnu
> LLD="$(rustc +stable-x86_64-pc-windows-gnu --print sysroot)/lib/rustlib/x86_64-pc-windows-gnu/bin/rust-lld.exe"
> CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUSTFLAGS="-Clinker=$LLD -Clink-self-contained=yes" \
>   cargo +stable-x86_64-pc-windows-gnu test --target x86_64-pc-windows-gnu
> ```

## Deploy to testnet

```bash
# 1. Configure an identity and fund it via friendbot.
stellar keys generate --global alice --network testnet --fund

# 2. Build and (optionally) optimize.
make build
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/pawnloan.wasm

# 3. Deploy — prints the Contract ID (C...).
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pawnloan.wasm \
  --source alice \
  --network testnet

# 4. Initialize with an admin.
stellar contract invoke \
  --id <CONTRACT_ID> --source alice --network testnet \
  -- initialize --admin $(stellar keys address alice)
```

Put the resulting `<CONTRACT_ID>` in the frontend `.env` as
`VITE_PAWNLOAN_CONTRACT_ID`, and a loan-token contract id (e.g. a testnet USDC
issuer's SAC, or the native XLM SAC) as `VITE_LOAN_TOKEN_ID`.

## Testing notes

The suite ([`src/test.rs`](pawnloan/src/test.rs)) deploys a real Stellar Asset
Contract as the SEP-41 token and exercises the full lifecycle — escrow, funding,
repayment with interest, time-advanced liquidation, cancellation, and every
guard (`SelfFunding`, `NotDueYet`, double-fund, zero amounts, invalid rate…).

```
test result: ok. 14 passed; 0 failed
```
