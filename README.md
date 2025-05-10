# Movie Service - JWT 인증 시스템

Next.js와 FastAPI를 이용한 영화 서비스 애플리케이션으로, JWT + Refresh Token + Redis를 활용한 안전한 인증 시스템을 갖추고 있습니다.

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

## 주요 기능

- **JWT + Refresh Token 인증**: 액세스 토큰과 리프레시 토큰을 활용한 안전한 인증
- **Redis 활용**: 토큰 블랙리스트 및 리프레시 토큰 저장
- **자동 토큰 갱신**: 액세스 토큰 만료 시 자동 갱신
- **사용자 관리**: 회원가입, 로그인, 로그아웃, 프로필 조회

## 시스템 아키텍처

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Browser   │ <---> │  Next.js    │ <---> │  FastAPI    │
│   Client    │       │  Frontend   │       │  Backend    │
└─────────────┘       └─────────────┘       └─────────────┘
                                                   │
                                           ┌───────┴───────┐
                                           │               │
                                    ┌──────▼─────┐  ┌──────▼─────┐
                                    │            │  │            │
                                    │ PostgreSQL │  │   Redis    │
                                    │            │  │            │
                                    └────────────┘  └────────────┘
```

## 폴더 구조

```
movie_service/
├── frontend/              # Next.js 프론트엔드
│   ├── public/            # 정적 파일
│   │   ├── app/           # App Router 구조
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── contexts/      # 컨텍스트 (AuthContext 등)
│   │   ├── hooks/         # 커스텀 훅 (useAuth 등)
│   │   ├── lib/           # 유틸리티 함수
│   │   ├── services/      # API 서비스
│   │   └── types/         # 타입 정의
│   ├── .env.local         # 환경 변수
│   └── next.config.ts     # Next.js 설정
├── backend/               # FastAPI 백엔드
│   ├── app/
│   │   ├── api/           # API 엔드포인트
│   │   │   ├── routes/    # 라우트 정의
│   │   │   └── deps.py    # 의존성 주입
│   │   ├── core/          # 핵심 설정
│   │   │   ├── config.py  # 환경 설정
│   │   │   ├── security.py# 보안 관련 유틸리티
│   │   │   └── auth.py    # 인증 관련 유틸리티
│   │   ├── db/            # 데이터베이스
│   │   │   ├── session.py # DB 세션
│   │   │   └── redis.py   # Redis 연결
│   │   ├── models/        # 데이터 모델
│   │   ├── schemas/       # Pydantic 스키마
│   │   ├── services/      # 비즈니스 로직
│   │   └── main.py        # 애플리케이션 진입점
│   ├── requirements.txt   # 파이썬 의존성
│   └── Dockerfile         # 백엔드 Docker 설정
├── docker-compose.yml     # Docker Compose 설정
└── README.md              # 이 파일
```

## 설치 및 실행 방법

### 사전 요구사항

- Docker 및 Docker Compose
- Python 3.11 이상 (로컬 개발용)
- Node.js 20 이상 (로컬 개발용)

### Docker Compose로 실행하기

```bash
# 전체 시스템 실행
docker-compose up

# 백그라운드로 실행
docker-compose up -d

# 서비스 중지
docker-compose down
```

### 로컬에서 개발하기

**백엔드:**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**프론트엔드:**

```bash
cd frontend
npm install
npm run dev
```

## API 엔드포인트

### 인증 관련

- `POST /api/v1/auth/login`: 로그인 및 토큰 발급
- `POST /api/v1/auth/refresh`: 리프레시 토큰을 이용한 액세스 토큰 갱신
- `POST /api/v1/auth/logout`: 로그아웃 (토큰 블랙리스트 등록)

### 사용자 관련

- `POST /api/v1/users/`: 새 사용자 등록
- `GET /api/v1/users/me`: 현재 인증된 사용자 정보 조회
- `PUT /api/v1/users/me`: 현재 인증된 사용자 정보 업데이트

## 보안 특징

- **액세스 토큰**: 짧은 만료 시간 (30분)
- **리프레시 토큰**: 긴 만료 시간 (7일)
- **Redis 블랙리스트**: 로그아웃한 토큰 관리
- **토큰 자동 갱신**: 인증 상태 유지

## 라이선스

MIT 