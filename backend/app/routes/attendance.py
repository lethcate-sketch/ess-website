"""出欠登録/更新（§6 /api/events/:id/attendance）。POST/PATCH は 🔑。集計 GET は M6 admin。"""
from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import Attendance, Event
from ..models.types import utcnow
from ..schemas.attendance import AttendanceIn
from ..schemas.serializers import serialize_attendance
from ..utils import error_response, validate
from ..utils.auth import login_required

bp = Blueprint("attendance", __name__, url_prefix="/api")


def _viewable_event(event_id):
    e = SessionLocal.query(Event).filter_by(id=event_id).first()
    if e is None or e.status == "DRAFT":
        return None
    return e


@bp.post("/events/<event_id>/attendance")
@login_required
def register_attendance(event_id):
    if _viewable_event(event_id) is None:
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    data, err = validate(AttendanceIn, request.get_json(silent=True) or {})
    if err:
        return err

    att = (
        SessionLocal.query(Attendance)
        .filter_by(userId=g.current_user.id, eventId=event_id)
        .first()
    )
    if att is None:
        att = Attendance(
            userId=g.current_user.id,
            eventId=event_id,
            status=data.status or "UNDECIDED",
            comment=data.comment,
            respondedAt=utcnow(),
        )
        SessionLocal.add(att)
    else:
        if data.status is not None:
            att.status = data.status
        att.comment = data.comment
        att.respondedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"attendance": serialize_attendance(att)}), 201


@bp.patch("/events/<event_id>/attendance")
@login_required
def update_attendance(event_id):
    att = (
        SessionLocal.query(Attendance)
        .filter_by(userId=g.current_user.id, eventId=event_id)
        .first()
    )
    if att is None:
        return error_response("NOT_FOUND", "出欠が未登録です。先に登録してください。", 404)
    data, err = validate(AttendanceIn, request.get_json(silent=True) or {})
    if err:
        return err
    fields = data.model_dump(exclude_unset=True)
    if fields.get("status") is not None:
        att.status = fields["status"]
    if "comment" in fields:
        att.comment = fields["comment"]
    att.respondedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"attendance": serialize_attendance(att)})
