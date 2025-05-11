import { LoginRequest, RegisterRequest } from '@/types/auth';
import { getCurrentUser, login as loginApi, logout as logoutApi, register as registerApi } from '@/services/auth';

import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

/**
 * 인증 관련 기능을 제공하는 커스텀 훅
 * Zustand 스토어와 비즈니스 로직을 결합하여 사용
 */
export function useAuth() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  
  // 일반 로그인
  const login = async (credentials: LoginRequest) => {
    try {
      // API 호출로 로그인 수행
      await loginApi(credentials);
      
      // 로그인 성공 후 사용자 정보 가져오기
      const userData = await getCurrentUser();
      setUser(userData);
      
      toast.success('로그인에 성공했습니다.');
      router.push('/');
      return true;
    } catch (error) {
      console.error('로그인 오류:', error);
      toast.error('로그인에 실패했습니다.');
      return false;
    }
  };
  
  // 회원가입
  const register = async (userData: RegisterRequest) => {
    try {
      // 회원가입 API 호출
      await registerApi(userData);
      
      // 회원가입 성공 후 자동 로그인
      await login({
        username: userData.username,
        password: userData.password
      });
      
      return true;
    } catch (error) {
      console.error('회원가입 오류:', error);
      toast.error('회원가입에 실패했습니다.');
      return false;
    }
  };
  
  // 로그아웃
  const logout = async () => {
    try {
      // API 호출로 로그아웃 수행
      await logoutApi();
      
      // 상태 초기화
      setUser(null);
      
      router.push('/login');
      return true;
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 에러가 발생해도 클라이언트 측에서는 로그아웃 처리
      setUser(null);
      router.push('/login');
      return true;
    }
  };
  
  // 소셜 로그인 처리 (콜백)
  const handleSocialLoginCallback = () => {
    try {
      // 쿠키에서 사용자 정보 가져오기
      const userInfoCookie = Cookies.get('user_info');
      
      if (!userInfoCookie) {
        console.error('사용자 정보 쿠키를 찾을 수 없습니다.');
        return false;
      }
      
      // URL 디코딩 및 JSON 파싱
      const decodedInfo = decodeURIComponent(userInfoCookie);
      const userInfo = JSON.parse(decodedInfo);
      
      console.log('소셜 로그인 사용자 정보:', userInfo);
      
      // 상태 업데이트
      setUser(userInfo);
      
      // 로그인 성공 메시지
      const provider = userInfo.oauth_provider ? 
        (userInfo.oauth_provider === 'google' ? '구글' : '카카오') : 
        '소셜';
        
      toast.success(`${provider} 계정으로 로그인이 완료되었습니다.`);
      return true;
    } catch (error) {
      console.error('소셜 로그인 콜백 오류:', error);
      // 실패 메시지 제거 (호출하는 쪽에서 처리)
      return false;
    }
  };
  
  // 현재 로그인 상태 확인
  const checkAuthStatus = async () => {
    // 이미 인증된 상태면 추가 확인 불필요
    if (user) return true;
    
    // 토큰이 있는지 확인
    const token = Cookies.get('access_token');
    if (!token) return false;
    
    try {
      // 사용자 정보 가져오기
      const userData = await getCurrentUser();
      setUser(userData);
      return true;
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      return false;
    }
  };
  
  return {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    handleSocialLoginCallback,
    checkAuthStatus
  };
} 