import 'dotenv/config';
import { z } from 'zod';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, EvmAddressSchema } from '@3dotpay/shared';

/**
 * Validate and normalize process.env once at startup. Importing this module
 * gives the rest of the app a typed, validated `env` object. Secrets are read
 * from the environment only — never hardcoded. Invalid config fails fast.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Persistence — optional so /health works without a DB; connection is attempted
  // at startup when present (success/failure is logged).
  MONGODB_URI: z.string().optional(),

  // Privy — token verification config. Secret is a placeholder until the auth
  // phase. APP_ID is a public client id.
  PRIVY_APP_ID: z.string().optional(),
  PRIVY_APP_SECRET: z.string().optional(),

  // Base chain
  BASE_RPC_URL: z.string().url().default('https://mainnet.base.org'),
  BASE_CHAIN_ID: z.coerce.number().int().positive().default(BASE_CHAIN_ID),
  USDC_CONTRACT_ADDRESS: EvmAddressSchema.default(BASE_USDC_ADDRESS),

  // Settlement partner (funds flow directly here — 3DotPay never holds funds).
  SETTLEMENT_WALLET_ADDRESS: EvmAddressSchema.optional(),

  // AEON settlement adapter (sandbox creds — TODO: fill in real values).
  AEON_API_BASE_URL: z.string().url().optional(),
  AEON_API_KEY: z.string().optional(),

  SETTLEMENT_ADAPTER: z.enum(['mock', 'aeon', 'ksher']).default('mock'),
});

/** Treat empty-string env values (common in copied .env files) as unset. */
const cleaned = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === '' ? undefined : v]),
);

const parsed = EnvSchema.safeParse(cleaned);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // Fail fast — do not start with invalid configuration. Values are not logged.
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;

/** Convenience flags. */
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
