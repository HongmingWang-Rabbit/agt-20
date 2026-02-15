import { PrismaClient } from '@prisma/client'

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
  author: {
    name: string
  }
  created_at: string
  url?: string
}

// Parse agt-20 JSON from post content
function parseAgt20(content: string): Agt20Operation | null {
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
      postUrl: post.url || `https://moltbook.com/post/${post.id}`,
    },
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: { operations: { increment: 1 } },
  })

  console.log(`Deployed token ${tick} by ${agent.name}`)
  return token
}

// Process mint operation
async function processMint(op: Agt20Mint, post: MoltbookPost, agent: { id: string; name: string }) {
  const tick = op.tick.toUpperCase()
  const amount = BigInt(op.amt)

  const token = await prisma.token.findUnique({ where: { tick } })
  if (!token) {
    console.log(`Token ${tick} not found, skipping mint`)
    return null
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
      postUrl: post.url || `https://moltbook.com/post/${post.id}`,
    },
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: { operations: { increment: 1 } },
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
      postUrl: post.url || `https://moltbook.com/post/${post.id}`,
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
      postUrl: post.url || `https://moltbook.com/post/${post.id}`,
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
export async function processPost(post: MoltbookPost) {
  // Check if already processed
  const existing = await prisma.operation.findUnique({
    where: { postId: post.id },
  })
  if (existing) {
    return null
  }

  const op = parseAgt20(post.content)
  if (!op) return null

  const agent = await getOrCreateAgent(post.author.name)

  switch (op.op) {
    case 'deploy':
      return processDeploy(op, post, agent)
    case 'mint':
      return processMint(op, post, agent)
    case 'transfer':
      return processTransfer(op, post, agent)
    case 'burn':
      return processBurn(op, post, agent)
    default:
      return null
  }
}

// Fetch posts from Moltbook API
export async function fetchMoltbookPosts(afterId?: string): Promise<MoltbookPost[]> {
  const url = new URL('https://www.moltbook.com/api/v1/posts')
  url.searchParams.set('limit', '100')
  if (afterId) {
    url.searchParams.set('after', afterId)
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status}`)
  }

  const data = await response.json()
  return data.posts || []
}

// Main indexer function
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
    const posts = await fetchMoltbookPosts(state.lastPostId || undefined)
    console.log(`Fetched ${posts.length} posts`)

    // Process in chronological order (oldest first)
    const sortedPosts = posts.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let processed = 0
    for (const post of sortedPosts) {
      const result = await processPost(post)
      if (result) processed++
    }

    // Update last indexed post
    if (sortedPosts.length > 0) {
      const lastPost = sortedPosts[sortedPosts.length - 1]
      await prisma.indexerState.update({
        where: { id: 'singleton' },
        data: {
          lastPostId: lastPost.id,
          lastIndexed: new Date(),
        },
      })
    }

    console.log(`Processed ${processed} agt-20 operations`)
    return { fetched: posts.length, processed }
  } catch (error) {
    console.error('Indexer error:', error)
    throw error
  }
}

// Export for API route
export { prisma }
