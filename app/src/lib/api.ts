import { env } from './env';

/** Error carrying the backend's status + error code for branching in the UI. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function request<T>(path: string, token: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(res.status, body.error?.code ?? 'UNKNOWN', body.error?.message ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface UserProfile {
  id: string;
  privyUserId: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus =
  | 'CREATED'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'SETTLEMENT_PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED';

export interface Transaction {
  id: string;
  userId: string;
  quoteId: string;
  merchantId: string;
  amountFiat: string;
  fiatCurrency: string;
  amountUsdc: string;
  assetCurrency: string;
  chain: string;
  walletAddress: string;
  settlementAddress: string;
  txHash?: string;
  status: TransactionStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** PATCH /api/v1/user/wallet — persist the embedded wallet address. */
export function patchWallet(token: string, walletAddress: string): Promise<UserProfile> {
  return request<UserProfile>('/api/v1/user/wallet', token, {
    method: 'PATCH',
    body: JSON.stringify({ walletAddress }),
  });
}

/** GET /api/v1/user/profile */
export function getProfile(token: string): Promise<UserProfile> {
  return request<UserProfile>('/api/v1/user/profile', token, { method: 'GET' });
}

export interface Quote {
  quoteId: string;
  amountTHB: string;
  fxRate: string;
  amountUSDC: string;
  networkFeeEstimate: string;
  settlementAddress: string;
  expiresAt: string;
  expirySeconds: number;
  status: string;
}

export interface CreateQuoteInput {
  merchantId: string;
  merchantName?: string;
  merchantAmount: string;
  currency?: 'THB';
  rawQrPayload?: string;
}

/** POST /api/v1/quote — create a fiat→USDC quote (60s TTL). */
export function createQuote(token: string, input: CreateQuoteInput): Promise<Quote> {
  return request<Quote>('/api/v1/quote', token, {
    method: 'POST',
    body: JSON.stringify({ currency: 'THB', ...input }),
  });
}

export interface DecodedQr {
  system: 'promptpay';
  merchantId: string;
  merchantName?: string;
  amount?: string;
  currency: string;
  rawPayload: string;
  requiresAmount: boolean;
}

/** POST /api/v1/qr/decode — decode a scanned QR payload. */
export function decodeQr(token: string, rawPayload: string): Promise<DecodedQr> {
  return request<DecodedQr>('/api/v1/qr/decode', token, {
    method: 'POST',
    body: JSON.stringify({ rawPayload }),
  });
}

export interface WalletBalance {
  address: string;
  chain: string;
  asset: string;
  decimals: number;
  balanceRaw: string;
  balance: string;
}

/** GET /api/v1/wallet/balance?address=... */
export function getWalletBalance(token: string, address: string): Promise<WalletBalance> {
  return request<WalletBalance>(
    `/api/v1/wallet/balance?address=${encodeURIComponent(address)}`,
    token,
    { method: 'GET' },
  );
}

/** GET /api/v1/transactions */
export function getTransactions(token: string): Promise<{ transactions: Transaction[] }> {
  return request<{ transactions: Transaction[] }>('/api/v1/transactions', token, { method: 'GET' });
}

/** GET /api/v1/transactions/:id */
export function getTransaction(token: string, id: string): Promise<Transaction> {
  return request<Transaction>(`/api/v1/transactions/${id}`, token, { method: 'GET' });
}
