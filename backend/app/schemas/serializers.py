"""出力シリアライザ（DBモデル -> JSON 可能な dict）。

日時は iso()（ISO8601 UTC, 末尾 Z）に整形。passwordHash 等の機密は決して含めない。
"""
import json

from ..utils import iso


def _parse_json(raw: str | None):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return raw


def serialize_user(u, *, include_email: bool = True) -> dict:
    data = {
        "id": u.id,
        "name": u.name,
        "nameKana": u.nameKana,
        "role": u.role,
        "grade": u.grade,
        "department": u.department,
        "bio": u.bio,
        "avatarUrl": u.avatarUrl,
        "isActive": u.isActive,
        "joinedAt": iso(u.joinedAt),
        "createdAt": iso(u.createdAt),
        "updatedAt": iso(u.updatedAt),
    }
    if include_email:
        data["email"] = u.email
    return data


def serialize_event(e, *, include_admin: bool = False) -> dict:
    data = {
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "type": e.type,
        "startAt": iso(e.startAt),
        "endAt": iso(e.endAt),
        "location": e.location,
        "capacity": e.capacity,
        "status": e.status,
        "isPublic": e.isPublic,
        "createdAt": iso(e.createdAt),
        "updatedAt": iso(e.updatedAt),
    }
    if include_admin:
        data["createdById"] = e.createdById
    return data


def serialize_attendance(a, *, with_event: bool = False) -> dict:
    data = {
        "id": a.id,
        "eventId": a.eventId,
        "userId": a.userId,
        "status": a.status,
        "comment": a.comment,
        "respondedAt": iso(a.respondedAt),
    }
    if with_event and a.event is not None:
        data["event"] = serialize_event(a.event)
    return data


def serialize_survey_question(q) -> dict:
    return {
        "id": q.id,
        "eventId": q.eventId,
        "questionText": q.questionText,
        "inputType": q.inputType,
        "options": _parse_json(q.options),
        "required": q.required,
        "orderIndex": q.orderIndex,
    }


def serialize_survey_response(r) -> dict:
    return {
        "id": r.id,
        "questionId": r.questionId,
        "userId": r.userId,
        "answerText": r.answerText,
        "answerChoice": _parse_json(r.answerChoice),
        "createdAt": iso(r.createdAt),
    }


def serialize_participation_request(p) -> dict:
    return {
        "id": p.id,
        "eventId": p.eventId,
        "name": p.name,
        "email": p.email,
        "type": p.type,
        "message": p.message,
        "status": p.status,
        "createdAt": iso(p.createdAt),
    }


def serialize_contact(c) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "subject": c.subject,
        "message": c.message,
        "status": c.status,
        "createdAt": iso(c.createdAt),
    }


def serialize_circle_info(c) -> dict | None:
    if c is None:
        return None
    return {
        "id": c.id,
        "about": c.about,
        "frequency": c.frequency,
        "updatedAt": iso(c.updatedAt),
    }


def serialize_home_content(h) -> dict | None:
    if h is None:
        return None
    return {
        "id": h.id,
        "heroTitle": h.heroTitle,
        "heroSubtitle": h.heroSubtitle,
        "featureEyebrow": h.featureEyebrow,
        "featureTitle": h.featureTitle,
        "featureItems": _parse_json(h.featureItems) or [],
        "galleryEyebrow": h.galleryEyebrow,
        "galleryTitle": h.galleryTitle,
        "galleryItems": _parse_json(h.galleryItems) or [],
        "updatedAt": iso(h.updatedAt),
    }


def serialize_key_member(m) -> dict:
    return {
        "id": m.id,
        "name": m.name,
        "role": m.role,
        "bio": m.bio,
        "avatarUrl": m.avatarUrl,
        "userId": m.userId,
        "orderIndex": m.orderIndex,
        "createdAt": iso(m.createdAt),
        "updatedAt": iso(m.updatedAt),
    }


def serialize_site_setting(s) -> dict:
    if s is None:
        return {"registrationEnabled": False, "updatedAt": None}
    return {"registrationEnabled": s.registrationEnabled, "updatedAt": iso(s.updatedAt)}


def serialize_line_link_token(t, *, target_name: str | None = None) -> dict:
    return {
        "id": t.id,
        "code": t.code,
        "userId": t.userId,
        "targetName": target_name,  # userId に対応するメンバー名（汎用コードは None）
        "note": t.note,
        "expiresAt": iso(t.expiresAt),
        "usedAt": iso(t.usedAt),
        "usedByLineUserId": t.usedByLineUserId,
        "createdAt": iso(t.createdAt),
    }
