/**
 * Pure, dependency-free helpers for building an ERC-20 USDC transfer. Isolated
 * and unit-tested (see test/usdcTransfer.test.ts) because this is the most
 * safety-critical code in the app — it moves real money.
 *
 * No private keys are ever touched here: this only builds the unsigned
 * `eth_sendTransaction` request that the Privy embedded wallet signs + sends.
 */

/** ERC-20 `transfer(address,uint256)` function selector. */
const TRANSFER_SELECTOR = 'a9059cbb';

/**
 * Convert a decimal amount string (e.g. "12.34") to integer base units, WITHOUT
 * floating point. Throws on malformed input or more fractional digits than the
 * token supports.
 */
export function toBaseUnits(amount: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(amount)) {
    throw new Error(`Invalid decimal amount: "${amount}"`);
  }
  const [whole, frac = ''] = amount.split('.');
  if (frac.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places: "${amount}"`);
  }
  const paddedFrac = frac.padEnd(decimals, '0');
  return BigInt(`${whole}${paddedFrac}`);
}

/** Left-pad a hex string (no 0x) to 32 bytes (64 hex chars). */
function pad32(hex: string): string {
  if (hex.length > 64) throw new Error('Value exceeds 32 bytes');
  return hex.padStart(64, '0');
}

/** Validate + normalize a 0x EVM address to lowercase (no checksum needed for calldata). */
function normalizeAddress(address: string): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid EVM address: "${address}"`);
  }
  return address.slice(2).toLowerCase();
}

/**
 * Encode ERC-20 `transfer(to, amount)` calldata: selector + 32-byte address +
 * 32-byte amount.
 */
export function encodeErc20Transfer(to: string, amountBaseUnits: bigint): `0x${string}` {
  if (amountBaseUnits < 0n) throw new Error('Amount must be non-negative');
  const toPadded = pad32(normalizeAddress(to));
  const amountPadded = pad32(amountBaseUnits.toString(16));
  return `0x${TRANSFER_SELECTOR}${toPadded}${amountPadded}`;
}

export interface UsdcTransferParams {
  /** Sender (embedded wallet) address. */
  from: string;
  /** USDC token contract address. */
  tokenAddress: string;
  /** Recipient (settlement) address. */
  to: string;
  /** Amount as a decimal string, e.g. the quote's amountUSDC. */
  amountUsdc: string;
  decimals: number;
  chainId: number;
}

/** An unsigned EIP-1193 `eth_sendTransaction` parameter object. */
export interface EthSendTransaction {
  from: string;
  to: string;
  data: `0x${string}`;
  value: '0x0';
  chainId: number;
}

/**
 * Build the unsigned transaction for a USDC transfer. `to` is the TOKEN contract
 * (the transfer recipient is encoded in calldata); `value` is 0.
 */
export function buildUsdcTransfer(params: UsdcTransferParams): EthSendTransaction {
  const amount = toBaseUnits(params.amountUsdc, params.decimals);
  if (amount <= 0n) throw new Error('Transfer amount must be greater than 0');
  return {
    from: params.from,
    to: params.tokenAddress,
    data: encodeErc20Transfer(params.to, amount),
    value: '0x0',
    chainId: params.chainId,
  };
}
