/**
 * Cross-cutting constants for the 3DotPay MVP.
 *
 * These are configuration values, not business logic. Addresses below are
 * PUBLIC, well-known contract addresses — they are NOT secrets.
 */

/** Base mainnet chain id. MVP targets Base only. */
export const BASE_CHAIN_ID = 8453 as const;

/** Base Sepolia testnet chain id (used during development). */
export const BASE_SEPOLIA_CHAIN_ID = 84532 as const;

/** Native USDC on Base mainnet (public contract address). */
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

/** USDC uses 6 decimals — all on-chain amounts are integer base units. */
export const USDC_DECIMALS = 6 as const;

/** Fiat currencies supported by the QR rail in the MVP. */
export const SUPPORTED_FIAT_CURRENCIES = ['THB'] as const;

/** Crypto assets supported for settlement in the MVP. */
export const SUPPORTED_ASSET_CURRENCIES = ['USDC'] as const;

/** Chains supported in the MVP (Base only). */
export const SUPPORTED_CHAINS = ['base'] as const;

/** QR payment rail supported in the MVP. */
export const QR_RAIL = 'promptpay' as const;
