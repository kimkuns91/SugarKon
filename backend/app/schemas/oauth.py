from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.oauth import OAuthProvider


class OAuthAccountBase(BaseModel):
    user_id: str
    provider: str
    provider_user_id: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class OAuthAccountCreate(OAuthAccountBase):
    pass


class OAuthAccountUpdate(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class OAuthAccountInDBBase(OAuthAccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class OAuthAccount(OAuthAccountInDBBase):
    pass 