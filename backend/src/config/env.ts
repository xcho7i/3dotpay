import 'dotenv/config';
import { z } from 'zod';
import { BASE_CHAIN_ID, BASE_USDC_ADDRESS, EvmAddressSchema } from '@3dotpay/shared';

/**
 * Validate and normalize process.env once at startup. Importing this module
 * gives the rest of the app a typed, validated `env` object. Secrets are read
 * from the environment only — never hardcoded. Invalid config fails fast, and
 * production requires real credentials (no insecure defaults).
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    CORS_ORIGIN: z.string().default('*'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Persistence — optional so /health works without a DB; connection is attempted
    // at startup when present (success/failure is logged).
    MONGODB_URI: z.string().optional(),

    // Privy — token verification config. APP_ID is a public client id; SECRET is secret.
    PRIVY_APP_ID: z.string().optional(),
    PRIVY_APP_SECRET: z.string().optional(),

    // Base chain
    BASE_RPC_URL: z.string().url().default('https://mainnet.base.org'),
    BASE_CHAIN_ID: z.coerce.number().int().positive().default(BASE_CHAIN_ID),
    USDC_CONTRACT_ADDRESS: EvmAddressSchema.default(BASE_USDC_ADDRESS),

    // Chain confirmation monitor poll interval (ms).
    CHAIN_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15000),

    // Settlement partner (funds flow directly here — 3DotPay never holds funds).
    SETTLEMENT_WALLET_ADDRESS: EvmAddressSchema.optional(),

    // AEON settlement adapter (sandbox creds — TODO: real values).
    AEON_API_BASE_URL: z.string().url().optional(),
    AEON_API_KEY: z.string().optional(),

    // KSHER settlement adapter (TODO: real values).
    KSHER_API_BASE_URL: z.string().url().optional(),
    KSHER_API_KEY: z.string().optional(),

    /** Which settlement partner to use. */
    SETTLEMENT_PARTNER: z.enum(['mock', 'aeon', 'ksher']).default('mock'),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== 'production') return;

    // Production hardening: no insecure defaults, real partner creds required.
    if (!val.PRIVY_APP_ID || !val.PRIVY_APP_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PRIVY_APP_SECRET'],
        message: 'PRIVY_APP_ID and PRIVY_APP_SECRET are required in production',
      });
    }
    if (val.CORS_ORIGIN === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'CORS_ORIGIN must be an explicit allow-list in production (not *)',
      });
    }
    if (val.SETTLEMENT_PARTNER === 'aeon' && (!val.AEON_API_BASE_URL || !val.AEON_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AEON_API_KEY'],
        message: 'AEON_API_BASE_URL and AEON_API_KEY are required when SETTLEMENT_PARTNER=aeon',
      });
    }
    if (val.SETTLEMENT_PARTNER === 'ksher' && (!val.KSHER_API_BASE_URL || !val.KSHER_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['KSHER_API_KEY'],
        message: 'KSHER_API_BASE_URL and KSHER_API_KEY are required when SETTLEMENT_PARTNER=ksher',
      });
    }
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

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
