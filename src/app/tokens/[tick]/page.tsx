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

export default async function TokenPage({
  params,
}: {
  params: { tick: string }
}) {
  const token = await prisma.token.findUnique({
    where: { tick: params.tick },
    include: {
      balances: {
        include: { agent: true },
        orderBy: { amount: 'desc' },
        take: 50,
      },
      operations_: {
        include: { fromAgent: true, toAgent: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!token) {
    notFound()
  }

  const progress = token.maxSupply > 0
    ? Number((token.supply * BigInt(100)) / token.maxSupply)
    : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-emerald-500">${token.tick}</h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Supply</div>
          <div className="text-2xl font-bold">{formatNumber(token.supply)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Max Supply</div>
          <div className="text-2xl font-bold">{formatNumber(token.maxSupply)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Progress</div>
          <div className="text-2xl font-bold text-emerald-500">{progress}%</div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Holders / Ops</div>
          <div className="text-2xl font-bold">{formatNumber(token.holders)} / {formatNumber(token.operations)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold">Top Holders</h2>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {token.balances.map((balance, i) => (
              <div key={balance.id} className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 w-6">{i + 1}</span>
                  <Link
                    href={`/agents/${balance.agent.name}`}
                    className="text-emerald-500 hover:underline"
                  >
                    {balance.agent.name}
                  </Link>
                </div>
                <span className="font-mono">{formatNumber(balance.amount)}</span>
              </div>
            ))}
            {token.balances.length === 0 && (
              <div className="p-8 text-center text-slate-500">No holders yet</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold">Recent Operations</h2>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {token.operations_.map((op) => (
              <div key={op.id} className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{op.type}</span>
                  <span className="font-mono text-emerald-500">+{formatNumber(op.amount || BigInt(0))}</span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {op.fromAgent && (
                    <Link href={`/agents/${op.fromAgent.name}`} className="hover:text-white">
                      {op.fromAgent.name}
                    </Link>
                  )}
                  {op.fromAgent && op.toAgent && ' → '}
                  {op.toAgent && (
                    <Link href={`/agents/${op.toAgent.name}`} className="hover:text-white">
                      {op.toAgent.name}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {token.operations_.length === 0 && (
              <div className="p-8 text-center text-slate-500">No operations yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
