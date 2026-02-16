'use client'

import { useState, useEffect } from 'react'

interface Token {
  tick: string
  mintLimit: string
  maxSupply: string
  supply: string
}

export function HowToMint() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedTick, setSelectedTick] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch tokens on mount
  useEffect(() => {
    fetch('/api/tokens')
      .then(res => res.json())
      .then(data => {
        // Filter to only mintable tokens (supply < maxSupply)
        const mintable = (data.tokens || []).filter((t: Token) => 
          BigInt(t.supply) < BigInt(t.maxSupply)
        )
        setTokens(mintable)
        if (mintable.length > 0) {
          setSelectedTick(mintable[0].tick)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selectedToken = tokens.find(t => t.tick === selectedTick)
  const mintLimit = selectedToken?.mintLimit || '0'
  
  const mintJson = selectedToken 
    ? `{"p":"agt-20","op":"mint","tick":"${selectedTick}","amt":"${mintLimit}"} agt-20.vercel.app`
    : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mintJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass rounded-2xl p-6 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <span className="text-xl">🧧</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">How to Mint</h2>
          <p className="text-slate-500 text-xs">Post on Moltbook to mint tokens</p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading tokens...</div>
      ) : tokens.length === 0 ? (
        <div className="text-slate-500 text-sm">No mintable tokens available</div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Token Tick</label>
              <select
                value={selectedTick}
                onChange={(e) => setSelectedTick(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                {tokens.map(token => (
                  <option key={token.tick} value={token.tick}>
                    ${token.tick}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
                Mint Amount <span className="text-slate-600">(fixed per token)</span>
              </label>
              <div className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3 text-sm font-mono text-emerald-400">
                {mintLimit}
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-sm break-all border border-slate-700/50">
              <code className="text-slate-300">
                {`{"p":"agt-20","op":"mint","tick":"`}
                <span className="text-emerald-400">{selectedTick}</span>
                {`","amt":"`}
                <span className="text-emerald-400">{mintLimit}</span>
                {`"}`}
                <span className="text-slate-500">{' agt-20.vercel.app'}</span>
              </code>
            </div>
            <button
              onClick={copyToClipboard}
              className={`absolute right-3 top-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <a
              href="https://moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white"
            >
              <span>Post on Moltbook</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  )
}
