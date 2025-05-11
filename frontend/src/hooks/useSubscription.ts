import { SubscriptionTier, useSubscriptionStore } from '@/stores/subscriptionStore';
import { cancelSubscription, changeSubscription, checkContentAccess, getUserSubscription, updateAutoRenew, updatePaymentMethod } from '@/services/subscription';

import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

// 에러 타입 가드
function isError(error: unknown): error is Error {
  return error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error);
}

/**
 * 구독 관련 기능을 제공하는 커스텀 훅
 */
export function useSubscription() {
  const { user } = useAuthStore();
  const { 
    subscription, 
    isLoading, 
    error,
    setSubscription, 
    setLoading, 
    setError, 
    clearSubscription 
  } = useSubscriptionStore();
  
  // 구독 정보 로딩
  useEffect(() => {
    // 사용자가 로그인 상태인 경우에만 구독 정보 로드
    if (user?.id && !subscription) {
      loadSubscription();
    }
    
    // 사용자가 로그아웃하면 구독 정보도 초기화
    if (!user) {
      clearSubscription();
    }
  }, [user, subscription]);
  
  // 구독 정보 로딩
  const loadSubscription = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserSubscription(user.id);
      setSubscription(data);
    } catch (error: unknown) {
      console.error('구독 정보 로딩 오류:', error);
      setError(isError(error) ? error.message : '구독 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 구독 플랜 변경
  const changePlan = async (tier: SubscriptionTier) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedSubscription = await changeSubscription(user.id, tier);
      setSubscription(updatedSubscription);
      toast.success('구독 플랜이 변경되었습니다.');
      return true;
    } catch (error: unknown) {
      console.error('구독 플랜 변경 오류:', error);
      setError(isError(error) ? error.message : '구독 플랜 변경 중 오류가 발생했습니다.');
      toast.error('구독 플랜 변경에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 구독 취소
  const cancelPlan = async () => {
    if (!user?.id || !subscription?.id) {
      toast.error('유효한 구독이 없습니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await cancelSubscription(subscription.id);
      setSubscription({
        ...subscription,
        isActive: false
      });
      toast.success('구독이 취소되었습니다.');
      return true;
    } catch (error: unknown) {
      console.error('구독 취소 오류:', error);
      setError(isError(error) ? error.message : '구독 취소 중 오류가 발생했습니다.');
      toast.error('구독 취소에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 자동 갱신 설정 변경
  const setAutoRenew = async (autoRenew: boolean) => {
    if (!user?.id || !subscription?.id) {
      toast.error('유효한 구독이 없습니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedSubscription = await updateAutoRenew(subscription.id, autoRenew);
      setSubscription(updatedSubscription);
      toast.success(`자동 갱신이 ${autoRenew ? '활성화' : '비활성화'}되었습니다.`);
      return true;
    } catch (error: unknown) {
      console.error('자동 갱신 설정 변경 오류:', error);
      setError(isError(error) ? error.message : '자동 갱신 설정 변경 중 오류가 발생했습니다.');
      toast.error('자동 갱신 설정 변경에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 결제 수단 변경
  const changePaymentMethod = async (paymentMethodId: string) => {
    if (!user?.id || !subscription?.id) {
      toast.error('유효한 구독이 없습니다.');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedSubscription = await updatePaymentMethod(subscription.id, paymentMethodId);
      setSubscription(updatedSubscription);
      toast.success('결제 수단이 변경되었습니다.');
      return true;
    } catch (error: unknown) {
      console.error('결제 수단 변경 오류:', error);
      setError(isError(error) ? error.message : '결제 수단 변경 중 오류가 발생했습니다.');
      toast.error('결제 수단 변경에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // 콘텐츠 접근 권한 확인
  const hasAccessToContent = async (contentId: string) => {
    if (!user?.id) return false;
    
    try {
      return await checkContentAccess(user.id, contentId);
    } catch (error: unknown) {
      console.error('콘텐츠 접근 권한 확인 오류:', error);
      return false;
    }
  };
  
  // 현재 구독 등급이 필요한 등급보다 높은지 확인
  const hasRequiredTier = (requiredTier: SubscriptionTier) => {
    if (!subscription?.isActive) return false;
    return subscription.tier >= requiredTier;
  };
  
  return {
    subscription,
    isLoading,
    error,
    
    // 구독 상태
    isSubscribed: !!subscription?.isActive,
    currentTier: subscription?.tier || SubscriptionTier.NONE,
    
    // 구독 관련 기능
    loadSubscription,
    changePlan,
    cancelPlan,
    setAutoRenew,
    changePaymentMethod,
    
    // 접근 권한 확인
    hasAccessToContent,
    hasRequiredTier
  };
} 