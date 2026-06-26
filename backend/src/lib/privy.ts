import { PrivyClient, type User } from '@privy-io/node';

import { env } from '../config/env.js';

/** Minimal identity/profile we need from Privy. */
export interface PrivyUserInfo {
  privyUserId: string;
  email?: string;
  walletAddress?: string;
}

/** Verifier seam — real impl wraps the Privy SDK; tests provide a mock. */
export interface PrivyAuth {
  /** Verify a Privy access token; returns the Privy user DID. Throws if invalid. */
  verifyAccessToken(token: string): Promise<{ userId: string }>;
  /** Fetch a user's email + embedded EVM wallet from Privy by DID. */
  getUser(userId: string): Promise<PrivyUserInfo>;
}

let client: PrivyClient | undefined;

function getClient(): PrivyClient {
  if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
    throw new Error('Privy is not configured: set PRIVY_APP_ID and PRIVY_APP_SECRET.');
  }
  client ??= new PrivyClient({ appId: env.PRIVY_APP_ID, appSecret: env.PRIVY_APP_SECRET });
  return client;
}

/** Loose view of a linked account — the SDK union is large; we only read a few fields. */
type LinkedAccountLite = {
  type?: string;
  address?: string;
  chain_type?: string;
  wallet_client?: string;
};

/** Pull email + embedded EVM wallet address out of a Privy User's linked accounts. */
function extractUserInfo(user: User): PrivyUserInfo {
  const accounts = ((user as { linked_accounts?: unknown }).linked_accounts ??
    []) as LinkedAccountLite[];

  const email = accounts.find((a) => a.type === 'email')?.address;

  // Prefer the Privy embedded Ethereum wallet; fall back to any EVM wallet.
  const wallet =
    accounts.find(
      (a) => a.type === 'wallet' && a.chain_type === 'ethereum' && a.wallet_client === 'privy',
    ) ?? accounts.find((a) => a.type === 'wallet' && a.address?.startsWith('0x'));

  return {
    privyUserId: user.id,
    email: email ?? undefined,
    walletAddress: wallet?.address ?? undefined,
  };
}

/** Real Privy-backed verifier (used outside tests). */
export const privyAuth: PrivyAuth = {
  async verifyAccessToken(token) {
    const claims = await getClient().utils().auth().verifyAccessToken(token);
    return { userId: claims.user_id };
  },
  async getUser(userId) {
    const user = await getClient().users()._get(userId);
    return extractUserInfo(user);
  },
};
