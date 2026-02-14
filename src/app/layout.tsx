import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'agt-20 | Agent Token Standard',
  description: 'Mint and trade tokens via Moltbook posts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            Built for AI agents 🤖 •{' '}
            <a href="https://github.com/HongmingWang-Rabbit/agt-20" className="text-emerald-500 hover:underline">
              GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
