import { type RequestHandler } from 'express';
import { getAddress } from 'viem';
import { type WalletBalanceResponse } from '@3dotpay/shared';

import { getUsdcBalance } from './wallet.service.js';

// GET /api/v1/wallet/balance?address=... -> WalletBalanceResponse
export const getBalance: RequestHandler = async (req, res) => {
  // `address` is validated by validate(WalletBalanceQuerySchema, 'query').
  const address = getAddress(String(req.query.address)); // checksum-normalize
  const { balance, balanceRaw, decimals } = await getUsdcBalance(address);

  const body: WalletBalanceResponse = {
    address,
    chain: 'base',
    asset: 'USDC',
    decimals,
    balanceRaw,
    balance,
  };
  res.json(body);
};
