import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender_username?: string;
  sender_avatar_url?: string;
  receiver_username?: string;
  receiver_avatar_url?: string;
}

export interface Friendship {
  id: number;
  user_id1: number;
  user_id2: number;
  created_at: string;
  friend_id: number;
  friend_username?: string;
  friend_avatar_url?: string;
  friend_bio?: string;
}

export async function sendFriendRequest(
  db: D1Database,
  senderId: number,
  receiverId: number
): Promise<FriendRequest | { error: string }> {
  try {
    // Check if users exist
    const { results: userResults } = await db.prepare(
      'SELECT id FROM users WHERE id IN (?, ?)'
    ).bind(senderId, receiverId).all();

    if (userResults.length < 2) {
      return { error: 'One or both users not found' };
    }

    // Check if sender and receiver are the same
    if (senderId === receiverId) {
      return { error: 'Cannot send friend request to yourself' };
    }

    // Check if already friends
    const { results: friendshipResults } = await db.prepare(
      'SELECT id FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)'
    ).bind(senderId, receiverId, receiverId, senderId).all();

    if (friendshipResults.length > 0) {
      return { error: 'Already friends' };
    }

    // Check if friend request already exists
    const { results: requestResults } = await db.prepare(
      'SELECT id, status FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)'
    ).bind(senderId, receiverId, receiverId, senderId).all();

    if (requestResults.length > 0) {
      const existingRequest = requestResults[0] as { id: number; status: string };
      
      if (existingRequest.status === 'pending') {
        // If the other user already sent a request, accept it
        if ((requestResults[0] as any).sender_id === receiverId) {
          return { error: 'Friend request already received from this user' };
        } else {
          return { error: 'Friend request already sent to this user' };
        }
      } else if (existingRequest.status === 'rejected') {
        // If previously rejected, update the request
        await db.prepare(
          'UPDATE friend_requests SET status = "pending", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(existingRequest.id).run();
        
        const { results } = await db.prepare(
          'SELECT * FROM friend_requests WHERE id = ?'
        ).bind(existingRequest.id).all();
        
        return results[0] as FriendRequest;
      }
    }

    // Create new friend request
    const { results } = await db.prepare(
      `INSERT INTO friend_requests (sender_id, receiver_id, status) 
       VALUES (?, ?, "pending") 
       RETURNING id, sender_id, receiver_id, status, created_at, updated_at`
    ).bind(senderId, receiverId).all();

    return results[0] as FriendRequest;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { error: 'Failed to send friend request' };
  }
}

export async function respondToFriendRequest(
  db: D1Database,
  requestId: number,
  userId: number,
  accept: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if request exists and user is the receiver
    const { results: requestResults } = await db.prepare(
      'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = "pending"'
    ).bind(requestId, userId).all();

    if (requestResults.length === 0) {
      return { error: 'Friend request not found or already processed' };
    }

    const request = requestResults[0] as FriendRequest;

    if (accept) {
      // Accept request
      await db.prepare(
        'UPDATE friend_requests SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(requestId).run();

      // Create friendship
      await db.prepare(
        'INSERT INTO friendships (user_id1, user_id2) VALUES (?, ?)'
      ).bind(request.sender_id, request.receiver_id).run();

      return { success: true };
    } else {
      // Reject request
      await db.prepare(
        'UPDATE friend_requests SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(requestId).run();

      return { success: true };
    }
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return { error: 'Failed to process friend request' };
  }
}

export async function removeFriend(
  db: D1Database,
  userId: number,
  friendId: number
): Promise<{ success: true } | { error: string }> {
  try {
    // Check if friendship exists
    const { results: friendshipResults } = await db.prepare(
      'SELECT id FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)'
    ).bind(userId, friendId, friendId, userId).all();

    if (friendshipResults.length === 0) {
      return { error: 'Friendship not found' };
    }

    // Remove friendship
    await db.prepare(
      'DELETE FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)'
    ).bind(userId, friendId, friendId, userId).run();

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { error: 'Failed to remove friend' };
  }
}

export async function getFriendRequests(
  db: D1Database,
  userId: number,
  type: 'sent' | 'received' = 'received'
): Promise<{ requests: FriendRequest[] } | { error: string }> {
  try {
    let query: string;
    
    if (type === 'sent') {
      query = `
        SELECT fr.*, u.username as receiver_username, u.avatar_url as receiver_avatar_url
        FROM friend_requests fr
        JOIN users u ON fr.receiver_id = u.id
        WHERE fr.sender_id = ? AND fr.status = "pending"
        ORDER BY fr.created_at DESC
      `;
    } else {
      query = `
        SELECT fr.*, u.username as sender_username, u.avatar_url as sender_avatar_url
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = "pending"
        ORDER BY fr.created_at DESC
      `;
    }

    const { results } = await db.prepare(query).bind(userId).all();

    return { requests: results as FriendRequest[] };
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return { error: 'Failed to get friend requests' };
  }
}

export async function getFriends(
  db: D1Database,
  userId: number
): Promise<{ friends: Friendship[] } | { error: string }> {
  try {
    const query = `
      SELECT 
        f.id, f.user_id1, f.user_id2, f.created_at,
        CASE 
          WHEN f.user_id1 = ? THEN f.user_id2
          ELSE f.user_id1
        END as friend_id,
        u.username as friend_username,
        u.avatar_url as friend_avatar_url,
        u.bio as friend_bio
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id1 = ? THEN f.user_id2
          ELSE f.user_id1
        END = u.id
      )
      WHERE f.user_id1 = ? OR f.user_id2 = ?
      ORDER BY u.username
    `;

    const { results } = await db.prepare(query).bind(userId, userId, userId, userId).all();

    return { friends: results as Friendship[] };
  } catch (error) {
    console.error('Error getting friends:', error);
    return { error: 'Failed to get friends' };
  }
}

export async function checkFriendshipStatus(
  db: D1Database,
  userId: number,
  otherUserId: number
): Promise<{ 
  status: 'friends' | 'request_sent' | 'request_received' | 'none';
  requestId?: number;
} | { error: string }> {
  try {
    // Check if already friends
    const { results: friendshipResults } = await db.prepare(
      'SELECT id FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)'
    ).bind(userId, otherUserId, otherUserId, userId).all();

    if (friendshipResults.length > 0) {
      return { status: 'friends' };
    }

    // Check for pending friend requests
    const { results: requestResults } = await db.prepare(
      'SELECT id, sender_id, receiver_id FROM friend_requests WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = "pending"'
    ).bind(userId, otherUserId, otherUserId, userId).all();

    if (requestResults.length > 0) {
      const request = requestResults[0] as { id: number; sender_id: number; receiver_id: number };
      
      if (request.sender_id === userId) {
        return { status: 'request_sent', requestId: request.id };
      } else {
        return { status: 'request_received', requestId: request.id };
      }
    }

    return { status: 'none' };
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return { error: 'Failed to check friendship status' };
  }
}
