import { createJSONStorage, persist } from 'zustand/middleware';

import { create } from 'zustand';

// 구독 플랜 타입 정의
export enum SubscriptionTier {
  NONE = 0,
  BASIC = 1,
  STANDARD = 2,
  PREMIUM = 3
}

// 구독 정보 인터페이스
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod?: string;
  // 기타 구독 관련 정보
}

// 구독 스토어 상태 인터페이스
interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  
  // 상태 설정 함수
  setSubscription: (subscription: Subscription | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSubscription: () => void;
}

// 구독 상태 관리를 위한 Zustand 스토어
export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscription: null,
      isLoading: false,
      error: null,
      
      setSubscription: (subscription) => set({ subscription }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearSubscription: () => set({ subscription: null }),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 