import { useCallback, useEffect, useSyncExternalStore } from 'react';
import * as walletService from '../services/stellar/wallet';
import { toastError } from '../utils/toast';

/**
 * Shared wallet state. Kept in a module-level store (not React state) so every
 * component that calls `useWallet` sees the same connection without a context
 * provider. Backed by `useSyncExternalStore` for concurrent-safe reads.
 */
let state = { address: null, connecting: false, restoring: true };
const listeners = new Set();

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((notify) => notify());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// Silent reconnect to a previously chosen wallet — run once, memoized.
let restorePromise = null;
function ensureRestore() {
  if (!restorePromise) {
    restorePromise = walletService
      .restore()
      .then((address) => setState({ address, restoring: false }))
      .catch(() => setState({ restoring: false }));
  }
  return restorePromise;
}

/**
 * Wallet connection hook.
 *
 * @returns {{
 *   address: string|null,
 *   isConnected: boolean,
 *   connecting: boolean,
 *   restoring: boolean,
 *   connect: () => Promise<string|null>,
 *   disconnect: () => void,
 * }}
 */
export function useWallet() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    ensureRestore();
  }, []);

  const connect = useCallback(async () => {
    setState({ connecting: true });
    try {
      const address = await walletService.connect();
      setState({ address, connecting: false });
      return address;
    } catch (err) {
      setState({ connecting: false });
      // A user closing the picker isn't an error worth shouting about.
      if (err && !/cancel/i.test(err.message || '')) {
        toastError(err);
      }
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    walletService.disconnect();
    setState({ address: null });
  }, []);

  return {
    address: snapshot.address,
    isConnected: !!snapshot.address,
    connecting: snapshot.connecting,
    restoring: snapshot.restoring,
    connect,
    disconnect,
  };
}

export default useWallet;
