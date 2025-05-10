import { LoginRequest, RegisterRequest, Token, User } from '@/types/auth';

import Cookies from 'js-cookie';
import api from '@/lib/api';

// 사용자 로그인
export const login = async (credentials: LoginRequest): Promise<Token> => {
  // FormData 형식으로 변환 (OAuth2 표준 요구사항)
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await api.post<Token>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // 토큰 쿠키에 저장
  Cookies.set('access_token', response.data.access_token, { expires: 1/48 }); // 30분
  Cookies.set('refresh_token', response.data.refresh_token, { expires: 7 }); // 7일

  return response.data;
};

// 사용자 회원가입
export const register = async (userData: RegisterRequest): Promise<User> => {
  const response = await api.post<User>('/users/', userData);
  return response.data;
};

// 토큰 새로고침
export const refreshToken = async (refreshTokenValue: string): Promise<Token> => {
  const response = await api.post<Token>('/auth/refresh', {
    refresh_token: refreshTokenValue
  });
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } finally {
    // API 요청 성공 여부와 관계없이 로컬 쿠키는 삭제
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  }
};

// 현재 사용자 정보 조회
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/users/me');
  return response.data;
}; 