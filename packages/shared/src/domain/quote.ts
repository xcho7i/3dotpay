import { z } from 'zod';

import {
  AssetCurrencySchema,
  ChainSchema,
  DecimalStringSchema,
  EvmAddressSchema,
  FiatCurrencySchema,
  IsoDateSchema,
  QuoteStatusSchema,
} from '../primitives.js';

/**
 * A time-bounded quote: how much USDC the user must send to settle a given
 * fiat amount to a merchant. Amounts are decimal strings (see DecimalString).
 */
export const QuoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  merchantId: z.string(),
  merchantName: z.string().optional(),
  merchantAmount: DecimalStringSchema,
  fiatCurrency: FiatCurrencySchema,
  assetCurrency: AssetCurrencySchema,
  chain: ChainSchema,
  amountUsdc: DecimalStringSchema,
  fxRate: DecimalStringSchema,
  networkFeeEstimate: DecimalStringSchema,
  settlementAddress: EvmAddressSchema,
  expiresAt: IsoDateSchema,
  status: QuoteStatusSchema,
  createdAt: IsoDateSchema,
});

export type Quote = z.infer<typeof QuoteSchema>;
