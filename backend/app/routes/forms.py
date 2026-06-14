"""公開フォーム受付（§6）。

POST /api/participation-requests 🔓 見学・参加申し込み
POST /api/contact               🔓 質問フォーム
（一覧 GET / 対応 PATCH は管理者専用のため M6 admin で追加する。）
"""
from flask import Blueprint, jsonify, request

from ..extensions import SessionLocal
from ..models import ContactInquiry, Event, ParticipationRequest
from ..schemas.admin import ContactStatusIn, RequestStatusIn
from ..schemas.forms import ContactIn, ParticipationRequestIn
from ..schemas.serializers import serialize_contact, serialize_participation_request
from ..utils import error_response, validate
from ..utils.auth import admin_required

bp = Blueprint("forms", __name__, url_prefix="/api")


@bp.post("/participation-requests")
def create_participation_request():
    data, err = validate(ParticipationRequestIn, request.get_json(silent=True) or {})
    if err:
        return err

    # eventId が指定されていても、存在しなければ FK 違反を避けるため None にする
    event_id = data.eventId
    if event_id and SessionLocal.query(Event).filter_by(id=event_id).first() is None:
        event_id = None

    pr = ParticipationRequest(
        name=data.name,
        email=data.email,
        type=data.type,
        message=data.message,
        eventId=event_id,
        status="NEW",
    )
    SessionLocal.add(pr)
    SessionLocal.commit()
    return jsonify({"ok": True, "id": pr.id}), 201


@bp.post("/contact")
def create_contact():
    data, err = validate(ContactIn, request.get_json(silent=True) or {})
    if err:
        return err

    ci = ContactInquiry(
        name=data.name,
        email=data.email,
        subject=data.subject,
        message=data.message,
        status="NEW",
    )
    SessionLocal.add(ci)
    SessionLocal.commit()
    return jsonify({"ok": True, "id": ci.id}), 201


# ---------- 管理 👑: 一覧・対応ステータス更新 ----------
@bp.get("/participation-requests")
@admin_required
def list_participation_requests():
    rows = (
        SessionLocal.query(ParticipationRequest)
        .order_by(ParticipationRequest.createdAt.desc())
        .all()
    )
    return jsonify({"requests": [serialize_participation_request(r) for r in rows]})


@bp.patch("/participation-requests/<req_id>")
@admin_required
def update_participation_request(req_id):
    data, err = validate(RequestStatusIn, request.get_json(silent=True) or {})
    if err:
        return err
    r = SessionLocal.query(ParticipationRequest).filter_by(id=req_id).first()
    if r is None:
        return error_response("NOT_FOUND", "申し込みが見つかりません。", 404)
    r.status = data.status
    SessionLocal.commit()
    return jsonify({"request": serialize_participation_request(r)})


@bp.get("/contact")
@admin_required
def list_contacts():
    rows = SessionLocal.query(ContactInquiry).order_by(ContactInquiry.createdAt.desc()).all()
    return jsonify({"contacts": [serialize_contact(c) for c in rows]})


@bp.patch("/contact/<contact_id>")
@admin_required
def update_contact(contact_id):
    data, err = validate(ContactStatusIn, request.get_json(silent=True) or {})
    if err:
        return err
    c = SessionLocal.query(ContactInquiry).filter_by(id=contact_id).first()
    if c is None:
        return error_response("NOT_FOUND", "問い合わせが見つかりません。", 404)
    c.status = data.status
    SessionLocal.commit()
    return jsonify({"contact": serialize_contact(c)})
