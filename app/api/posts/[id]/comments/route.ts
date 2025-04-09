import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCommentsByPostId, createComment } from '@/lib/comments';

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
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Get comments
    const result = await getCommentsByPostId(env.DB, postId, page, limit);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách bình luận' },
      { status: 500 }
    );
  }
}

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
    const { content } = await request.json();
    
    // Validate input
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Nội dung bình luận không được để trống' },
        { status: 400 }
      );
    }
    
    // Create comment
    const result = await createComment(env.DB, user.id, postId, content);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { comment: result, message: 'Bình luận thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Không thể tạo bình luận' },
      { status: 500 }
    );
  }
}
