import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// AuthContext의 useAuth를 재내보내기
export const useAuth = useAuthContext;

// 인증 여부 확인 훅
export const useIsAuthenticated = () => {
  const { isAuthenticated, loading } = useAuthContext();
  return { isAuthenticated, loading };
};

// 로그인 상태에서만 접근 가능한 페이지를 위한 훅
export const useRequireAuth = () => {
  const auth = useAuthContext();
  
  return {
    ...auth,
    isReady: !auth.loading && auth.isAuthenticated,
    isNotAuthenticated: !auth.loading && !auth.isAuthenticated,
  };
}; 