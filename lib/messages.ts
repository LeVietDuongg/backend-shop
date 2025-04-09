import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_avatar_url?: string;
  receiver_username?: string;
  receiver_avatar_url?: string;
}

export async function sendMessage(
  db: D1Database,
  senderId: number,
  receiverId: number,
  content: string
): Promise<Message | { error: string }> {
  try {
    // Validate content
    if (!content.trim()) {
      return { error: 'Message content cannot be empty' };
    }

    // Check if users exist
    const { results: userResults } = await db.prepare(
      'SELECT id FROM users WHERE id IN (?, ?)'
    ).bind(senderId, receiverId).all();

    if (userResults.length < 2) {
      return { error: 'One or both users not found' };
    }

    // Check if sender and receiver are friends
    const { results: friendshipResults } = await db.prepare(
      'SELECT id FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)'
    ).bind(senderId, receiverId, receiverId, senderId).all();

    if (friendshipResults.length === 0) {
      return { error: 'You can only send messages to friends' };
    }

    // Create message
    const { results } = await db.prepare(
      `INSERT INTO messages (sender_id, receiver_id, content, is_read) 
       VALUES (?, ?, ?, FALSE) 
       RETURNING id, sender_id, receiver_id, content, is_read, created_at`
    ).bind(senderId, receiverId, content).all();

    return results[0] as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    return { error: 'Failed to send message' };
  }
}

export async function markMessageAsRead(
  db: D1Database,
  messageId: number,
  userId: number
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if message exists and user is the receiver
    const { results: messageResults } = await db.prepare(
      'SELECT id FROM messages WHERE id = ? AND receiver_id = ? AND is_read = FALSE'
    ).bind(messageId, userId).all();

    if (messageResults.length === 0) {
      return { error: 'Message not found or already read' };
    }

    // Mark as read
    await db.prepare(
      'UPDATE messages SET is_read = TRUE WHERE id = ?'
    ).bind(messageId).run();

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { error: 'Failed to mark message as read' };
  }
}

export async function getConversation(
  db: D1Database,
  userId: number,
  otherUserId: number,
  limit: number = 50,
  before?: number
): Promise<{ messages: Message[] } | { error: string }> {
  try {
    let query = `
      SELECT 
        m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
        s.username as sender_username, s.avatar_url as sender_avatar_url,
        r.username as receiver_username, r.avatar_url as receiver_avatar_url
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    `;

    const params = [userId, otherUserId, otherUserId, userId];

    if (before) {
      query += ' AND m.id < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();

    // Mark messages as read
    const messagesToMark = results
      .filter((m: any) => m.receiver_id === userId && !m.is_read)
      .map((m: any) => m.id);

    if (messagesToMark.length > 0) {
      await db.prepare(
        'UPDATE messages SET is_read = TRUE WHERE id IN (' + messagesToMark.map(() => '?').join(',') + ')'
      ).bind(...messagesToMark).run();

      // Update is_read status in results
      results.forEach((m: any) => {
        if (m.receiver_id === userId) {
          m.is_read = true;
        }
      });
    }

    return { messages: results as Message[] };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { error: 'Failed to get conversation' };
  }
}

export async function getConversationList(
  db: D1Database,
  userId: number
): Promise<{ conversations: any[] } | { error: string }> {
  try {
    const query = `
      WITH latest_messages AS (
        SELECT 
          m1.*,
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE 
                WHEN m1.sender_id = ? THEN m1.receiver_id 
                ELSE m1.sender_id 
              END 
            ORDER BY m1.created_at DESC
          ) as rn
        FROM messages m1
        WHERE m1.sender_id = ? OR m1.receiver_id = ?
      )
      SELECT 
        m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        u.username as other_username,
        u.avatar_url as other_avatar_url,
        (SELECT COUNT(*) FROM messages 
         WHERE receiver_id = ? AND sender_id = u.id AND is_read = FALSE) as unread_count
      FROM latest_messages m
      JOIN users u ON (
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END = u.id
      )
      WHERE m.rn = 1
      ORDER BY m.created_at DESC
    `;

    const { results } = await db.prepare(query)
      .bind(userId, userId, userId, userId, userId, userId)
      .all();

    return { conversations: results };
  } catch (error) {
    console.error('Error getting conversation list:', error);
    return { error: 'Failed to get conversation list' };
  }
}
