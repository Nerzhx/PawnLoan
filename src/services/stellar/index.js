/**
 * Stellar / Soroban service layer for PawnLoan.
 *
 * - `network`        active network config (RPC, passphrase, explorer)
 * - `wallet`         multi-wallet connect / sign via Stellar Wallets Kit
 * - `pawnloanClient` typed reads & writes against the deployed contract
 */
export * as wallet from './wallet';
export * as pawnloan from './pawnloanClient';
export {
  network,
  contractId,
  loanTokenId,
  isContractConfigured,
  txExplorerUrl,
  contractExplorerUrl,
} from './network';
