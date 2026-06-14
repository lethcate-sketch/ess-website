"""認証の業務ロジック（§4 services）。

- access token: JWT（flask-jwt-extended）。identity=user.id、claims に role/email。
- refresh token: 不透明なランダム文字列。SHA-256 ハッシュのみ DB(refresh_tokens) に保存し、
  生の値は Next.js BFF が httpOnly Cookie に保持する（§3-4）。検証時に回転（古いものを失効）。
"""
import hashlib
import secrets
from datetime import timedelta

from flask import current_app
from flask_jwt_extended import create_access_token

from ..extensions import SessionLocal
from ..models import RefreshToken
from ..models.types import utcnow


def issue_access_token(user) -> str:
    return create_access_token(
        identity=user.id,
        additional_claims={"role": user.role, "email": user.email},
    )


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def issue_refresh_token(user) -> str:
    raw = secrets.token_urlsafe(48)
    days = current_app.config["JWT_REFRESH_EXPIRES_DAYS"]
    rt = RefreshToken(
        userId=user.id,
        tokenHash=_hash(raw),
        expiresAt=utcnow() + timedelta(days=days),
        revoked=False,
    )
    SessionLocal.add(rt)
    SessionLocal.commit()
    return raw


def rotate_refresh_token(raw: str):
    """リフレッシュトークンを検証し、新しい access+refresh を返す。無効なら None。"""
    if not raw:
        return None
    rt = (
        SessionLocal.query(RefreshToken)
        .filter_by(tokenHash=_hash(raw), revoked=False)
        .first()
    )
    if rt is None or rt.expiresAt <= utcnow():
        return None
    user = rt.user
    if user is None or not user.isActive:
        return None
    rt.revoked = True  # 回転: 旧トークンを失効
    SessionLocal.commit()
    new_raw = issue_refresh_token(user)
    return {"user": user, "access": issue_access_token(user), "refresh": new_raw}


def revoke_refresh_token(raw: str) -> None:
    if not raw:
        return
    rt = SessionLocal.query(RefreshToken).filter_by(tokenHash=_hash(raw)).first()
    if rt is not None:
        rt.revoked = True
        SessionLocal.commit()
