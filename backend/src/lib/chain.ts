import { type Chain, createPublicClient, erc20Abi, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../config/env.js';

/** Resolve the configured Base chain (mainnet or Sepolia) from env. */
const chain: Chain = env.BASE_CHAIN_ID === baseSepolia.id ? baseSepolia : base;

/** Read-only Base client (confirmation monitoring, balances). */
export const publicClient = createPublicClient({
  chain,
  transport: http(env.BASE_RPC_URL),
});

/** ERC-20 `balanceOf` for `owner` on `token`. Returns base units (bigint). */
export function readErc20Balance(
  token: `0x${string}`,
  owner: `0x${string}`,
): Promise<bigint> {
  return publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [owner],
  });
}
