import { z } from 'zod';

import { EvmAddressSchema, IsoDateSchema } from '../primitives.js';

/**
 * A 3DotPay user, backed by a Privy account + embedded EVM wallet.
 * `walletAddress` is optional: a user exists from first login, but the embedded
 * wallet may be synced slightly later (or via PATCH /user/wallet).
 */
export const UserSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  email: z.string().email(),
  walletAddress: EvmAddressSchema.optional(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

export type User = z.infer<typeof UserSchema>;
