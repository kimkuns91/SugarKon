// 사용자 타입 정의
export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  profile_image?: string;
  oauth_provider?: 'kakao' | 'google' | null;
}

// 인증 상태 타입 정의
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 토큰 관련 타입 정의
export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// 로그인 요청 타입
export interface LoginRequest {
  username: string;
  password: string;
}

// 회원가입 요청 타입
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
} 