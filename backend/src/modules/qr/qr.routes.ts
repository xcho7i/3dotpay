import { Router } from 'express';
import { QrDecodeRequestSchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { postDecode } from './qr.controller.js';

export const qrRouter: Router = Router();

// POST /qr/decode (body: QrDecodeRequest) -> QrDecodeResponse
qrRouter.post('/qr/decode', requireAuth, validate(QrDecodeRequestSchema), postDecode);
