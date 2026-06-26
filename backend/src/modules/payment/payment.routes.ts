import { Router } from 'express';
import { CreatePaymentRequestSchema } from '@3dotpay/shared';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { postPayment } from './payment.controller.js';

export const paymentRouter: Router = Router();

// POST /payment (body: CreatePaymentRequest) -> PaymentResponse
paymentRouter.post('/payment', requireAuth, validate(CreatePaymentRequestSchema), postPayment);
