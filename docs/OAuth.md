# Next.js와 FastAPI로 구현하는 안전한 JWT 인증 및 OAuth(카카오, 구글) 소셜 로그인 시스템

본 글에서는 현대 웹 애플리케이션의 핵심 요소인 사용자 인증 시스템을 Next.js와 FastAPI를 활용하여 구현하는 방법에 대해 설명하고자 합니다. 특히 JWT(JSON Web Token)와 Redis를 활용한 안전한 인증 시스템의 설계 및 구현 방법을 실제 코드 예시와 함께 살펴보겠습니다.

GitHub 저장소: [코드 보러가기](https://github.com/kimkuns91/SugarKon/tree/feature/oauth-login-restriction)

---

## 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [기술 스택](#기술-스택)
3. [인증 시스템 설계](#인증-시스템-설계)
4. [소셜 로그인 구현](#소셜-로그인-구현)
5. [백엔드 구현](#백엔드-구현)
6. [프론트엔드 구현](#프론트엔드-구현)
7. [보안 고려사항](#보안-고려사항)
8. [결론](#결론)

---

## 프로젝트 소개

본 프로젝트는 Next.js와 FastAPI를 기반으로 한 영화 서비스 애플리케이션으로, JWT와 Refresh Token을 활용한 안전한 인증 시스템을 구현하였습니다. 단순한 로그인/로그아웃 기능을 넘어서, 토큰 자동 갱신과 블랙리스트 관리까지 실제 프로덕션 환경에서 필요한 다양한 보안 기능을 포함하고 있습니다. 또한 소셜 로그인(카카오, 구글)을 지원하며, 계정 보안을 위해 동일 이메일은 최초 가입한 소셜 로그인 제공자로만 로그인이 가능하도록 제한하는 기능을 구현했습니다.

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
- **OAuth**: 소셜 로그인(카카오, 구글) 구현

### 프론트엔드
- **Next.js**: React 기반 풀스택 프레임워크
- **React**: 사용자 인터페이스 구축
- **TailwindCSS**: 유틸리티 기반 CSS 프레임워크
- **React Hook Form**: 폼 처리
- **Axios**: HTTP 클라이언트
- **SWR**: 데이터 페칭
- **Zustand**: 상태 관리 라이브러리

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

![JWT 인증 흐름 다이어그램](assets/images/jwt-auth-with-oauth-flow-diagram.png)

---

## 소셜 로그인 구현

본 프로젝트에서는 카카오와 구글 소셜 로그인을 지원하며, 사용자 계정의 일관성과 보안을 위해 동일한 이메일은 최초 가입한 소셜 로그인 제공자로만 로그인할 수 있도록 제한하는 기능을 구현했습니다.

### 소셜 로그인 제한 설계

사용자 계정 보안 및 혼란 방지를 위해 다음과 같은 로직을 구현했습니다:

1. **이메일 중복 확인**: 
   - 소셜 로그인 시 이메일이 이미 다른 소셜 로그인 제공자를 통해 가입되어 있는지 확인합니다.
   - 이미 가입되어 있는 경우, 최초 가입한 소셜 로그인 제공자로만 로그인이 가능하도록 합니다.

2. **명확한 오류 메시지**:
   - 다른 소셜 로그인 제공자로 로그인을 시도할 경우, 사용자에게 어떤 방식으로 가입되어 있는지 안내합니다.
   - 예: "이미 구글 계정으로 등록된 이메일입니다. 구글 계정으로 로그인해 주세요."

3. **계정 관리의 일관성**:
   - 동일한 사용자가 다양한 소셜 로그인 방식으로 여러 계정을 생성하는 혼란을 방지합니다.
   - 이메일을 기준으로 사용자 식별성을 유지합니다.

### 구현 예시

백엔드에서 소셜 로그인 처리 및 이메일 중복 확인 로직을 다음과 같이 구현했습니다:

```python
async def find_or_create_oauth_user(
    db: Session,
    provider: OAuthProvider,
    provider_user_id: str,
    email: Optional[str] = None,
    name: Optional[str] = None,
    profile_image: Optional[str] = None
):
    logger.info(f"소셜 로그인 처리 시작: 제공자={provider.value}, 이메일={email}")
    
    # 동일한 제공자 & ID의 OAuth 계정이 이미 있는지 확인
    oauth_account = crud.oauth_account.get_by_provider_and_id(
        db=db, 
        provider=provider, 
        provider_user_id=provider_user_id
    )
    
    if oauth_account:
        # 기존 OAuth 계정이 있으면 연결된 사용자 반환
        logger.info(f"기존 OAuth 계정 발견: provider={provider.value}, user_id={oauth_account.user_id}")
        return oauth_account.user
    
    # 이메일이 있는 경우, 이메일로 등록된 사용자가 있는지 확인
    if not email:
        # 이메일이 없으면 새 사용자 생성
        return await create_new_oauth_user(db, provider, provider_user_id, email, name, profile_image)
    
    # 이메일로 사용자 검색
    existing_user = crud.user.get_by_email(db=db, email=email)
    
    if existing_user:
        logger.info(f"동일 이메일 사용자 존재: email={email}, user_id={existing_user.id}")
        
        # 해당 사용자의 OAuth 계정 조회
        existing_oauth_accounts = crud.oauth_account.get_by_user_id(db=db, user_id=existing_user.id)
        
        # 다른 제공자로 등록된 경우 차단
        if existing_oauth_accounts:
            for account in existing_oauth_accounts:
                if account.provider != provider.value:
                    error_msg = f"이미 {account.provider} 계정으로 등록된 이메일입니다 ({email}). 해당 서비스로 로그인하거나 다른 이메일을 사용해주세요."
                    logger.warning(f"소셜 로그인 차단: {error_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=error_msg
                    )
        
        # 새 OAuth 계정 연결 (같은 이메일, 같은 제공자지만 다른 계정)
        # ...
```

프론트엔드에서는 오류 처리를 위한 콜백 페이지를 구현했습니다:

```tsx
useEffect(() => {
  // URL에서 에러 파라미터 확인
  const errorParam = searchParams.get('error');
  if (errorParam) {
    setIsProcessing(false);
    const errorDetail = searchParams.get('error_description') || '소셜 로그인 처리에 실패했습니다.';
    setErrorMessage(decodeURIComponent(errorDetail));
    toast.error(decodeURIComponent(errorDetail));
    return;
  }
  
  // 처리 중임을 표시
  processedRef.current = true;
  
  // 소셜 로그인 콜백 처리
  const success = handleSocialLoginCallback();
  
  if (success) {
    // 성공 시 홈으로 리디렉션
    setTimeout(() => {
      router.push('/');
    }, 100);
  } else {
    setIsProcessing(false);
    setErrorMessage('소셜 로그인 처리에 실패했습니다.');
    toast.error('소셜 로그인에 실패했습니다.');
  }
}, [router, user, handleSocialLoginCallback, searchParams]);
```

이러한 구현을 통해 사용자는 최초 가입한 소셜 로그인 방식으로만 로그인할 수 있으며, 계정 관리의 일관성과 보안을 강화했습니다.

---

## 백엔드 구현

FastAPI로 구현한 백엔드의 핵심 부분들을 살펴보겠습니다.

### 1. JWT 토큰 생성 및 검증

```python
# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: str, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """액세스 토큰 생성"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt
```

### 2. 소셜 로그인 엔드포인트

```python
# 카카오 로그인 시작
@router.get("/kakao")
async def kakao_login():
    kakao_oauth_url = f"https://kauth.kakao.com/oauth/authorize?client_id={settings.KAKAO_CLIENT_ID}&redirect_uri={settings.KAKAO_REDIRECT_URI}&response_type=code"
    return RedirectResponse(url=kakao_oauth_url)

# 카카오 로그인 콜백
@router.get("/kakao/callback")
async def kakao_callback(
    request: Request,
    code: str,
    db: Session = Depends(deps.get_db)
):
    try:
        logger.info(f"카카오 로그인 콜백 시작: code={code[:5]}...")
        # 인증 코드로 액세스 토큰 얻기
        token_url = "https://kauth.kakao.com/oauth/token"
        # ... 생략 ...
        
        # 해당 OAuth 계정으로 사용자 찾거나 생성
        user = await find_or_create_oauth_user(
            db=db,
            provider=OAuthProvider.KAKAO,
            provider_user_id=provider_user_id,
            email=email,
            name=name,
            profile_image=profile_image
        )
        
        # ... 이하 생략 ...
```

---

## 프론트엔드 구현

Next.js로 구현한 프론트엔드의 주요 부분을 살펴보겠습니다.

### 1. 인증 훅 (useAuth)

```tsx
// frontend/src/hooks/useAuth.ts
export function useAuth() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  
  // 일반 로그인
  const login = async (credentials: LoginRequest) => {
    // ... 생략 ...
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
      return false;
    }
  };
  
  // ... 이하 생략 ...
}
```

### 2. 소셜 로그인 버튼 컴포넌트

```tsx
// frontend/src/components/auth/SocialLogin.tsx
export function SocialLogin() {
  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/kakao`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/google`;
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-600">또는</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black flex items-center justify-center"
        onClick={handleKakaoLogin}
      >
        <div className="mr-2 h-5 w-5 relative">
          <Image
            src="/images/kakao-logo-48.svg"
            alt="Kakao Logo"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        카카오로 계속하기
      </Button>

      <Button
        type="button"
        variant="outline"
        className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300 flex items-center justify-center"
        onClick={handleGoogleLogin}
      >
        <div className="mr-2 h-5 w-5 relative">
          <Image
            src="/images/google-logo-48.svg"
            alt="Google Logo"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        Google로 계속하기
      </Button>
    </div>
  );
}
```

---

## 보안 고려사항

본 프로젝트에서 구현한 인증 시스템은 몇 가지 중요한 보안 고려사항을 포함하고 있습니다:

1. **짧은 액세스 토큰 수명**: 
   - 액세스 토큰의 유효 기간을 30분으로 제한하여 토큰이 탈취되더라도 위험을 최소화합니다.
   - 이는 금융 기관에서 사용하는 일회용 비밀번호(OTP)와 유사한 보안 개념입니다.

2. **소셜 로그인 제한**:
   - 동일한 이메일에 대해 최초 가입한 소셜 로그인 제공자만 허용하여 계정 혼란과 보안 위험을 방지합니다.
   - 이는 한 사람에게 하나의 신분증만 발급하는 것과 유사한 개념입니다.

3. **리프레시 토큰 관리**:
   - 리프레시 토큰은 클라이언트가 아닌 서버 측 Redis에 저장합니다.
   - 사용자별로 하나의 리프레시 토큰만 유효하게 관리합니다.
   - 이는 중요 시설의 마스터 키를 보안 금고에 보관하는 것과 유사한 개념입니다.

4. **토큰 블랙리스트**:
   - 로그아웃 시 액세스 토큰을 블랙리스트에 추가하여 유효 기간이 남아있더라도 사용을 방지합니다.
   - 이는 보안 시스템에서 분실된 출입 카드를 시스템에서 즉시 비활성화하는 것과 유사합니다.

5. **HTTPS 활용**:
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

본 프로젝트에서는 Next.js와 FastAPI를 활용하여 안전하고 확장 가능한 JWT 기반 인증 시스템을 구현하였습니다. 특히 소셜 로그인 구현에 있어 단순히 여러 로그인 방식을 제공하는 것을 넘어, 사용자 계정의 일관성과 보안을 강화하기 위해 동일 이메일에 대해 최초 가입한 소셜 로그인 제공자로만 로그인이 가능하도록 제한하는 기능을 구현했습니다.

이러한 접근 방식은 사용자 경험과 보안 간의 균형을 유지하는 데 중요합니다. 사용자는 자신이 최초에 선택한 소셜 로그인 방식을 일관되게 사용함으로써 계정 관리의 혼란을 피할 수 있으며, 서비스 제공자는 계정 도용 및 중복 계정 생성과 같은 보안 위험을 줄일 수 있습니다.

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
- [카카오 로그인 API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [구글 OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)

---

전체 소스 코드는 GitHub 저장소 [kimkuns91/SugarKon](https://github.com/kimkuns91/SugarKon)에서 확인하실 수 있습니다. 질문이나 피드백이 있으시면 해당 저장소의 이슈 페이지를 통해 남겨주시기 바랍니다.