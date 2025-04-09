'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import CreatePostForm from '@/components/posts/CreatePostForm';
import PostList from '@/components/posts/PostList';
import FriendRequests from '@/components/friends/FriendRequests';

export default function HomePage() {
  const { user } = useAuth();
  const [refreshPosts, setRefreshPosts] = useState(0);

  const handlePostCreated = () => {
    setRefreshPosts(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left sidebar - visible on medium screens and up */}
      <div className="hidden md:block">
        <div className="space-y-6">
          {user && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="h-14 w-14 rounded-full bg-gray-200 overflow-hidden mr-4">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user.username}</h2>
                  <p className="text-gray-500">{user.bio || 'Không có tiểu sử'}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <a href="/" className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
                    Trang chủ
                  </a>
                </li>
                {user && (
                  <>
                    <li>
                      <a href={`/profile/${user.id}`} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                        Hồ sơ cá nhân
                      </a>
                    </li>
                    <li>
                      <a href="/friends" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                        Bạn bè
                      </a>
                    </li>
                    <li>
                      <a href="/messages" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                        Tin nhắn
                      </a>
                    </li>
                  </>
                )}
                <li>
                  <a href="/search" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                    Tìm kiếm
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="md:col-span-2">
        {user && <CreatePostForm onPostCreated={handlePostCreated} />}
        <PostList key={refreshPosts} />
      </div>
      
      {/* Right sidebar - visible on large screens */}
      <div className="hidden lg:block md:col-span-1">
        {user && <FriendRequests />}
      </div>
      
      {/* Mobile-only friend requests - visible below posts on small screens */}
      <div className="block md:hidden">
        {user && <FriendRequests />}
      </div>
    </div>
  );
}
