// src/stores/authStore.ts

import { createJSONStorage, persist } from 'zustand/middleware';

import { User } from '@/types/auth';
import { create } from 'zustand';
import { logout as logoutApi } from '@/services/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      logout: async () => {
        try {
          await logoutApi();
        } catch (error) {
          console.error('로그아웃 오류:', error);
        } finally {
          set({ isAuthenticated: false, user: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);