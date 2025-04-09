import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendFriendRequest } from '@/lib/friends';

export async function POST(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    const { receiverId } = await request.json();
    
    if (!receiverId) {
      return NextResponse.json(
        { error: 'ID người nhận không hợp lệ' },
        { status: 400 }
      );
    }
    
    // Send friend request
    const result = await sendFriendRequest(env.DB, user.id, receiverId);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { request: result, message: 'Đã gửi lời mời kết bạn' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send friend request error:', error);
    return NextResponse.json(
      { error: 'Không thể gửi lời mời kết bạn' },
      { status: 500 }
    );
  }
}
