from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# SQLite와 PostgreSQL 모두 지원하도록 설정
engine = create_engine(
    settings.DATABASE_URL,
    # SQLite 전용 설정은 제거
    echo=True  # 개발 중 SQL 쿼리 로깅 활성화
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 의존성 주입에 사용될 DB 세션 생성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 