import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllPosts } from '@/lib/posts';

export async function GET(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Get current user (if authenticated)
    const currentUser = await getCurrentUser(env.DB, request);
    
    // Get posts
    const result = await getAllPosts(
      env.DB,
      page,
      limit,
      currentUser?.id
    );
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách bài viết' },
      { status: 500 }
    );
  }
}
