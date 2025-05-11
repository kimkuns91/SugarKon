from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OAuthProvider(str, Enum):
    GOOGLE = "google"
    KAKAO = "kakao"

class OAuthUserCreate(BaseModel):
    provider: OAuthProvider
    provider_user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    profile_image: Optional[str] = None
    
class OAuthUser(OAuthUserCreate):
    user_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True 