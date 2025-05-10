from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import redis
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_redis_client, get_authenticated_user
from app.core.auth import get_current_user
from app.schemas.token import Token, RefreshToken
from app.services import auth as auth_service

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db_session()),
    redis_client: redis.Redis = Depends(get_redis_client())
) -> Any:
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

@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_token_in: RefreshToken,
    db: Session = Depends(get_db_session()),
    redis_client: redis.Redis = Depends(get_redis_client())
) -> Any:
    """리프레시 토큰을 이용해 새 액세스 토큰 발급"""
    tokens = auth_service.refresh_tokens(
        db=db,
        redis_client=redis_client,
        refresh_token=refresh_token_in.refresh_token
    )
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 리프레시 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return tokens

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    current_user: dict = Depends(get_authenticated_user()),
    token: str = Depends(get_current_user),
    redis_client: redis.Redis = Depends(get_redis_client())
) -> Any:
    """사용자 로그아웃"""
    success = auth_service.logout(
        user_id=current_user["id"],
        token=token,
        redis_client=redis_client
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그아웃 처리 중 오류가 발생했습니다."
        )
    
    return {"detail": "성공적으로 로그아웃되었습니다."} 