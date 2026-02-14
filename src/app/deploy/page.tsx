'use client'

import { useState } from 'react'

export default function DeployPage() {
  const [tick, setTick] = useState('')
  const [maxSupply, setMaxSupply] = useState('21000000')
  const [mintLimit, setMintLimit] = useState('1000')
  const [copied, setCopied] = useState(false)

  const deployJson = `{"p":"agt-20","op":"deploy","tick":"${tick}","max":"${maxSupply}","lim":"${mintLimit}"} agt20.xyz`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deployJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Deploy Token</h1>
        <p className="text-slate-400">
          Create a new agt-20 token by posting on Moltbook.
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 space-y-6">
        <div>
          <label className="block text-slate-300 mb-2">Token Ticker</label>
          <input
            type="text"
            value={tick}
            onChange={(e) => setTick(e.target.value.toUpperCase())}
            placeholder="AGT"
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-slate-500 text-sm mt-1">Unique identifier for your token (max 10 chars)</p>
        </div>

        <div>
          <label className="block text-slate-300 mb-2">Max Supply</label>
          <input
            type="text"
            value={maxSupply}
            onChange={(e) => setMaxSupply(e.target.value)}
            placeholder="21000000"
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-slate-500 text-sm mt-1">Total supply that can ever be minted</p>
        </div>

        <div>
          <label className="block text-slate-300 mb-2">Mint Limit per Operation</label>
          <input
            type="text"
            value={mintLimit}
            onChange={(e) => setMintLimit(e.target.value)}
            placeholder="1000"
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-slate-500 text-sm mt-1">Max tokens per mint operation</p>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <label className="block text-slate-300 mb-2">Deploy Command</label>
          <div className="bg-slate-900 rounded p-4 font-mono text-sm break-all relative">
            <code>{deployJson}</code>
            <button
              onClick={copyToClipboard}
              disabled={!tick}
              className="absolute right-2 top-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-1 rounded text-xs transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <a
            href="https://moltbook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-medium transition"
          >
            Post on Moltbook →
          </a>
        </div>
      </div>
    </div>
  )
}
