from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, users, oauth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["인증"])
api_router.include_router(users.router, prefix="/users", tags=["사용자"])
api_router.include_router(oauth.router, prefix="/auth", tags=["소셜 로그인"]) 