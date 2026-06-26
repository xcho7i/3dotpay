import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuoteResponseSchema } from '@3dotpay/shared';

// Mock only the repository (no Mongo). The real MockAeonSettlementAdapter runs,
// so the Decimal-safe FX math is exercised end-to-end.
vi.mock('../src/modules/quote/quote.repository.js', () => ({
  createQuote: vi.fn(),
  findQuoteById: vi.fn(),
}));

import { createApp } from '../src/app.js';
import { DEV_AUTH_HEADER } from '../src/middleware/auth.js';
import { computeExpiresAt, expirySeconds, isExpired, QUOTE_TTL_SECONDS } from '../src/modules/quote/quote.expiry.js';
import * as repo from '../src/modules/quote/quote.repository.js';

const app = createApp();
const createQuote = vi.mocked(repo.createQuote);
const auth = (req: request.Test) => req.set(DEV_AUTH_HEADER, 'dev-user-1');

beforeEach(() => {
  vi.clearAllMocks();
  // Echo the stored record back with an id + timestamps.
  createQuote.mockImplementation(async (data) => ({
    ...data,
    _id: 'quote-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
});

describe('quote expiry helpers', () => {
  it('expires exactly 60s after creation', () => {
    const now = new Date('2026-06-27T00:00:00.000Z');
    expect(QUOTE_TTL_SECONDS).toBe(60);
    expect(computeExpiresAt(now).getTime() - now.getTime()).toBe(60_000);
    expect(expirySeconds(computeExpiresAt(now), now)).toBe(60);
  });

  it('reports expired/zero seconds once past expiry', () => {
    const now = new Date('2026-06-27T00:01:00.000Z');
    const past = new Date('2026-06-27T00:00:00.000Z');
    expect(isExpired(past, now)).toBe(true);
    expect(expirySeconds(past, now)).toBe(0);
    expect(isExpired(computeExpiresAt(now), now)).toBe(false);
  });
});

describe('POST /api/v1/quote', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/quote').send({ merchantId: 'M1', merchantAmount: '100' });
    expect(res.status).toBe(401);
  });

  it.each(['0', '-5', 'abc', ''])('rejects invalid amount %j', async (merchantAmount) => {
    const res = await auth(request(app).post('/api/v1/quote')).send({ merchantId: 'M1', merchantAmount });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(createQuote).not.toHaveBeenCalled();
  });

  it('rejects a missing merchantId', async () => {
    const res = await auth(request(app).post('/api/v1/quote')).send({ merchantAmount: '100' });
    expect(res.status).toBe(400);
  });

  it('creates and stores a quote with Decimal-safe amounts', async () => {
    const res = await auth(request(app).post('/api/v1/quote')).send({
      merchantId: 'M-123',
      merchantName: 'Test Shop',
      merchantAmount: '365.00',
      currency: 'THB',
    });

    expect(res.status).toBe(201);
    expect(QuoteResponseSchema.safeParse(res.body).success).toBe(true);

    // 365 THB / 36.50 (THB per USDC) = exactly 10 USDC.
    expect(res.body.amountTHB).toBe('365.00');
    expect(res.body.fxRate).toBe('36.50');
    expect(res.body.amountUSDC).toBe('10.000000');
    expect(res.body.networkFeeEstimate).toBe('0.010000');
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.expirySeconds).toBeGreaterThan(0);
    expect(res.body.expirySeconds).toBeLessThanOrEqual(60);

    // Persisted with the right shape.
    expect(createQuote).toHaveBeenCalledOnce();
    const stored = createQuote.mock.calls[0]![0];
    expect(stored.status).toBe('ACTIVE');
    expect(stored.amountUsdc).toBe('10.000000');
    expect(stored.expiresAt).toBeInstanceOf(Date);
  });
});
