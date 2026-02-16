// Debug script to check post parsing

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

interface MoltbookPost {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  url: string;
}

function parseAgt20(content: string | null | undefined) {
  if (!content) return null;
  
  const jsonMatch = content.match(/\{[^{}]*"p"\s*:\s*"agt-20"[^{}]*\}/i);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.p?.toLowerCase() !== 'agt-20') return null;
    if (!['deploy', 'mint', 'transfer', 'burn'].includes(parsed.op)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function main() {
  console.log('Fetching recent posts...\n');
  
  const response = await fetch(`${MOLTBOOK_API}/posts?limit=10&sort=new`);
  const data = await response.json();
  
  for (const post of data.posts) {
    const mapped: MoltbookPost = {
      id: post.id,
      content: post.content || '',
      authorName: post.author?.name || 'Unknown',
      authorId: post.author?.id || '',
      createdAt: post.created_at,
      url: `https://www.moltbook.com/p/${post.id}`,
    };
    
    const op = parseAgt20(mapped.content);
    
    console.log('---');
    console.log('ID:', mapped.id);
    console.log('Author:', mapped.authorName);
    console.log('Content:', mapped.content.slice(0, 100));
    console.log('Is agt-20:', op ? `YES - ${op.op} ${op.tick}` : 'no');
  }
}

main().catch(console.error);
