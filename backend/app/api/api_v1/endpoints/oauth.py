from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
from typing import Dict, Optional
import json
import logging
import urllib.parse

from app import crud, schemas
from app.core.config import settings
from app.core import security
from app.api import deps
from app.models.oauth import OAuthProvider
from app.models.user import OAuthAccount

router = APIRouter()
logger = logging.getLogger(__name__)

# 카카오 로그인 시작
@router.get("/kakao")
async def kakao_login():
    kakao_oauth_url = f"https://kauth.kakao.com/oauth/authorize?client_id={settings.KAKAO_CLIENT_ID}&redirect_uri={settings.KAKAO_REDIRECT_URI}&response_type=code"
    return RedirectResponse(url=kakao_oauth_url)

# 카카오 로그인 콜백
@router.get("/kakao/callback")
async def kakao_callback(
    request: Request,
    code: str,
    db: Session = Depends(deps.get_db)
):
    try:
        logger.info(f"카카오 로그인 콜백 시작: code={code[:5]}...")
        # 인증 코드로 액세스 토큰 얻기
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_CLIENT_ID,
            "client_secret": settings.KAKAO_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.KAKAO_REDIRECT_URI
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=token_data)
            token_info = response.json()
            
            # 사용자 정보 가져오기
            user_info_url = "https://kapi.kakao.com/v2/user/me"
            headers = {
                "Authorization": f"Bearer {token_info['access_token']}"
            }
            user_response = await client.get(user_info_url, headers=headers)
            user_info = user_response.json()
            
        # 사용자 정보에서 필요한 데이터 추출
        kakao_account = user_info.get("kakao_account", {})
        profile = kakao_account.get("profile", {})
        
        provider_user_id = str(user_info["id"])
        email = kakao_account.get("email")
        name = profile.get("nickname")
        profile_image = profile.get("profile_image_url")
        
        logger.info(f"카카오 사용자 정보: id={provider_user_id}, email={email}")
        
        # 해당 OAuth 계정으로 사용자 찾거나 생성
        user = await find_or_create_oauth_user(
            db=db,
            provider=OAuthProvider.KAKAO,
            provider_user_id=provider_user_id,
            email=email,
            name=name,
            profile_image=profile_image
        )
        
        # 액세스 토큰 생성
        access_token = security.create_access_token(subject=str(user.id))
        refresh_token = security.create_refresh_token(subject=str(user.id))
        
        # 쿠키를 설정하고 프론트엔드로 리디렉션
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/oauth-callback")
        
        # 쿠키 설정 (secure=True는 HTTPS에서만 작동)
        response.set_cookie(
            key="access_token", 
            value=access_token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            samesite="lax",
            secure=False  # 개발 환경에서는 False, 프로덕션에서는 True로 설정
        )
        
        response.set_cookie(
            key="refresh_token", 
            value=refresh_token,
            httponly=True,
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            samesite="lax",
            secure=False  # 개발 환경에서는 False, 프로덕션에서는 True로 설정
        )
        
        # 사용자 정보를 JSON으로 쿠키에 저장 (프론트엔드에서 접근 가능하도록)
        # 문자열화 가능한 간단한 사용자 정보만 포함
        user_info_dict = {
            "id": str(user.id),
            "email": user.email or "",
            "name": user.name or "",
            "username": user.username or "",
            "oauth_provider": OAuthProvider.KAKAO.value  # OAuth 제공자 정보 추가
        }
        
        try:
            user_info_json = json.dumps(user_info_dict)
            # URL 인코딩 추가
            encoded_user_info = urllib.parse.quote(user_info_json)
            logger.info(f"사용자 정보 쿠키 설정: 원본={user_info_json}, 인코딩={encoded_user_info}")
            
            response.set_cookie(
                key="user_info", 
                value=encoded_user_info,
                max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                path="/",
                samesite="lax",
                secure=False  # 개발 환경에서는 False, 프로덕션에서는 True로 설정
            )
        except Exception as e:
            logger.error(f"쿠키 설정 오류: {str(e)}")
        
        return response
    except HTTPException as e:
        # 구체적인 HTTP 예외는 적절한 오류 메시지와 함께 리디렉션
        error_description = urllib.parse.quote(e.detail)
        error_redirect_url = f"{settings.FRONTEND_URL}/auth/oauth-callback?error=true&error_description={error_description}"
        return RedirectResponse(url=error_redirect_url)
    except Exception as e:
        # 일반적인 예외 처리
        logger.error(f"카카오 로그인 처리 중 오류 발생: {str(e)}")
        error_description = urllib.parse.quote("로그인 처리 중 오류가 발생했습니다.")
        error_redirect_url = f"{settings.FRONTEND_URL}/auth/oauth-callback?error=true&error_description={error_description}"
        return RedirectResponse(url=error_redirect_url)

