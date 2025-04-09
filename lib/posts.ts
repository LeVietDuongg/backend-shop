import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
  likes_count?: number;
  comments_count?: number;
  liked_by_user?: boolean;
}

export async function createPost(
  db: D1Database,
  userId: number,
  content: string,
  imageUrl?: string
): Promise<Post | { error: string }> {
  try {
    if (!content && !imageUrl) {
      return { error: 'Post must have content or image' };
    }

    const { results } = await db.prepare(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?) RETURNING id, user_id, content, image_url, created_at, updated_at'
    ).bind(userId, content || '', imageUrl || null).all();

    if (results.length === 0) {
      return { error: 'Failed to create post' };
    }

    return results[0] as Post;
  } catch (error) {
    console.error('Error creating post:', error);
    return { error: 'Failed to create post' };
  }
}

export async function getPostById(
  db: D1Database,
  postId: number,
  currentUserId?: number
): Promise<Post | { error: string }> {
  try {
    const query = `
      SELECT 
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.updated_at,
        u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as liked_by_user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    const { results } = await db.prepare(query)
      .bind(currentUserId || 0, postId)
      .all();

    if (results.length === 0) {
      return { error: 'Post not found' };
    }

    return results[0] as Post;
  } catch (error) {
    console.error('Error getting post:', error);
    return { error: 'Failed to get post' };
  }
}

export async function getAllPosts(
  db: D1Database,
  page: number = 1,
  limit: number = 10,
  currentUserId?: number
): Promise<{ posts: Post[]; total: number } | { error: string }> {
  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.updated_at,
        u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as liked_by_user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM posts';

    const [postsResult, countResult] = await Promise.all([
      db.prepare(query).bind(currentUserId || 0, limit, offset).all(),
      db.prepare(countQuery).all()
    ]);

    return {
      posts: postsResult.results as Post[],
      total: (countResult.results[0] as { total: number }).total
    };
  } catch (error) {
    console.error('Error getting posts:', error);
    return { error: 'Failed to get posts' };
  }
}

export async function getUserPosts(
  db: D1Database,
  userId: number,
  page: number = 1,
  limit: number = 10,
  currentUserId?: number
): Promise<{ posts: Post[]; total: number } | { error: string }> {
  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id, p.user_id, p.content, p.image_url, p.created_at, p.updated_at,
        u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as liked_by_user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM posts WHERE user_id = ?';

    const [postsResult, countResult] = await Promise.all([
      db.prepare(query).bind(currentUserId || 0, userId, limit, offset).all(),
      db.prepare(countQuery).bind(userId).all()
    ]);

    return {
      posts: postsResult.results as Post[],
      total: (countResult.results[0] as { total: number }).total
    };
  } catch (error) {
    console.error('Error getting user posts:', error);
    return { error: 'Failed to get user posts' };
  }
}

export async function deletePost(
  db: D1Database,
  postId: number,
  userId: number
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if post exists and belongs to user
    const { results } = await db.prepare(
      'SELECT id FROM posts WHERE id = ? AND user_id = ?'
    ).bind(postId, userId).all();

    if (results.length === 0) {
      return { error: 'Post not found or you do not have permission to delete it' };
    }

    // Delete post
    await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();

    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { error: 'Failed to delete post' };
  }
}

export async function likePost(
  db: D1Database,
  postId: number,
  userId: number
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if post exists
    const { results: postResults } = await db.prepare(
      'SELECT id FROM posts WHERE id = ?'
    ).bind(postId).all();

    if (postResults.length === 0) {
      return { error: 'Post not found' };
    }

    // Check if already liked
    const { results: likeResults } = await db.prepare(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(postId, userId).all();

    if (likeResults.length > 0) {
      return { error: 'Post already liked' };
    }

    // Add like
    await db.prepare(
      'INSERT INTO likes (post_id, user_id) VALUES (?, ?)'
    ).bind(postId, userId).run();

    return { success: true };
  } catch (error) {
    console.error('Error liking post:', error);
    return { error: 'Failed to like post' };
  }
}

export async function unlikePost(
  db: D1Database,
  postId: number,
  userId: number
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if like exists
    const { results } = await db.prepare(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(postId, userId).all();

    if (results.length === 0) {
      return { error: 'Post not liked' };
    }

    // Remove like
    await db.prepare(
      'DELETE FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(postId, userId).run();

    return { success: true };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { error: 'Failed to unlike post' };
  }
}
