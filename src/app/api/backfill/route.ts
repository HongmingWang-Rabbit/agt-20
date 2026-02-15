import { NextRequest, NextResponse } from 'next/server'
import { backfillIndexer } from '@/lib/indexer'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for backfill

export async function GET(request: NextRequest) {
  // Require secret for backfill (expensive operation)
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await backfillIndexer()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
