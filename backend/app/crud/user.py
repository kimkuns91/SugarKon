from typing import Any, Dict, Optional, Union

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.crud.base import CRUDBase
from app.models.oauth import OAuthProvider


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    def get_by_oauth(
        self, db: Session, *, provider: OAuthProvider, provider_user_id: str
    ) -> Optional[User]:
        return db.query(User).filter(
            User.oauth_provider == provider,
            User.oauth_id == provider_user_id
        ).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        hashed_password = None
        if obj_in.password:
            hashed_password = get_password_hash(obj_in.password)
            
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=hashed_password,
            is_active=obj_in.is_active,
            is_superuser=obj_in.is_superuser,
            oauth_provider=obj_in.oauth_provider,
            oauth_id=obj_in.oauth_id,
            name=obj_in.name,
            profile_image=obj_in.profile_image,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def create_oauth_user(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=None,  # OAuth 사용자는 비밀번호가 없음
            is_active=obj_in.is_active,
            is_superuser=False,
            oauth_provider=obj_in.oauth_provider,
            oauth_id=obj_in.oauth_id,
            name=obj_in.name,
            profile_image=obj_in.profile_image,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
            
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user


user = CRUDUser(User) 