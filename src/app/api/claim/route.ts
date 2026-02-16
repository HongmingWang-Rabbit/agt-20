import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createWalletClient, http, encodePacked, keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hashkeyTestnet } from '@/lib/wagmi';

export const dynamic = 'force-dynamic';

const SIGNER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const CLAIM_FACTORY = process.env.NEXT_PUBLIC_CLAIM_FACTORY as `0x${string}`;

// GET: Check if token is claimable and get user's balance
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tick = searchParams.get('tick');
  const agentName = searchParams.get('agent');

  if (!tick) {
    return NextResponse.json({ error: 'tick required' }, { status: 400 });
  }

  try {
    // Get token info
    const token = await prisma.token.findUnique({
      where: { tick: tick.toUpperCase() },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const isClaimable = token.supply >= token.maxSupply;
    const progress = Number((token.supply * BigInt(100)) / token.maxSupply);

    // If agent specified, get their balance
    let userBalance = BigInt(0);
    if (agentName) {
      const agent = await prisma.agent.findUnique({
        where: { name: agentName },
      });
      if (agent) {
        const balance = await prisma.balance.findUnique({
          where: {
            tokenId_agentId: {
              tokenId: token.id,
              agentId: agent.id,
            },
          },
        });
        userBalance = balance?.amount || BigInt(0);
      }
    }

    return NextResponse.json({
      tick: token.tick,
      maxSupply: token.maxSupply.toString(),
      supply: token.supply.toString(),
      progress,
      isClaimable,
      userBalance: userBalance.toString(),
      message: isClaimable 
        ? 'Token is claimable! Connect wallet to claim.'
        : `Minting in progress: ${progress}% complete`,
    });
  } catch (error) {
    console.error('Claim check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: Generate claim signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tick, agentName, walletAddress, tokenAddress } = body;

    if (!tick || !agentName || !walletAddress) {
      return NextResponse.json(
        { error: 'tick, agentName, and walletAddress required' },
        { status: 400 }
      );
    }

    // Get token info
    const token = await prisma.token.findUnique({
      where: { tick: tick.toUpperCase() },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Check if claimable
    if (token.supply < token.maxSupply) {
      return NextResponse.json(
        { error: 'Token minting not complete yet', supply: token.supply.toString(), maxSupply: token.maxSupply.toString() },
        { status: 400 }
      );
    }

    // Get agent's balance
    const agent = await prisma.agent.findUnique({
      where: { name: agentName },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const balance = await prisma.balance.findUnique({
      where: {
        tokenId_agentId: {
          tokenId: token.id,
          agentId: agent.id,
        },
      },
    });

    const amount = balance?.amount || BigInt(0);
    if (amount === BigInt(0)) {
      return NextResponse.json({ error: 'No balance to claim' }, { status: 400 });
    }

    // Generate signature
    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);
    
    // For deployAndClaim (first claimer), use factory address
    // For subsequent claims, use token contract address
    const contractAddress = tokenAddress || CLAIM_FACTORY;
    
    const messageHash = keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256', 'address'],
        [walletAddress as `0x${string}`, amount, BigInt(hashkeyTestnet.id), contractAddress as `0x${string}`]
      )
    );

    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return NextResponse.json({
      success: true,
      tick: token.tick,
      agentName,
      walletAddress,
      amount: amount.toString(),
      maxSupply: token.maxSupply.toString(),
      signature,
      contractAddress,
      chainId: hashkeyTestnet.id,
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
