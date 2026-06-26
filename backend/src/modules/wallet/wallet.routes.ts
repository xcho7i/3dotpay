import { Router } from 'express';
import { WalletBalanceQuerySchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getBalance } from './wallet.controller.js';

export const walletRouter: Router = Router();

// GET /wallet/balance?address=... (query: WalletBalanceQuery) -> WalletBalanceResponse
walletRouter.get('/wallet/balance', requireAuth, validate(WalletBalanceQuerySchema, 'query'), getBalance);
