import { Router } from 'express';
import { UpdateWalletRequestSchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getProfile, updateWallet } from './user.controller.js';

export const userRouter: Router = Router();

// GET /user/profile -> UserProfileResponse
userRouter.get('/user/profile', requireAuth, getProfile);

// PATCH /user/wallet (body: UpdateWalletRequest) -> UpdateWalletResponse
userRouter.patch(
  '/user/wallet',
  requireAuth,
  validate(UpdateWalletRequestSchema),
  updateWallet,
);
