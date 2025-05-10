from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.db.redis import get_redis, is_token_blacklisted
import redis

# OAuth2 스키마 설정 (토큰 엔드포인트 지정)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """현재 인증된 사용자 정보 반환"""
    # 토큰 검증 실패 시 발생할 예외
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증에 실패했습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 토큰 디코딩
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        # 사용자 ID 또는 토큰 타입이 없는 경우 예외 발생
        if user_id is None or token_type != "access":
            raise credentials_exception
        
        # 토큰이 블랙리스트에 있는지 확인 (로그아웃된 토큰)
        if is_token_blacklisted(token):
            raise credentials_exception
            
        # 여기서 데이터베이스에서 사용자 정보를 조회하는 로직 추가
        # from app.models.user import User
        # user = db.query(User).filter(User.id == user_id).first()
        # if user is None:
        #     raise credentials_exception
        # return user
        
        # 임시로 사용자 ID만 반환 (이후 모델 구현 시 수정 필요)
        return {"id": user_id}
        
    except JWTError:
        raise credentials_exception

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """현재 인증된 사용자 정보를 선택적으로 반환 (없으면 None)"""
    if token:
        try:
            return get_current_user(token, db, redis_client)
        except HTTPException:
            return None
    return None 