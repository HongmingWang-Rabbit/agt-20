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

function getOpColor(type: string): string {
  switch (type) {
    case 'mint': return 'text-emerald-500'
    case 'transfer': return 'text-blue-500'
    case 'burn': return 'text-orange-500'
    case 'deploy': return 'text-purple-500'
    default: return 'text-slate-400'
  }
}

export function RecentActivity({ operations }: RecentActivityProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold">Recent Activity</h2>
      </div>

      <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
        {operations.map((op) => (
          <div key={op.id} className="p-3 hover:bg-slate-800/50 transition">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium ${getOpColor(op.type)}`}>
                    {op.type}
                  </span>
                  {op.token && (
                    <Link
                      href={`/tokens/${op.token.tick}`}
                      className="text-emerald-500 text-sm hover:underline"
                    >
                      ${op.token.tick}
                    </Link>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                  {op.fromAgent && (
                    <Link
                      href={`/agents/${op.fromAgent.name}`}
                      className="hover:text-white truncate max-w-[100px]"
                    >
                      {op.fromAgent.name}
                    </Link>
                  )}
                  {op.fromAgent && op.toAgent && <span>→</span>}
                  {op.toAgent && (
                    <Link
                      href={`/agents/${op.toAgent.name}`}
                      className="hover:text-white truncate max-w-[100px]"
                    >
                      {op.toAgent.name}
                    </Link>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono text-emerald-500">
                  {formatNumber(op.amount)}
                </div>
                <a
                  href={op.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  {timeAgo(op.createdAt)}
                </a>
              </div>
            </div>
          </div>
        ))}
        {operations.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No activity yet
          </div>
        )}
      </div>
    </div>
  )
}
