import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, updateUserProfile } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  // Check authentication
  const authResult = await requireAuth(env.DB, request);
  if (authResult.response) {
    return authResult.response;
  }
  
  const user = authResult.user;
  
  try {
    const { bio, avatar_url, email } = await request.json();
    
    // Update profile
    const result = await updateUserProfile(env.DB, user.id, {
      bio,
      avatar_url,
      email
    });
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(
      { user: result, message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
