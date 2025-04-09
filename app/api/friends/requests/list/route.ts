import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFriendRequests } from '@/lib/friends';

export async function GET(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    // Get query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as 'sent' | 'received' || 'received';
    
    // Get friend requests
    const result = await getFriendRequests(env.DB, user.id, type);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get friend requests error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách lời mời kết bạn' },
      { status: 500 }
    );
  }
}
