'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
}

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/posts/${postId}/comments?page=${pageNum}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tải bình luận');
      }

      if (append) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      
      setTotal(data.total);
      setHasMore(data.comments.length > 0 && data.total > pageNum * 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch comments error:', error);
      setError('Đã xảy ra lỗi khi tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Vui lòng đăng nhập để bình luận');
      return;
    }
    
    if (!content.trim()) {
      setError('Nội dung bình luận không được để trống');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Không thể tạo bình luận');
      }
      
      // Add new comment to list
      setComments(prev => [data.comment, ...prev]);
      setTotal(prev => prev + 1);
      
      // Clear input
      setContent('');
    } catch (error) {
      console.error('Submit comment error:', error);
      setError('Đã xảy ra lỗi khi gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchComments(page + 1, true);
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

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Bình luận ({total})</h3>
      
      {/* Comment form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="flex">
            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
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
            
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Viết bình luận..."
              />
              
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {submitting ? 'Đang gửi...' : 'Bình luận'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {/* Comments list */}
      {loading && comments.length === 0 ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          Chưa có bình luận nào
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex">
              <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
                {comment.avatar_url ? (
                  <img 
                    src={comment.avatar_url} 
                    alt={comment.username || 'User'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                    {(comment.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="font-semibold">{comment.username || 'Người dùng'}</div>
                  <div className="whitespace-pre-line">{comment.content}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-2">
                  {formatDate(comment.created_at)}
                </div>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-md"
              >
                {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