# 구글 로그인 시작
@router.get("/google")
async def google_login():
    google_oauth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile&access_type=offline"
    return RedirectResponse(url=google_oauth_url)

# 구글 로그인 콜백
@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str,
    db: Session = Depends(deps.get_db)
):
    try:
        logger.info(f"구글 로그인 콜백 시작: code={code[:5]}...")
        # 인증 코드로 액세스 토큰 얻기
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=token_data)
            token_info = response.json()
            
            # 사용자 정보 가져오기
            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {
                "Authorization": f"Bearer {token_info['access_token']}"
            }
            user_response = await client.get(user_info_url, headers=headers)
            user_info = user_response.json()
        
        # 사용자 정보에서 필요한 데이터 추출
        provider_user_id = user_info["id"]
        email = user_info.get("email")
        name = user_info.get("name")
        profile_image = user_info.get("picture")
        
        logger.info(f"구글 사용자 정보: id={provider_user_id}, email={email}")
        
        # 해당 OAuth 계정으로 사용자 찾거나 생성
        user = await find_or_create_oauth_user(
            db=db,
            provider=OAuthProvider.GOOGLE,
            provider_user_id=provider_user_id,
            email=email,
            name=name,
            profile_image=profile_image
        )
        
        # 액세스 토큰 생성
        access_token = security.create_access_token(subject=str(user.id))
        refresh_token = security.create_refresh_token(subject=str(user.id))
        
        # 쿠키를 설정하고 프론트엔드로 리디렉션
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/oauth-callback")
        
        # 쿠키 설정 (secure=True는 HTTPS에서만 작동)
        response.set_cookie(
            key="access_token", 
            value=access_token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            samesite="lax",
            secure=False  # 개발 환경에서는 False, 프로덕션에서는 True로 설정
        )
        
        response.set_cookie(
            key="refresh_token", 
            value=refresh_token,
            httponly=True,
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            samesite="lax",
            secure=False  # 개발 환경에서는 False, 프로덕션에서는 True로 설정
        )
        
        # 사용자 정보를 JSON으로 쿠키에 저장 (프론트엔드에서 접근 가능하도록)
        # 문자열화 가능한 간단한 사용자 정보만 포함
        user_info_dict = {
            "id": str(user.id),
            "email": user.email or "",  # None 값이 있으면 빈 문자열로 변환
            "name": user.name or "",
            "username": user.username or "",
            "oauth_provider": OAuthProvider.GOOGLE.value  # OAuth 제공자 정보 추가
        }
        
        try:
            user_info_json = json.dumps(user_info_dict)
            # URL 인코딩 추가
            encoded_user_info = urllib.parse.quote(user_info_json)
            logger.info(f"사용자 정보 쿠키 설정 (구글): 원본={user_info_json}, 인코딩={encoded_user_info}")
            
            response.set_cookie(
                key="user_info", 
                value=encoded_user_info,
                max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                path="/",
                samesite="lax",
                secure=False  # 개발 환경에서는 False, 프로덕션에서는 True로 설정
            )
        except Exception as e:
            logger.error(f"쿠키 설정 오류 (구글): {str(e)}")
        
        return response
    except HTTPException as e:
        # 구체적인 HTTP 예외는 적절한 오류 메시지와 함께 리디렉션
        error_description = urllib.parse.quote(e.detail)
        error_redirect_url = f"{settings.FRONTEND_URL}/auth/oauth-callback?error=true&error_description={error_description}"
        return RedirectResponse(url=error_redirect_url)
    except Exception as e:
        # 일반적인 예외 처리
        logger.error(f"구글 로그인 처리 중 오류 발생: {str(e)}")
        error_description = urllib.parse.quote("로그인 처리 중 오류가 발생했습니다.")
        error_redirect_url = f"{settings.FRONTEND_URL}/auth/oauth-callback?error=true&error_description={error_description}"
        return RedirectResponse(url=error_redirect_url)

