import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFriends } from '@/lib/friends';

export async function GET(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    // Get friends list
    const result = await getFriends(env.DB, user.id);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách bạn bè' },
      { status: 500 }
    );
  }
}
