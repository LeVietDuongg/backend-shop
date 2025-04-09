'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                SocialNet
              </Link>
            </div>
            
            {/* Desktop navigation links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/"
                className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Trang chủ
              </Link>
              
              {user && (
                <>
                  <Link 
                    href="/friends"
                    className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Bạn bè
                  </Link>
                  
                  <Link 
                    href="/messages"
                    className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Tin nhắn
                  </Link>
                </>
              )}
              
              <Link 
                href="/search"
                className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Tìm kiếm
              </Link>
            </div>
          </div>
          
          {/* User menu and mobile menu button */}
          <div className="flex items-center">
            {user ? (
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <Link 
                  href={`/profile/${user.id}`}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-500 mr-4"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden mr-2">
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
                  <span>{user.username}</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <Link 
                  href="/login"
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đăng nhập
                </Link>
                
                <Link 
                  href="/register"
                  className="px-3 py-1 bg-blue-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-600"
                >
                  Đăng ký
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Mở menu</span>
                {/* Icon when menu is closed */}
                {!mobileMenuOpen ? (
                  <svg 
                    className="block h-6 w-6" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg 
                    className="block h-6 w-6" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            href="/"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            Trang chủ
          </Link>
          
          {user && (
            <>
              <Link 
                href="/friends"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bạn bè
              </Link>
              
              <Link 
                href="/messages"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tin nhắn
              </Link>
            </>
          )}
          
          <Link 
            href="/search"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tìm kiếm
          </Link>
        </div>
        
        {/* Mobile user menu */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {user ? (
            <>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
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
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.username}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link 
                  href={`/profile/${user.id}`}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Hồ sơ của tôi
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-1 px-2">
              <Link 
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng nhập
              </Link>
              
              <Link 
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-500 hover:bg-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
