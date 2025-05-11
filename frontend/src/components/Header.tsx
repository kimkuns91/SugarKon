// src/components/Header.tsx
"use client";

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

export function Header() {
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Movie Service
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/movies" className="hover:text-gray-300">
            영화 목록
          </Link>
          
          {user ? (
            <>
              <Link href="/account" className="hover:text-gray-300">
                {user?.username || '내 계정'}
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
              >
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">
                로그인
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}