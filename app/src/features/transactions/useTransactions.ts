import { useCallback, useEffect, useState } from 'react';

import { getTransactions, type Transaction } from '../../lib/api';
import { useAuth } from '../../lib/privy/hooks';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; transactions: Transaction[] };

const PAGE_SIZE = 20;

/**
 * Loads the user's transactions (cursor-paginated, newest first). `loadMore`
 * appends the next page; `loadingMore`/`hasMore` drive the list footer so
 * pagination never breaks the UI.
 */
export function useTransactions() {
  const { getAccessToken } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const { transactions, nextCursor } = await getTransactions(token, { limit: PAGE_SIZE });
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
      setState({ status: 'ready', transactions });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [getAccessToken]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || state.status !== 'ready') return;
    setLoadingMore(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const { transactions, nextCursor } = await getTransactions(token, {
        limit: PAGE_SIZE,
        cursor,
      });
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
      setState((prev) =>
        prev.status === 'ready'
          ? { status: 'ready', transactions: [...prev.transactions, ...transactions] }
          : prev,
      );
    } catch {
      // Keep what we have; a failed "load more" shouldn't blow away the list.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, state.status, getAccessToken, cursor]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load, loadMore, hasMore, loadingMore };
}
