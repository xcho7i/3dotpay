# Security Review — MVP Hardening Pass

Date: 2026-06-27 · Scope: 3DotPay MVP (mobile + backend). Legend: ✅ implemented ·
⚠️ partial / operational · ❌ open.

## Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | No private keys / seed phrases stored | ✅ | Keys live only in the Privy embedded wallet. The app builds an **unsigned** tx (`usdcTransfer.ts`) and Privy signs on-device. Backend never sees keys/seed material. |
| 2 | No secrets in git | ✅ | `.env` gitignored (root `.gitignore` + `app/.gitignore`); only `.env.example` with placeholders is tracked. See ⚠️ note below on local `.env`. |
| 3 | Privy auth on all protected routes | ✅ | `requireAuth` on `user`, `wallet`, `quote`, `payment`, `qr`, `transactions`. Only `/health` + `/api/v1/health` are public. |
| 4 | Users access only their own data | ✅ | Transactions queried by `{_id, userId}`; quote payment requires `quote.userId === req.auth.userId` (else `403`); profile keyed by the verified Privy DID. |
| 5 | Quote expiry enforced server-side | ✅ | 60s TTL; `payment.service` rejects with `409 QUOTE_EXPIRED` and flips the quote to `EXPIRED`. |
| 6 | Quote reuse prevented | ✅ | Atomic `claimQuoteForPayment` (`findOneAndUpdate` `ACTIVE→USED`); a lost race → `409 QUOTE_NOT_ACTIVE`. |
| 7 | txHash uniqueness | ✅ | Unique **sparse** index on `txHash` + `quoteId` unique; `E11000` → `409 TX_ALREADY_RECORDED`. |
| 8 | On-chain payment validation | ✅ | `ChainMonitorService` checks **sender == wallet**, **to == USDC contract**, **Transfer recipient == settlementAddress**, **value ≥ quoted amount**. Mismatch → `FAILED`. |
| 9 | Input validation on every API | ✅ | zod `validate(schema, part)` on body/params/query for every endpoint; failures → consistent `VALIDATION_ERROR`. |
| 10 | Rate limiting | ✅ | `express-rate-limit` per-user: quote 20/min, payment 15/min, status 120/min → `429 RATE_LIMITED`. |
| 11 | CORS not wildcard in production | ✅ | Env validation **fails fast** if `CORS_ORIGIN='*'` when `NODE_ENV=production`. |
| 12 | Helmet | ✅ | Enabled; `x-powered-by` disabled. |
| 13 | Mongo indexes | ✅ | `{userId, createdAt}`, `txHash` (unique sparse), `quoteId` (unique), `status`; quote `userId`. |
| 14 | Errors don't leak secrets | ✅ | Single `ApiError` envelope `{code, message}`; unhandled errors → generic `500 INTERNAL_ERROR` (no stack/values to client). |
| 15 | Logs don't include full tokens | ✅ | pino `redact` on `authorization`, `cookie`, `x-dev-user-id`, `*.token`, `*.accessToken`, `*.PRIVY_APP_SECRET`. |

## Production fail-fast (env validation)

When `NODE_ENV=production`, startup **aborts** unless:
- `PRIVY_APP_ID` + `PRIVY_APP_SECRET` are set (real token verification),
- `CORS_ORIGIN` is an explicit allow-list (not `*`),
- the selected `SETTLEMENT_PARTNER` has its credentials.

The **dev mock auth header** (`x-dev-user-id`) is rejected when `NODE_ENV=production`
— it only works outside production.

## Remaining risks & launch blockers

**Launch blockers (must resolve before real money):**
- ⚠️ **Settlement is mocked.** `MockAeonSettlementAdapter` auto-succeeds. No real
  fiat settlement happens. Real AEON/KSHER integration is required — see
  `settlement-partner-contract.md`.
- ⚠️ **Not device-verified.** The Privy signing flow + on-chain send have not been
  exercised on a real EAS build/device.
- ⚠️ **Rotate shared secrets.** The MongoDB Atlas URI and Privy app secret were
  shared during development and live in local `.env` (gitignored, and the repo root
  is not a git repo). Rotate both before production and inject via the host's secret
  manager, never a committed file.

**Hardening follow-ups (not blockers for a demo):**
- ⚠️ Rate limiting is **in-memory per instance**; multi-instance deploys need a
  shared store (e.g. Redis) to be effective.
- ⚠️ Amount validation accepts **overpayment** (`value ≥ quoted`); tighten if exact
  match is required by the partner.
- ❌ No webhook signature verification yet (settlement is poll-based for MVP).
- ❌ No HTTPS/TLS enforcement in app code — must be terminated at the host/proxy.
- ❌ No per-user spend limits / anomaly detection.
- ❌ Privy token replay is bounded only by the token's own expiry; consider
  short-lived tokens + `sessionId` checks if needed.
