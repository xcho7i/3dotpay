# 3DotPay — MVP Status

Final status of the MVP. 3DotPay scans a Thailand **PromptPay** QR and pays with
**USDC on Base** from a Privy embedded wallet. Funds flow **directly** from the
user's wallet to the settlement partner — **the backend never holds funds or
keys.** It handles UX, QR decoding, quoting, payment metadata, on-chain
confirmation, and partner notification only.

> One-line state: **Feature-complete end-to-end with a mock settlement
> partner.** Real fiat payout (AEON/KSHER) and a physical-device pass are the
> remaining launch blockers.

---

## 1. What is implemented (real)

- **Auth** — Privy email OTP → embedded Base wallet (mobile). Backend verifies
  Privy access tokens (`@privy-io/node`) and syncs the user/wallet to MongoDB.
- **Deposit** — wallet address + QR + "USDC on Base only" warning.
- **QR decode** — pure EMVCo TLV + CRC-16/CCITT-FALSE decoder (backend
  `/qr/decode`); PromptPay only; manual-amount fallback when the QR has none.
- **Quote** — `POST /quote`, 60s TTL, THB→USDC, Decimal-safe money, stored in
  Mongo, single-use (atomic ACTIVE→USED claim).
- **Payment** — mobile builds the ERC-20 USDC transfer and signs it with the
  Privy provider; `POST /payment` records `quoteId` + `txHash` only.
- **On-chain confirmation** — `ChainMonitorService` reads the transfer receipt
  and validates sender, token, recipient, and amount before advancing status.
- **Status & receipts** — polling status endpoint drives Processing → Receipt;
  paginated, ownership-scoped history with BaseScan links.
- **USDC balance** — `GET /wallet/balance` via viem `balanceOf`, decimal-formatted.
- **Hardening** — per-user rate limits, prod env fail-fast, helmet + CORS, Mongo
  indexes, pino log redaction, no secrets in code.
- **Quality** — backend 59 tests, app 12 tests, lint clean, typecheck clean
  (shared + api + app).

## 2. What is mocked / stubbed

- **Settlement partner** — `MockAeonSettlementAdapter` returns a fixed FX rate
  (~36.5 THB/USDC) and a fake settlement acknowledgement. No real fiat moves.
- **AEON / KSHER adapters** — typed boundary stubs that fail fast with
  `SETTLEMENT_NOT_IMPLEMENTED`. The interface is final; only the bodies are TODO.
- **Google / Apple login** — UI placeholders; only email OTP is wired.
- **Share receipt** — placeholder button.
- **Settlement wallet** — `SETTLEMENT_WALLET_ADDRESS` is unset; a real partner
  address is required for any real transfer.

## 3. What needs AEON / KSHER credentials

To go from mock to real settlement (all **partner integration**):

- `SETTLEMENT_PARTNER=aeon` (or `ksher`) + `AEON_API_BASE_URL` / `AEON_API_KEY`
  (or the `KSHER_*` equivalents).
- `SETTLEMENT_WALLET_ADDRESS` — the partner's receiving wallet on Base.
- Implement `requestQuote`, `notifyPayment`, `getSettlementStatus` in
  `backend/src/modules/settlement/{aeon,ksher}.adapter.ts` against the partner
  API (live FX quote, payment notification, settlement status/webhook).
- Replace the mock FX with the partner's live rate.
- See [settlement-partner-contract.md](settlement-partner-contract.md) for the
  exact request/response shape the adapter expects.

## 4. What needs Privy dashboard setup

- A production Privy app with **email login** enabled and **embedded wallets** on.
- Allowed app identifiers / redirect config for the EAS builds.
- `PRIVY_APP_ID` (public) + `PRIVY_APP_SECRET` (secret) in `backend/.env`;
  `EXPO_PUBLIC_PRIVY_APP_ID` (+ optional `EXPO_PUBLIC_PRIVY_CLIENT_ID`) in `app/.env`.
- Confirm Base (8453) is in the app's supported chains.
- **Rotate** the development app secret that was shared during the build before
  any production use.

## 5. What needs legal / compliance review

- Non-custodial positioning — confirm 3DotPay is not acting as a PSP / MSB /
  exchange in the operating jurisdictions, given funds route user→partner.
- AEON/KSHER contract terms, KYC/AML responsibility split, and who is the
  merchant-of-record for the THB leg.
- Thailand PromptPay scheme rules and cross-border settlement licensing.
- Stablecoin (USDC) handling, consumer disclosures, fees, refunds/disputes, and
  terms of service / privacy policy.
