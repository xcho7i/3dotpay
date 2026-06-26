import { useEffect, useRef, useState } from 'react';

import { patchWallet } from '../api';
import { useAuth, useEmbeddedWallet } from './hooks';

export type WalletSyncStatus = 'idle' | 'creating' | 'syncing' | 'synced' | 'error';

/**
 * After authentication: ensure the user has an embedded Ethereum wallet
 * (create one if missing), then persist its address to the backend via
 * PATCH /user/wallet. No private keys are ever read or stored — only the
 * public address is sent.
 */
export function useWalletSync(): {
  status: WalletSyncStatus;
  error: string | null;
  address?: string;
} {
  const { isReady, isAuthenticated, getAccessToken } = useAuth();
  const { wallets, create } = useEmbeddedWallet();
  const [status, setStatus] = useState<WalletSyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const syncedRef = useRef(false);

  const address = wallets[0]?.address as string | undefined;

  useEffect(() => {
    if (!isReady || !isAuthenticated || syncedRef.current) return;

    let cancelled = false;
    void (async () => {
      try {
        // 1. Ensure an embedded wallet exists. After create(), the hook's
        //    `wallets` updates and this effect re-runs to do the sync.
        if (wallets.length === 0) {
          setStatus('creating');
          await create();
          return;
        }

        const walletAddress = wallets[0]?.address;
        if (!walletAddress) return;

        // 2. Persist the public address to the backend.
        setStatus('syncing');
        const token = await getAccessToken();
        if (!token) throw new Error('Could not get access token');
        await patchWallet(token, walletAddress);

        if (!cancelled) {
          syncedRef.current = true;
          setStatus('synced');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, wallets.length, create, getAccessToken]);

  return { status, error, address };
}
