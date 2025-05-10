import { AuthState, User } from '@/types/auth';
import { LoginRequest, RegisterRequest } from '@/types/auth';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, login, logout, register } from '@/services/auth';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

// 초기 인증 상태
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// Context 타입 정의
interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// AuthContext 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props 타입 정의
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider 컴포넌트
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);
  const router = useRouter();

  // 인증 상태 초기화
  useEffect(() => {
    const initAuth = async () => {
      // 액세스 토큰 확인
      const token = Cookies.get('access_token');
      
      if (!token) {
        setState({ ...initialAuthState, loading: false });
        return;
      }
      
      try {
        // 사용자 정보 조회
        const user = await getCurrentUser();
        setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: '인증에 실패했습니다. 다시 로그인해주세요.',
        });
      }
    };
    
    initAuth();
  }, []);

  // 로그인 처리
  const handleLogin = async (credentials: LoginRequest) => {
    setState({ ...state, loading: true, error: null });
    
    try {
      await login(credentials);
      const user = await getCurrentUser();
      
      setState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
      
      router.push('/'); // 홈으로 리다이렉트
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.response?.data?.detail || '로그인에 실패했습니다.',
      });
    }
  };
  
  // 회원가입 처리
  const handleRegister = async (userData: RegisterRequest) => {
    setState({ ...state, loading: true, error: null });
    
    try {
      await register(userData);
      
      // 회원가입 후 바로 로그인
      await handleLogin({
        username: userData.username,
        password: userData.password,
      });
    } catch (error: any) {
      setState({
        ...state,
        loading: false,
        error: error.response?.data?.detail || '회원가입에 실패했습니다.',
      });
    }
  };
  
  // 로그아웃 처리
  const handleLogout = async () => {
    setState({ ...state, loading: true });
    
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      
      router.push('/login'); // 로그인 페이지로 리다이렉트
    }
  };
  
  // 에러 초기화
  const clearError = () => {
    setState({ ...state, error: null });
  };
  
  // Context 값 정의
  const contextValue: AuthContextType = {
    ...state,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Context 사용을 위한 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 