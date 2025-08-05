"""Authentication utilities"""

from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta

from ..config import get_settings

security = HTTPBearer(auto_error=False)
settings = get_settings()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except jwt.PyJWTError:
        return None


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict]:
    """Get current user from JWT token (optional)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        return None
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "exp": payload.get("exp")
    }


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Require authentication (mandatory)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "exp": payload.get("exp")
    }