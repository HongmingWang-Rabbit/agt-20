import { PrismaClient } from '@prisma/client'
import { verifyNewYearBlessing, requiresBlessing } from './nvidia-ai'

const prisma = new PrismaClient()

// agt-20 operation types
interface Agt20Deploy {
  p: 'agt-20'
  op: 'deploy'
  tick: string
  max: string
  lim: string
}

interface Agt20Mint {
  p: 'agt-20'
  op: 'mint'
  tick: string
  amt: string
  'new-year-bless'?: string  // Required for REDX token
}

interface Agt20Transfer {
  p: 'agt-20'
  op: 'transfer'
  tick: string
  amt: string
  to: string
}

interface Agt20Burn {
  p: 'agt-20'
  op: 'burn'
  tick: string
  amt: string
}

type Agt20Operation = Agt20Deploy | Agt20Mint | Agt20Transfer | Agt20Burn

interface MoltbookPost {
  id: string
  content: string
  authorName: string
  authorId: string
  createdAt: string
  url: string
}

// Parse agt-20 JSON from post content
function parseAgt20(content: string | null | undefined): Agt20Operation | null {
  if (!content) return null
  
  // Look for JSON pattern in content
  const jsonMatch = content.match(/\{[^{}]*"p"\s*:\s*"agt-20"[^{}]*\}/i)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (parsed.p?.toLowerCase() !== 'agt-20') return null
    if (!['deploy', 'mint', 'transfer', 'burn'].includes(parsed.op)) return null
    return parsed as Agt20Operation
  } catch {
    return null
  }
}

// Get or create agent
async function getOrCreateAgent(name: string) {
  let agent = await prisma.agent.findUnique({ where: { name } })
  if (!agent) {
    agent = await prisma.agent.create({ data: { name } })
  }
  return agent
}

// Process deploy operation
async function processDeploy(op: Agt20Deploy, post: MoltbookPost, agent: { id: string; name: string }) {
  const tick = op.tick.toUpperCase()
  
  // Check if token already exists
  const existing = await prisma.token.findUnique({ where: { tick } })
  if (existing) {
    console.log(`Token ${tick} already exists, skipping deploy`)
    return null
  }

  const maxSupply = BigInt(op.max)
  const mintLimit = BigInt(op.lim)

  const token = await prisma.token.create({
    data: {
      tick,
      maxSupply,
      mintLimit,
      supply: BigInt(0),
      holders: 0,
      operations: 1,
      deployer: agent.name,
    },
  })

  await prisma.operation.create({
    data: {
      type: 'deploy',
      tokenId: token.id,
      toAgentId: agent.id,
      postId: post.id,
      postUrl: post.url,
    },
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: { operations: { increment: 1 } },
  })

  console.log(`Deployed token ${tick} by ${agent.name}`)
  return token
}

// Rate limits: 2 hour cooldown, max 3 mints per day
const MINT_COOLDOWN_MS = 2 * 60 * 60 * 1000  // 2 hours
const MAX_MINTS_PER_DAY = 3
const DAY_MS = 24 * 60 * 60 * 1000

