from datetime import datetime, timedelta
from typing import Optional

import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.db.redis import save_refresh_token, get_refresh_token, delete_refresh_token, blacklist_token
from app.models.user import User
from app.services import user as user_service

def generate_tokens(user_id: str) -> dict:
    """액세스 토큰과 리프레시 토큰을 생성"""
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)
    
    # 리프레시 토큰 유효기간 계산 (초 단위)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": refresh_token_expires
    }

def login(
    db: Session, 
    redis_client: redis.Redis,
    username: str, 
    password: str
) -> Optional[dict]:
    """사용자 로그인 및 토큰 발급"""
    user = user_service.authenticate(db, username, password)
    if not user:
        return None
    
    if not user_service.is_active(user):
        return None
    
    # 토큰 생성
    tokens = generate_tokens(user.id)
    
    # Redis에 리프레시 토큰 저장
    save_refresh_token(
        user_id=user.id,
        token=tokens["refresh_token"],
        expires_in_seconds=int(tokens["expires_in"])
    )
    
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer"
    }

def refresh_tokens(
    db: Session,
    redis_client: redis.Redis,
    refresh_token: str
) -> Optional[dict]:
    """리프레시 토큰을 이용해 새 액세스 토큰 발급"""
    try:
        from jose import jwt, JWTError
        # 리프레시 토큰 검증
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        # 토큰 타입 및 사용자 ID 확인
        if not user_id or token_type != "refresh":
            return None
        
        # Redis에 저장된 리프레시 토큰과 비교
        stored_token = get_refresh_token(user_id)
        if not stored_token or stored_token != refresh_token:
            return None
        
        # 사용자 존재 확인
        user = user_service.get_by_id(db, user_id)
        if not user or not user_service.is_active(user):
            return None
        
        # 새 토큰 발급
        tokens = generate_tokens(user_id)
        
        # 기존 토큰 삭제 및 새 리프레시 토큰 저장
        delete_refresh_token(user_id)
        save_refresh_token(
            user_id=user_id,
            token=tokens["refresh_token"],
            expires_in_seconds=int(tokens["expires_in"])
        )
        
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer"
        }
        
    except JWTError:
        return None

def logout(
    user_id: str,
    token: str,
    redis_client: redis.Redis
) -> bool:
    """사용자 로그아웃 처리"""
    # 리프레시 토큰 삭제
    delete_refresh_token(user_id)
    
    # 액세스 토큰 블랙리스트에 추가 (유효기간까지만)
    try:
        from jose import jwt
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}  # 만료된 토큰도 디코딩하기 위한 옵션
        )
        exp = payload.get("exp")
        if exp:
            # 현재 시간과 만료 시간의 차이 계산
            now = datetime.utcnow().timestamp()
            ttl = max(0, int(exp - now))  # 음수가 되지 않도록 설정
            
            # 블랙리스트에 추가
            blacklist_token(token, ttl)
            return True
    except Exception:
        pass
    
    return False 