import { useCallback, useEffect, useState } from 'react';

import { ApiError, getTransactions, type Transaction } from '../../lib/api';
import { useAuth } from '../../lib/privy/hooks';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; transactions: Transaction[] };

/**
 * Loads the user's transactions from the backend. The backend endpoint is a
 * stub for now (501 NOT_IMPLEMENTED) — that is treated as "no transactions yet"
 * so the UI shows an empty state rather than an error.
 */
export function useTransactions() {
  const { getAccessToken } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const { transactions } = await getTransactions(token);
      setState({ status: 'ready', transactions });
    } catch (err) {
      // Endpoint not built yet → show empty, not an error.
      if (err instanceof ApiError && err.code === 'NOT_IMPLEMENTED') {
        setState({ status: 'ready', transactions: [] });
        return;
      }
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
