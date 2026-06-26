import { z } from 'zod';

import {
  SUPPORTED_ASSET_CURRENCIES,
  SUPPORTED_CHAINS,
  SUPPORTED_FIAT_CURRENCIES,
} from './constants.js';

/**
 * Reusable primitive schemas shared across every domain entity. Defining them
 * once here is what guarantees there are no duplicated field definitions.
 */

/** EVM (0x-prefixed, 20-byte) address. */
export const EvmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address');

/** EVM transaction hash (0x-prefixed, 32-byte). */
export const TxHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');

/** ISO 8601 datetime string (e.g. the output of Date#toISOString). */
export const IsoDateSchema = z.string().datetime();

/**
 * Non-negative decimal amount as a STRING. Money is never represented as a JS
 * number — that would lose precision. USDC has 6 decimals; fiat 2.
 */
export const DecimalStringSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Must be a non-negative decimal string');

export const ChainSchema = z.enum(SUPPORTED_CHAINS);
export const FiatCurrencySchema = z.enum(SUPPORTED_FIAT_CURRENCIES);
export const AssetCurrencySchema = z.enum(SUPPORTED_ASSET_CURRENCIES);

export const QuoteStatusSchema = z.enum(['ACTIVE', 'EXPIRED', 'USED', 'CANCELLED']);

export const TransactionStatusSchema = z.enum([
  'CREATED',
  'SUBMITTED',
  'CONFIRMED',
  'SETTLEMENT_PENDING',
  'SUCCESS',
  'FAILED',
  'EXPIRED',
]);

export type EvmAddress = z.infer<typeof EvmAddressSchema>;
export type TxHash = z.infer<typeof TxHashSchema>;
export type IsoDate = z.infer<typeof IsoDateSchema>;
export type DecimalString = z.infer<typeof DecimalStringSchema>;
export type Chain = z.infer<typeof ChainSchema>;
export type FiatCurrency = z.infer<typeof FiatCurrencySchema>;
export type AssetCurrency = z.infer<typeof AssetCurrencySchema>;
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
