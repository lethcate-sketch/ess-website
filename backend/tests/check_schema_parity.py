"""Prisma が作成した実DBのテーブル/列名と SQLAlchemy モデルの宣言が一致するか検証する。

§12 受け入れ基準: 「Flask の SQLAlchemy モデルのテーブル/列名が Prisma の @@map/@map と一致している」。
スタンドアロン実行: backend/venv/Scripts/python.exe backend/tests/check_schema_parity.py
（M7 で pytest 化する。）

注: Windows コンソール(cp932)対策として stdout を UTF-8 に再構成し、print は ASCII に統一する。
"""
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, inspect  # noqa: E402

from app import create_app  # noqa: E402  モデル import & マッパー構成のため
from app.config import Config  # noqa: E402
from app.extensions import Base  # noqa: E402


def main() -> int:
    create_app()  # Base.metadata にモデルを登録
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
    insp = inspect(engine)
    db_tables = set(insp.get_table_names())

    problems: list[str] = []
    for table_name, table in sorted(Base.metadata.tables.items()):
        if table_name not in db_tables:
            problems.append(f"[table missing in DB] {table_name}")
            continue
        db_cols = {c["name"] for c in insp.get_columns(table_name)}
        model_cols = {c.name for c in table.columns}
        missing = model_cols - db_cols
        extra = db_cols - model_cols
        if missing:
            problems.append(f"[{table_name}] model cols not in DB: {sorted(missing)}")
        if extra:
            problems.append(f"[{table_name}] DB cols not in model: {sorted(extra)}")

    print(f"DB tables    : {sorted(db_tables)}")
    print(f"Model tables : {sorted(Base.metadata.tables.keys())}")
    if problems:
        print("PARITY: FAIL")
        for p in problems:
            print("  -", p)
        return 1
    print("PARITY: OK - all model table/column names match the live DB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
