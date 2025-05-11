'use client';

import { useEffect, useRef, useState } from 'react';

import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { handleSocialLoginCallback, user } = useAuth();
  const processedRef = useRef(false);  // 처리 여부를 추적하는 ref

  useEffect(() => {
    // 이미 처리된 경우 중복 실행 방지
    if (processedRef.current) return;
    
    const processCallback = async () => {
      try {
        // 이미 로그인되어 있는 경우 조용히 리디렉션
        if (user) {
          router.push('/');
          return;
        }
        
        // URL에서 에러 파라미터 확인
        const errorParam = searchParams.get('error');
        if (errorParam) {
          setIsProcessing(false);
          const errorDetail = searchParams.get('error_description') || '소셜 로그인 처리에 실패했습니다.';
          setErrorMessage(decodeURIComponent(errorDetail));
          toast.error(decodeURIComponent(errorDetail));
          return;
        }
        
        // 처리 중임을 표시
        processedRef.current = true;
        
        // 소셜 로그인 콜백 처리
        const success = handleSocialLoginCallback();
        
        if (success) {
          // 성공 시 홈으로 리디렉션
          setTimeout(() => {
            router.push('/');
          }, 100);
        } else {
          setIsProcessing(false);
          setErrorMessage('소셜 로그인 처리에 실패했습니다.');
          toast.error('소셜 로그인에 실패했습니다.');
        }
      } catch (error: unknown) {
        console.error('OAuth 콜백 처리 오류:', error);
        const errorMsg = `로그인 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        setIsProcessing(false);
        processedRef.current = false;  // 오류 발생 시 재시도 가능하도록 처리 상태 초기화
      }
    };

    processCallback();
    
  }, [router, user, handleSocialLoginCallback, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
        {isProcessing ? (
          <>
            <h1 className="text-xl font-bold mb-4">로그인 처리 중...</h1>
            <div className="animate-pulse flex justify-center">
              <div className="h-8 w-8 bg-blue-400 rounded-full"></div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-4">로그인에 실패했습니다</h1>
            {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
            <p className="text-gray-600 mb-4">다시 시도해주세요.</p>
            <button
              onClick={() => {
                processedRef.current = false;  // 재시도 허용
                router.push('/login');
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              로그인 페이지로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
} 