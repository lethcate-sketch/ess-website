"""サークル紹介（/api/circle）。

GET /api/circle                      🔓 活動内容・頻度 + 主要メンバー一覧
PATCH /api/circle/info               👑 活動内容・頻度の更新
POST /api/circle/key-members         👑 主要メンバー追加
PATCH /api/circle/key-members/:id    👑 主要メンバー編集
DELETE /api/circle/key-members/:id   👑 主要メンバー削除
"""
from flask import Blueprint, jsonify, request

from ..extensions import SessionLocal
from ..models import CircleInfo, KeyMember
from ..models.types import utcnow
from ..schemas.circle import CircleInfoUpdateIn, KeyMemberIn, KeyMemberUpdateIn
from ..schemas.serializers import serialize_circle_info, serialize_key_member
from ..utils import error_response, validate
from ..utils.auth import admin_required

bp = Blueprint("circle", __name__, url_prefix="/api/circle")


def _get_info():
    return SessionLocal.query(CircleInfo).filter_by(id="default").first()


def _key_members():
    return (
        SessionLocal.query(KeyMember)
        .order_by(KeyMember.orderIndex.asc(), KeyMember.createdAt.asc())
        .all()
    )


@bp.get("")
def get_circle():
    info = _get_info()
    return jsonify(
        {
            "info": serialize_circle_info(info),
            "keyMembers": [serialize_key_member(m) for m in _key_members()],
        }
    )


@bp.patch("/info")
@admin_required
def update_info():
    data, err = validate(CircleInfoUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    info = _get_info()
    if info is None:
        info = CircleInfo(id="default", about="", frequency="")
        SessionLocal.add(info)
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(info, key, value)
    info.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"info": serialize_circle_info(info)})


@bp.post("/key-members")
@admin_required
def create_key_member():
    data, err = validate(KeyMemberIn, request.get_json(silent=True) or {})
    if err:
        return err
    m = KeyMember(
        name=data.name,
        role=data.role,
        bio=data.bio,
        avatarUrl=data.avatarUrl,
        userId=data.userId,
        orderIndex=data.orderIndex,
    )
    SessionLocal.add(m)
    SessionLocal.commit()
    return jsonify({"keyMember": serialize_key_member(m)}), 201


@bp.patch("/key-members/<member_id>")
@admin_required
def update_key_member(member_id):
    m = SessionLocal.query(KeyMember).filter_by(id=member_id).first()
    if m is None:
        return error_response("NOT_FOUND", "メンバーが見つかりません。", 404)
    data, err = validate(KeyMemberUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    for key, value in data.model_dump(exclude_unset=True).items():
        if key in ("name", "role") and value is None:
            continue  # 必須項目を null にはしない
        setattr(m, key, value)
    m.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"keyMember": serialize_key_member(m)})


@bp.delete("/key-members/<member_id>")
@admin_required
def delete_key_member(member_id):
    m = SessionLocal.query(KeyMember).filter_by(id=member_id).first()
    if m is None:
        return error_response("NOT_FOUND", "メンバーが見つかりません。", 404)
    SessionLocal.delete(m)
    SessionLocal.commit()
    return jsonify({"ok": True})
