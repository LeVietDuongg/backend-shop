import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { likePost, unlikePost } from '@/lib/posts';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const env = request.env as { DB: D1Database };
  const postId = parseInt(params.id);
  
  if (isNaN(postId)) {
    return NextResponse.json(
      { error: 'ID bài viết không hợp lệ' },
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
    // Like post
    const result = await likePost(env.DB, postId, user.id);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { message: 'Đã thích bài viết' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Không thể thích bài viết' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const env = request.env as { DB: D1Database };
  const postId = parseInt(params.id);
  
  if (isNaN(postId)) {
    return NextResponse.json(
      { error: 'ID bài viết không hợp lệ' },
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
    // Unlike post
    const result = await unlikePost(env.DB, postId, user.id);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { message: 'Đã bỏ thích bài viết' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      { error: 'Không thể bỏ thích bài viết' },
      { status: 500 }
    );
  }
}
