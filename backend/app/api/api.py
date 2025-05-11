from fastapi import APIRouter

# 라우팅 경로 변경
from app.api.routes import auth, users
from app.api.api_v1.endpoints import oauth

# API 라우터
api_router = APIRouter()

# 인증 관련 라우트
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# 사용자 관련 라우트
api_router.include_router(users.router, prefix="/users", tags=["users"])

# OAuth 관련 라우트
api_router.include_router(oauth.router, prefix="/oauth", tags=["소셜 로그인"]) 