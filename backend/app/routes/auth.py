"""認証エンドポイント（§6 /api/auth）。

POST /register 🔓 / POST /login 🔓 / POST /refresh 🔓(Cookie) / POST /logout 🔑 / GET /me 🔑
パスワードは bcrypt でハッシュ化・検証（seed の bcryptjs ハッシュ($2a$)とも相互運用）。
トークンの Cookie 化は Next.js BFF が担当し、本APIは JSON でトークンを返すのみ（§3-4）。
"""
import bcrypt
from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import SiteSetting, User
from ..schemas.auth import LoginIn, RegisterIn
from ..schemas.serializers import serialize_user
from ..services.auth import (
    issue_access_token,
    issue_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
)
from ..utils import error_response, validate
from ..utils.auth import login_required

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    # 新規登録の受付が OFF のときは拒否（部外者の登録防止 / 既定 OFF）
    setting = SessionLocal.query(SiteSetting).filter_by(id="default").first()
    if setting is None or not setting.registrationEnabled:
        return error_response("REGISTRATION_DISABLED", "現在、新規登録は受け付けていません。", 403)
    data, err = validate(RegisterIn, request.get_json(silent=True) or {})
    if err:
        return err
    if SessionLocal.query(User).filter_by(email=data.email).first() is not None:
        return error_response("EMAIL_TAKEN", "このメールアドレスは登録済みです。", 422)

    pw_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(
        email=data.email,
        passwordHash=pw_hash,
        name=data.name,
        nameKana=data.nameKana,
        grade=data.grade,
        department=data.department,
        role="MEMBER",
    )
    SessionLocal.add(user)
    SessionLocal.commit()

    access = issue_access_token(user)
    refresh = issue_refresh_token(user)
    return (
        jsonify({"user": serialize_user(user), "accessToken": access, "refreshToken": refresh}),
        201,
    )


@bp.post("/login")
def login():
    data, err = validate(LoginIn, request.get_json(silent=True) or {})
    if err:
        return err
    user = SessionLocal.query(User).filter_by(email=data.email).first()
    if user is None or not bcrypt.checkpw(
        data.password.encode("utf-8"), user.passwordHash.encode("utf-8")
    ):
        return error_response("INVALID_CREDENTIALS", "メールアドレスまたはパスワードが違います。", 401)
    if not user.isActive:
        return error_response("ACCOUNT_DISABLED", "アカウントが無効化されています。", 403)

    access = issue_access_token(user)
    refresh = issue_refresh_token(user)
    return jsonify({"user": serialize_user(user), "accessToken": access, "refreshToken": refresh})


@bp.post("/refresh")
def refresh():
    raw = (request.get_json(silent=True) or {}).get("refreshToken")
    if not raw:
        return error_response("UNAUTHORIZED", "リフレッシュトークンがありません。", 401)
    result = rotate_refresh_token(raw)
    if result is None:
        return error_response("INVALID_TOKEN", "リフレッシュトークンが無効です。", 401)
    return jsonify(
        {
            "user": serialize_user(result["user"]),
            "accessToken": result["access"],
            "refreshToken": result["refresh"],
        }
    )


@bp.post("/logout")
@login_required
def logout():
    raw = (request.get_json(silent=True) or {}).get("refreshToken")
    if raw:
        revoke_refresh_token(raw)
    return jsonify({"ok": True})


@bp.get("/me")
@login_required
def me():
    return jsonify({"user": serialize_user(g.current_user)})
