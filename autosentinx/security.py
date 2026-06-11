"""Authentication — bcrypt password hashing + JWT bearer tokens + the FastAPI auth dependency.

Users sign up / log in via /auth/*; protected endpoints depend on `current_user`. App-level auth means
the Cloud Run service can be public while every real endpoint still requires a logged-in user.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import select

from .config import get_settings
from .db import SessionLocal
from .models import User

_bearer = HTTPBearer(auto_error=True)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(sub: str) -> str:
    s = get_settings()
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "iat": now, "exp": now + timedelta(hours=s.jwt_expire_hours)}
    return jwt.encode(payload, s.jwt_secret, algorithm="HS256")


def _decode(token: str) -> str:
    s = get_settings()
    try:
        return jwt.decode(token, s.jwt_secret, algorithms=["HS256"])["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token expired")
    except (jwt.InvalidTokenError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")


async def create_user(email: str, password: str) -> User:
    email = email.strip().lower()
    async with SessionLocal() as s:
        exists = (await s.execute(select(User).where(User.email == email))).scalars().first()
        if exists:
            raise HTTPException(status.HTTP_409_CONFLICT, "email already registered")
        user = User(email=email, hashed_password=hash_password(password))
        s.add(user)
        await s.commit()
        await s.refresh(user)
        return user


async def authenticate(email: str, password: str) -> User:
    async with SessionLocal() as s:
        user = (await s.execute(select(User).where(User.email == email.strip().lower()))).scalars().first()
    if not user or not user.is_active or not verify_password(password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid email or password")
    return user


async def current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> User:
    """FastAPI dependency: require a valid bearer token; return the User."""
    email = _decode(creds.credentials)
    async with SessionLocal() as s:
        user = (await s.execute(select(User).where(User.email == email))).scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    return user
