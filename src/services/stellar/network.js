import { Networks } from '@stellar/stellar-sdk';
import ENV_VARS from '../../config/env';

/**
 * Maps our env network name to the Soroban RPC URL and network passphrase.
 * Testnet is the default target for the Wave / SCF review.
 */
const NETWORKS = {
  testnet: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    passphrase: Networks.TESTNET,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    explorer: 'https://stellar.expert/explorer/testnet',
  },
  futurenet: {
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    passphrase: Networks.FUTURENET,
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    explorer: 'https://stellar.expert/explorer/futurenet',
  },
  mainnet: {
    rpcUrl: 'https://soroban-rpc.mainnet.stellar.gateway.fm',
    passphrase: Networks.PUBLIC,
    horizonUrl: 'https://horizon.stellar.org',
    explorer: 'https://stellar.expert/explorer/public',
  },
};

const key = (ENV_VARS.STELLAR_NETWORK || 'testnet').toLowerCase();
const selected = NETWORKS[key] || NETWORKS.testnet;

/** Active network configuration derived from VITE_STELLAR_NETWORK. */
export const network = {
  name: key,
  // Allow an explicit RPC override from env, else the per-network default.
  rpcUrl: ENV_VARS.SOROBAN_RPC_URL || selected.rpcUrl,
  passphrase: selected.passphrase,
  horizonUrl: selected.horizonUrl,
  explorer: selected.explorer,
};

/** The deployed PawnLoan contract id, or '' if not yet configured. */
export const contractId = ENV_VARS.PAWNLOAN_CONTRACT_ID;

/** Default loan-denomination token contract id. */
export const loanTokenId = ENV_VARS.LOAN_TOKEN_ID;

/** True when a contract id is present and looks like a Soroban contract addr. */
export const isContractConfigured = /^C[A-Z2-7]{55}$/.test(contractId);

/** Build a Stellar Expert link for a tx hash on the active network. */
export function txExplorerUrl(hash) {
  return `${network.explorer}/tx/${hash}`;
}

/** Build a Stellar Expert link for a contract on the active network. */
export function contractExplorerUrl(id = contractId) {
  return `${network.explorer}/contract/${id}`;
}
