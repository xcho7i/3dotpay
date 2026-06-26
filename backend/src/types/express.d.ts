/** Authenticated principal attached to a request by `requireAuth`. */
export interface AuthContext {
  userId: string;
  source: 'mock-dev-header' | 'privy';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
