from typing import Optional

from sqlalchemy.orm import Session
from app.models.user import OAuthAccount
from app.models.oauth import OAuthProvider
from app.schemas.oauth import OAuthAccountCreate, OAuthAccountUpdate
from app.crud.base import CRUDBase


class CRUDOAuthAccount(CRUDBase[OAuthAccount, OAuthAccountCreate, OAuthAccountUpdate]):
    def get_by_provider_and_id(
        self, db: Session, *, provider: OAuthProvider, provider_user_id: str
    ) -> Optional[OAuthAccount]:
        return db.query(self.model).filter(
            self.model.provider == provider,
            self.model.provider_user_id == provider_user_id
        ).first()
    
    def get_by_user_id(
        self, db: Session, *, user_id: int
    ) -> list[OAuthAccount]:
        return db.query(self.model).filter(
            self.model.user_id == user_id
        ).all()


oauth_account = CRUDOAuthAccount(OAuthAccount) 