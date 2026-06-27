"""管理者ダッシュボード/メンバー管理（§6 /api/admin, すべて 👑）。"""
import re
import secrets
from datetime import timedelta

from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import (
    Attendance,
    ContactInquiry,
    Event,
    LineLinkToken,
    ParticipationRequest,
    SiteImage,
    SiteSetting,
    User,
)
from ..models.types import utcnow
from ..schemas.admin import (
    ImageUpdateIn,
    LineTokenCreateIn,
    RoleUpdateIn,
    SettingsUpdateIn,
    StatusUpdateIn,
)
from ..schemas.serializers import (
    serialize_line_link_token,
    serialize_site_setting,
    serialize_user,
)
from ..utils import error_response, validate
from ..utils.auth import admin_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# 管理画面から差し替え可能な画像キー（公開ページの各スロットに対応）
ALLOWED_IMAGE_KEYS = {
    "logo",
    "hero",
    "galleryDiscussion",
    "gallerySpeech",
    "gallerySocial",
    "galleryDrama",
    "aboutCover",
    "aboutActivity1",
    "aboutActivity2",
    "aboutActivity3",
    "scheduleCover",
    "eventsCover",
}

# トップページのフィーチャー/ギャラリー項目の画像は動的キー（feature-<id> / gallery-<id>）。
_DYNAMIC_IMAGE_KEY = re.compile(r"^(feature|gallery)-[A-Za-z0-9_-]{1,64}$")


def _is_allowed_image_key(key: str) -> bool:
    return key in ALLOWED_IMAGE_KEYS or bool(_DYNAMIC_IMAGE_KEY.match(key))


def _active_admin_count() -> int:
    """有効（isActive=True）な ADMIN の人数。"""
    return SessionLocal.query(User).filter_by(role="ADMIN", isActive=True).count()


@bp.get("/dashboard")
@admin_required
def dashboard():
    members = SessionLocal.query(User).filter_by(isActive=True).count()
    admins = SessionLocal.query(User).filter_by(isActive=True, role="ADMIN").count()
    published = SessionLocal.query(Event).filter_by(status="PUBLISHED").count()
    upcoming = (
        SessionLocal.query(Event)
        .filter(Event.status == "PUBLISHED", Event.endAt >= utcnow())
        .count()
    )
    pending_requests = SessionLocal.query(ParticipationRequest).filter_by(status="NEW").count()
    pending_contacts = SessionLocal.query(ContactInquiry).filter_by(status="NEW").count()

    total_att = SessionLocal.query(Attendance).count()
    present = (
        SessionLocal.query(Attendance)
        .filter(Attendance.status.in_(["ATTENDING", "LATE"]))
        .count()
    )
    rate = round(present / total_att * 100, 1) if total_att else None

    return jsonify(
        {
            "members": members,
            "admins": admins,
            "publishedEvents": published,
            "upcomingEvents": upcoming,
            "pendingRequests": pending_requests,
            "pendingContacts": pending_contacts,
            "attendanceRate": rate,
        }
    )


@bp.get("/members")
@admin_required
def admin_members():
    users = SessionLocal.query(User).order_by(User.joinedAt.asc()).all()
    return jsonify({"members": [serialize_user(u, include_email=True) for u in users]})


@bp.patch("/members/<user_id>/role")
@admin_required
def update_role(user_id):
    data, err = validate(RoleUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    u = SessionLocal.query(User).filter_by(id=user_id).first()
    if u is None:
        return error_response("NOT_FOUND", "メンバーが見つかりません。", 404)
    # 最後の有効な ADMIN は降格不可
    if (
        data.role != "ADMIN"
        and u.role == "ADMIN"
        and u.isActive
        and _active_admin_count() <= 1
    ):
        return error_response("LAST_ADMIN", "最後の管理者を降格することはできません。", 409)
    u.role = data.role
    u.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"member": serialize_user(u, include_email=True)})


@bp.patch("/members/<user_id>/status")
@admin_required
def update_status(user_id):
    data, err = validate(StatusUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    u = SessionLocal.query(User).filter_by(id=user_id).first()
    if u is None:
        return error_response("NOT_FOUND", "メンバーが見つかりません。", 404)
    if not data.isActive:
        # 自分自身は無効化不可
        if u.id == g.current_user.id:
            return error_response("CANNOT_DISABLE_SELF", "自分自身を無効化することはできません。", 409)
        # 最後の有効な ADMIN は無効化不可
        if u.role == "ADMIN" and u.isActive and _active_admin_count() <= 1:
            return error_response("LAST_ADMIN", "最後の管理者は無効化できません。", 409)
    u.isActive = data.isActive
    u.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"member": serialize_user(u, include_email=True)})


