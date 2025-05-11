# SQLAlchemy 모델을 모두 가져오는 파일
# 이 파일을 import하면 모든 모델이 Base.metadata에 등록됩니다.

from app.db.base_class import Base  # noqa
from app.models.user import User, OAuthAccount  # noqa 