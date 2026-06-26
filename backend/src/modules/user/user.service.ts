import { UserProfileResponseSchema, type UserProfileResponse } from '@3dotpay/shared';

import { NotFoundError } from '../../lib/errors.js';
import { type PrivyUserInfo } from '../../lib/privy.js';
import { type UserRecord } from '../../models/user.model.js';
import * as repo from './user.repository.js';

const toIso = (v: Date | string): string => (v instanceof Date ? v.toISOString() : String(v));

/** Map a stored record to the shared profile shape, validating the contract. */
function toProfile(record: UserRecord): UserProfileResponse {
  return UserProfileResponseSchema.parse({
    id: String(record._id),
    privyUserId: record.privyUserId,
    email: record.email,
    walletAddress: record.walletAddress ?? undefined,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  });
}

/**
 * Sync the local user record from Privy identity. Creates the user on first
 * sight; otherwise updates email/wallet if Privy reports newer values.
 */
export async function findOrCreateFromPrivyUser(
  info: PrivyUserInfo,
): Promise<UserProfileResponse> {
  const existing = await repo.findByPrivyUserId(info.privyUserId);

  if (!existing) {
    const created = await repo.createUser({
      privyUserId: info.privyUserId,
      email: info.email,
      walletAddress: info.walletAddress,
    });
    return toProfile(created);
  }

  const patch: Partial<Pick<UserRecord, 'email' | 'walletAddress'>> = {};
  if (info.email && info.email !== existing.email) patch.email = info.email;
  if (info.walletAddress && info.walletAddress !== existing.walletAddress) {
    patch.walletAddress = info.walletAddress;
  }

  const record = Object.keys(patch).length
    ? ((await repo.updateByPrivyUserId(info.privyUserId, patch)) ?? existing)
    : existing;
  return toProfile(record);
}

/** Update only the wallet address for an existing user. */
export async function updateWalletAddress(
  privyUserId: string,
  walletAddress: string,
): Promise<UserProfileResponse> {
  const updated = await repo.updateByPrivyUserId(privyUserId, { walletAddress });
  if (!updated) throw new NotFoundError('User not found; fetch your profile first');
  return toProfile(updated);
}

/** Return an existing user's profile, or 404. */
export async function getProfile(privyUserId: string): Promise<UserProfileResponse> {
  const record = await repo.findByPrivyUserId(privyUserId);
  if (!record) throw new NotFoundError('User not found');
  return toProfile(record);
}
