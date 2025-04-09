'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate form
    if (!content && !imageUrl) {
      setError('Bài viết phải có nội dung hoặc hình ảnh');
      setLoading(false);
      return;
    }

    try {
      // Create post
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, image_url: imageUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Không thể tạo bài viết');
        setLoading(false);
        return;
      }

      // Reset form
      setContent('');
      setImageUrl('');
      setLoading(false);

      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Create post error:', error);
      setError('Đã xảy ra lỗi khi tạo bài viết');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <p className="text-center text-gray-500">Vui lòng đăng nhập để đăng bài viết</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Tạo bài viết mới</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Bạn đang nghĩ gì?"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="URL hình ảnh (tùy chọn)"
          />
        </div>
        
        {imageUrl && (
          <div className="mb-4">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="max-h-64 rounded-md mx-auto"
              onError={() => setError('URL hình ảnh không hợp lệ')}
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Đang đăng...' : 'Đăng bài viết'}
        </button>
      </form>
    </div>
  );
}
