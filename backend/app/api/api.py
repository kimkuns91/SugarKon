from fastapi import APIRouter

from app.api.routes import auth, users

# API 라우터
api_router = APIRouter()

# 인증 관련 라우트
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# 사용자 관련 라우트
api_router.include_router(users.router, prefix="/users", tags=["users"]) 