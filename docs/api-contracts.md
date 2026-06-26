# 3DotPay — API Contracts

All request/response shapes are defined as zod schemas in
[`packages/shared`](../packages/shared/src) and inferred into TypeScript types.
Schemas are the single source of truth.

## Conventions

- **Base URL (dev):** `http://localhost:8080`
- **Content type:** `application/json`
- **Auth:** Privy access token via `Authorization: Bearer <token>` on protected
  routes (verification isolated in `backend/src/middleware/auth.ts`). `/health`
  is public.
- **Errors:** every error returns the `ApiError` envelope:

  ```json
  { "error": { "code": "STRING_CODE", "message": "Human readable", "details": {} } }
  ```

## Implemented

### `GET /health`

Liveness probe. No dependencies (no DB, no chain).

**200 OK**

```json
{
  "status": "ok",
  "service": "3dotpay-api",
  "version": "0.1.0",
  "uptime": 12.34,
  "timestamp": "2026-06-26T00:00:00.000Z"
}
```

Schema: `HealthResponseSchema` in `@3dotpay/shared`.

## Defined contracts (schemas live, handlers stubbed)

Request/response shapes are defined as zod schemas in
[`packages/shared/src/api/contracts.ts`](../packages/shared/src/api/contracts.ts)
and reuse the domain schemas in
[`packages/shared/src/domain`](../packages/shared/src/domain). Handlers are
stubbed and currently return `501 NOT_IMPLEMENTED`; request bodies/params are
already validated against the shared schemas (invalid input → `VALIDATION_ERROR`).

All routes below are under the `/api/v1` prefix and require authentication
(`Authorization: Bearer <privy access token>`). `✅` = implemented.

| Method | Path                | Request schema               | Response schema                  | Status |
| ------ | ------------------- | ---------------------------- | -------------------------------- | ------ |
| GET    | `/user/profile`     | —                            | `UserProfileResponseSchema`      | ✅     |
| PATCH  | `/user/wallet`      | `UpdateWalletRequestSchema`  | `UpdateWalletResponseSchema`     | ✅     |
| POST   | `/quote`            | `CreateQuoteRequestSchema`   | `QuoteResponseSchema`            | stub   |
| POST   | `/payment`          | `CreatePaymentRequestSchema` | `PaymentResponseSchema`          | stub   |
| GET    | `/transactions`     | —                            | `TransactionsListResponseSchema` | stub   |
| GET    | `/transactions/:id` | `TransactionParamsSchema`    | `TransactionResponseSchema`      | stub   |

### Authentication

Privy is the source of identity (no password system). The backend verifies the
Privy access token, extracts the user's DID, and syncs a local Mongo profile
(`GET /user/profile` creates the record on first call). `walletAddress` is
synced from Privy and can also be set via `PATCH /user/wallet`.

**Local dev — safe mock mode:** outside production, sending the header
`x-dev-user-id: <any-id>` authenticates as that user **without contacting Privy**
(a synthetic `@dev.local` profile is used). This is rejected in production.

### Domain entities

`UserSchema`, `QuoteSchema`, `TransactionSchema`, `PromptPayQRParseResultSchema`
— with reusable primitives (`EvmAddressSchema`, `TxHashSchema`, `IsoDateSchema`,
`DecimalStringSchema`, currency/chain/status enums) in
[`primitives.ts`](../packages/shared/src/primitives.ts).

> Business logic does not exist yet — handlers are 501 stubs. Money amounts are
> **decimal strings**, never numbers, to preserve precision.
