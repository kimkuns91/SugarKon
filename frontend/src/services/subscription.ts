import { Subscription, SubscriptionTier } from '@/stores/subscriptionStore';

import api from '@/lib/api';

// 사용자의 구독 정보 조회
export const getUserSubscription = async (userId: string): Promise<Subscription> => {
  const response = await api.get<Subscription>(`/subscriptions/user/${userId}`);
  return response.data;
};

// 구독 플랜 업그레이드/변경
export const changeSubscription = async (userId: string, tier: SubscriptionTier): Promise<Subscription> => {
  const response = await api.post<Subscription>('/subscriptions/change', {
    userId,
    tier
  });
  return response.data;
};

// 구독 취소
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await api.post(`/subscriptions/${subscriptionId}/cancel`);
};

// 자동 갱신 설정 변경
export const updateAutoRenew = async (subscriptionId: string, autoRenew: boolean): Promise<Subscription> => {
  const response = await api.patch<Subscription>(`/subscriptions/${subscriptionId}/auto-renew`, {
    autoRenew
  });
  return response.data;
};

// 결제 수단 변경
export const updatePaymentMethod = async (subscriptionId: string, paymentMethodId: string): Promise<Subscription> => {
  const response = await api.patch<Subscription>(`/subscriptions/${subscriptionId}/payment-method`, {
    paymentMethodId
  });
  return response.data;
};

// 콘텐츠 접근 권한 확인
export const checkContentAccess = async (userId: string, contentId: string): Promise<boolean> => {
  try {
    const response = await api.get<{ hasAccess: boolean }>(`/subscriptions/access-check`, {
      params: { userId, contentId }
    });
    return response.data.hasAccess;
  } catch (error) {
    console.error('콘텐츠 접근 권한 확인 오류:', error);
    return false;
  }
}; 