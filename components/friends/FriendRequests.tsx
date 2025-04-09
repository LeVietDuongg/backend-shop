'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface FriendRequest {
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

export default function FriendRequests() {
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');

      // Fetch received requests
      const receivedResponse = await fetch('/api/friends/requests/list?type=received');
      const receivedData = await receivedResponse.json();

      if (!receivedResponse.ok) {
        throw new Error(receivedData.error || 'Không thể tải lời mời kết bạn');
      }

      // Fetch sent requests
      const sentResponse = await fetch('/api/friends/requests/list?type=sent');
      const sentData = await sentResponse.json();

      if (!sentResponse.ok) {
        throw new Error(sentData.error || 'Không thể tải lời mời kết bạn đã gửi');
      }

      setReceivedRequests(receivedData.requests);
      setSentRequests(sentData.requests);
    } catch (error) {
      console.error('Fetch friend requests error:', error);
      setError('Đã xảy ra lỗi khi tải lời mời kết bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleAccept = async (requestId: number) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accept: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể chấp nhận lời mời kết bạn');
      }

      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Accept friend request error:', error);
      setError('Đã xảy ra lỗi khi chấp nhận lời mời kết bạn');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accept: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể từ chối lời mời kết bạn');
      }

      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Reject friend request error:', error);
      setError('Đã xảy ra lỗi khi từ chối lời mời kết bạn');
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 my-4 text-center">
        <p className="text-gray-500">Vui lòng đăng nhập để xem lời mời kết bạn</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 font-medium ${
            activeTab === 'received' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('received')}
        >
          Lời mời nhận được ({receivedRequests.length})
        </button>
        <button
          className={`flex-1 py-3 font-medium ${
            activeTab === 'sent' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          Lời mời đã gửi ({sentRequests.length})
        </button>
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
      ) : activeTab === 'received' ? (
        <div className="p-4">
          {receivedRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Không có lời mời kết bạn nào</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {receivedRequests.map(request => (
                <li key={request.id} className="py-4 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                    {request.sender_avatar_url ? (
                      <img 
                        src={request.sender_avatar_url} 
                        alt={request.sender_username || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                        {(request.sender_username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/profile/${request.sender_id}`} className="font-medium hover:underline">
                      {request.sender_username || 'Người dùng'}
                    </Link>
                    <p className="text-sm text-gray-500">Muốn kết bạn với bạn</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Từ chối
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="p-4">
          {sentRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Bạn chưa gửi lời mời kết bạn nào</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sentRequests.map(request => (
                <li key={request.id} className="py-4 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                    {request.receiver_avatar_url ? (
                      <img 
                        src={request.receiver_avatar_url} 
                        alt={request.receiver_username || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                        {(request.receiver_username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/profile/${request.receiver_id}`} className="font-medium hover:underline">
                      {request.receiver_username || 'Người dùng'}
                    </Link>
                    <p className="text-sm text-gray-500">Đang chờ phản hồi</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
