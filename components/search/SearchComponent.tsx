'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

interface SearchProps {
  initialQuery?: string;
}

export default function SearchComponent({ initialQuery = '' }: SearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'all' | 'users' | 'posts'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchType}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Không thể thực hiện tìm kiếm');
        }

        setUsers(data.users || []);
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Search error:', error);
        setError('Đã xảy ra lỗi khi tìm kiếm');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchType]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm kiếm người dùng hoặc bài viết..."
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSearchType('all')}
            className={`px-4 py-2 rounded-md ${
              searchType === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSearchType('users')}
            className={`px-4 py-2 rounded-md ${
              searchType === 'users' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Người dùng
          </button>
          <button
            onClick={() => setSearchType('posts')}
            className={`px-4 py-2 rounded-md ${
              searchType === 'posts' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bài viết
          </button>
        </div>
      </div>

      {/* Search results */}
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : !debouncedQuery.trim() ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">Nhập từ khóa để tìm kiếm</p>
        </div>
      ) : (users.length === 0 && posts.length === 0) ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">Không tìm thấy kết quả nào cho "{debouncedQuery}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Users results */}
          {(searchType === 'all' || searchType === 'users') && users.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Người dùng ({users.length})</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {users.map(user => (
                  <li key={user.id} className="p-4 hover:bg-gray-50">
                    <Link href={`/profile/${user.id}`} className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
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
                        <h3 className="font-medium">{user.username}</h3>
                        {user.bio && (
                          <p className="text-sm text-gray-500 line-clamp-1">{user.bio}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Posts results */}
          {(searchType === 'all' || searchType === 'posts') && posts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Bài viết ({posts.length})</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {posts.map(post => (
                  <li key={post.id} className="p-4 hover:bg-gray-50">
                    <Link href={`/posts/${post.id}`}>
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden mr-2">
                          {post.avatar_url ? (
                            <img 
                              src={post.avatar_url} 
                              alt={post.username || 'User'} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                              {(post.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">{post.username || 'Người dùng'}</span>
                          <span className="text-xs text-gray-500 ml-2">{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                      <p className="line-clamp-2">{post.content}</p>
                      {post.image_url && (
                        <div className="mt-2">
                          <img 
                            src={post.image_url} 
                            alt="Post image" 
                            className="h-32 w-auto object-cover rounded"
                          />
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
