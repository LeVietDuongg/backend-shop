'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import { AuthProvider } from '@/lib/auth-context';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="bg-white shadow-inner mt-8 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              © 2025 SocialNet. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
