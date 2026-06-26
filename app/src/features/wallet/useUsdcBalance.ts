import { useCallback, useEffect, useState } from 'react';

import { getWalletBalance } from '../../lib/api';
import { useAuth } from '../../lib/privy/hooks';

export type BalanceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; usdc: string | null };

/**
 * Reads the wallet's USDC balance on Base via the backend
 * (GET /wallet/balance). RPC/network failures surface as an error state — the
 * UI never crashes. Returns `refresh` for the button + pull-to-refresh.
 */
export function useUsdcBalance(address?: string) {
  const { getAccessToken } = useAuth();
  const [state, setState] = useState<BalanceState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    if (!address) {
      setState({ status: 'ready', usdc: null });
      return;
    }
    setState({ status: 'loading' });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const result = await getWalletBalance(token, address);
      setState({ status: 'ready', usdc: result.balance });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [address, getAccessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
