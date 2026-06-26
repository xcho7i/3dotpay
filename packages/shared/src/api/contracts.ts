import { z } from 'zod';

import { PromptPayQRParseResultSchema } from '../domain/promptpay.js';
import { TransactionSchema } from '../domain/transaction.js';
import { UserSchema } from '../domain/user.js';
import {
  AssetCurrencySchema,
  ChainSchema,
  DecimalStringSchema,
  EvmAddressSchema,
  FiatCurrencySchema,
  QuoteStatusSchema,
  TxHashSchema,
} from '../primitives.js';

/**
 * Request/response contracts for the MVP API. Responses reuse the domain
 * schemas directly — no duplicated DTOs.
 */

/** GET /health */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
});

/** GET /user/profile */
export const UserProfileResponseSchema = UserSchema;

/** PATCH /user/wallet — set/update the user's embedded wallet address. */
export const UpdateWalletRequestSchema = z.object({
  walletAddress: EvmAddressSchema,
});
export const UpdateWalletResponseSchema = UserSchema;

/** POST /qr/decode — decode a scanned QR payload (PromptPay for MVP). */
export const QrDecodeRequestSchema = z.object({
  rawPayload: z.string().min(1),
});
export const QrDecodeResponseSchema = PromptPayQRParseResultSchema.extend({
  system: z.literal('promptpay'),
  /** True when the QR had no amount and the user must enter one. */
  requiresAmount: z.boolean(),
});

/** GET /wallet/balance?address=... — read an address's USDC balance on Base. */
export const WalletBalanceQuerySchema = z.object({
  address: EvmAddressSchema,
});
export const WalletBalanceResponseSchema = z.object({
  address: EvmAddressSchema,
  chain: ChainSchema,
  asset: AssetCurrencySchema,
  decimals: z.number().int().nonnegative(),
  /** Balance in integer base units (e.g. 6-dp USDC), as a string. */
  balanceRaw: z.string(),
  /** Human-readable decimal balance, e.g. "12.34". */
  balance: DecimalStringSchema,
});

/** POST /quote — create a quote from a (decoded) PromptPay QR + amount. */
export const CreateQuoteRequestSchema = z.object({
  merchantId: z.string().min(1),
  merchantName: z.string().optional(),
  merchantAmount: DecimalStringSchema.refine((v) => Number(v) > 0, 'Amount must be greater than 0'),
  currency: FiatCurrencySchema.default('THB'),
  rawQrPayload: z.string().optional(),
});

/** Projection returned by POST /quote. */
export const QuoteResponseSchema = z.object({
  quoteId: z.string(),
  amountTHB: DecimalStringSchema,
  fxRate: DecimalStringSchema,
  amountUSDC: DecimalStringSchema,
  networkFeeEstimate: DecimalStringSchema,
  settlementAddress: EvmAddressSchema,
  expiresAt: z.string().datetime(),
  expirySeconds: z.number().int().nonnegative(),
  status: QuoteStatusSchema,
});

/** POST /payment — record a broadcast USDC payment against a quote. */
export const CreatePaymentRequestSchema = z.object({
  quoteId: z.string(),
  txHash: TxHashSchema,
  walletAddress: EvmAddressSchema.optional(),
});
export const PaymentResponseSchema = TransactionSchema;

/** GET /transactions */
export const TransactionsListResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
});

/** GET /transactions/:id */
export const TransactionParamsSchema = z.object({ id: z.string() });
export const TransactionResponseSchema = TransactionSchema;

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UpdateWalletRequest = z.infer<typeof UpdateWalletRequestSchema>;
export type UpdateWalletResponse = z.infer<typeof UpdateWalletResponseSchema>;
export type WalletBalanceQuery = z.infer<typeof WalletBalanceQuerySchema>;
export type WalletBalanceResponse = z.infer<typeof WalletBalanceResponseSchema>;
export type QrDecodeRequest = z.infer<typeof QrDecodeRequestSchema>;
export type QrDecodeResponse = z.infer<typeof QrDecodeResponseSchema>;
export type CreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type TransactionsListResponse = z.infer<typeof TransactionsListResponseSchema>;
export type TransactionParams = z.infer<typeof TransactionParamsSchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
