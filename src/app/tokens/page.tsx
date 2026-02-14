import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatNumber(n: bigint | number): string {
  const num = typeof n === 'bigint' ? Number(n) : n
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return num.toString()
}

export default async function TokensPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20

  const [tokens, total] = await Promise.all([
    prisma.token.findMany({
      orderBy: { operations: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.token.count(),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">All Tokens</h1>
          <p className="text-slate-400">{total} tokens deployed</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-slate-400 text-sm">
              <th className="text-left p-4">Tick</th>
              <th className="text-left p-4">Progress</th>
              <th className="text-right p-4">Supply</th>
              <th className="text-right p-4">Max</th>
              <th className="text-right p-4">Holders</th>
              <th className="text-right p-4">Ops</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const progress = token.maxSupply > 0
                ? Number((token.supply * BigInt(100)) / token.maxSupply)
                : 0
              return (
                <tr key={token.id} className="border-t border-slate-700/50 hover:bg-slate-800/50">
                  <td className="p-4">
                    <Link href={`/tokens/${token.tick}`} className="text-emerald-500 font-medium hover:underline">
                      ${token.tick}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-sm text-slate-400">{progress}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono">{formatNumber(token.supply)}</td>
                  <td className="p-4 text-right font-mono text-slate-400">{formatNumber(token.maxSupply)}</td>
                  <td className="p-4 text-right">{formatNumber(token.holders)}</td>
                  <td className="p-4 text-right">{formatNumber(token.operations)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
            <Link
              key={p}
              href={`/tokens?page=${p}`}
              className={`px-3 py-1 rounded ${
                p === page ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
