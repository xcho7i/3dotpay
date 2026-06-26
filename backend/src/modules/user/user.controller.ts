import { type RequestHandler } from 'express';
import { type UpdateWalletRequest } from '@3dotpay/shared';

import { privyAuth, type PrivyUserInfo } from '../../lib/privy.js';
import * as userService from './user.service.js';

/**
 * Resolve the Privy identity/profile for the request. In the documented dev mock
 * mode no real Privy call is made — a synthetic profile is used so the API is
 * usable offline.
 */
async function resolvePrivyUserInfo(
  userId: string,
  source: 'mock-dev-header' | 'privy',
): Promise<PrivyUserInfo> {
  if (source === 'mock-dev-header') {
    return { privyUserId: userId, email: `${userId}@dev.local` };
  }
  return privyAuth.getUser(userId);
}

// GET /api/v1/user/profile — verifies (middleware) then syncs the Mongo record.
export const getProfile: RequestHandler = async (req, res) => {
  const { userId, source } = req.auth!;
  const info = await resolvePrivyUserInfo(userId, source);
  const profile = await userService.findOrCreateFromPrivyUser(info);
  res.json(profile);
};

// PATCH /api/v1/user/wallet — set/update the user's embedded wallet address.
export const updateWallet: RequestHandler = async (req, res) => {
  const { walletAddress } = req.body as UpdateWalletRequest;
  const profile = await userService.updateWalletAddress(req.auth!.userId, walletAddress);
  res.json(profile);
};
