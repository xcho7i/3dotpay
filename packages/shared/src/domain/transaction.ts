import { z } from 'zod';

import {
  AssetCurrencySchema,
  ChainSchema,
  DecimalStringSchema,
  EvmAddressSchema,
  FiatCurrencySchema,
  IsoDateSchema,
  TransactionStatusSchema,
  TxHashSchema,
} from '../primitives.js';

/**
 * A payment record (metadata only — 3DotPay never holds funds). `txHash` is
 * optional because a transaction exists in CREATED state before it is broadcast
 * on-chain; it is populated once the wallet submits the USDC transfer.
 */
export const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  quoteId: z.string(),
  merchantId: z.string(),
  amountFiat: DecimalStringSchema,
  fiatCurrency: FiatCurrencySchema,
  amountUsdc: DecimalStringSchema,
  assetCurrency: AssetCurrencySchema,
  chain: ChainSchema,
  walletAddress: EvmAddressSchema,
  settlementAddress: EvmAddressSchema,
  txHash: TxHashSchema.optional(),
  status: TransactionStatusSchema,
  failureReason: z.string().optional(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});

export type Transaction = z.infer<typeof TransactionSchema>;
