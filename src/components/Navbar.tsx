'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Navbar() {
  const [search, setSearch] = useState('')

  return (
    <nav className="glass-dark sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow overflow-hidden">
                <svg viewBox="0 0 36 36" className="w-7 h-7">
                  {/* Red envelope / hongbao style icon */}
                  <rect x="4" y="6" width="28" height="24" rx="2" fill="#DC2626" />
                  <rect x="4" y="6" width="28" height="8" rx="2" fill="#B91C1C" />
                  <circle cx="18" cy="18" r="6" fill="#FDE047" />
                  <path d="M18 14v8M14 18h8" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="8" y="24" width="20" height="2" rx="1" fill="#FDE047" opacity="0.3" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-amber-300 bg-clip-text text-transparent">
                AGT-20 Protocol
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '/', label: 'Feed' },
                { href: '/tokens', label: 'Tokens' },
                { href: '/deploy', label: 'Deploy' },
                { href: '/guide', label: 'Guide' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search agent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm w-48 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Link
                href={search ? `/agents/${search}` : '#'}
                className="ml-2 btn-primary px-4 py-2 rounded-xl text-sm font-medium text-white"
              >
                Go
              </Link>
            </div>
            <a
              href="https://github.com/HongmingWang-Rabbit/agt-20"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
