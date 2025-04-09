import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getConversation, markMessageAsRead } from '@/lib/messages';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const env = request.env as { DB: D1Database };
  const otherUserId = parseInt(params.userId);
  
  if (isNaN(otherUserId)) {
    return NextResponse.json(
      { error: 'ID người dùng không hợp lệ' },
      { status: 400 }
    );
  }
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const before = url.searchParams.get('before') ? parseInt(url.searchParams.get('before')!) : undefined;
    
    // Get conversation
    const result = await getConversation(env.DB, user.id, otherUserId, limit, before);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy cuộc trò chuyện' },
      { status: 500 }
    );
  }
}
