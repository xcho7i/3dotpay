import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WalletBalanceResponseSchema } from '@3dotpay/shared';

// Mock the chain read so tests need no RPC.
vi.mock('../src/lib/chain.js', () => ({
  readErc20Balance: vi.fn(),
}));

import { createApp } from '../src/app.js';
import { readErc20Balance } from '../src/lib/chain.js';
import { DEV_AUTH_HEADER } from '../src/middleware/auth.js';

const app = createApp();
const readBalance = vi.mocked(readErc20Balance);
const VALID = `0x${'a'.repeat(40)}`;
const auth = (req: request.Test) => req.set(DEV_AUTH_HEADER, 'dev-user-1');

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/wallet/balance', () => {
  it('rejects an invalid address with VALIDATION_ERROR', async () => {
    const res = await auth(request(app).get('/api/v1/wallet/balance').query({ address: 'nope' }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(readBalance).not.toHaveBeenCalled();
  });

  it('rejects a missing address', async () => {
    const res = await auth(request(app).get('/api/v1/wallet/balance'));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/wallet/balance').query({ address: VALID });
    expect(res.status).toBe(401);
  });

  // Formatting: 6-dp USDC base units -> decimal string.
  it.each([
    [1234567n, '1.234567', '1234567'],
    [1000000n, '1', '1000000'],
    [0n, '0', '0'],
    [12340000n, '12.34', '12340000'],
  ])('formats %s base units as %s USDC', async (raw, expected, expectedRaw) => {
    readBalance.mockResolvedValueOnce(raw);
    const res = await auth(request(app).get('/api/v1/wallet/balance').query({ address: VALID }));

    expect(res.status).toBe(200);
    expect(WalletBalanceResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.balance).toBe(expected);
    expect(res.body.balanceRaw).toBe(expectedRaw);
    expect(res.body.decimals).toBe(6);
    expect(res.body.asset).toBe('USDC');
    expect(res.body.chain).toBe('base');
  });

  it('does not crash on RPC failure — returns 502 RPC_ERROR', async () => {
    readBalance.mockRejectedValueOnce(new Error('rpc down'));
    const res = await auth(request(app).get('/api/v1/wallet/balance').query({ address: VALID }));
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('RPC_ERROR');
  });
});
