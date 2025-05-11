'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReactNode } from 'react';
import { SubscriptionTier } from '@/stores/subscriptionStore';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { useSubscription } from '@/hooks/useSubscription';

interface ProtectedContentProps {
  children: ReactNode;
  requiredTier?: SubscriptionTier;
  checkDeviceLimit?: boolean;
}

/**
 * 인증, 구독, 기기 제한 등의 접근 제어를 처리하는 컴포넌트
 */
export function ProtectedContent({ 
  children, 
  requiredTier = SubscriptionTier.NONE,
  checkDeviceLimit = true 
}: ProtectedContentProps) {
  const { user, isAuthenticated } = useAuth();
  const { hasRequiredTier, isSubscribed, currentTier } = useSubscription();
  const { isDeviceLimitReached, deviceCount, maxDevices } = useDevices();
  
  // 로그인 필요
  if (!isAuthenticated || !user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <h3 className="text-xl font-bold mb-4">로그인이 필요합니다</h3>
        <p className="text-gray-600 mb-4">이 콘텐츠를 이용하려면 로그인해 주세요.</p>
        <Link href="/login">
          <Button>로그인하기</Button>
        </Link>
      </div>
    );
  }
  
  // 구독 필요
  if (requiredTier > SubscriptionTier.NONE && !hasRequiredTier(requiredTier)) {
    const tierNames = {
      [SubscriptionTier.BASIC]: '베이직',
      [SubscriptionTier.STANDARD]: '스탠다드',
      [SubscriptionTier.PREMIUM]: '프리미엄'
    };
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <h3 className="text-xl font-bold mb-4">구독이 필요합니다</h3>
        <p className="text-gray-600 mb-4">
          이 콘텐츠를 이용하려면 {tierNames[requiredTier as keyof typeof tierNames]} 이상의 구독이 필요합니다.
          {isSubscribed && <span> 현재 구독: {tierNames[currentTier as keyof typeof tierNames]}</span>}
        </p>
        <Link href="/subscription">
          <Button>구독 플랜 보기</Button>
        </Link>
      </div>
    );
  }
  
  // 기기 제한 확인
  if (checkDeviceLimit && isDeviceLimitReached()) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <h3 className="text-xl font-bold mb-4">기기 제한에 도달했습니다</h3>
        <p className="text-gray-600 mb-4">
          현재 사용 중인 기기 수: {deviceCount}/{maxDevices}
        </p>
        <p className="text-gray-600 mb-4">
          새 기기를 등록하려면 먼저 다른 기기의 등록을 해제해주세요.
        </p>
        <Link href="/devices">
          <Button>기기 관리</Button>
        </Link>
      </div>
    );
  }
  
  // 모든 접근 제어 조건 통과
  return <>{children}</>;
} 