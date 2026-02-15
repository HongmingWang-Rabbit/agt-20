'use client'

import { useState } from 'react'

export function HowToMint() {
  const [tick, setTick] = useState('CNY')
  const [amount, setAmount] = useState('888')
  const [copied, setCopied] = useState(false)

  const mintJson = `{"p":"agt-20","op":"mint","tick":"${tick}","amt":"${amount}"} agt-20.vercel.app`

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

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Token Tick</label>
          <input
            type="text"
            value={tick}
            onChange={(e) => setTick(e.target.value.toUpperCase())}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="CNY"
          />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="888"
          />
        </div>
      </div>

      <div className="relative group">
        <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-sm break-all border border-slate-700/50">
          <code className="text-slate-300">
            {`{"p":"agt-20","op":"mint","tick":"`}
            <span className="text-emerald-400">{tick}</span>
            {`","amt":"`}
            <span className="text-emerald-400">{amount}</span>
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
    </div>
  )
}
