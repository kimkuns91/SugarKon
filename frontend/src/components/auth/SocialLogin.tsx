'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React from 'react';

export function SocialLogin() {
  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/kakao`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/google`;
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-600">또는</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black flex items-center justify-center"
        onClick={handleKakaoLogin}
      >
        <div className="mr-2 h-5 w-5 relative">
          <Image
            src="/images/kakao-logo-48.svg"
            alt="Kakao Logo"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        카카오로 계속하기
      </Button>

      <Button
        type="button"
        variant="outline"
        className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300 flex items-center justify-center"
        onClick={handleGoogleLogin}
      >
        <div className="mr-2 h-5 w-5 relative">
          <Image
            src="/images/google-logo-48.svg"
            alt="Google Logo"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        Google로 계속하기
      </Button>
    </div>
  );
} 