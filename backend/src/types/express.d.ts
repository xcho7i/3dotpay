/** Authenticated principal attached to a request by `requireAuth`. */
export interface AuthContext {
  userId: string;
  source: 'mock-dev-header' | 'privy';
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
