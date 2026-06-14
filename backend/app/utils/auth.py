"""認可デコレータ（§4 utils / §6 権限）。

- login_required: 有効な access JWT（Authorization: Bearer）を要求。401 で拒否。
- admin_required: さらに role=ADMIN を要求。権限不足は 403（§6, §12-③）。
JWT は Flask が検証する。トークンは Next.js BFF が httpOnly Cookie から取り出し
Authorization ヘッダで中継する（§3-4）。
"""
from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from ..extensions import SessionLocal
from ..models import User
from . import error_response


def _load_active_user():
    uid = get_jwt_identity()
    return SessionLocal.query(User).filter_by(id=uid).first()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()  # 無効/欠如は jwt のローダが 401 を返す
        user = _load_active_user()
        if user is None or not user.isActive:
            return error_response("UNAUTHORIZED", "認証が必要です。", 401)
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = _load_active_user()
        if user is None or not user.isActive:
            return error_response("UNAUTHORIZED", "認証が必要です。", 401)
        if user.role != "ADMIN":
            return error_response("FORBIDDEN", "管理者権限が必要です。", 403)
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def current_user():
    return getattr(g, "current_user", None)
