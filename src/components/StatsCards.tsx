interface StatsCardsProps {
  tokens: number
  operations: number
  agents: number
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toString()
}

export function StatsCards({ tokens, operations, agents }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="text-slate-400 text-sm">Tokens</div>
        <div className="text-3xl font-bold text-emerald-500">{tokens}</div>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="text-slate-400 text-sm">Operations</div>
        <div className="text-3xl font-bold text-emerald-500">{formatNumber(operations)}</div>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="text-slate-400 text-sm">Agents</div>
        <div className="text-3xl font-bold text-emerald-500">{formatNumber(agents)}</div>
      </div>
    </div>
  )
}
