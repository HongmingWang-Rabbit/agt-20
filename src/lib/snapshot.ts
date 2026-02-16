import { createPublicClient, http, getContract } from 'viem';
import { PrismaClient } from '@prisma/client';
import { hashkeyTestnet, CONTRACTS } from './chain';

const prisma = new PrismaClient();

const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(),
});

const FACTORY_ABI = [
  {
    name: 'allTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'tick', type: 'string' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'deployedBy', type: 'address' },
      { name: 'deployedAt', type: 'uint256' },
    ],
  },
] as const;

const TOKEN_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'maxSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface TokenSnapshot {
  address: string;
  tick: string;
  maxSupply: bigint;
  totalSupply: bigint;
  totalClaimed: bigint;
  deployedBy: string;
  deployedAt: Date;
}

export async function getOnChainTokens(): Promise<TokenSnapshot[]> {
  const factory = getContract({
    address: CONTRACTS.claimFactory,
    abi: FACTORY_ABI,
    client: publicClient,
  });

  const totalTokens = await factory.read.totalTokens();
  console.log(`Found ${totalTokens} tokens on-chain`);

  const tokens: TokenSnapshot[] = [];

  for (let i = 0; i < totalTokens; i++) {
    try {
      const tokenAddress = await factory.read.allTokens([BigInt(i)]);
      const info = await factory.read.tokenInfo([tokenAddress]);
      
      const token = getContract({
        address: tokenAddress,
        abi: TOKEN_ABI,
        client: publicClient,
      });

      const [totalSupply, totalClaimed] = await Promise.all([
        token.read.totalSupply(),
        token.read.totalClaimed(),
      ]);

      tokens.push({
        address: tokenAddress,
        tick: info[1],
        maxSupply: info[2],
        totalSupply,
        totalClaimed,
        deployedBy: info[3],
        deployedAt: new Date(Number(info[4]) * 1000),
      });
    } catch (error) {
      console.error(`Error fetching token ${i}:`, error);
    }
  }

  return tokens;
}

export async function syncTokensToDb(): Promise<{ synced: number; errors: number }> {
  const tokens = await getOnChainTokens();
  let synced = 0;
  let errors = 0;

  for (const token of tokens) {
    try {
      await prisma.token.upsert({
        where: { tick: token.tick },
        create: {
          tick: token.tick,
          maxSupply: token.maxSupply,
          mintLimit: token.maxSupply, // For claimable tokens, mintLimit = maxSupply
          supply: token.totalClaimed,
          holders: 0, // Would need to track Transfer events to count
          operations: 0,
          decimals: 0,
          deployer: token.deployedBy,
          deployedAt: token.deployedAt,
        },
        update: {
          supply: token.totalClaimed,
          updatedAt: new Date(),
        },
      });
      synced++;
      console.log(`✓ Synced ${token.tick}: ${token.totalClaimed}/${token.maxSupply} claimed`);
    } catch (error) {
      errors++;
      console.error(`✗ Error syncing ${token.tick}:`, error);
    }
  }

  // Update indexer state
  await prisma.indexerState.upsert({
    where: { id: 'onchain-snapshot' },
    create: { id: 'onchain-snapshot', lastIndexed: new Date() },
    update: { lastIndexed: new Date() },
  });

  return { synced, errors };
}

// Run snapshot
export async function runSnapshot() {
  console.log('Starting on-chain token snapshot...');
  console.log(`Factory: ${CONTRACTS.claimFactory}`);
  console.log(`Chain: ${hashkeyTestnet.name} (${hashkeyTestnet.id})`);
  console.log('---');

  const result = await syncTokensToDb();
  
  console.log('---');
  console.log(`Snapshot complete: ${result.synced} synced, ${result.errors} errors`);
  
  return result;
}
