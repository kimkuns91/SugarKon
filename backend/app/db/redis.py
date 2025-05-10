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

# 의존성 주입에 사용될 Redis 클라이언트 생성 함수
def get_redis():
    try:
        yield redis_client
    finally:
        # 특별한 종료 로직이 필요하면 여기에 추가
        pass

# 리프레시 토큰 관리 함수들
def save_refresh_token(user_id: str, token: str, expires_in_seconds: int):
    """리프레시 토큰을 Redis에 저장"""
    redis_client.setex(f"refresh_token:{user_id}", expires_in_seconds, token)

def get_refresh_token(user_id: str) -> str:
    """사용자 ID로 리프레시 토큰 조회"""
    return redis_client.get(f"refresh_token:{user_id}")

def delete_refresh_token(user_id: str):
    """리프레시 토큰 삭제 (로그아웃)"""
    redis_client.delete(f"refresh_token:{user_id}")

def is_token_blacklisted(token: str) -> bool:
    """블랙리스트에 등록된 토큰인지 확인"""
    return redis_client.exists(f"blacklist:{token}")

def blacklist_token(token: str, expires_in_seconds: int):
    """토큰을 블랙리스트에 등록 (로그아웃 처리용)"""
    redis_client.setex(f"blacklist:{token}", expires_in_seconds, "1") 