import { useRouter } from 'expo-router';
import { useState } from 'react';

import { submitPayment } from '../../lib/api';
import { useAuth, useEmbeddedWallet } from '../../lib/privy/hooks';
import { useSendUsdc } from '../../lib/privy/useSendUsdc';

export type PayPhase = 'idle' | 'signing' | 'submitting' | 'error';

export interface PayableQuote {
  quoteId: string;
  settlementAddress: string;
  amountUSDC: string;
}

/**
 * Orchestrates Pay Now:
 *  1. Privy embedded wallet signs + sends the USDC transfer (captures txHash).
 *  2. POST /payment with { quoteId, txHash } (backend validates + records).
 *  3. Navigate to ProcessingScreen.
 *
 * The backend never signs — funds move directly from the user's wallet.
 */
export function usePayQuote() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { address } = useEmbeddedWallet();
  const { sendUsdc } = useSendUsdc();

  const [phase, setPhase] = useState<PayPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const pay = async (quote: PayableQuote) => {
    setError(null);
    try {
      // 1. Wallet confirmation + on-chain send.
      setPhase('signing');
      const txHash = await sendUsdc({ to: quote.settlementAddress, amountUsdc: quote.amountUSDC });

      // 2. Notify backend.
      setPhase('submitting');
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const result = await submitPayment(token, {
        quoteId: quote.quoteId,
        txHash,
        walletAddress: address,
      });

      // 3. Processing screen.
      router.replace({
        pathname: '/processing',
        params: { transactionId: result.transactionId, txHash },
      });
    } catch (e) {
      setPhase('error');
      setError(e instanceof Error ? e.message : 'Payment failed');
    }
  };

  return { phase, error, pay, isBusy: phase === 'signing' || phase === 'submitting' };
}
