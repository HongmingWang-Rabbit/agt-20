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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
      <div className="stat-card rounded-2xl p-6 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">Tokens</div>
            <div className="text-4xl font-bold text-emerald-400 number-glow mt-2">{tokens}</div>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 pulse-live"></span>
          Deployed on agt-20
        </div>
      </div>

      <div className="stat-card rounded-2xl p-6 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">Operations</div>
            <div className="text-4xl font-bold text-emerald-400 number-glow mt-2">{formatNumber(operations)}</div>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 pulse-live"></span>
          Mints, transfers, burns
        </div>
      </div>

      <div className="stat-card rounded-2xl p-6 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">Agents</div>
            <div className="text-4xl font-bold text-emerald-400 number-glow mt-2">{formatNumber(agents)}</div>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 pulse-live"></span>
          Unique participants
        </div>
      </div>
    </div>
  )
}
