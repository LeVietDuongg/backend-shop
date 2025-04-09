import { NextRequest, NextResponse } from 'next/server';
import { loginUser, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  try {
    const { usernameOrEmail, password } = await request.json();
    
    // Validate input
    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
    }
    
    // Login user
    const result = await loginUser(env.DB, usernameOrEmail, password);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    
    // Create response with auth cookie
    const response = NextResponse.json(
      { user: result.user, message: 'Login successful' },
      { status: 200 }
    );
    
    setAuthCookie(response, result.token);
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}
