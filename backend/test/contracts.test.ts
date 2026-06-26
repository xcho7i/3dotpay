import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ApiErrorSchema } from '@3dotpay/shared';

import { createApp } from '../src/app.js';
import { DEV_AUTH_HEADER } from '../src/middleware/auth.js';

const auth = (req: request.Test) => req.set(DEV_AUTH_HEADER, 'dev-user-1');

describe('API v1 contracts wiring', () => {
  const app = createApp();

  it('rejects an invalid POST /api/v1/quote body with VALIDATION_ERROR', async () => {
    const res = await auth(request(app).post('/api/v1/quote')).send({ merchantId: 123 });

    expect(res.status).toBe(400);
    expect(ApiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  // /user/profile and /quote are implemented (covered elsewhere); the rest are stubs.
  it('exposes the remaining contract routes under /api/v1 (auth required)', async () => {
    expect((await auth(request(app).get('/api/v1/transactions'))).status).toBe(501);
    expect((await auth(request(app).get('/api/v1/transactions/abc'))).status).toBe(501);
    expect(
      (
        await auth(request(app).post('/api/v1/payment')).send({
          quoteId: 'q1',
          txHash: `0x${'a'.repeat(64)}`,
        })
      ).status,
    ).toBe(501);
  });
});
