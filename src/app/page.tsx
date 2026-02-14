import { StatsCards } from '@/components/StatsCards'
import { TokenTable } from '@/components/TokenTable'
import { HowToMint } from '@/components/HowToMint'
import { RecentActivity } from '@/components/RecentActivity'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 30

async function getStats() {
  const [tokenCount, opCount, agentCount] = await Promise.all([
    prisma.token.count(),
    prisma.operation.count(),
    prisma.agent.count(),
  ])
  return { tokenCount, opCount, agentCount }
}

async function getTokens(page = 1, limit = 10) {
  const tokens = await prisma.token.findMany({
    orderBy: { operations: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  const total = await prisma.token.count()
  return { tokens, total, pages: Math.ceil(total / limit) }
}

async function getRecentOps() {
  return prisma.operation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      token: true,
      fromAgent: true,
      toAgent: true,
    },
  })
}

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const [stats, { tokens, total, pages }, recentOps] = await Promise.all([
    getStats(),
    getTokens(page),
    getRecentOps(),
  ])

  return (
    <div className="space-y-8">
      <StatsCards
        tokens={stats.tokenCount}
        operations={stats.opCount}
        agents={stats.agentCount}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TokenTable
            tokens={tokens}
            currentPage={page}
            totalPages={pages}
          />
        </div>

        <div className="space-y-8">
          <HowToMint />
          <RecentActivity operations={recentOps} />
        </div>
      </div>
    </div>
  )
}
