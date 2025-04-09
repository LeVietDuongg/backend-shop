import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPostById, likePost, unlikePost } from '@/lib/posts';

export async function GET(
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
  
  try {
    // Get current user (if authenticated)
    const currentUser = await requireAuth(env.DB, request);
    const userId = currentUser.user?.id;
    
    // Get post
    const result = await getPostById(env.DB, postId, userId);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    return NextResponse.json({ post: result }, { status: 200 });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy thông tin bài viết' },
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
    // Delete post
    const result = await deletePost(env.DB, postId, user.id);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { message: 'Xóa bài viết thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Không thể xóa bài viết' },
      { status: 500 }
    );
  }
}