- Data retention for transaction records vs. privacy obligations.

## 6. How to run locally

```bash
# from repo root — installs all workspaces (npm workspaces)
npm install

cp backend/.env.example backend/.env   # fill MONGODB_URI, PRIVY_APP_SECRET
cp app/.env.example app/.env           # PRIVY_APP_ID pre-filled

# Backend (tsx watch, http://localhost:8080)
npm run dev:api
curl http://localhost:8080/health

# Tests / checks
npm test                # backend; app: npm test -w app
npm run typecheck
npm run lint
```

Local dev auth uses a mock header (no Privy call) — production ignores it:

```bash
curl -H "x-dev-user-id: dev-1" http://localhost:8080/api/v1/user/profile
```

## 7. How to deploy the API

- **Runtime**: Node ≥ 20 (developed on 24). Start with `npm run start:api`
  (`tsx src/server.ts`); run behind a process manager or container.
- **Env (production)**: `NODE_ENV=production`, a real `MONGODB_URI`,
  `PRIVY_APP_ID` + `PRIVY_APP_SECRET`, an explicit `CORS_ORIGIN` allow-list
  (**not** `*` — env fail-fast rejects `*` in prod), `BASE_RPC_URL`,
  `SETTLEMENT_PARTNER` + partner creds + `SETTLEMENT_WALLET_ADDRESS`.
- **Secrets**: inject via the host's secret manager; never commit `.env`.
- **TLS**: terminate HTTPS at the load balancer / reverse proxy.
- **Data**: MongoDB Atlas (or managed Mongo); indexes are created by the models.
- **Health**: point the platform's health check at `GET /health`.
- The chain confirmation monitor starts with the server; ensure the RPC URL has
  sufficient rate limits for the poll interval (`CHAIN_POLL_INTERVAL_MS`).

> Note: a single in-memory rate-limit store is used. For multiple API instances,
> move to a shared store (see nice-to-have below).

## 8. How to build the mobile app

Privy + camera **do not run in Expo Go** — a custom EAS dev/build client is required.

```bash
cd app
cp .env.example .env                 # set EXPO_PUBLIC_API_BASE_URL (LAN IP for device)
npx eas-cli login
npx eas-cli init                     # one-time: links project (writes projectId)

# Dev client (for local development against the dev server)
npx eas-cli build --profile development --platform android   # or ios
npm run dev:app -- --dev-client

# Production build
npx eas-cli build --profile production --platform android    # or ios
# then: npx eas-cli submit -p android   # / ios, to the stores
```

`EXPO_PUBLIC_*` values are baked into the build — rebuild after changing them,
and never put secrets there.

---

## 9. TODO categorization

### Launch blockers (must do before real users)
- Replace mock settlement with a real AEON/KSHER integration (no fiat moves today).
- Set a real `SETTLEMENT_WALLET_ADDRESS`.
- Verify the full flow on a physical device via an EAS build.
- Production config: `NODE_ENV=production`, real Privy creds, explicit
  `CORS_ORIGIN` allow-list, HTTPS.
- Rotate the dev Privy app secret and Mongo credentials shared during development.

### Partner integration (needs AEON/KSHER)
- Implement `requestQuote` / `notifyPayment` / `getSettlementStatus` in the
  `aeon` and `ksher` adapters (currently fail-fast stubs).
- Replace the mock FX rate with the partner's live quote.
- Settlement webhook + signature verification; partner wallet/address rules.
- Fill `AEON_*` / `KSHER_*` env values (TODO markers in `backend/.env.example`
  and `backend/src/config/env.ts`).

### Nice-to-have (post-MVP)
- Google / Apple login (currently placeholders).
- Share receipt (currently a placeholder).
- Shared rate-limit store (e.g. Redis) for multi-instance API.
- Push notification when settlement completes.
- Configurable confirmation count / finality tuning.

---

## 10. At a glance

| Area | State |
|---|---|
| Auth (email OTP + embedded wallet) | ✅ Implemented |
| QR decode (PromptPay) | ✅ Implemented |
| Quote (60s, THB→USDC) | ✅ Implemented |
| Payment (Privy-signed USDC transfer) | ✅ Implemented |
| On-chain confirmation | ✅ Implemented |
| History / receipts | ✅ Implemented |
| Settlement (real fiat payout) | ⚠️ Mocked — partner integration |
| Google/Apple login, share | ⚠️ Placeholder |
| Physical-device verification | ⛔ Not done — launch blocker |
| Production secrets / config | ⛔ Pending — launch blocker |
