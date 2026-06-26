/**
 * Public runtime config. Only EXPO_PUBLIC_* vars are available in the bundle —
 * never put secrets here.
 */
export const env = {
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  /** Optional Privy app client id (created in the Privy dashboard under Clients). */
  privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID || undefined,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  baseChainId: Number(process.env.EXPO_PUBLIC_BASE_CHAIN_ID ?? '8453'),
} as const;
