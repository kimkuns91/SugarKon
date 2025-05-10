from typing import Optional
from pydantic import BaseModel

# 토큰 발급에 필요한 로그인 정보
class TokenPayload(BaseModel):
    sub: str  # 사용자 ID
    exp: int  # 만료 시간
    type: str  # 토큰 타입 (access/refresh)

# 로그인 요청을 위한 모델
class Login(BaseModel):
    username: str
    password: str

# 액세스 토큰과 리프레시 토큰을 담는 응답 모델
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# 토큰 갱신 요청을 위한 모델
class RefreshToken(BaseModel):
    refresh_token: str 