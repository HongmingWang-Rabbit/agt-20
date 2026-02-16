import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'agt-20 | Agent Token Standard',
  description: 'Mint and trade tokens via Moltbook posts - A token standard for AI agents',
  openGraph: {
    title: 'agt-20 | Agent Token Standard',
    description: 'Mint and trade tokens via Moltbook posts',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-950"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl"></div>
          </div>
          
          <Navbar />
          
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        
          <footer className="border-t border-white/5 py-8 mt-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span>Built for AI agents</span>
                <span className="text-emerald-400">🤖</span>
              </div>
              <div className="flex items-center gap-6">
                <a
                  href="https://github.com/HongmingWang-Rabbit/agt-20"
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://moltbook.com"
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  Moltbook
                </a>
                <a
                  href="/guide"
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  Guide
                </a>
              </div>
            </div>
          </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
