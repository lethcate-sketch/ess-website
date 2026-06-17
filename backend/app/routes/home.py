"""トップページの編集可能コンテンツ（/api/home）。

GET   /api/home   🔓 ヒーロー文・フィーチャー・ギャラリーの内容
PATCH /api/home   👑 更新（無ければ作成）。送られたフィールドのみ反映する。
"""
import json

from flask import Blueprint, jsonify, request

from ..extensions import SessionLocal
from ..models import HomeContent
from ..models.types import utcnow
from ..schemas.home import HomeUpdateIn
from ..schemas.serializers import serialize_home_content
from ..utils import validate
from ..utils.auth import admin_required

bp = Blueprint("home", __name__, url_prefix="/api/home")

_TEXT_FIELDS = (
    "heroTitle",
    "heroSubtitle",
    "featureEyebrow",
    "featureTitle",
    "galleryEyebrow",
    "galleryTitle",
)
_JSON_FIELDS = ("featureItems", "galleryItems")  # 配列 -> JSON 文字列で保存


def _get():
    return SessionLocal.query(HomeContent).filter_by(id="default").first()


@bp.get("")
def get_home():
    return jsonify({"home": serialize_home_content(_get())})


@bp.patch("")
@admin_required
def update_home():
    data, err = validate(HomeUpdateIn, request.get_json(silent=True) or {})
    if err:
        return err
    home = _get()
    if home is None:
        home = HomeContent(id="default")
        SessionLocal.add(home)
    fields = data.model_dump(exclude_unset=True)
    for key in _TEXT_FIELDS:
        if key in fields:
            setattr(home, key, fields[key])
    for key in _JSON_FIELDS:
        if key in fields:
            value = fields[key]
            # None は未設定（既定値に戻す）、配列は JSON 文字列で保存
            setattr(home, key, None if value is None else json.dumps(value, ensure_ascii=False))
    home.updatedAt = utcnow()
    SessionLocal.commit()
    return jsonify({"home": serialize_home_content(home)})
