import { NextRequest, NextResponse } from 'next/server'
import { processPost, prisma } from '@/lib/indexer'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Webhook endpoint for immediate post indexing
// Can be called by Moltbook or manually after posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, postUrl } = body

    if (!postId && !postUrl) {
      return NextResponse.json(
        { error: 'postId or postUrl required' },
        { status: 400 }
      )
    }

    // Extract post ID from URL if needed
    const id = postId || postUrl.split('/').pop()

    // Fetch the post directly from Moltbook
    const response = await fetch(`https://www.moltbook.com/api/v1/posts/${id}`)
    if (!response.ok) {
      return NextResponse.json(
        { error: `Post not found: ${id}` },
        { status: 404 }
      )
    }

    const data = await response.json()
    const p = data.post

    if (!p) {
      return NextResponse.json(
        { error: 'Invalid post data' },
        { status: 400 }
      )
    }

    const post = {
      id: p.id,
      content: p.content || '',
      authorName: p.author?.name || 'Unknown',
      authorId: p.author?.id || '',
      createdAt: p.created_at,
      url: `https://www.moltbook.com/post/${p.id}`,
    }

    // Check if it contains agt-20 data
    const hasAgt20 = post.content.toLowerCase().includes('"p":"agt-20"') ||
                     post.content.toLowerCase().includes("'p':'agt-20'")

    if (!hasAgt20) {
      return NextResponse.json({
        success: true,
        indexed: false,
        reason: 'Not an agt-20 operation',
        postId: id,
      })
    }

    // Process the post
    const success = await processPost(post)

    return NextResponse.json({
      success: true,
      indexed: success,
      postId: id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

// GET for easy testing - index a post by ID
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId') || searchParams.get('id')

  if (!postId) {
    return NextResponse.json(
      { error: 'postId query param required', usage: '/api/webhook?postId=xxx' },
      { status: 400 }
    )
  }

  // Reuse POST logic
  const fakeRequest = {
    json: async () => ({ postId }),
  } as NextRequest

  return POST(fakeRequest)
}
