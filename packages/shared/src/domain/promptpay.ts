import { z } from 'zod';

import { DecimalStringSchema, FiatCurrencySchema } from '../primitives.js';

/**
 * Result of decoding a Thailand PromptPay (EMVCo) QR. `amount` is optional
 * because many PromptPay QRs are open-amount (the payer enters the amount).
 */
export const PromptPayQRParseResultSchema = z.object({
  merchantId: z.string(),
  merchantName: z.string().optional(),
  amount: DecimalStringSchema.optional(),
  currency: FiatCurrencySchema, // THB for the MVP
  rawPayload: z.string(),
});

export type PromptPayQRParseResult = z.infer<typeof PromptPayQRParseResultSchema>;
