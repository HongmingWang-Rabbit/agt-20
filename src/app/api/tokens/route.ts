import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tokens = await prisma.token.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Convert BigInt to string for JSON serialization
    const serialized = tokens.map(token => ({
      id: token.id,
      tick: token.tick,
      maxSupply: token.maxSupply.toString(),
      mintLimit: token.mintLimit.toString(),
      supply: token.supply.toString(),
      holders: token.holders,
      operations: token.operations,
      decimals: token.decimals,
      deployer: token.deployer,
      deployedAt: token.deployedAt.toISOString(),
    }));

    return NextResponse.json({ tokens: serialized });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}
