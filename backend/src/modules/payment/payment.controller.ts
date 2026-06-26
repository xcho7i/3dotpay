import { type RequestHandler } from 'express';
import { type CreatePaymentRequest, type PaymentResponse } from '@3dotpay/shared';

import { recordPayment } from './payment.service.js';

// POST /api/v1/payment (body: CreatePaymentRequest) -> PaymentResponse
export const postPayment: RequestHandler = async (req, res) => {
  const result = await recordPayment(req.auth!.userId, req.body as CreatePaymentRequest);
  const body: PaymentResponse = result;
  res.status(201).json(body);
};
