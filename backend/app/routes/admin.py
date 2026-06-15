"""管理者ダッシュボード/メンバー管理（§6 /api/admin, すべて 👑）。"""
from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import (
    Attendance,
    ContactInquiry,
    Event,
    ParticipationRequest,
    SiteImage,
    SiteSetting,
    User,
)
from ..models.types import utcnow
from ..schemas.admin import ImageUpdateIn, RoleUpdateIn, SettingsUpdateIn, StatusUpdateIn
from ..schemas.serializers import serialize_site_setting, serialize_user
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
}


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
    if key not in ALLOWED_IMAGE_KEYS:
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
