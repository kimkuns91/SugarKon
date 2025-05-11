# Next.js와 FastAPI로 구현하는 안전한 JWT 인증 시스템

본 글에서는 현대 웹 애플리케이션의 핵심 요소인 사용자 인증 시스템을 Next.js와 FastAPI를 활용하여 구현하는 방법에 대해 설명하고자 합니다. 특히 JWT(JSON Web Token)와 Redis를 활용한 안전한 인증 시스템의 설계 및 구현 방법을 실제 코드 예시와 함께 살펴보겠습니다.

GitHub 저장소: [https://github.com/kimkuns91/nextjs-fastapi-jwt-auth](https://github.com/kimkuns91/nextjs-fastapi-jwt-auth)

---

## 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [기술 스택](#기술-스택)
3. [인증 시스템 설계](#인증-시스템-설계)
4. [백엔드 구현](#백엔드-구현)
5. [프론트엔드 구현](#프론트엔드-구현)
6. [보안 고려사항](#보안-고려사항)
7. [결론](#결론)

---

## 프로젝트 소개

본 프로젝트는 Next.js와 FastAPI를 기반으로 한 영화 서비스 애플리케이션으로, JWT와 Refresh Token을 활용한 안전한 인증 시스템을 구현하였습니다. 단순한 로그인/로그아웃 기능을 넘어서, 토큰 자동 갱신과 블랙리스트 관리까지 실제 프로덕션 환경에서 필요한 다양한 보안 기능을 포함하고 있습니다.

현대 웹 애플리케이션에서 인증은 단순한 기능이 아닌, 애플리케이션의 보안을 결정짓는 중요한 요소입니다. 특히 REST API 기반의 백엔드와 SPA(Single Page Application) 프론트엔드로 구성된 아키텍처에서는 더욱 그러한 경향을 보입니다.

---

## 기술 스택

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **SQLAlchemy**: SQL 툴킷 및 ORM
- **PostgreSQL**: 관계형 데이터베이스
- **Redis**: 리프레시 토큰 및 토큰 블랙리스트 관리
- **JWT**: JSON Web Token 기반 인증
- **Pydantic**: 데이터 검증

### 프론트엔드
- **Next.js**: React 기반 풀스택 프레임워크
- **React**: 사용자 인터페이스 구축
- **TailwindCSS**: 유틸리티 기반 CSS 프레임워크
- **React Hook Form**: 폼 처리
- **Axios**: HTTP 클라이언트
- **SWR**: 데이터 페칭

---

## 인증 시스템 설계

본 프로젝트에서 구현한 인증 시스템의 핵심은 JWT와 Refresh Token의 조합입니다. 은행 금고를 비유하자면, JWT는 정해진 시간에만 사용 가능한 임시 출입 카드이고, Refresh Token은 금고를 열 수 있는 마스터 키와 유사하다고 할 수 있습니다.

### 인증 흐름

1. **로그인 프로세스**:
   - 사용자가 로그인을 요청하면 서버는 두 가지 토큰을 생성합니다:
     - **액세스 토큰(JWT)**: 짧은 수명(30분)을 가지며 사용자 식별에 사용됩니다.
     - **리프레시 토큰**: 긴 수명(7일)을 가지며 새 액세스 토큰 발급에 사용됩니다.
   - 액세스 토큰은 클라이언트에 반환됩니다.
   - 리프레시 토큰은 Redis에 저장됩니다.

2. **API 요청 인증**:
   - 클라이언트는 모든 보호된 API 요청에 액세스 토큰을 포함시킵니다.
   - 서버는 액세스 토큰을 검증하여 요청을 인증합니다.

3. **토큰 갱신 프로세스**:
   - 액세스 토큰이 만료되면 클라이언트는 리프레시 토큰으로 새 토큰을 요청합니다.
   - 서버는 Redis에 저장된 리프레시 토큰과 비교하여 검증합니다.
   - 유효한 경우 새로운 액세스 토큰을 발급합니다.

4. **로그아웃 처리**:
   - 사용자가 로그아웃하면 리프레시 토큰은 Redis에서 삭제됩니다.
   - 현재 액세스 토큰은 블랙리스트에 등록하여 더 이상 사용할 수 없게 합니다.

다음 다이어그램은 이 인증 흐름을 시각적으로 보여줍니다:

![JWT 인증 흐름 다이어그램](assets/images/jwt-auth-flow-diagram.png)

---

## 백엔드 구현

FastAPI로 구현한 백엔드의 핵심 부분들을 살펴보겠습니다.

### 1. JWT 토큰 생성 및 검증

```python
# backend/app/core/security.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

### 2. Redis를 활용한 토큰 관리

```python
# backend/app/db/redis.py
import redis
from app.core.config import settings

# Redis 클라이언트 생성
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)

def save_refresh_token(user_id: str, token: str, expires_in_seconds: int):
    """리프레시 토큰을 Redis에 저장"""
    redis_client.setex(f"refresh_token:{user_id}", expires_in_seconds, token)

def is_token_blacklisted(token: str) -> bool:
    """블랙리스트에 등록된 토큰인지 확인"""
    return redis_client.exists(f"blacklist:{token}")

def blacklist_token(token: str, expires_in_seconds: int):
    """토큰을 블랙리스트에 등록 (로그아웃 처리용)"""
    redis_client.setex(f"blacklist:{token}", expires_in_seconds, "1")
```

### 3. 인증 엔드포인트

```python
# backend/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import redis

from app.api.deps import get_db_session, get_redis_client
from app.schemas.token import Token, RefreshToken
from app.services import auth as auth_service

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = get_db_session,
    redis_client: redis.Redis = get_redis_client
):
    """사용자 로그인 및 토큰 발급"""
    tokens = auth_service.login(
        db=db,
        redis_client=redis_client,
        username=form_data.username,
        password=form_data.password
    )
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 사용자 이름 또는 비밀번호입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return tokens
```

---

## 프론트엔드 구현

Next.js로 구현한 프론트엔드의 주요 부분을 살펴보겠습니다.

### 1. 인증 컨텍스트

```tsx
// frontend/src/contexts/AuthContext.tsx
"use client";

import { AuthState } from '@/types/auth';
import { LoginRequest, RegisterRequest } from '@/types/auth';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, login, logout, register } from '@/services/auth';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

// API 에러 인터페이스 정의
interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

// API 에러 타입 가드 함수
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && 
         error !== null && 
         ('response' in error || 'message' in error);
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);
  const router = useRouter();

  // 인증 상태 초기화
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token');
      
      if (!token) {
        setState({ ...initialAuthState, loading: false });
        return;
      }
      
      try {
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
    // 구현 내용...
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
```

### 2. 로그인 폼 컴포넌트

```tsx
// frontend/src/components/auth/LoginForm.tsx
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { LoginRequest } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

const LoginForm: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  
  const onSubmit = async (data: LoginRequest) => {
    clearError();
    await login(data);
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-md p-6">
        <h2 className="text-2xl font-bold mb-6">로그인</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            사용자 이름
          </label>
          <input
            {...register('username', { required: '사용자 이름은 필수입니다' })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="사용자 이름"
          />
          {errors.username && (
            <p className="text-red-500 text-xs italic">{errors.username.message}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            비밀번호
          </label>
          <input
            {...register('password', { required: '비밀번호는 필수입니다' })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
          />
          {errors.password && (
            <p className="text-red-500 text-xs italic">{errors.password.message}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
```

---

## 보안 고려사항

본 프로젝트에서 구현한 인증 시스템은 몇 가지 중요한 보안 고려사항을 포함하고 있습니다:

1. **짧은 액세스 토큰 수명**: 
   - 액세스 토큰의 유효 기간을 30분으로 제한하여 토큰이 탈취되더라도 위험을 최소화합니다.
   - 이는 금융 기관에서 사용하는 일회용 비밀번호(OTP)와 유사한 보안 개념입니다.

2. **리프레시 토큰 관리**:
   - 리프레시 토큰은 클라이언트가 아닌 서버 측 Redis에 저장합니다.
   - 사용자별로 하나의 리프레시 토큰만 유효하게 관리합니다.
   - 이는 중요 시설의 마스터 키를 보안 금고에 보관하는 것과 유사한 개념입니다.

3. **토큰 블랙리스트**:
   - 로그아웃 시 액세스 토큰을 블랙리스트에 추가하여 유효 기간이 남아있더라도 사용을 방지합니다.
   - 이는 보안 시스템에서 분실된 출입 카드를 시스템에서 즉시 비활성화하는 것과 유사합니다.

4. **HTTPS 활용**:
   - 모든 통신에 HTTPS를 사용하여 데이터 전송 중 암호화를 보장합니다.
   - 이는 민감한 정보 전송 시 암호화된 채널을 사용하는 것과 같습니다.

### 보안 향상을 위한 추가 고려사항

1. **CSRF 토큰 구현**:
   - Cross-Site Request Forgery 공격 방지를 위한 추가 보안 레이어 구현을 고려할 수 있습니다.

2. **Rate Limiting**:
   - 로그인 시도 횟수 제한을 통해 무차별 대입 공격(Brute Force)을 방지할 수 있습니다.

3. **2FA(Two-Factor Authentication)**:
   - 추가적인 보안 레이어로 이중 인증 시스템 구현을 고려할 수 있습니다.

---

## 결론

본 프로젝트에서는 Next.js와 FastAPI를 활용하여 안전하고 확장 가능한 JWT 기반 인증 시스템을 구현하였습니다. 단순한 로그인/로그아웃 기능을 넘어서, 토큰 자동 갱신, 블랙리스트 관리 등 실제 프로덕션 환경에서 필요한 다양한 보안 기능들을 포함하고 있습니다.

현대 웹 애플리케이션에서 보안은 선택이 아닌 필수 요소입니다. 특히 사용자 인증 시스템은 애플리케이션의 첫 번째 방어선으로서, 이 부분의 취약점은 전체 시스템의 보안을 위협할 수 있습니다. 본 글에서 소개한 패턴과 구현 방법이 독자 여러분의 프로젝트에서 안전한 인증 시스템을 구축하는 데 도움이 되기를 희망합니다.

마지막으로, 인증 시스템은 '완성'이라는 개념보다는 지속적인 개선과 보안 업데이트가 필요한 영역입니다. 새로운 보안 위협이 발견되면 시스템을 지속적으로 업데이트하고, 최신 보안 모범 사례를 따르는 것이 중요합니다.

---

## 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [JWT.io - JWT 소개 및 디버깅 도구](https://jwt.io/)
- [Redis 공식 문서](https://redis.io/documentation)
- [Auth0 - JWT 인증 가이드](https://auth0.com/docs/tokens/json-web-tokens)
- [OWASP - 인증 보안 모범 사례](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/README)

---

전체 소스 코드는 GitHub 저장소 [kimkuns91/nextjs-fastapi-jwt-auth](https://github.com/kimkuns91/nextjs-fastapi-jwt-auth)에서 확인하실 수 있습니다. 질문이나 피드백이 있으시면 해당 저장소의 이슈 페이지를 통해 남겨주시기 바랍니다.