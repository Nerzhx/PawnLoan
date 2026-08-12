# Environment Configuration

This directory contains environment variable configuration for the app.

## Usage

Import the environment variables in your components:

```javascript
import ENV_VARS from '../config/env';

const rpcUrl = ENV_VARS.SOROBAN_RPC_URL;
const network = ENV_VARS.STELLAR_NETWORK;
```

`validateEnv()` (called from `main.jsx`) logs a warning for any missing
on-chain variable but never blocks rendering — the UI surfaces a
"not configured" state instead.

## Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your values (see `contracts/README.md` to deploy and get a contract id)
3. Restart the dev server so Vite picks up the new variables

## Available Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_STELLAR_NETWORK` | yes | `testnet` (default), `futurenet`, or `mainnet` |
| `VITE_SOROBAN_RPC_URL` | yes | Soroban RPC endpoint for the chosen network |
| `VITE_PAWNLOAN_CONTRACT_ID` | yes | Deployed PawnLoan contract id (starts with `C…`) |
| `VITE_LOAN_TOKEN_ID` | no | Default loan-token contract id (e.g. testnet USDC or the XLM SAC) |
| `VITE_API_BASE_URL` | no | Optional off-chain metadata/indexer base URL |
