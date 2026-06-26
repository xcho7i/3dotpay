import { PrivyProvider as BasePrivyProvider } from '@privy-io/expo';
import { type ReactNode } from 'react';

import { env } from '../env';

/**
 * App-wide Privy provider. All Privy configuration lives here so the rest of the
 * app never imports the SDK directly.
 *
 * TODO: pass `supportedChains={[base]}` (viem) once chain/tx work lands, so
 * embedded wallets are configured for Base specifically.
 */
export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <BasePrivyProvider appId={env.privyAppId} clientId={env.privyClientId}>
      {children}
    </BasePrivyProvider>
  );
}
