import { type RequestHandler } from 'express';
import { type CreatePaymentRequest } from '@3dotpay/shared';

import { recordPayment } from './payment.service.js';

export const postPayment: RequestHandler = async (req, res) => {
  const payment = await recordPayment(req.auth!.userId, req.body as CreatePaymentRequest);
  res.status(201).json(payment);
};
