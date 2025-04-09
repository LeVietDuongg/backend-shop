'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

interface Message {
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

interface ConversationProps {
  userId: number;
}

export default function Conversation({ userId }: ConversationProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserInfo, setOtherUserInfo] = useState<{
    username: string;
    avatar_url?: string;
  } | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation history
  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/messages/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tải tin nhắn');
      }

      setMessages(data.messages.reverse()); // Reverse to show oldest first
      
      // Extract other user info from first message
      if (data.messages.length > 0) {
        const message = data.messages[0];
        if (message.sender_id === userId) {
          setOtherUserInfo({
            username: message.sender_username || 'Người dùng',
            avatar_url: message.sender_avatar_url
          });
        } else {
          setOtherUserInfo({
            username: message.receiver_username || 'Người dùng',
            avatar_url: message.receiver_avatar_url
          });
        }
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
      setError('Đã xảy ra lỗi khi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;
    
    // Connect to Socket.IO server
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });
    
    socketRef.current = socket;
    
    // Socket event handlers
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Không thể kết nối đến máy chủ tin nhắn');
    });
    
    socket.on('private_message', (message: Message) => {
      if (
        (message.sender_id === userId && message.receiver_id === user.id) ||
        (message.sender_id === user.id && message.receiver_id === userId)
      ) {
        setMessages(prev => [...prev, message]);
        
        // Mark message as read if we are the receiver
        if (message.sender_id === userId) {
          socket.emit('message_read', { 
            messageId: message.id,
            senderId: message.sender_id
          });
        }
      }
    });
    
    socket.on('message_sent', (message: Message) => {
      // Update UI with sent message confirmation
      setMessages(prev => 
        prev.map(m => 
          m.id === message.id ? message : m
        )
      );
    });
    
    socket.on('message_error', (error: { error: string }) => {
      setError(error.error || 'Không thể gửi tin nhắn');
    });
    
    socket.on('user_typing', ({ userId: typingUserId, isTyping }: { userId: number, isTyping: boolean }) => {
      if (typingUserId === userId) {
        setOtherUserTyping(isTyping);
      }
    });
    
    socket.on('user_status_change', ({ userId: statusUserId, status }: { userId: number, status: string }) => {
      if (statusUserId === userId) {
        setOtherUserOnline(status === 'online');
      }
    });
    
    socket.on('message_read', ({ messageId }: { messageId: number }) => {
      // Update message read status
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId ? { ...m, is_read: true } : m
        )
      );
    });
    
    // Fetch initial messages
    fetchMessages();
    
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [user, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim()) return;
    
    try {
      // Send message via Socket.IO
      socketRef.current?.emit('private_message', {
        senderId: user.id,
        receiverId: userId,
        content: newMessage,
        timestamp: new Date().toISOString()
      });
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: Date.now(), // Temporary ID
        sender_id: user.id,
        receiver_id: userId,
        content: newMessage,
        is_read: false,
        created_at: new Date().toISOString(),
        sender_username: user.username,
        sender_avatar_url: user.avatar_url
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Stop typing indicator
      handleStopTyping();
    } catch (error) {
      console.error('Send message error:', error);
      setError('Không thể gửi tin nhắn');
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', { receiverId: userId, isTyping: true });
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(handleStopTyping, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socketRef.current?.emit('typing', { receiverId: userId, isTyping: false });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 my-4 text-center">
        <p className="text-gray-500">Vui lòng đăng nhập để xem tin nhắn</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-200px)]">
      {/* Conversation header */}
      <div className="p-4 border-b flex items-center">
        <Link href={`/profile/${userId}`} className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
            {otherUserInfo?.avatar_url ? (
              <img 
                src={otherUserInfo.avatar_url} 
                alt={otherUserInfo.username} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                {(otherUserInfo?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold">{otherUserInfo?.username || 'Người dùng'}</div>
            <div className="text-xs text-gray-500">
              {otherUserTyping ? (
                <span className="text-green-500">Đang nhập...</span>
              ) : otherUserOnline ? (
                <span className="text-green-500">Đang hoạt động</span>
              ) : (
                <span>Ngoại tuyến</span>
              )}
            </div>
          </div>
        </Link>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === user.id;
              const showDate = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString();
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUser && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden mr-2 flex-shrink-0">
                        {message.sender_avatar_url ? (
                          <img 
                            src={message.sender_avatar_url} 
                            alt={message.sender_username || 'User'} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                            {(message.sender_username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2`}>
                      <div className="whitespace-pre-line">{message.content}</div>
                      <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} flex items-center`}>
                        <span>{formatTime(message.created_at)}</span>
                        {isCurrentUser && (
                          <span className="ml-1">
                            {message.is_read ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onBlur={handleStopTyping}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tin nhắn..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
