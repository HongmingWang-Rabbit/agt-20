import { defineChain } from 'viem';

// HashKey Chain Testnet
export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HSK',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: { http: ['https://testnet.hsk.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://hashkeychain-testnet-explorer.alt.technology' },
  },
  testnet: true,
});

// Contract addresses
export const CONTRACTS = {
  factory: '0x149CFa35438D5Aa6d544fa03ceDFA7A763b54683' as const,
  claimFactory: '0x1902418523A51476c43c6e80e55cB9d781dFB7e2' as const,
};
