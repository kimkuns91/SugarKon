// src/hooks/useAuth.ts

import { LoginRequest, RegisterRequest, User } from '@/types/auth';
import { getCurrentUser, login as loginApi, register as registerApi } from '@/services/auth';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { setUser, logout, user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // 현재 사용자 정보 조회
  const { refetch } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
  });

  // 사용자 정보 변경시 처리
  if (isAuthenticated) {
    refetch()
      .then((result) => {
        if (result.data) {
          setUser(result.data);
        }
      })
      .catch(() => {
        logout();
      });
  }

  // 로그인 뮤테이션
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => loginApi(credentials),
    onSuccess: async () => {
      await refetch();
      router.push('/');
    },
  });

  // 회원가입 뮤테이션
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => registerApi(userData),
    onSuccess: async (_, variables) => {
      // 회원가입 후 자동 로그인
      await loginMutation.mutateAsync({
        username: variables.username,
        password: variables.password,
      });
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
}