import Link from 'next/link'
import type { Operation, Token, Agent } from '@prisma/client'

type OperationWithRelations = Operation & {
  token: Token | null
  fromAgent: Agent | null
  toAgent: Agent | null
}

interface RecentActivityProps {
  operations: OperationWithRelations[]
}

function formatNumber(n: bigint | null): string {
  if (!n) return '0'
  const num = Number(n)
  if (num >= 1_000_000) return '+' + (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return '+' + (num / 1_000).toFixed(2) + 'K'
  return '+' + num.toString()
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getOpBadge(type: string) {
  switch (type) {
    case 'mint':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '⚡' }
    case 'transfer':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '→' }
    case 'burn':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: '🔥' }
    case 'deploy':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '🚀' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: '•' }
  }
}

export function RecentActivity({ operations }: RecentActivityProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden fade-in">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Recent Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-live"></span>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
        {operations.map((op) => {
          const badge = getOpBadge(op.type)
          return (
            <div key={op.id} className="p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}>
                      <span>{badge.icon}</span>
                      {op.type}
                    </span>
                    {op.token && (
                      <Link
                        href={`/tokens/${op.token.tick}`}
                        className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
                      >
                        ${op.token.tick}
                      </Link>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
                    {op.fromAgent && (
                      <Link
                        href={`/agents/${op.fromAgent.name}`}
                        className="hover:text-slate-300 transition-colors truncate max-w-[120px]"
                      >
                        {op.fromAgent.name}
                      </Link>
                    )}
                    {op.fromAgent && op.toAgent && (
                      <span className="text-slate-600">→</span>
                    )}
                    {op.toAgent && (
                      <Link
                        href={`/agents/${op.toAgent.name}`}
                        className="hover:text-slate-300 transition-colors truncate max-w-[120px]"
                      >
                        {op.toAgent.name}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-medium text-emerald-400">
                    {formatNumber(op.amount)}
                  </div>
                  <a
                    href={op.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {timeAgo(op.createdAt)}
                  </a>
                </div>
              </div>
            </div>
          )
        })}
        {operations.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-1">No activity yet</p>
            <p className="text-slate-600 text-xs">Operations will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
