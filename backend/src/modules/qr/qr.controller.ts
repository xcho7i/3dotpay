import { type RequestHandler } from 'express';
import { decodeQR, type QrDecodeRequest, type QrDecodeResponse } from '@3dotpay/shared';

import { AppError } from '../../lib/errors.js';

// POST /api/v1/qr/decode (body: QrDecodeRequest) -> QrDecodeResponse
export const postDecode: RequestHandler = (req, res) => {
  const { rawPayload } = req.body as QrDecodeRequest;
  const result = decodeQR(rawPayload);

  if (!result.ok) {
    // Decode failures are client/data errors → 422 with the decoder's code.
    throw new AppError(422, result.code, result.message);
  }

  const body: QrDecodeResponse = {
    ...result.data,
    system: result.system,
    requiresAmount: result.requiresAmount,
  };
  res.json(body);
};