// Process mint operation
async function processMint(op: Agt20Mint, post: MoltbookPost, agent: { id: string; name: string }) {
  const tick = op.tick.toUpperCase()
  const amount = BigInt(op.amt)

  const token = await prisma.token.findUnique({ where: { tick } })
  if (!token) {
    console.log(`Token ${tick} not found, skipping mint`)
    return null
  }

  // Check 2-hour cooldown
  const agentData = await prisma.agent.findUnique({ where: { id: agent.id } })
  if (agentData?.lastMintAt) {
    const timeSinceLastMint = Date.now() - agentData.lastMintAt.getTime()
    if (timeSinceLastMint < MINT_COOLDOWN_MS) {
      const remainingMins = Math.ceil((MINT_COOLDOWN_MS - timeSinceLastMint) / 60000)
      console.log(`Agent ${agent.name} on cooldown, ${remainingMins} minutes remaining`)
      return null
    }
  }

  // Check daily mint limit (max 3 per day)
  const oneDayAgo = new Date(Date.now() - DAY_MS)
  const mintsToday = await prisma.operation.count({
    where: {
      type: 'mint',
      fromAgentId: agent.id,
      createdAt: { gte: oneDayAgo }
    }
  })
  if (mintsToday >= MAX_MINTS_PER_DAY) {
    console.log(`Agent ${agent.name} reached daily mint limit (${MAX_MINTS_PER_DAY}/day)`)
    return null
  }

  // Check blessing requirement for REDX token
  if (requiresBlessing(tick)) {
    const blessing = op['new-year-bless']
    if (!blessing) {
      console.log(`Token ${tick} requires "new-year-bless" field with a blessing message`)
      return null
    }
    
    const isValidBlessing = await verifyNewYearBlessing(blessing)
    if (isValidBlessing === false) {
      console.log(`Invalid blessing for ${tick}: "${blessing}"`)
      return null
    }
    // If isValidBlessing is null (AI unavailable), we allow it to pass
    if (isValidBlessing === true) {
      console.log(`✨ Valid blessing verified for ${tick}: "${blessing}"`)
    }
  }

  // Check mint limit
  if (amount > token.mintLimit) {
    console.log(`Amount ${amount} exceeds mint limit ${token.mintLimit}`)
    return null
  }

  // Check max supply
  if (token.supply + amount > token.maxSupply) {
    console.log(`Mint would exceed max supply`)
    return null
  }

  // Get or create balance
  let balance = await prisma.balance.findUnique({
    where: { tokenId_agentId: { tokenId: token.id, agentId: agent.id } },
  })

  const isNewHolder = !balance || balance.amount === BigInt(0)

  if (balance) {
    await prisma.balance.update({
      where: { id: balance.id },
      data: { amount: { increment: amount } },
    })
  } else {
    await prisma.balance.create({
      data: {
        tokenId: token.id,
        agentId: agent.id,
        amount,
      },
    })
  }

  await prisma.token.update({
    where: { id: token.id },
    data: {
      supply: { increment: amount },
      operations: { increment: 1 },
      holders: isNewHolder ? { increment: 1 } : undefined,
    },
  })

  await prisma.operation.create({
    data: {
      type: 'mint',
      tokenId: token.id,
      toAgentId: agent.id,
      amount,
      postId: post.id,
      postUrl: post.url,
    },
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: { 
      operations: { increment: 1 },
      lastMintAt: new Date(),  // Update cooldown timer
    },
  })

  console.log(`Minted ${amount} ${tick} to ${agent.name}`)
  return { token, amount }
}

// Process transfer operation
async function processTransfer(op: Agt20Transfer, post: MoltbookPost, fromAgent: { id: string; name: string }) {
  const tick = op.tick.toUpperCase()
  const amount = BigInt(op.amt)
  const toAgentName = op.to

  const token = await prisma.token.findUnique({ where: { tick } })
  if (!token) {
    console.log(`Token ${tick} not found, skipping transfer`)
    return null
  }

  // Check sender balance
  const fromBalance = await prisma.balance.findUnique({
    where: { tokenId_agentId: { tokenId: token.id, agentId: fromAgent.id } },
  })

  if (!fromBalance || fromBalance.amount < amount) {
    console.log(`Insufficient balance for transfer`)
    return null
  }

  const toAgent = await getOrCreateAgent(toAgentName)

  // Get or create recipient balance
  let toBalance = await prisma.balance.findUnique({
    where: { tokenId_agentId: { tokenId: token.id, agentId: toAgent.id } },
  })

  const isNewHolder = !toBalance || toBalance.amount === BigInt(0)
  const senderBecomesZero = fromBalance.amount === amount

  // Update balances
  await prisma.balance.update({
    where: { id: fromBalance.id },
    data: { amount: { decrement: amount } },
  })

  if (toBalance) {
    await prisma.balance.update({
      where: { id: toBalance.id },
      data: { amount: { increment: amount } },
    })
  } else {
    await prisma.balance.create({
      data: {
        tokenId: token.id,
        agentId: toAgent.id,
        amount,
      },
    })
  }

  // Update holder count
  let holderDelta = 0
  if (isNewHolder) holderDelta++
  if (senderBecomesZero) holderDelta--

  await prisma.token.update({
    where: { id: token.id },
    data: {
      operations: { increment: 1 },
      holders: holderDelta !== 0 ? { increment: holderDelta } : undefined,
    },
  })

  await prisma.operation.create({
    data: {
      type: 'transfer',
      tokenId: token.id,
      fromAgentId: fromAgent.id,
      toAgentId: toAgent.id,
      amount,
      postId: post.id,
      postUrl: post.url,
    },
  })

  await prisma.agent.update({
    where: { id: fromAgent.id },
    data: { operations: { increment: 1 } },
  })

  await prisma.agent.update({
    where: { id: toAgent.id },
    data: { operations: { increment: 1 } },
  })

  console.log(`Transferred ${amount} ${tick} from ${fromAgent.name} to ${toAgent.name}`)
  return { token, amount, from: fromAgent, to: toAgent }
}

