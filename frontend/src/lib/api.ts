import Cookies from 'js-cookie';
import axios from 'axios';
import { refreshToken } from '@/services/auth';

// API 기본 URL 설정
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    // 요청 보내기 전에 수행할 작업
    const accessToken = Cookies.get('access_token');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    // 요청 에러 처리
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    // 응답 데이터 가공
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 토큰이 만료되어 401 에러가 발생하고, 이미 재시도하지 않았을 경우
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 리프레시 토큰으로 새 액세스 토큰 요청
        const refreshTokenValue = Cookies.get('refresh_token');
        
        if (!refreshTokenValue) {
          // 리프레시 토큰이 없으면 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // 토큰 리프레시 요청
        const response = await refreshToken(refreshTokenValue);
        
        // 새 토큰 저장
        Cookies.set('access_token', response.access_token, { expires: 1/48 }); // 30분
        Cookies.set('refresh_token', response.refresh_token, { expires: 7 }); // 7일
        
        // 헤더 업데이트
        originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
        
        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃 처리
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 