/**
 * Environment configuration with validation and fallback defaults.
 *
 * PawnLoan is an on-chain protocol: the Soroban contract is the source of
 * truth. The API base URL is optional (off-chain metadata/indexer only).
 */

const ENV_VARS = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  STELLAR_NETWORK: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  SOROBAN_RPC_URL:
    import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  PAWNLOAN_CONTRACT_ID: import.meta.env.VITE_PAWNLOAN_CONTRACT_ID || '',
  LOAN_TOKEN_ID: import.meta.env.VITE_LOAN_TOKEN_ID || '',
};

// Variables required for on-chain features to work. Missing values only warn —
// the UI still renders and surfaces a "not configured" state.
const REQUIRED_VARS = [
  'VITE_STELLAR_NETWORK',
  'VITE_SOROBAN_RPC_URL',
  'VITE_PAWNLOAN_CONTRACT_ID',
];

/**
 * Validates required environment variables and logs warnings for missing ones.
 */
export function validateEnv() {
  const missing = [];

  REQUIRED_VARS.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.warn(
      '⚠️  Missing Stellar environment variables:\n' +
      missing.map(v => `   - ${v}`).join('\n') +
      '\n\nOn-chain features need these set in .env.local. ' +
      'See .env.example and contracts/README.md for deployment steps.'
    );
  }

  return missing.length === 0;
}

export default ENV_VARS;