// Process burn operation
async function processBurn(op: Agt20Burn, post: MoltbookPost, agent: { id: string; name: string }) {
  const tick = op.tick.toUpperCase()
  const amount = BigInt(op.amt)

  const token = await prisma.token.findUnique({ where: { tick } })
  if (!token) {
    console.log(`Token ${tick} not found, skipping burn`)
    return null
  }

  // Check balance
  const balance = await prisma.balance.findUnique({
    where: { tokenId_agentId: { tokenId: token.id, agentId: agent.id } },
  })

  if (!balance || balance.amount < amount) {
    console.log(`Insufficient balance for burn`)
    return null
  }

  const becomesZero = balance.amount === amount

  await prisma.balance.update({
    where: { id: balance.id },
    data: { amount: { decrement: amount } },
  })

  await prisma.token.update({
    where: { id: token.id },
    data: {
      supply: { decrement: amount },
      operations: { increment: 1 },
      holders: becomesZero ? { decrement: 1 } : undefined,
    },
  })

  await prisma.operation.create({
    data: {
      type: 'burn',
      tokenId: token.id,
      fromAgentId: agent.id,
      amount,
      postId: post.id,
      postUrl: post.url,
    },
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: { operations: { increment: 1 } },
  })

  console.log(`Burned ${amount} ${tick} by ${agent.name}`)
  return { token, amount }
}

// Process a single post
export async function processPost(post: MoltbookPost): Promise<boolean> {
  // Check if already processed
  const existing = await prisma.operation.findUnique({
    where: { postId: post.id },
  })
  if (existing) {
    return false
  }

  const op = parseAgt20(post.content)
  if (!op) return false

  const agent = await getOrCreateAgent(post.authorName)

  let result
  switch (op.op) {
    case 'deploy':
      result = await processDeploy(op, post, agent)
      break
    case 'mint':
      result = await processMint(op, post, agent)
      break
    case 'transfer':
      result = await processTransfer(op, post, agent)
      break
    case 'burn':
      result = await processBurn(op, post, agent)
      break
    default:
      return false
  }

  return result !== null
}

// Fetch posts from Moltbook API (from both global feed and agt-20 submolt)
async function fetchMoltbookPosts(offset = 0, limit = 100): Promise<{ posts: MoltbookPost[]; hasMore: boolean }> {
  const allPosts: MoltbookPost[] = []
  const seenIds = new Set<string>()
  
  // Fetch from global feed
  const globalUrl = new URL('https://www.moltbook.com/api/v1/posts')
  globalUrl.searchParams.set('limit', limit.toString())
  globalUrl.searchParams.set('offset', offset.toString())
  globalUrl.searchParams.set('sort', 'new')

  // Fetch from agt-20 submolt (crypto-allowed)
  const submoltUrl = new URL('https://www.moltbook.com/api/v1/posts')
  submoltUrl.searchParams.set('submolt', 'agt-20')
  submoltUrl.searchParams.set('limit', limit.toString())
  submoltUrl.searchParams.set('offset', offset.toString())
  submoltUrl.searchParams.set('sort', 'new')

  const [globalRes, submoltRes] = await Promise.all([
    fetch(globalUrl.toString(), { headers: { 'Accept': 'application/json' } }),
    fetch(submoltUrl.toString(), { headers: { 'Accept': 'application/json' } }),
  ])

  // Process global feed
  if (globalRes.ok) {
    const globalData = await globalRes.json()
    for (const post of globalData.posts || []) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id)
        allPosts.push({
          id: post.id,
          content: post.content || '',
          authorName: post.author?.name || 'Unknown',
          authorId: post.author?.id || '',
          createdAt: post.created_at,
          url: `https://www.moltbook.com/p/${post.id}`,
        })
      }
    }
  }

  // Process agt-20 submolt
  if (submoltRes.ok) {
    const submoltData = await submoltRes.json()
    for (const post of submoltData.posts || []) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id)
        allPosts.push({
          id: post.id,
          content: post.content || '',
          authorName: post.author?.name || 'Unknown',
          authorId: post.author?.id || '',
          createdAt: post.created_at,
          url: `https://www.moltbook.com/p/${post.id}`,
        })
      }
    }
  }

  return {
    posts: allPosts,
    hasMore: false, // Simplified for now
  }
}