# ---------- サイト設定（新規登録の受付 ON/OFF 等） ----------
@bp.get("/settings")
@admin_required
def get_settings():
    s = SessionLocal.query(SiteSetting).filter_by(id="default").first()
    return jsonify({"settings": serialize_site_setting(s)})


@bp.patch("/settings")
@admin_required
def update_settings():
    data, err = validate(SettingsUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    s = SessionLocal.query(SiteSetting).filter_by(id="default").first()
    if s is None:
        s = SiteSetting(id="default", registrationEnabled=False)
        SessionLocal.add(s)
    fields = data.model_dump(exclude_unset=True)
    if fields.get("registrationEnabled") is not None:
        s.registrationEnabled = fields["registrationEnabled"]
    s.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"settings": serialize_site_setting(s)})


# ---------- サイト画像（ロゴ・写真の差し替え） ----------
@bp.get("/images")
@admin_required
def get_images():
    rows = SessionLocal.query(SiteImage).all()
    return jsonify({"images": {r.key: r.url for r in rows}})


@bp.put("/images/<key>")
@admin_required
def put_image(key):
    if not _is_allowed_image_key(key):
        return error_response("INVALID_KEY", "未知の画像キーです。", 400)
    data, err = validate(ImageUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    row = SessionLocal.query(SiteImage).filter_by(key=key).first()
    if row is None:
        row = SiteImage(key=key, url=data.url)
        SessionLocal.add(row)
    else:
        row.url = data.url
        row.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"image": {"key": row.key, "url": row.url}})


@bp.delete("/images/<key>")
@admin_required
def delete_image(key):
    """画像をデフォルトに戻す（DB の上書きを削除）。"""
    row = SessionLocal.query(SiteImage).filter_by(key=key).first()
    if row is not None:
        SessionLocal.delete(row)
        SessionLocal.commit()
    return jsonify({"ok": True})


# ---------- LINE 招待コード（友だち紐付け用） ----------
# 紛らわしい文字（I/O/0/1）を除いた英数字。コードは "ESS-XXXXXX"。
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _gen_code() -> str:
    return "ESS-" + "".join(secrets.choice(_CODE_ALPHABET) for _ in range(6))


def _create_one_token(user_id, note, expires_at):
    # まれな衝突に備え、未使用コードになるまで数回試行する。
    code = _gen_code()
    for _ in range(5):
        if SessionLocal.query(LineLinkToken).filter_by(code=code).first() is None:
            break
        code = _gen_code()
    t = LineLinkToken(code=code, userId=user_id, note=note, expiresAt=expires_at)
    SessionLocal.add(t)
    SessionLocal.flush()  # id を採番
    return t


def _token_target_names(tokens) -> dict:
    """userId 指定トークンの宛先メンバー名 {userId: name} を一括取得。"""
    ids = {t.userId for t in tokens if t.userId}
    if not ids:
        return {}
    return {u.id: u.name for u in SessionLocal.query(User).filter(User.id.in_(ids)).all()}


@bp.get("/line/tokens")
@admin_required
def list_line_tokens():
    tokens = (
        SessionLocal.query(LineLinkToken).order_by(LineLinkToken.createdAt.desc()).all()
    )
    names = _token_target_names(tokens)
    return jsonify(
        {"tokens": [serialize_line_link_token(t, target_name=names.get(t.userId)) for t in tokens]}
    )


@bp.post("/line/tokens")
@admin_required
def create_line_tokens():
    data, err = validate(LineTokenCreateIn, request.get_json(silent=True) or {})
    if err:
        return err
    expires_at = utcnow() + timedelta(days=data.expiresInDays) if data.expiresInDays else None

    if data.kind == "member":
        u = SessionLocal.query(User).filter_by(id=data.userId).first()
        if u is None:
            return error_response("NOT_FOUND", "メンバーが見つかりません。", 404)
        created = [_create_one_token(u.id, data.note, expires_at)]
    else:
        created = [_create_one_token(None, data.note, expires_at) for _ in range(data.count)]

    SessionLocal.commit()
    names = _token_target_names(created)
    return (
        jsonify(
            {"tokens": [serialize_line_link_token(t, target_name=names.get(t.userId)) for t in created]}
        ),
        201,
    )


@bp.delete("/line/tokens/<token_id>")
@admin_required
def delete_line_token(token_id):
    t = SessionLocal.query(LineLinkToken).filter_by(id=token_id).first()
    if t is None:
        return jsonify({"ok": True})
    if t.usedAt is not None:
        return error_response("ALREADY_USED", "使用済みのコードは削除できません（履歴として保持）。", 409)
    SessionLocal.delete(t)
    SessionLocal.commit()
    return jsonify({"ok": True})
