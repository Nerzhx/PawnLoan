import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from '@creit.tech/stellar-wallets-kit';
import { network } from './network';

const NETWORK_MAP = {
  testnet: WalletNetwork.TESTNET,
  futurenet: WalletNetwork.FUTURENET,
  mainnet: WalletNetwork.PUBLIC,
};

let kit = null;

/**
 * Lazily construct the wallet kit. Deferred so it doesn't run at import time
 * (the kit touches `window`, which breaks SSR/tests).
 */
function getKit() {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: NETWORK_MAP[network.name] || WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kit;
}

const STORAGE_KEY = 'pawnloan:walletId';

/**
 * Open the wallet-selection modal, let the user pick a wallet, and return the
 * connected public key. Persists the chosen wallet for silent reconnects.
 */
export async function connect() {
  const k = getKit();
  return new Promise((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          localStorage.setItem(STORAGE_KEY, option.id);
          resolve(address);
        } catch (err) {
          reject(err);
        }
      },
      onClosed: (err) => reject(err || new Error('Wallet selection cancelled')),
    });
  });
}

/**
 * Reconnect to a previously selected wallet without showing the modal.
 * Returns the address, or null if none was remembered / it's unavailable.
 */
export async function restore() {
  const savedId = localStorage.getItem(STORAGE_KEY);
  if (!savedId) return null;
  try {
    const k = getKit();
    k.setWallet(savedId);
    const { address } = await k.getAddress();
    return address;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/** Forget the connected wallet. */
export function disconnect() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Sign a transaction XDR with the connected wallet. Returns the signed XDR
 * string ready to submit via the RPC server.
 */
export async function signTransaction(xdr) {
  const k = getKit();
  const { signedTxXdr } = await k.signTransaction(xdr, {
    networkPassphrase: network.passphrase,
  });
  return signedTxXdr;
}
