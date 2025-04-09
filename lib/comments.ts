import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
}

export async function getCommentsByPostId(
  db: D1Database,
  postId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ comments: Comment[]; total: number } | { error: string }> {
  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        c.id, c.user_id, c.post_id, c.content, c.created_at, c.updated_at,
        u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM comments WHERE post_id = ?';

    const [commentsResult, countResult] = await Promise.all([
      db.prepare(query).bind(postId, limit, offset).all(),
      db.prepare(countQuery).bind(postId).all()
    ]);

    return {
      comments: commentsResult.results as Comment[],
      total: (countResult.results[0] as { total: number }).total
    };
  } catch (error) {
    console.error('Error getting comments:', error);
    return { error: 'Failed to get comments' };
  }
}

export async function createComment(
  db: D1Database,
  userId: number,
  postId: number,
  content: string
): Promise<Comment | { error: string }> {
  try {
    if (!content.trim()) {
      return { error: 'Comment content cannot be empty' };
    }

    // Check if post exists
    const { results: postResults } = await db.prepare(
      'SELECT id FROM posts WHERE id = ?'
    ).bind(postId).all();

    if (postResults.length === 0) {
      return { error: 'Post not found' };
    }

    // Create comment
    const { results } = await db.prepare(
      `INSERT INTO comments (user_id, post_id, content) 
       VALUES (?, ?, ?) 
       RETURNING id, user_id, post_id, content, created_at, updated_at`
    ).bind(userId, postId, content).all();

    if (results.length === 0) {
      return { error: 'Failed to create comment' };
    }

    // Get username and avatar
    const { results: userResults } = await db.prepare(
      'SELECT username, avatar_url FROM users WHERE id = ?'
    ).bind(userId).all();

    const comment = results[0] as Comment;
    if (userResults.length > 0) {
      const user = userResults[0] as { username: string; avatar_url?: string };
      comment.username = user.username;
      comment.avatar_url = user.avatar_url;
    }

    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    return { error: 'Failed to create comment' };
  }
}

export async function deleteComment(
  db: D1Database,
  commentId: number,
  userId: number
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if comment exists and belongs to user
    const { results } = await db.prepare(
      'SELECT id FROM comments WHERE id = ? AND user_id = ?'
    ).bind(commentId, userId).all();

    if (results.length === 0) {
      return { error: 'Comment not found or you do not have permission to delete it' };
    }

    // Delete comment
    await db.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();

    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error: 'Failed to delete comment' };
  }
}
