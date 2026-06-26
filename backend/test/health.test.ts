import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { HealthResponseSchema } from '@3dotpay/shared';

import { createApp } from '../src/app.js';

describe('health', () => {
  const app = createApp();

  it.each(['/health', '/api/v1/health'])('GET %s returns a valid health payload', async (path) => {
    const res = await request(app).get(path);

    expect(res.status).toBe(200);
    expect(HealthResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('3dotpay-api');
  });

  it('returns the ApiError envelope for unknown routes', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
