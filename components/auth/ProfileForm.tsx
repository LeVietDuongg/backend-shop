'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function ProfileForm() {
  const { user, updateProfile, updatePassword, logout } = useAuth();
  
  // Profile state
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);

    // Update profile
    const result = await updateProfile({
      bio,
      email: email !== user?.email ? email : undefined,
      avatar_url: avatarUrl
    });
    
    if (!result.success) {
      setProfileError(result.error || 'Cập nhật hồ sơ thất bại');
      setProfileLoading(false);
      return;
    }

    setProfileSuccess(true);
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    setPasswordLoading(true);

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới không khớp');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setPasswordLoading(false);
      return;
    }

    // Update password
    const result = await updatePassword(currentPassword, newPassword);
    
    if (!result.success) {
      setPasswordError(result.error || 'Cập nhật mật khẩu thất bại');
      setPasswordLoading(false);
      return;
    }

    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
    setPasswordLoading(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    // Redirect happens automatically via auth context
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <p className="text-center">Vui lòng đăng nhập để xem hồ sơ của bạn.</p>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-blue-500 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Hồ sơ của bạn</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Thông tin cá nhân</h3>
        
        {profileError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {profileError}
          </div>
        )}
        
        {profileSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Cập nhật hồ sơ thành công!
          </div>
        )}
        
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Tên người dùng
            </label>
            <input
              type="text"
              id="username"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">Tên người dùng không thể thay đổi</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="avatarUrl" className="block text-gray-700 font-medium mb-2">
              URL ảnh đại diện
            </label>
            <input
              type="text"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
              Tiểu sử
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Giới thiệu về bản thân..."
            />
          </div>
          
          <button
            type="submit"
            disabled={profileLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {profileLoading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
          </button>
        </form>
      </div>
      
      <div className="mb-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Đổi mật khẩu</h3>
        
        {passwordError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {passwordError}
          </div>
        )}
        
        {passwordSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Cập nhật mật khẩu thành công!
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-2">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
      
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300"
        >
          {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </div>
    </div>
  );
}
