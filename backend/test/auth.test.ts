import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserSchema } from '@3dotpay/shared';

// Mock the Privy verifier and the user repository so these tests need no network
// and no MongoDB — exactly the "mocked Privy verifier" the brief asks for.
vi.mock('../src/lib/privy.js', () => ({
  privyAuth: { verifyAccessToken: vi.fn(), getUser: vi.fn() },
}));
vi.mock('../src/modules/user/user.repository.js', () => ({
  findByPrivyUserId: vi.fn(),
  createUser: vi.fn(),
  updateByPrivyUserId: vi.fn(),
}));

import { createApp } from '../src/app.js';
import { privyAuth } from '../src/lib/privy.js';
import { DEV_AUTH_HEADER } from '../src/middleware/auth.js';
import * as repo from '../src/modules/user/user.repository.js';

const app = createApp();
const verify = vi.mocked(privyAuth.verifyAccessToken);
const getUser = vi.mocked(privyAuth.getUser);
const findByPrivyUserId = vi.mocked(repo.findByPrivyUserId);
const createUser = vi.mocked(repo.createUser);
const updateByPrivyUserId = vi.mocked(repo.updateByPrivyUserId);

const WALLET = `0x${'1'.repeat(40)}`;
const AT = new Date('2026-06-26T00:00:00.000Z');
const record = (over: Partial<Record<string, unknown>> = {}) => ({
  _id: 'mongo-id-1',
  privyUserId: 'did:privy:1',
  email: 'user@example.com',
  walletAddress: undefined,
  createdAt: AT,
  updatedAt: AT,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('requireAuth + profile sync', () => {
  it('rejects requests with no token (401 UNAUTHORIZED)', async () => {
    const res = await request(app).get('/api/v1/user/profile');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid token (verifier throws → 401)', async () => {
    verify.mockRejectedValueOnce(new Error('invalid'));
    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(verify).toHaveBeenCalledWith('bad-token');
  });

  it('creates the local user on first valid token and returns a schema-valid profile', async () => {
    verify.mockResolvedValueOnce({ userId: 'did:privy:1' });
    getUser.mockResolvedValueOnce({
      privyUserId: 'did:privy:1',
      email: 'user@example.com',
      walletAddress: WALLET,
    });
    findByPrivyUserId.mockResolvedValueOnce(null);
    createUser.mockResolvedValueOnce(record({ walletAddress: WALLET }));

    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(200);
    expect(UserSchema.safeParse(res.body).success).toBe(true);
    expect(createUser).toHaveBeenCalledOnce();
    expect(res.body.walletAddress).toBe(WALLET);
  });

  it('updates email/wallet when Privy reports newer values (existing user)', async () => {
    verify.mockResolvedValueOnce({ userId: 'did:privy:1' });
    getUser.mockResolvedValueOnce({
      privyUserId: 'did:privy:1',
      email: 'user@example.com',
      walletAddress: WALLET,
    });
    findByPrivyUserId.mockResolvedValueOnce(record({ walletAddress: undefined }));
    updateByPrivyUserId.mockResolvedValueOnce(record({ walletAddress: WALLET }));

    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(200);
    expect(createUser).not.toHaveBeenCalled();
    expect(updateByPrivyUserId).toHaveBeenCalledWith('did:privy:1', { walletAddress: WALLET });
  });

  it('safe mock mode: dev header authenticates without contacting Privy', async () => {
    findByPrivyUserId.mockResolvedValueOnce(null);
    createUser.mockResolvedValueOnce(record({ privyUserId: 'dev-1', email: 'dev-1@dev.local' }));

    const res = await request(app).get('/api/v1/user/profile').set(DEV_AUTH_HEADER, 'dev-1');

    expect(res.status).toBe(200);
    expect(verify).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(res.body.email).toBe('dev-1@dev.local');
  });
});

describe('PATCH /api/v1/user/wallet', () => {
  it('rejects an invalid wallet address (400 VALIDATION_ERROR)', async () => {
    const res = await request(app)
      .patch('/api/v1/user/wallet')
      .set(DEV_AUTH_HEADER, 'dev-1')
      .send({ walletAddress: 'not-an-address' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('updates the wallet for an existing user', async () => {
    updateByPrivyUserId.mockResolvedValueOnce(record({ privyUserId: 'dev-1', walletAddress: WALLET }));
    const res = await request(app)
      .patch('/api/v1/user/wallet')
      .set(DEV_AUTH_HEADER, 'dev-1')
      .send({ walletAddress: WALLET });
    expect(res.status).toBe(200);
    expect(res.body.walletAddress).toBe(WALLET);
  });

  it('returns 404 when updating a non-existent user', async () => {
    updateByPrivyUserId.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch('/api/v1/user/wallet')
      .set(DEV_AUTH_HEADER, 'dev-1')
      .send({ walletAddress: WALLET });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
