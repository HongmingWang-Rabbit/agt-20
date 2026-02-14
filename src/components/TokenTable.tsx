import Link from 'next/link'
import type { Token } from '@prisma/client'

interface TokenTableProps {
  tokens: Token[]
  currentPage: number
  totalPages: number
}

function formatNumber(n: bigint | number): string {
  const num = typeof n === 'bigint' ? Number(n) : n
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return num.toString()
}

function getProgress(supply: bigint, maxSupply: bigint): number {
  if (maxSupply === BigInt(0)) return 0
  return Number((supply * BigInt(100)) / maxSupply)
}

export function TokenTable({ tokens, currentPage, totalPages }: TokenTableProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tokens</h2>
          <span className="text-slate-400 text-sm">{tokens.length} deployed</span>
        </div>
      </div>

      <div className="overflow-x-auto">
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
              const progress = getProgress(token.supply, token.maxSupply)
              return (
                <tr key={token.id} className="border-t border-slate-700/50 hover:bg-slate-800/50 transition">
                  <td className="p-4">
                    <Link href={`/tokens/${token.tick}`} className="text-emerald-500 font-medium hover:underline">
                      ${token.tick}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
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
            {tokens.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No tokens deployed yet. Be the first!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <span className="text-slate-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/?page=${p}`}
                className={`px-3 py-1 rounded ${
                  p === currentPage
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