// Legacy single-source fetch (kept for reference)
async function fetchMoltbookPostsLegacy(offset = 0, limit = 100): Promise<{ posts: MoltbookPost[]; hasMore: boolean }> {
  const url = new URL('https://www.moltbook.com/api/v1/posts')
  url.searchParams.set('limit', limit.toString())
  url.searchParams.set('offset', offset.toString())
  url.searchParams.set('sort', 'new')

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status}`)
  }

  const data = await response.json()
  
  const posts: MoltbookPost[] = (data.posts || []).map((post: any) => ({
    id: post.id,
    content: post.content || '',
    authorName: post.author?.name || 'Unknown',
    authorId: post.author?.id || '',
    createdAt: post.created_at,
    url: `https://www.moltbook.com/p/${post.id}`,
  }))

  return {
    posts,
    hasMore: data.has_more || false,
  }
}

// Fetch all posts (for backfill)
async function fetchAllPosts(maxPosts = 10000): Promise<MoltbookPost[]> {
  const allPosts: MoltbookPost[] = []
  let offset = 0
  const limit = 100

  while (allPosts.length < maxPosts) {
    console.log(`Fetching posts offset=${offset}...`)
    const { posts, hasMore } = await fetchMoltbookPosts(offset, limit)
    
    allPosts.push(...posts)
    
    if (!hasMore || posts.length === 0) break
    
    offset += limit
    
    // Rate limit: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return allPosts
}

// Main indexer function - fetches recent posts and processes them
export async function runIndexer() {
  console.log('Starting agt-20 indexer...')

  // Get last indexed state
  let state = await prisma.indexerState.findUnique({
    where: { id: 'singleton' },
  })

  if (!state) {
    state = await prisma.indexerState.create({
      data: { id: 'singleton' },
    })
  }

  try {
    // Fetch recent posts
    const { posts } = await fetchMoltbookPosts(0, 100)
    console.log(`Fetched ${posts.length} posts`)

    // Process in chronological order (oldest first)
    const sortedPosts = posts.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    let processed = 0
    for (const post of sortedPosts) {
      const success = await processPost(post)
      if (success) processed++
    }

    // Update last indexed timestamp
    await prisma.indexerState.update({
      where: { id: 'singleton' },
      data: {
        lastPostId: sortedPosts.length > 0 ? sortedPosts[sortedPosts.length - 1].id : state.lastPostId,
        lastIndexed: new Date(),
      },
    })

    console.log(`Processed ${processed} agt-20 operations`)
    return { fetched: posts.length, processed }
  } catch (error) {
    console.error('Indexer error:', error)
    throw error
  }
}

// Backfill function - fetches all historical posts
export async function backfillIndexer() {
  console.log('Starting agt-20 backfill...')

  try {
    const allPosts = await fetchAllPosts()
    console.log(`Fetched ${allPosts.length} total posts`)

    // Process in chronological order (oldest first)
    const sortedPosts = allPosts.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    let processed = 0
    for (const post of sortedPosts) {
      const success = await processPost(post)
      if (success) processed++
    }

    console.log(`Backfill complete: processed ${processed} agt-20 operations`)
    return { fetched: allPosts.length, processed }
  } catch (error) {
    console.error('Backfill error:', error)
    throw error
  }
}

// Export for API route
export { prisma }
