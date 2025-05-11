'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const { user, logout } = useAuthStore();
  const isLoggingIn = false; // Zustand에는 이 상태가 없으므로 기본값으로 설정

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">영화 서비스</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* 인증 상태 카드 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>인증 상태</CardTitle>
            <CardDescription>현재 로그인 상태와 사용자 정보를 확인합니다</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user?.profile_image ? (
                      <Image 
                        src={user.profile_image} 
                        alt="프로필 이미지" 
                        width={64} 
                        height={64} 
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user?.username || '사용자'}</p>
                    <p className="text-sm text-gray-500">{user?.email || '이메일 없음'}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-2">사용자 정보</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">ID:</p>
                    <p>{user?.id}</p>
                    <p className="text-gray-500">생성일:</p>
                    <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
                    {user?.oauth_provider && (
                      <>
                        <p className="text-gray-500">로그인 방식:</p>
                        <p>{user.oauth_provider === 'kakao' ? '카카오' : 
                            user.oauth_provider === 'google' ? '구글' : '일반'}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="mb-4">로그인이 필요합니다</p>
                <div className="flex justify-center gap-4">
                  <Link href="/login">
                    <Button>로그인</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline">회원가입</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {user && (
              <Button 
                variant="destructive" 
                onClick={logout} 
                disabled={isLoggingIn}
              >
                로그아웃
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* 앱 정보 카드 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>영화 서비스</CardTitle>
            <CardDescription>최신 영화 정보와 리뷰를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">이 서비스는 다음 기능을 제공합니다:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>최신 영화 정보 제공</li>
              <li>인기 영화 순위</li>
              <li>영화 리뷰 및 평점</li>
              <li>소셜 로그인 (카카오, 구글)</li>
              <li>개인화된 영화 추천</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/movies" className="w-full">
              <Button className="w-full">영화 둘러보기</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
