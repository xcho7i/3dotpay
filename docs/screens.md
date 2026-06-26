# 3DotPay — Screen Descriptions

Text descriptions of every mobile screen (in lieu of screenshots — these can't be
captured without a running device build). Dark theme, **red/white** accent
(`#E5322D`), clean and minimal. Route files live in `app/src/app/`.

## Auth

- **Splash** (`components/SplashScreen`) — centered 3DotPay logo (three dots:
  red/white/red) + spinner. Shown while Privy initializes.
- **Welcome** (`(auth)/welcome`) — logo, tagline ("Scan. Pay. Done."), and a
  "Continue with email" primary button (Google/Apple are placeholders).
- **Email login** (`(auth)/email`) — email input + "Send code"; loading/error states.
- **Email code** (`(auth)/code`) — 6-digit OTP input + "Verify"; resend; error states.

## Main (auth-gated; unauthenticated users are redirected to Welcome)

- **Home** (`index`) — top bar: logo + ⚙︎ settings. **Balance card**: USDC balance
  on Base (refresh ↻ + pull-to-refresh), short wallet address with sync status.
  Primary actions: **Scan QR to pay**, **Deposit**, **History**. **Recent**
  transactions list (loading/error/empty states).
- **Deposit** (`deposit`) — QR code of the wallet address (white card), full
  address with **Copy**, and a yellow "Send only USDC on Base" warning.
- **Scan** (`scan`) — full-screen camera with a red reticle and "Point at a
  PromptPay QR" hint. States: permission loading, permission denied (with Allow
  button), decoding overlay, error overlay ("Can't read this QR" → Scan again).
  Duplicate scans are suppressed.
- **Quote** (`quote`) — if the QR had no amount, an **amount entry** step (฿ input).
  Then a summary card: pay-to merchant, THB amount, USDC amount, rate, network fee,
  settlement address, and a **60s countdown**. "Pay now" (disabled when expired →
  "Get a new quote"). Pay now shows "Confirm in your wallet…" / "Submitting…".
- **Processing** (`processing`) — spinner + "Confirming payment…"; polls status
  every 3s. Resolves to Receipt on success, a **failed** state on failure, or a
  graceful **timeout** state ("Still processing — check History") after 90s.
- **Receipt** (`receipt`) — status badge (green ✓ success / amber … pending / red ✕
  failed), ฿ amount + USDC amount, merchant, status, short tx hash, **Copy tx hash**,
  **View on BaseScan**, **Share** (placeholder), and **Done**.
- **History** (`history`) — `FlatList` of transactions with colored status badges;
  empty/error/loading states; infinite scroll (cursor pagination) with a footer
  spinner. Tap a row → Transaction detail.
- **Transaction detail** (`transaction/[id]`) — card with status, USDC amount, fiat
  amount, merchant, tx hash, date. Loading/error states; owner-only.
- **Settings** (`settings`) — account email, wallet (short), network (Base), asset
  (USDC), version, and **Log out** (returns to Welcome). Note: "3DotPay never
  stores your keys."

## Shared components (`app/src/components/`)

`Logo`, `Screen` (safe-area + optional scroll/refresh), `Button`
(primary/secondary/ghost/danger), `Card`, `Header` (back chevron), `TransactionRow`
(status-colored), `StateView` (Loading/Error/Empty), `SplashScreen`.
