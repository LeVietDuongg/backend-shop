import { NextRequest, NextResponse } from 'next/server';
import { searchUsers, searchPosts, searchAll } from '@/lib/search';

export async function GET(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  try {
    // Get query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    if (!query.trim()) {
      return NextResponse.json(
        { users: [], posts: [] },
        { status: 200 }
      );
    }
    
    let result;
    
    // Perform search based on type
    switch (type) {
      case 'users':
        result = await searchUsers(env.DB, query, limit);
        break;
      case 'posts':
        result = await searchPosts(env.DB, query, limit);
        break;
      case 'all':
      default:
        result = await searchAll(env.DB, query, limit);
        break;
    }
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Không thể thực hiện tìm kiếm' },
      { status: 500 }
    );
  }
}
