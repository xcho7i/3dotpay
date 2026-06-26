# 3DotPay — MVP QA & Demo Runbook

A step-by-step guide a **non-engineer** can follow to set up, demo, and QA the MVP.
You should not need to read any source code.

---

## A. Demo setup

### A1. Prerequisites
- Node.js 20+ and npm installed.
- A phone (iOS/Android) for the full flow. **Expo Go will not work** — Privy needs a
  custom build, so you need an **EAS development build** installed on the phone.
- A MongoDB connection string (MongoDB Atlas free tier is fine).
- Privy dashboard credentials (App ID, App Secret, Client ID) — already provisioned.

### A2. Required environment variables

**Backend** — copy `backend/.env.example` to `backend/.env` and fill:
```
NODE_ENV=development
PORT=8080
MONGODB_URI=<your mongodb connection string>
PRIVY_APP_ID=<from Privy dashboard>
PRIVY_APP_SECRET=<from Privy dashboard>          # secret — never commit
BASE_RPC_URL=https://mainnet.base.org            # or Base Sepolia (see A5)
BASE_CHAIN_ID=8453
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
SETTLEMENT_PARTNER=mock                           # uses the built-in mock AEON
```

**Mobile** — copy `app/.env.example` to `app/.env` and fill:
```
EXPO_PUBLIC_PRIVY_APP_ID=<from Privy dashboard>
EXPO_PUBLIC_PRIVY_CLIENT_ID=<from Privy dashboard>
EXPO_PUBLIC_API_BASE_URL=http://<your-computer-LAN-IP>:8080   # NOT localhost for a phone
EXPO_PUBLIC_BASE_CHAIN_ID=8453
```

### A3. Run the backend API
```
npm install            # from the repo root (once)
npm run dev:api        # starts http://localhost:8080
```
Verify it's up:
```
curl http://localhost:8080/health        # → {"status":"ok",...}
```
You should see `MongoDB connected` and `Chain monitor started` in the logs.

### A4. Run the mobile app
```
npm run dev:app        # starts the Expo dev server
```
Open your **EAS development build** on the phone and connect it to the dev server
(scan the QR or pick the LAN URL). The home screen shows the 3DotPay logo.

### A5. Mock AEON adapter & test-transaction mode
- **Mock AEON (default):** `SETTLEMENT_PARTNER=mock`. Quotes use a fixed rate
  (≈ 36.5 THB per USDC) and settlement **auto-succeeds**. No partner account needed.
- **On-chain confirmation is real.** There is **no fully-mocked transaction mode** —
  the backend validates the actual on-chain transfer. For safe demos use **Base
  Sepolia testnet** so no real funds move:
  ```
  # backend/.env
  BASE_RPC_URL=https://sepolia.base.org
  BASE_CHAIN_ID=84532
  USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e   # testnet USDC
  # app/.env
  EXPO_PUBLIC_BASE_CHAIN_ID=84532
  ```
  Fund the embedded wallet with Base Sepolia ETH (gas) + testnet USDC before paying.

---

## B. Happy path (full demo, ~3 min)

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Open the app | Splash → Welcome/Login |
| 2 | Log in with **email** | Enter email → 6-digit code → logged in |
| 3 | Wallet created | Home shows a short wallet address (`0x1234…abcd`) |
| 4 | View **Deposit** | Shows wallet QR + address + "USDC on Base only" warning; Copy works |
| 5 | Tap **Scan QR to pay** | Camera opens (allow permission) |
| 6 | Scan a **PromptPay** QR | Decodes; if no amount, prompts for THB amount |
| 7 | Get **quote** | Shows THB amount, USDC amount, rate, fee, **60s countdown** |
| 8 | Tap **Pay now** | Privy prompts to confirm; wallet signs + sends USDC |
| 9 | txHash captured → submitted | App moves to **Processing** ("Confirming payment…") |
| 10 | Backend tracks status | Status advances SUBMITTED → CONFIRMED → SUCCESS |
| 11 | **Receipt** displayed | Green check, amounts, tx hash, **View on BaseScan**, Share |
| 12 | **History** updated | New transaction appears with a status badge |

### Backend-only smoke (no phone, via curl)
Outside production you can use the **mock auth header** `x-dev-user-id`:
```
# 1) create a quote
curl -s -H "x-dev-user-id: demo" -H "Content-Type: application/json" \
  -d '{"merchantId":"M-1","merchantAmount":"73.00","currency":"THB"}' \
  http://localhost:8080/api/v1/quote
# 2) submit a payment (use the quoteId above + a REAL on-chain txHash)
curl -s -H "x-dev-user-id: demo" -H "Content-Type: application/json" \
  -d '{"quoteId":"<id>","txHash":"0x<64 hex>","walletAddress":"0x<40 hex>"}' \
  http://localhost:8080/api/v1/payment
# 3) poll status
curl -s -H "x-dev-user-id: demo" http://localhost:8080/api/v1/transactions/<txId>/status
```
> Note: status only reaches SUCCESS when the txHash is a **real, matching** USDC
> transfer on the configured chain. With a fake hash it stays `SUBMITTED`/pending.

---

## C. Failure paths to demonstrate

| Scenario | How to trigger | Expected |
|----------|----------------|----------|
| Invalid QR | Scan a non-PromptPay QR | "Can't read this QR" → **Scan again** |
| Missing amount | Scan an open-amount PromptPay QR | App asks you to enter the THB amount |
| Expired quote | Wait > 60s on the quote screen | Countdown hits 0 → **Pay now** disabled → "Get a new quote" |
| Insufficient balance | Pay with an underfunded wallet | Wallet/tx fails → Processing → **Payment failed** |
| Rejected confirmation | Cancel the Privy signing prompt | Returns to quote with an error; can retry |
| RPC failure | Stop/unreach the RPC | Balance shows "couldn't load · tap to retry"; status polling keeps trying then **times out** gracefully |
| Settlement failure | (Real partner) settlement returns FAILED | Transaction → **FAILED** with a reason on the receipt |
| Duplicate submission | Submit the same quote/txHash twice | `409` — quote already used / tx already recorded |

---

## D. QA checklist (tick each)

- [ ] `GET /health` returns ok.
- [ ] Email login works; Home shows a wallet address.
- [ ] Deposit address + copy + QR render.
- [ ] Scanning a PromptPay QR navigates to a quote.
- [ ] Quote shows THB + USDC + fee + a live countdown.
- [ ] Pay Now triggers the wallet confirmation.
- [ ] After paying, Processing → Receipt on success.
- [ ] Receipt shows amounts, tx hash, BaseScan link.
- [ ] History lists the transaction with a status badge; scrolling loads more.
- [ ] A second user cannot see the first user's transactions.
- [ ] Expired quote cannot be paid.
- [ ] Invalid QR shows a clear error.

---

## E. Known limitations (MVP)

- **Settlement is mocked** — `SETTLEMENT_PARTNER=mock` auto-succeeds; no real fiat
  payout. Real AEON/KSHER is a boundary stub (see `settlement-partner-contract.md`).
- **No fully-mocked tx mode** — confirmation needs a real on-chain transfer; use
  **Base Sepolia** for safe demos.
- **Requires an EAS dev build** — Privy + camera don't run in Expo Go.
- **PromptPay (Thailand) only**; **USDC on Base only**.
- **Rate limiting is per-instance** (in-memory) — fine for a demo, not for scale.
- Quotes use a **fixed mock FX rate**, not a live market rate.
- Rotate the shared MongoDB/Privy credentials before any public deployment.
