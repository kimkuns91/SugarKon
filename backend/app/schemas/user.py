from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# 기본 사용자 모델
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False

# 사용자 생성 시 사용되는 모델
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str

# 사용자 정보 업데이트 시 사용되는 모델
class UserUpdate(UserBase):
    password: Optional[str] = None

# DB에서 가져온 데이터를 위한 모델
class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# API 응답으로 반환되는 사용자 정보 모델
class User(UserBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True 