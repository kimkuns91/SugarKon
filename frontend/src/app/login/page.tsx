'use client';

import React, { useEffect } from 'react';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    console.log('로그인 페이지 - 인증 상태:', { user });
    if (user) {
      router.push('/');
    }
  }, [user, router]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Movie Service
        </h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          로그인
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage; 