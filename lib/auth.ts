import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_NAME = 'auth_token';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  password: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}

export async function getUserFromToken(db: D1Database, token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const { results } = await db.prepare(
      'SELECT id, username, email, avatar_url, bio, created_at, updated_at FROM users WHERE id = ?'
    ).bind(decoded.id).all();
    
    if (results.length === 0) {
      return null;
    }
    
    return results[0] as User;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export function getAuthToken(req: NextRequest): string | null {
  // Try to get token from cookies
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Try to get token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export async function getCurrentUser(db: D1Database, req: NextRequest): Promise<User | null> {
  const token = getAuthToken(req);
  if (!token) {
    return null;
  }
  
  return getUserFromToken(db, token);
}

export async function requireAuth(
  db: D1Database,
  req: NextRequest
): Promise<{ user: User; response: null } | { user: null; response: NextResponse }> {
  const user = await getCurrentUser(db, req);
  
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    };
  }
  
  return { user, response: null };
}

export async function registerUser(
  db: D1Database,
  username: string,
  email: string,
  password: string
): Promise<{ user: User; token: string } | { error: string }> {
  try {
    // Check if username or email already exists
    const { results: existingUsers } = await db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).all();
    
    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0] as AuthUser;
      if (existingUser.username === username) {
        return { error: 'Username already taken' };
      } else {
        return { error: 'Email already registered' };
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    const result = await db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?) RETURNING id, username, email, avatar_url, bio, created_at, updated_at'
    ).bind(username, email, hashedPassword).all();
    
    const user = result.results[0] as User;
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    console.error('Error registering user:', error);
    return { error: 'Failed to register user' };
  }
}

export async function loginUser(
  db: D1Database,
  usernameOrEmail: string,
  password: string
): Promise<{ user: User; token: string } | { error: string }> {
  try {
    // Find user by username or email
    const { results } = await db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).bind(usernameOrEmail, usernameOrEmail).all();
    
    if (results.length === 0) {
      return { error: 'Invalid credentials' };
    }
    
    const user = results[0] as AuthUser;
    
    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid credentials' };
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword as User, token };
  } catch (error) {
    console.error('Error logging in user:', error);
    return { error: 'Failed to log in' };
  }
}

export async function updateUserProfile(
  db: D1Database,
  userId: number,
  updates: {
    bio?: string;
    avatar_url?: string;
    email?: string;
  }
): Promise<User | { error: string }> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.bio !== undefined) {
      fields.push('bio = ?');
      values.push(updates.bio);
    }
    
    if (updates.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updates.avatar_url);
    }
    
    if (updates.email !== undefined) {
      // Check if email is already taken
      if (updates.email) {
        const { results: existingEmails } = await db.prepare(
          'SELECT id FROM users WHERE email = ? AND id != ?'
        ).bind(updates.email, userId).all();
        
        if (existingEmails.length > 0) {
          return { error: 'Email already taken' };
        }
        
        fields.push('email = ?');
        values.push(updates.email);
      }
    }
    
    if (fields.length === 0) {
      return { error: 'No fields to update' };
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = ? 
      RETURNING id, username, email, avatar_url, bio, created_at, updated_at
    `;
    
    values.push(userId);
    
    const { results } = await db.prepare(query).bind(...values).all();
    
    if (results.length === 0) {
      return { error: 'User not found' };
    }
    
    return results[0] as User;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function updatePassword(
  db: D1Database,
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  try {
    // Get current user with password
    const { results } = await db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).all();
    
    if (results.length === 0) {
      return { error: 'User not found' };
    }
    
    const user = results[0] as AuthUser;
    
    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      return { error: 'Current password is incorrect' };
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await db.prepare(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(hashedPassword, userId).run();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: 'Failed to update password' };
  }
}
