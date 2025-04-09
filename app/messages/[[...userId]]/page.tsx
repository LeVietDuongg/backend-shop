'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import ConversationList from '@/components/messages/ConversationList';
import Conversation from '@/components/messages/Conversation';

interface MessagesPageProps {
  params?: {
    userId?: string;
  };
}

export default function MessagesPage({ params }: MessagesPageProps) {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    params?.userId ? parseInt(params.userId) : null
  );
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 my-4 text-center">
        <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem tin nhắn</p>
        <Link 
          href="/login" 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  // On mobile: show either conversation list or selected conversation
  // On desktop: show both side by side
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Conversation list - hidden on mobile when a conversation is selected */}
      {(!isMobile || !selectedUserId) && (
        <div className="md:col-span-1">
          <ConversationList />
        </div>
      )}
      
      {/* Selected conversation - full width on mobile, 2/3 on desktop */}
      {selectedUserId ? (
        <div className="md:col-span-2">
          {isMobile && (
            <button
              onClick={() => setSelectedUserId(null)}
              className="mb-4 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
          )}
          <Conversation userId={selectedUserId} />
        </div>
      ) : (
        // Placeholder when no conversation is selected (desktop only)
        <div className="hidden md:block md:col-span-2 bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu</p>
        </div>
      )}
    </div>
  );
}
