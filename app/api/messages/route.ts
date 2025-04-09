import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendMessage } from '@/lib/messages';

export async function POST(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    const { receiverId, content } = await request.json();
    
    if (!receiverId) {
      return NextResponse.json(
        { error: 'ID người nhận không hợp lệ' },
        { status: 400 }
      );
    }
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Nội dung tin nhắn không được để trống' },
        { status: 400 }
      );
    }
    
    // Send message
    const result = await sendMessage(env.DB, user.id, receiverId, content);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { message: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Không thể gửi tin nhắn' },
      { status: 500 }
    );
  }
}
