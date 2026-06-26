import { useEmbeddedEthereumWallet, usePrivy } from '@privy-io/expo';

/**
 * Thin wrappers so non-auth code (e.g. the Home screen) can consume Privy state
 * without importing the SDK directly — keeping Privy isolated to src/lib/privy
 * and src/features/auth.
 */

/** Pull the user's email out of Privy's linked accounts (loose narrowing). */
function extractEmail(user: ReturnType<typeof usePrivy>['user']): string | undefined {
  const accounts = ((user as { linked_accounts?: unknown } | null)?.linked_accounts ?? []) as Array<{
    type?: string;
    address?: string;
  }>;
  return accounts.find((a) => a.type === 'email')?.address;
}

export function useAuth() {
  const { user, isReady, error, logout, getAccessToken } = usePrivy();
  return {
    user,
    isReady,
    error,
    logout,
    getAccessToken,
    isAuthenticated: !!user,
    email: extractEmail(user),
  };
}

export function useEmbeddedWallet() {
  const { wallets, create } = useEmbeddedEthereumWallet();
  const address = wallets[0]?.address as string | undefined;
  return { wallets, address, hasWallet: wallets.length > 0, create };
}
