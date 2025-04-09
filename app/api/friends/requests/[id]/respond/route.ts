import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { respondToFriendRequest } from '@/lib/friends';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const env = request.env as { DB: D1Database };
  const requestId = parseInt(params.id);
  
  if (isNaN(requestId)) {
    return NextResponse.json(
      { error: 'ID lời mời không hợp lệ' },
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
    const { accept } = await request.json();
    
    if (typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: 'Tham số accept không hợp lệ' },
        { status: 400 }
      );
    }
    
    // Respond to friend request
    const result = await respondToFriendRequest(env.DB, requestId, user.id, accept);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { 
        message: accept ? 'Đã chấp nhận lời mời kết bạn' : 'Đã từ chối lời mời kết bạn',
        success: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Respond to friend request error:', error);
    return NextResponse.json(
      { error: 'Không thể xử lý lời mời kết bạn' },
      { status: 500 }
    );
  }
}
