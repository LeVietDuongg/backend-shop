import { NextRequest, NextResponse } from 'next/server';
import { registerUser, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const env = request.env as { DB: D1Database };
  
  try {
    const { username, email, password } = await request.json();
    
    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Register user
    const result = await registerUser(env.DB, username, email, password);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Create response with auth cookie
    const response = NextResponse.json(
      { user: result.user, message: 'Registration successful' },
      { status: 201 }
    );
    
    setAuthCookie(response, result.token);
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
