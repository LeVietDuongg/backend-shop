import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Create response and clear auth cookie
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
    
    clearAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    );
  }
}
