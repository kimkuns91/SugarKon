from typing import Any, List

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_authenticated_user
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.services import user as user_service

router = APIRouter()

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db_session())
) -> Any:
    """새 사용자 등록"""
    # 이메일 또는 사용자명 중복 확인
    user = user_service.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 이메일입니다."
        )
    
    user = user_service.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 사용자명입니다."
        )
    
    # 새 사용자 생성
    user = user_service.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=UserSchema)
def get_current_user(
    current_user: dict = Depends(get_authenticated_user()),
    db: Session = Depends(get_db_session())
) -> Any:
    """현재 로그인된 사용자 정보 조회"""
    user = user_service.get_by_id(db, user_id=current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    return user

@router.put("/me", response_model=UserSchema)
def update_current_user(
    user_in: UserUpdate,
    current_user: dict = Depends(get_authenticated_user()),
    db: Session = Depends(get_db_session())
) -> Any:
    """현재 로그인된 사용자 정보 업데이트"""
    user = user_service.get_by_id(db, user_id=current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    
    # 이메일 업데이트 시 중복 확인
    if user_in.email and user_in.email != user.email:
        if user_service.get_by_email(db, email=user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 이메일입니다."
            )
    
    # 사용자명 업데이트 시 중복 확인
    if user_in.username and user_in.username != user.username:
        if user_service.get_by_username(db, username=user_in.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 사용자명입니다."
            )
    
    # 사용자 정보 업데이트
    user = user_service.update(db, db_obj=user, obj_in=user_in)
    return user 