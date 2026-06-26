import { PrivyProvider as BasePrivyProvider } from '@privy-io/expo';
import { type ReactNode } from 'react';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../env';

// Configure embedded wallets for the chain we use, so sendTransaction/switchChain
// to Base is supported.
const chain = env.baseChainId === baseSepolia.id ? baseSepolia : base;

/**
 * App-wide Privy provider. All Privy configuration lives here so the rest of the
 * app never imports the SDK directly.
 */
export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <BasePrivyProvider appId={env.privyAppId} clientId={env.privyClientId} supportedChains={[chain]}>
      {children}
    </BasePrivyProvider>
  );
}
