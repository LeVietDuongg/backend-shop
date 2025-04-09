import { NextRequest, NextResponse } from 'next/server';

export interface SearchResult {
  users?: {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
    bio?: string;
  }[];
  posts?: {
    id: number;
    user_id: number;
    content: string;
    image_url?: string;
    created_at: string;
    username?: string;
    avatar_url?: string;
  }[];
}

export async function searchUsers(
  db: D1Database,
  query: string,
  limit: number = 20
): Promise<SearchResult | { error: string }> {
  try {
    if (!query.trim()) {
      return { users: [] };
    }

    const searchTerm = `%${query}%`;
    
    const { results } = await db.prepare(`
      SELECT id, username, email, avatar_url, bio
      FROM users
      WHERE username LIKE ? OR email LIKE ? OR bio LIKE ?
      ORDER BY 
        CASE 
          WHEN username LIKE ? THEN 1
          WHEN email LIKE ? THEN 2
          ELSE 3
        END,
        username
      LIMIT ?
    `).bind(searchTerm, searchTerm, searchTerm, `${query}%`, `${query}%`, limit).all();

    return { users: results as any[] };
  } catch (error) {
    console.error('Error searching users:', error);
    return { error: 'Failed to search users' };
  }
}

export async function searchPosts(
  db: D1Database,
  query: string,
  limit: number = 20
): Promise<SearchResult | { error: string }> {
  try {
    if (!query.trim()) {
      return { posts: [] };
    }

    const searchTerm = `%${query}%`;
    
    const { results } = await db.prepare(`
      SELECT 
        p.id, p.user_id, p.content, p.image_url, p.created_at,
        u.username, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.content LIKE ?
      ORDER BY 
        CASE 
          WHEN p.content LIKE ? THEN 1
          ELSE 2
        END,
        p.created_at DESC
      LIMIT ?
    `).bind(searchTerm, `${query}%`, limit).all();

    return { posts: results as any[] };
  } catch (error) {
    console.error('Error searching posts:', error);
    return { error: 'Failed to search posts' };
  }
}

export async function searchAll(
  db: D1Database,
  query: string,
  limit: number = 10
): Promise<SearchResult | { error: string }> {
  try {
    if (!query.trim()) {
      return { users: [], posts: [] };
    }

    const [usersResult, postsResult] = await Promise.all([
      searchUsers(db, query, limit),
      searchPosts(db, query, limit)
    ]);

    if ('error' in usersResult || 'error' in postsResult) {
      return { error: 'Failed to search' };
    }

    return {
      users: usersResult.users,
      posts: postsResult.posts
    };
  } catch (error) {
    console.error('Error searching:', error);
    return { error: 'Failed to search' };
  }
}
