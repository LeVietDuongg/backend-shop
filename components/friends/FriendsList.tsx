'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Friendship {
  id: number;
  user_id1: number;
  user_id2: number;
  created_at: string;
  friend_id: number;
  friend_username?: string;
  friend_avatar_url?: string;
  friend_bio?: string;
}

export default function FriendsList() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/friends/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tải danh sách bạn bè');
      }

      setFriends(data.friends);
    } catch (error) {
      console.error('Fetch friends error:', error);
      setError('Đã xảy ra lỗi khi tải danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const handleRemoveFriend = async (friendId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy kết bạn không?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/friends/${friendId}/remove`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể hủy kết bạn');
      }

      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.friend_id !== friendId));
    } catch (error) {
      console.error('Remove friend error:', error);
      setError('Đã xảy ra lỗi khi hủy kết bạn');
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 my-4 text-center">
        <p className="text-gray-500">Vui lòng đăng nhập để xem danh sách bạn bè</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Bạn bè ({friends.length})</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : friends.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">Bạn chưa có bạn bè nào</p>
          <Link 
            href="/search" 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Tìm kiếm bạn bè
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {friends.map(friend => (
            <li key={friend.id} className="p-4 flex items-center">
              <div className="h-14 w-14 rounded-full bg-gray-200 overflow-hidden mr-4">
                {friend.friend_avatar_url ? (
                  <img 
                    src={friend.friend_avatar_url} 
                    alt={friend.friend_username || 'User'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                    {(friend.friend_username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Link href={`/profile/${friend.friend_id}`} className="font-medium hover:underline">
                  {friend.friend_username || 'Người dùng'}
                </Link>
                {friend.friend_bio && (
                  <p className="text-sm text-gray-500 line-clamp-1">{friend.friend_bio}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Link 
                  href={`/messages/${friend.friend_id}`}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Nhắn tin
                </Link>
                <button
                  onClick={() => handleRemoveFriend(friend.friend_id)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Hủy kết bạn
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
