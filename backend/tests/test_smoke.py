"""最低限のテスト（pytest）。重い統合確認は check_*.py スクリプトを参照。"""
from datetime import datetime, timezone

from sqlalchemy import create_engine, inspect

from app.config import Config
from app.extensions import Base
from app.utils import ALLOWED_VALUES, iso


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_me_requires_auth(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401
    assert "error" in r.get_json()


def test_public_events_list(client):
    r = client.get("/api/events")
    assert r.status_code == 200
    assert "events" in r.get_json()


def test_unknown_route_returns_json_envelope(client):
    r = client.get("/api/does-not-exist")
    assert r.status_code == 404
    assert "error" in r.get_json()  # §6 形式（HTML でない）


def test_allowed_values():
    assert ALLOWED_VALUES["user_role"] == {"MEMBER", "ADMIN"}
    assert "PUBLISHED" in ALLOWED_VALUES["event_status"]


def test_iso_formats_utc_z():
    assert iso(datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)) == "2026-01-02T03:04:05Z"


def test_schema_parity(app):
    """SQLAlchemy モデルのテーブル/列名が実DBと一致（§12-⑧）。"""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
    insp = inspect(engine)
    db_tables = set(insp.get_table_names())
    for table_name, table in Base.metadata.tables.items():
        assert table_name in db_tables, f"missing table: {table_name}"
        db_cols = {c["name"] for c in insp.get_columns(table_name)}
        model_cols = {c.name for c in table.columns}
        assert model_cols == db_cols, f"column mismatch in {table_name}: {model_cols ^ db_cols}"
