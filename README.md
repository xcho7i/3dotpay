# 3DotPay

MVP crypto-to-local-QR payment app. Scan a Thailand **PromptPay** QR, pay with
**USDC on Base** from a Privy embedded wallet; funds settle directly to a
settlement partner. 3DotPay handles UX + metadata only — **never** funds or keys.

> Status: **MVP feature-complete with a mock settlement partner.** Full flow
> works: email login → embedded wallet → scan PromptPay → quote → pay (USDC on
> Base) → on-chain confirmation → settlement → receipt → history. Settlement is
> **mocked**; AEON/KSHER is an intentional fail-fast boundary. Not yet verified on
> a physical device. See [docs/mvp-status.md](docs/mvp-status.md) for the full
> status, what's mocked, and launch blockers.

## Layout

```
app/               React Native (Expo SDK 56) + expo-router — mobile
backend/           Node.js + Express 5 + TypeScript — API
packages/shared/   zod schemas, types, constants (single source of truth)
docs/              status, runbook, security review, partner contract, architecture
```

Managed with **npm workspaces** (single root lockfile).

## What's built

- **Auth**: Privy email OTP → embedded Base wallet; backend verifies Privy tokens.
- **Deposit**: wallet address + QR + "USDC on Base only" warning.
- **Pay**: scan PromptPay QR → decode (EMVCo + CRC) → quote (60s TTL) → Privy
  signs a USDC transfer → backend records `txHash`.
- **Confirm**: chain monitor validates the transfer + tracks settlement; status
  endpoint + polling drive the receipt.
- **History/Receipts**: paginated, ownership-scoped, BaseScan link.
- **Hardening**: rate limiting, prod env fail-fast, Mongo indexes, log redaction.

## Docs

- [docs/mvp-status.md](docs/mvp-status.md) — final status + run/deploy/build guide
- [docs/mvp-demo-runbook.md](docs/mvp-demo-runbook.md) — non-engineer QA/demo script
- [docs/security-review.md](docs/security-review.md) — security checklist + risks
- [docs/settlement-partner-contract.md](docs/settlement-partner-contract.md) — AEON/KSHER needs
- [docs/screens.md](docs/screens.md) — screen-by-screen descriptions
- [docs/architecture.md](docs/architecture.md) · [docs/api-contracts.md](docs/api-contracts.md)

## Prerequisites

- Node.js >= 20 (repo developed on Node 24)
- npm >= 10
- For mobile: a **custom Expo dev build** is required later (Privy/camera don't
  run in Expo Go). The home placeholder runs in Expo Go today.

## Setup

```bash
# from the repo root — installs all workspaces
npm install

# create local env files (then fill in values)
cp backend/.env.example backend/.env
cp app/.env.example app/.env
```

## Run

### Backend API

```bash
npm run dev:api        # tsx watch, http://localhost:8080
# health check:
curl http://localhost:8080/health
```

**Local dev auth (safe mock mode):** protected routes need a Privy access token,
but outside production you can use a mock header instead — no Privy call is made:

```bash
curl -H "x-dev-user-id: dev-1" http://localhost:8080/api/v1/user/profile
```

In production this header is ignored; only a verified `Authorization: Bearer
<privy token>` is accepted. Set `PRIVY_APP_ID` + `PRIVY_APP_SECRET` for real tokens.

### Mobile app

The app uses Privy (email OTP login + embedded wallets), which **does not run in
Expo Go** — it needs a custom dev client built with EAS (cloud).

```bash
# 1. Configure env
cp app/.env.example app/.env        # EXPO_PUBLIC_PRIVY_APP_ID is pre-filled

# 2. One-time: create an EAS dev build (cloud)
cd app
npx eas-cli login
npx eas-cli init                    # links the project (writes eas projectId)
npx eas-cli build --profile development --platform android   # or ios
# install the resulting build on a device/emulator

# 3. Run the dev server against that build
npm run dev:app -- --dev-client     # or: npx expo start --dev-client
```

Auth flow: Welcome → email → 6-digit code → **Home** (shows the embedded Base
wallet address, which is synced to the backend via `PATCH /api/v1/user/wallet`).
For the backend to verify real Privy tokens, set `PRIVY_APP_SECRET` in
`backend/.env`. All Privy code is isolated under `app/src/lib/privy` and
`app/src/features/auth`.

## Useful scripts (root)

```bash
npm test               # backend tests (vitest); app tests: npm test -w app
npm run typecheck      # typecheck shared + api + app
npm run lint           # eslint (whole repo, must pass clean)
npm run format         # prettier --write
```

## Environment

Secrets come from environment variables only — nothing is hardcoded or
committed. See `backend/.env.example` and `app/.env.example`. `EXPO_PUBLIC_*`
vars are bundled into the client, so never put secrets there.

## Security

No private keys, seed phrases, or recovery material are stored anywhere. Privy
access-token verification is isolated in
[`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts).
