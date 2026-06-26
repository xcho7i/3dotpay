# Settlement Partner Contract (AEON / KSHER)

> Status: **boundary defined, real integration NOT implemented.** The `Mock`
> adapter is the working default. `AeonSettlementAdapter` / `KsherSettlementAdapter`
> are typed stubs with TODOs and **no invented API fields**. This doc captures
> exactly what we need from the partner so the stubs can be filled in.

## Where 3DotPay sits

3DotPay is **not** a custodian, exchange, or PSP. Funds never touch us. The user's
Privy embedded wallet sends USDC **directly** to the partner's settlement wallet.
We only: request a quote, notify the partner of the on-chain `txHash`, and track
status. The adapter interface (`backend/src/modules/settlement/settlement.types.ts`)
is the contract:

```ts
interface SettlementPartner {
  requestQuote(input): Promise<QuoteResult>;
  notifyPayment(input): Promise<NotifyPaymentResult>;
  getSettlementStatus(input): Promise<SettlementStatusResult>;
}
```

## 1. Data we need from AEON / KSHER

- **API base URL** (sandbox + production) → `AEON_API_BASE_URL` / `KSHER_API_BASE_URL`
- **API credentials** (key/secret, auth scheme: header? HMAC? OAuth?) → `*_API_KEY`
- **Settlement wallet address(es)** on Base for USDC, and the rules for how/when
  they rotate (static per merchant? per quote? per partner?).
- **Supported corridors**: confirm THB + PromptPay is live; confirm USDC-on-Base in.
- **Quote endpoint** + **payment-notify endpoint** + **status endpoint** (or webhook).
- **Decimal/rounding rules** for fiat↔USDC and fees.

## 2. Quote request fields (what we send)

Currently (mock): `{ merchantId, merchantAmount (THB, decimal string), fiatCurrency: 'THB', assetCurrency: 'USDC', chain: 'base' }`.

> **OPEN:** Does AEON need the PromptPay payload/merchant proxy id directly? Does
> it need an expiry hint, a client reference, or KYC/user identifiers?

## 3. Quote response fields (what we need back)

Mapped into `QuoteResult`:

| Our field            | Meaning                                  | OPEN question |
| -------------------- | ---------------------------------------- | ------------- |
| `fxRate`             | THB per 1 USDC                           | exact field name + precision? |
| `amountAsset`        | USDC the user must send (decimal string) | who rounds, and which direction? |
| `networkFeeEstimate` | est. on-chain fee in USDC                | does AEON provide this, or do we? |
| `settlementAddress`  | Base address to receive USDC             | per-quote or static? checksum format? |
| (partner quote id)   | AEON's own quote reference               | needed for notify/status correlation? |
| (expiry)             | partner-side quote TTL                   | does it match our 60s, or shorter? |

## 4. Settlement wallet address rules

- Must be a valid Base EVM address that accepts **USDC (ERC-20)**.
- **OPEN:** static vs per-quote? If per-quote, the address comes from
  `requestQuote` and must be stored on the quote (we already do this).
- **OPEN:** any allow-list / memo / reference required alongside the transfer?
  (ERC-20 transfers can't carry a memo — if AEON needs a reference, it must come
  from `notifyPayment`, not the transfer.)

## 5. Webhook / callback needs

- **Preferred:** AEON → 3DotPay webhook on settlement state change (signed).
- **OPEN:** webhook URL registration, signature scheme, retry policy, payload shape.
- **Fallback (MVP):** we poll `getSettlementStatus` from the background monitor.
- If webhooks are used we need: a public callback endpoint, signature verification,
  and idempotent handling.

## 6. Status lifecycle

Our internal transaction states:

```
SUBMITTED → CONFIRMED (on-chain) → SETTLEMENT_PENDING → SUCCESS | FAILED
```

We map the partner's settlement status into `PENDING | SUCCESS | FAILED`.

> **OPEN:** AEON's exact status enum + the meaning of intermediate states
> (accepted / processing / payout-initiated / settled / refunded / failed).

## 7. Failure modes to define

- Quote expired on the partner side before notify.
- `txHash` not seen / wrong amount / wrong recipient (we already validate on-chain
  before notifying — see `ChainMonitorService`).
- Settlement rejected (compliance, merchant offline, limits).
- Partial settlement / refund path (does the user get USDC back, and to where?).
- Duplicate notify for the same `txHash` (must be idempotent).
- Partner API down / timeout (retry + backoff policy).

## 8. Config

```
SETTLEMENT_PARTNER=mock|aeon|ksher   # default: mock
AEON_API_BASE_URL=...  AEON_API_KEY=...
KSHER_API_BASE_URL=... KSHER_API_KEY=...
```

In **production**, selecting `aeon`/`ksher` without its credentials **fails fast at
startup** (env validation). The adapters also fail fast at construction if creds
are missing. Until a real contract is provided, the real adapters throw
`SETTLEMENT_NOT_IMPLEMENTED` rather than guessing API shapes.
