import { formatUnits } from 'viem';
import { USDC_DECIMALS } from '@3dotpay/shared';

import { env } from '../../config/env.js';
import { readErc20Balance } from '../../lib/chain.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

export interface UsdcBalance {
  decimals: number;
  /** Integer base units as a string. */
  balanceRaw: string;
  /** Human-readable decimal string. */
  balance: string;
}

/**
 * Read an address's USDC balance on Base. Token address comes from config
 * (USDC_CONTRACT_ADDRESS, env-overridable); decimals from the shared constant.
 * RPC failures are surfaced as a 502 RPC_ERROR — never an uncaught crash.
 */
export async function getUsdcBalance(address: `0x${string}`): Promise<UsdcBalance> {
  try {
    const raw = await readErc20Balance(env.USDC_CONTRACT_ADDRESS as `0x${string}`, address);
    return {
      decimals: USDC_DECIMALS,
      balanceRaw: raw.toString(),
      balance: formatUnits(raw, USDC_DECIMALS),
    };
  } catch (err) {
    logger.error({ err }, 'USDC balance read failed');
    throw new AppError(502, 'RPC_ERROR', 'Failed to read balance from the chain');
  }
}
