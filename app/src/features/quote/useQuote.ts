import { useCallback, useEffect, useState } from 'react';

import { createQuote, type CreateQuoteInput, type Quote } from '../../lib/api';
import { useAuth } from '../../lib/privy/hooks';

export type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; quote: Quote };

/**
 * Requests a quote from the backend once an amount is known. `refresh` re-quotes
 * (used after expiry). No request is made until `merchantAmount` is set.
 */
export function useQuote(input: {
  merchantId: string;
  merchantName?: string;
  merchantAmount?: string;
  rawQrPayload?: string;
}) {
  const { getAccessToken } = useAuth();
  const [state, setState] = useState<QuoteState>({ status: 'idle' });

  const refresh = useCallback(async () => {
    if (!input.merchantAmount) {
      setState({ status: 'idle' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const payload: CreateQuoteInput = {
        merchantId: input.merchantId,
        merchantName: input.merchantName,
        merchantAmount: input.merchantAmount,
        rawQrPayload: input.rawQrPayload,
      };
      const quote = await createQuote(token, payload);
      setState({ status: 'ready', quote });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [input.merchantId, input.merchantName, input.merchantAmount, input.rawQrPayload, getAccessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
