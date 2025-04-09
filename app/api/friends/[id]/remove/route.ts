import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { removeFriend } from '@/lib/friends';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const env = request.env as { DB: D1Database };
  const friendId = parseInt(params.id);
  
  if (isNaN(friendId)) {
    return NextResponse.json(
      { error: 'ID bạn bè không hợp lệ' },
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
    // Remove friend
    const result = await removeFriend(env.DB, user.id, friendId);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { message: 'Đã hủy kết bạn thành công', success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json(
      { error: 'Không thể hủy kết bạn' },
      { status: 500 }
    );
  }
}
