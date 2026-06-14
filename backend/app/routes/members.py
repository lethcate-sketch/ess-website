"""メンバー / マイページ（§6 /api/members, /api/me）。すべて 🔑 要ログイン。"""
from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import Attendance, User
from ..models.types import utcnow
from ..schemas.members import MeUpdateIn
from ..schemas.serializers import serialize_attendance, serialize_user
from ..utils import error_response, validate
from ..utils.auth import login_required

bp = Blueprint("members", __name__, url_prefix="/api")


@bp.get("/members")
@login_required
def list_members():
    users = (
        SessionLocal.query(User)
        .filter_by(isActive=True)
        .order_by(User.joinedAt.asc())
        .all()
    )
    return jsonify({"members": [serialize_user(u, include_email=False) for u in users]})


@bp.get("/members/<user_id>")
@login_required
def get_member(user_id):
    u = SessionLocal.query(User).filter_by(id=user_id, isActive=True).first()
    if u is None:
        return error_response("NOT_FOUND", "メンバーが見つかりません。", 404)
    return jsonify({"member": serialize_user(u, include_email=False)})


@bp.get("/me")
@login_required
def get_me():
    return jsonify({"user": serialize_user(g.current_user, include_email=True)})


@bp.patch("/me")
@login_required
def update_me():
    data, err = validate(MeUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    fields = data.model_dump(exclude_unset=True)
    user = g.current_user
    for key, value in fields.items():
        setattr(user, key, value)
    user.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"user": serialize_user(user, include_email=True)})


@bp.get("/me/attendance")
@login_required
def my_attendance():
    atts = (
        SessionLocal.query(Attendance)
        .filter_by(userId=g.current_user.id)
        .all()
    )
    items = [serialize_attendance(a, with_event=True) for a in atts]
    # 開始日時の新しい順に並べる（イベントが取れないものは末尾）
    items.sort(key=lambda x: (x.get("event") or {}).get("startAt") or "", reverse=True)
    return jsonify({"attendance": items})
