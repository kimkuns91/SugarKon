from fastapi import Depends, HTTPException, status
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.redis import get_redis
from app.core.auth import get_current_user, get_optional_current_user

# DB 세션 의존성
get_db_session = Depends(get_db)

# Redis 클라이언트 의존성
get_redis_client = Depends(get_redis)

# 현재 인증된 사용자 의존성
get_authenticated_user = Depends(get_current_user)

# 선택적 인증 사용자 의존성 (토큰이 없어도 에러는 아님)
get_optional_authenticated_user = Depends(get_optional_current_user) 