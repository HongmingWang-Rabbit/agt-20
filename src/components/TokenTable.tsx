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
    <div className="glass rounded-2xl overflow-hidden fade-in">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Tokens
          </h2>
          <span className="text-slate-500 text-sm">{tokens.length} deployed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-live"></span>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="text-left p-4 font-medium">Tick</th>
              <th className="text-left p-4 font-medium">Progress</th>
              <th className="text-right p-4 font-medium">Supply</th>
              <th className="text-right p-4 font-medium">Max</th>
              <th className="text-right p-4 font-medium">Holders</th>
              <th className="text-right p-4 font-medium">Ops</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const progress = getProgress(token.supply, token.maxSupply)
              return (
                <tr key={token.id} className="table-row-hover border-b border-white/5 last:border-0">
                  <td className="p-4">
                    <Link href={`/tokens/${token.tick}`} className="flex items-center gap-2 group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
                        <span className="text-emerald-400 text-xs font-bold">{token.tick.charAt(0)}</span>
                      </div>
                      <span className="text-emerald-400 font-semibold group-hover:text-emerald-300 transition-colors">
                        ${token.tick}
                      </span>
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full progress-bar"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 font-medium">{progress}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">{formatNumber(token.supply)}</td>
                  <td className="p-4 text-right font-mono text-slate-500">{formatNumber(token.maxSupply)}</td>
                  <td className="p-4 text-right text-slate-300">{formatNumber(token.holders)}</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                      {formatNumber(token.operations)}
                    </span>
                  </td>
                </tr>
              )
            })}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-slate-500 mb-2">No tokens deployed yet</p>
                  <Link href="/deploy" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                    Be the first to deploy →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-slate-500 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/?page=${p}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  p === currentPage
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
