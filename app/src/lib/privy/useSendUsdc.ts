import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useCallback } from 'react';

import { buildUsdcTransfer } from '../../features/payment/usdcTransfer';
import { env } from '../env';

/**
 * Privy-isolated hook to send USDC from the user's embedded wallet directly to a
 * recipient. 3DotPay never signs or holds funds — the wallet prompts the user to
 * confirm, signs locally, and broadcasts. No private keys are ever exposed.
 *
 * Uses the officially supported pattern: `wallet.getProvider()` → EIP-1193
 * `request({ method: 'eth_sendTransaction', params: [tx] })`.
 */
export function useSendUsdc() {
  const { wallets } = useEmbeddedEthereumWallet();

  const sendUsdc = useCallback(
    async ({ to, amountUsdc }: { to: string; amountUsdc: string }): Promise<string> => {
      const wallet = wallets[0];
      if (!wallet) throw new Error('No embedded wallet available');

      const tx = buildUsdcTransfer({
        from: wallet.address,
        tokenAddress: env.usdcAddress,
        to,
        amountUsdc,
        decimals: env.usdcDecimals,
        chainId: env.baseChainId,
      });

      const provider = await wallet.getProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
      });

      if (typeof txHash !== 'string') {
        throw new Error('Wallet did not return a transaction hash');
      }
      return txHash;
    },
    [wallets],
  );

  return { sendUsdc };
}
