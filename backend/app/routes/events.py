"""イベント（§6 /api/events）。

公開GET 🔓: 一覧 / upcoming / history / 詳細
管理 👑    : 作成(POST) / 編集(PATCH) / 削除=アーカイブ(DELETE) / 出欠集計(GET :id/attendance)
"""
from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import Attendance, Event
from ..models.types import utcnow
from ..schemas.events import EventCreateIn, EventUpdateIn
from ..schemas.serializers import serialize_attendance, serialize_event, serialize_user
from ..utils import ALLOWED_VALUES, error_response, validate
from ..utils.auth import admin_required

bp = Blueprint("events", __name__, url_prefix="/api/events")

PUBLIC_STATUSES = ("PUBLISHED", "CLOSED", "ARCHIVED")


def _is_public_viewable(e: Event) -> bool:
    return e.isPublic and e.status != "DRAFT"


# ---------- 公開 GET ----------
@bp.get("")
def list_events():
    events = (
        SessionLocal.query(Event)
        .filter(Event.status == "PUBLISHED", Event.isPublic.is_(True))
        .order_by(Event.startAt.desc())
        .all()
    )
    return jsonify({"events": [serialize_event(e) for e in events]})


@bp.get("/upcoming")
def upcoming_events():
    events = (
        SessionLocal.query(Event)
        .filter(Event.status == "PUBLISHED", Event.isPublic.is_(True), Event.endAt >= utcnow())
        .order_by(Event.startAt.asc())
        .all()
    )
    return jsonify({"events": [serialize_event(e) for e in events]})


@bp.get("/history")
def history_events():
    events = (
        SessionLocal.query(Event)
        .filter(Event.isPublic.is_(True), Event.status.in_(PUBLIC_STATUSES), Event.endAt < utcnow())
        .order_by(Event.startAt.desc())
        .all()
    )
    return jsonify({"events": [serialize_event(e) for e in events]})


@bp.get("/<event_id>")
def get_event(event_id):
    e = SessionLocal.query(Event).filter_by(id=event_id).first()
    if e is None or not _is_public_viewable(e):
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    return jsonify({"event": serialize_event(e)})


# ---------- 管理 👑 ----------
@bp.post("")
@admin_required
def create_event():
    data, err = validate(EventCreateIn, request.get_json(silent=True) or {})
    if err:
        return err
    if data.endAt < data.startAt:
        return error_response("INVALID_RANGE", "終了日時は開始日時以降にしてください。", 422)

    event = Event(
        title=data.title,
        description=data.description,
        type=data.type,
        startAt=data.startAt,
        endAt=data.endAt,
        location=data.location,
        capacity=data.capacity,
        status=data.status,
        isPublic=data.isPublic,
        createdById=g.current_user.id,
    )
    SessionLocal.add(event)
    SessionLocal.commit()
    return jsonify({"event": serialize_event(event, include_admin=True)}), 201


@bp.patch("/<event_id>")
@admin_required
def update_event(event_id):
    event = SessionLocal.query(Event).filter_by(id=event_id).first()
    if event is None:
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    data, err = validate(EventUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    fields = data.model_dump(exclude_unset=True)
    for key, value in fields.items():
        setattr(event, key, value)
    if event.endAt < event.startAt:
        return error_response("INVALID_RANGE", "終了日時は開始日時以降にしてください。", 422)
    event.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"event": serialize_event(event, include_admin=True)})


@bp.delete("/<event_id>")
@admin_required
def delete_event(event_id):
    # FK 依存（出欠・アンケート）を壊さないよう、物理削除ではなくアーカイブする（§6 "削除/アーカイブ"）。
    event = SessionLocal.query(Event).filter_by(id=event_id).first()
    if event is None:
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    event.status = "ARCHIVED"
    event.isPublic = False
    event.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"ok": True, "status": event.status})


# ---------- 出欠集計 👑 ----------
@bp.get("/<event_id>/attendance")
@admin_required
def attendance_summary(event_id):
    event = SessionLocal.query(Event).filter_by(id=event_id).first()
    if event is None:
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    atts = SessionLocal.query(Attendance).filter_by(eventId=event_id).all()

    counts = {k: 0 for k in ALLOWED_VALUES["attendance_status"]}
    responses = []
    for a in atts:
        counts[a.status] = counts.get(a.status, 0) + 1
        item = serialize_attendance(a)
        item["user"] = serialize_user(a.user, include_email=False) if a.user else None
        responses.append(item)

    return jsonify(
        {
            "eventId": event_id,
            "total": len(atts),
            "counts": counts,
            "responses": responses,
        }
    )
