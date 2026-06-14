"""共通ユーティリティ: 統一エラーレスポンス・日時シリアライズ・許可値（enum代替）・認可デコレータの土台。

§3-3: SQLite では enum を使わず String + デフォルト値で表現し、許可値はアプリ層で検証する。
その許可値集合をここに集約する。
§6 共通レスポンス規約: エラーは {"error": {"code", "message"}}、422/401/403 を使い分ける。
認可デコレータ（@login_required / @admin_required）は M2 で本実装する。
"""
from datetime import datetime, timezone
from typing import Any

from flask import jsonify

# enum 代替の許可値（§3-3）。バリデーションとドキュメントの単一の出どころ。
ALLOWED_VALUES: dict[str, set[str]] = {
    "user_role": {"MEMBER", "ADMIN"},
    "event_type": {"REGULAR", "SPECIAL", "SOCIAL", "EXTERNAL"},
    "event_status": {"DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"},
    "attendance_status": {"ATTENDING", "ABSENT", "UNDECIDED", "LATE"},
    "survey_input_type": {"TEXT", "SINGLE", "MULTI", "SCALE"},
    "participation_type": {"TRIAL", "JOIN"},
    "participation_status": {"NEW", "CONTACTED", "DONE"},
    "contact_status": {"NEW", "REPLIED", "CLOSED"},
}


def error_response(code: str, message: str, status: int):
    """§6 規約のエラー形に整形して (response, status) を返す。"""
    return jsonify({"error": {"code": code, "message": message}}), status


def iso(dt: datetime | None) -> str | None:
    """datetime を ISO8601 UTC（末尾 Z）に整形。None はそのまま。"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def is_allowed(field: str, value: Any) -> bool:
    """許可値集合に含まれるか（§3-3 アプリ層バリデーション）。"""
    return value in ALLOWED_VALUES.get(field, set())


def validate(schema, data):
    """pydantic スキーマで検証し (obj, None) か (None, 422レスポンス) を返す（§6: 422）。"""
    from pydantic import ValidationError

    try:
        return schema.model_validate(data), None
    except ValidationError as e:
        msg = "; ".join(
            f'{".".join(str(x) for x in err["loc"])}: {err["msg"]}' for err in e.errors()
        )
        return None, error_response("VALIDATION_ERROR", msg, 422)
