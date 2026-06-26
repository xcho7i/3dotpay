# 3DotPay — Architecture Notes

> MVP: crypto-to-local-QR payments. Base + USDC, PromptPay (Thailand) only.

## What 3DotPay is (and is not)

3DotPay is **not** an exchange, custodian, liquidity provider, or payment
processor. It owns **user experience and metadata only**:

- QR decoding
- quote request/response
- payment metadata + transaction tracking
- notifying the settlement partner

**Funds never touch 3DotPay.** The user's Privy embedded wallet sends USDC
**directly** to the settlement partner's wallet. The backend stores metadata and
monitors the chain — it never receives, holds, or controls funds, keys, or seed
phrases.

## Monorepo layout

```
3dotpay/
├── app/               # React Native (Expo SDK 56) + expo-router, TypeScript
├── backend/           # Node.js + Express 5 + TypeScript API
├── packages/shared/   # zod schemas + types + constants (source of truth)
└── docs/              # this folder
```

- **Workspaces:** npm workspaces (the app was already npm-based). Single root
  lockfile; deps hoist to the root `node_modules`.
- **Shared package:** consumed as TypeScript source (`main` → `src/index.ts`).
  Both bundlers (tsx/esbuild on the API, Metro on mobile) transpile it directly,
  so there is no build step for `@3dotpay/shared` during development.

## Core payment flow (target)

1. Sign up via Privy (email / Google / Apple) → embedded EVM wallet.
2. User funds the wallet with USDC on Base.
3. Scan PromptPay QR → decode merchant id / amount / currency.
4. Backend requests a quote from the settlement adapter (AEON/KSHER).
5. App shows fiat amount, USDC amount, network fee estimate, quote expiry.
6. User confirms → Privy wallet signs + sends USDC to the settlement wallet.
7. App gets the tx hash → backend stores payment + notifies the adapter
   (`quoteId` + `txHash`).
8. Backend monitors Base for confirmation; adapter returns success/failure.
9. App shows receipt + history.

## Settlement adapter

A single `SettlementAdapter` interface with a `MockAdapter` for the MVP. Real
AEON/KSHER adapters are swapped in behind the same interface once sandbox
credentials exist. Selected at runtime via `SETTLEMENT_ADAPTER`.

## Status

Base monorepo scaffold only — **no business logic yet**. Implemented:

- backend `GET /health`
- mobile 3DotPay home placeholder
- shared constants + structural schemas (ApiError, Health, currency enums)

## Security guardrails

- No private keys, seed phrases, or recovery material — ever.
- No hardcoded secrets; everything via environment variables.
- Strict TypeScript across all packages.
- Validation with zod at every trust boundary.
- Privy token verification isolated in `backend/src/middleware/auth.ts`.
