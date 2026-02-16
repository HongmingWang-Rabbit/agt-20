import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const skillPath = path.join(process.cwd(), 'public', 'SKILL.md');
  
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'SKILL.md not found' }, { status: 404 });
  }
}
