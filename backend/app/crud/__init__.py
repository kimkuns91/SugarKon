from app.crud.oauth_account import CRUDOAuthAccount
from app.models.user import OAuthAccount
from app.crud.user import CRUDUser, User

# CRUD 객체 인스턴스 생성
user = CRUDUser(User)
oauth_account = CRUDOAuthAccount(OAuthAccount) 