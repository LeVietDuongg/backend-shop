import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getConversationList } from '@/lib/messages';

export async function GET(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    // Get conversation list
    const result = await getConversationList(env.DB, user.id);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get conversation list error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách cuộc trò chuyện' },
      { status: 500 }
    );
  }
}
