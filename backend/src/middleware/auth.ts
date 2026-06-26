import { type Request, type RequestHandler } from 'express';

import { isProduction } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';
import { privyAuth, type PrivyAuth } from '../lib/privy.js';

/** Dev-only header that stands in for a real Privy session (safe mock mode). */
export const DEV_AUTH_HEADER = 'x-dev-user-id';

function readBearerToken(req: Request): string | undefined {
  const header = req.header('authorization');
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
  return token.trim() || undefined;
}

/**
 * Authentication gate. Privy is the source of identity.
 *
 * - Local dev (non-production) ONLY: a non-empty `x-dev-user-id` header
 *   authenticates as that user without contacting Privy — the documented safe
 *   mock mode for offline development.
 * - Otherwise: requires a valid `Authorization: Bearer <privy access token>`,
 *   verified via the Privy SDK. Unsigned/unverified tokens are NEVER accepted
 *   outside local dev.
 *
 * Factory form takes the verifier so tests can inject a mock.
 */
export function createRequireAuth(privy: Pick<PrivyAuth, 'verifyAccessToken'>): RequestHandler {
  return async (req, _res, next) => {
    if (!isProduction) {
      const devUserId = req.header(DEV_AUTH_HEADER)?.trim();
      if (devUserId) {
        req.auth = { userId: devUserId, source: 'mock-dev-header' };
        next();
        return;
      }
    }

    const token = readBearerToken(req);
    if (!token) {
      next(new UnauthorizedError('Missing bearer token'));
      return;
    }

    try {
      const { userId } = await privy.verifyAccessToken(token);
      req.auth = { userId, source: 'privy' };
      next();
    } catch {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}

/** Default gate wired to the real Privy verifier. */
export const requireAuth: RequestHandler = createRequireAuth(privyAuth);
