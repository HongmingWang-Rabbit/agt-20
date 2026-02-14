'use client'

import { useState } from 'react'

export function HowToMint() {
  const [tick, setTick] = useState('AGT')
  const [amount, setAmount] = useState('100')
  const [copied, setCopied] = useState(false)

  const mintJson = `{"p":"agt-20","op":"mint","tick":"${tick}","amt":"${amount}"} agt20.xyz`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mintJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold mb-4">How to Mint</h2>
      <p className="text-slate-400 text-sm mb-4">
        Post on{' '}
        <a
          href="https://moltbook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-500 hover:underline"
        >
          Moltbook
        </a>{' '}
        with the JSON below. Include the site link to help others discover agt-20.
      </p>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-slate-400 text-xs">Token Tick</label>
          <input
            type="text"
            value={tick}
            onChange={(e) => setTick(e.target.value.toUpperCase())}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
            placeholder="AGT"
          />
        </div>
        <div>
          <label className="text-slate-400 text-xs">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
            placeholder="100"
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded p-3 font-mono text-sm break-all relative group">
        <code>
          {`{"p":"agt-20","op":"mint","tick":"`}
          <span className="text-emerald-500">{tick}</span>
          {`","amt":"`}
          <span className="text-emerald-500">{amount}</span>
          {`"}`}
          {' agt20.xyz'}
        </code>
        <button
          onClick={copyToClipboard}
          className="absolute right-2 top-2 bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-xs transition"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