# 로그아웃 엔드포인트
@router.post("/logout")
async def logout():
    response = Response({"message": "로그아웃 성공"})
    
    # 인증 관련 쿠키 삭제
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="user_info", path="/")
    
    return response

# 사용자 찾기 또는 생성 (OAuth)
async def find_or_create_oauth_user(
    db: Session,
    provider: OAuthProvider,
    provider_user_id: str,
    email: Optional[str] = None,
    name: Optional[str] = None,
    profile_image: Optional[str] = None
):
    logger.info(f"소셜 로그인 처리 시작: 제공자={provider.value}, 이메일={email}")
    
    # 1. 동일한 제공자 & ID의 OAuth 계정이 이미 있는지 확인
    oauth_account = crud.oauth_account.get_by_provider_and_id(
        db=db, 
        provider=provider, 
        provider_user_id=provider_user_id
    )
    
    if oauth_account:
        # 기존 OAuth 계정이 있으면 연결된 사용자 반환
        logger.info(f"기존 OAuth 계정 발견: provider={provider.value}, user_id={oauth_account.user_id}")
        return oauth_account.user
    
    # 2. 이메일이 있는 경우, 이메일로 등록된 사용자가 있는지 확인
    if not email:
        logger.warning(f"이메일 정보 없음: provider={provider.value}, provider_user_id={provider_user_id}")
        # 이메일이 없으면 새 사용자 생성
        return await create_new_oauth_user(db, provider, provider_user_id, email, name, profile_image)
    
    # 3. 이메일로 사용자 검색
    existing_user = crud.user.get_by_email(db=db, email=email)
    
    if existing_user:
        logger.info(f"동일 이메일 사용자 존재: email={email}, user_id={existing_user.id}")
        
        # 4. 해당 사용자의 OAuth 계정 조회
        existing_oauth_accounts = crud.oauth_account.get_by_user_id(db=db, user_id=existing_user.id)
        
        # 5. 다른 제공자로 등록된 경우 차단
        if existing_oauth_accounts:
            for account in existing_oauth_accounts:
                if account.provider != provider.value:
                    error_msg = f"이미 {account.provider} 계정으로 등록된 이메일입니다 ({email}). 해당 서비스로 로그인하거나 다른 이메일을 사용해주세요."
                    logger.warning(f"소셜 로그인 차단: {error_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=error_msg
                    )
        
        # 6. 새 OAuth 계정 연결 (같은 이메일, 같은 제공자지만 다른 계정)
        oauth_account_in = schemas.OAuthAccountCreate(
            user_id=existing_user.id,
            provider=provider,
            provider_user_id=provider_user_id
        )
        oauth_account = crud.oauth_account.create(db=db, obj_in=oauth_account_in)
        logger.info(f"기존 사용자에 새 OAuth 계정 연결: user_id={existing_user.id}, provider={provider.value}")
        
        return existing_user
    
    # 7. 기존 사용자가 없으면 새 사용자 생성
    return await create_new_oauth_user(db, provider, provider_user_id, email, name, profile_image)

# 새 OAuth 사용자 생성 (코드 분리)
async def create_new_oauth_user(
    db: Session,
    provider: OAuthProvider,
    provider_user_id: str,
    email: Optional[str] = None,
    name: Optional[str] = None,
    profile_image: Optional[str] = None
):
    logger.info(f"새 사용자 생성: provider={provider.value}, email={email}")
    
    # 1. 새 사용자 생성
    user_in = schemas.UserCreate(
        email=email,
        username=f"{provider.value}_{provider_user_id}",
        password=None,  # OAuth 사용자는 비밀번호 없음
        is_active=True,
        oauth_provider=provider,
        oauth_id=provider_user_id,
        name=name,
        profile_image=profile_image
    )
    user = crud.user.create(db=db, obj_in=user_in)
    
    # 2. OAuth 계정 연결
    oauth_account_in = schemas.OAuthAccountCreate(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id
    )
    oauth_account = crud.oauth_account.create(db=db, obj_in=oauth_account_in)
    
    logger.info(f"새 사용자 및 OAuth 계정 생성 완료: user_id={user.id}, provider={provider.value}")
    return user 