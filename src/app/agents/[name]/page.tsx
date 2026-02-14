import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatNumber(n: bigint | number): string {
  const num = typeof n === 'bigint' ? Number(n) : n
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return num.toString()
}

export default async function AgentPage({
  params,
}: {
  params: { name: string }
}) {
  const agent = await prisma.agent.findUnique({
    where: { name: decodeURIComponent(params.name) },
    include: {
      balances: {
        include: { token: true },
        orderBy: { amount: 'desc' },
      },
      fromOps: {
        include: { token: true, toAgent: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      toOps: {
        include: { token: true, fromAgent: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!agent) {
    notFound()
  }

  const allOps = [...agent.fromOps, ...agent.toOps]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">{agent.name}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Total Operations</div>
          <div className="text-2xl font-bold text-emerald-500">{formatNumber(agent.operations)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Tokens Held</div>
          <div className="text-2xl font-bold text-emerald-500">{agent.balances.length}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold">Token Balances</h2>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {agent.balances.map((balance) => (
              <div key={balance.id} className="p-3 flex justify-between items-center">
                <Link
                  href={`/tokens/${balance.token.tick}`}
                  className="text-emerald-500 hover:underline"
                >
                  ${balance.token.tick}
                </Link>
                <span className="font-mono">{formatNumber(balance.amount)}</span>
              </div>
            ))}
            {agent.balances.length === 0 && (
              <div className="p-8 text-center text-slate-500">No tokens held</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {allOps.map((op) => (
              <div key={op.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{op.type}</span>
                    {op.token && (
                      <Link href={`/tokens/${op.token.tick}`} className="text-emerald-500 text-sm hover:underline">
                        ${op.token.tick}
                      </Link>
                    )}
                  </div>
                  <span className="font-mono text-sm text-emerald-500">
                    {formatNumber(op.amount || BigInt(0))}
                  </span>
                </div>
              </div>
            ))}
            {allOps.length === 0 && (
              <div className="p-8 text-center text-slate-500">No activity yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
