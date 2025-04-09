import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createPost } from '@/lib/posts';

export async function POST(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    const { content, image_url } = await request.json();
    
    // Validate input
    if (!content && !image_url) {
      return NextResponse.json(
        { error: 'Bài viết phải có nội dung hoặc hình ảnh' },
        { status: 400 }
      );
    }
    
    // Create post
    const result = await createPost(env.DB, user.id, content, image_url);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { post: result, message: 'Tạo bài viết thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: 'Không thể tạo bài viết' },
      { status: 500 }
    );
  }
}
