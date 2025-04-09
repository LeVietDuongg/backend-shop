'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Post {
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

interface PostListProps {
  initialPosts?: Post[];
  userId?: number;
}

export default function PostList({ initialPosts, userId }: PostListProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (pageNum = 1, replace = true) => {
    try {
      setLoading(pageNum === 1);
      setLoadingMore(pageNum > 1);
      setError('');

      const endpoint = userId 
        ? `/api/posts/user/${userId}?page=${pageNum}` 
        : `/api/posts/all?page=${pageNum}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tải bài viết');
      }

      if (replace) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(data.posts.length > 0 && data.total > page * 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch posts error:', error);
      setError('Đã xảy ra lỗi khi tải bài viết');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!initialPosts) {
      fetchPosts();
    }
  }, [initialPosts, userId]);

  const handleLikeToggle = async (postId: number, currentLiked: boolean) => {
    if (!user) return;

    try {
      // Optimistically update UI
      setPosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: !currentLiked,
              likes_count: (post.likes_count || 0) + (currentLiked ? -1 : 1)
            };
          }
          return post;
        })
      );

      // Send request to server
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: currentLiked ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        // Revert if failed
        setPosts(prev => 
          prev.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                liked_by_user: currentLiked,
                likes_count: (post.likes_count || 0) + (currentLiked ? 0 : -1)
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Like toggle error:', error);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page + 1, false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 my-4 text-center">
        <p className="text-gray-500">Chưa có bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Post header */}
          <div className="p-4 flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
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
              <Link href={`/profile/${post.user_id}`} className="font-semibold hover:underline">
                {post.username || 'Người dùng'}
              </Link>
              <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>
          
          {/* Post content */}
          <div className="px-4 pb-3">
            <p className="whitespace-pre-line">{post.content}</p>
          </div>
          
          {/* Post image */}
          {post.image_url && (
            <div className="pb-3">
              <img 
                src={post.image_url} 
                alt="Post image" 
                className="w-full max-h-96 object-contain"
              />
            </div>
          )}
          
          {/* Post stats */}
          <div className="px-4 py-2 border-t border-gray-100 text-sm text-gray-500 flex justify-between">
            <div>{post.likes_count || 0} lượt thích</div>
            <div>{post.comments_count || 0} bình luận</div>
          </div>
          
          {/* Post actions */}
          <div className="px-4 py-2 border-t border-gray-100 flex">
            <button 
              onClick={() => handleLikeToggle(post.id, !!post.liked_by_user)}
              className={`flex-1 py-1 flex items-center justify-center rounded-md ${
                post.liked_by_user 
                  ? 'text-blue-500 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                fill={post.liked_by_user ? "currentColor" : "none"}
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={post.liked_by_user ? 0 : 1.5} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              Thích
            </button>
            
            <Link 
              href={`/posts/${post.id}`}
              className="flex-1 py-1 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-md"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              Bình luận
            </Link>
          </div>
        </div>
      ))}
      
      {hasMore && (
        <div className="flex justify-center my-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loadingMore ? 'Đang tải...' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
}
