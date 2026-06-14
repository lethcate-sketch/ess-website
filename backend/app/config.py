"""開発/本番の設定切替（§9）。

ルートの単一 .env（Prisma / Next.js と共有）を読み込み、Prisma 形式の DATABASE_URL を
SQLAlchemy 用 URI に変換する。provider を postgresql に変えて DATABASE_URL を差し替えるだけで
本番設定に追従できる（§12）。
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# backend/app/config.py -> parents[2] がリポジトリルート
BASE_DIR = Path(__file__).resolve().parents[2]

# ルートの .env を読み込む（§9: 単一ファイルを 3 スタックで共有）
load_dotenv(BASE_DIR / ".env")


def _resolve_database_uri() -> str:
    """Prisma 形式 DATABASE_URL を SQLAlchemy URI に変換する。

    - ``file:./dev.db`` -> ``sqlite:///<repo>/prisma/dev.db``
      （Prisma は file: パスを schema.prisma のあるディレクトリ基準で解決するため prisma/ を起点にする）
    - ``postgresql://…`` -> そのまま（本番。SQLAlchemy 2.0 は postgresql:// を psycopg2 で解決）
    """
    url = os.environ.get("DATABASE_URL", "file:./dev.db")
    if url.startswith("file:"):
        rel = url[len("file:") :]
        db_path = (BASE_DIR / "prisma" / rel).resolve()
        return f"sqlite:///{db_path.as_posix()}"
    return url


class Config:
    # JWT（§3-4 / §9）— Flask が署名・検証し、Next.js middleware も同じ秘密で検証する
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET", "change-me")
    SECRET_KEY = JWT_SECRET_KEY
    JWT_ACCESS_EXPIRES_MIN = int(os.environ.get("JWT_ACCESS_EXPIRES_MIN", "15"))
    JWT_REFRESH_EXPIRES_DAYS = int(os.environ.get("JWT_REFRESH_EXPIRES_DAYS", "14"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=JWT_ACCESS_EXPIRES_MIN)
    JWT_TOKEN_LOCATION = ["headers"]  # BFF が Authorization: Bearer で中継（§3-4）

    # DB（Prisma と同一 DB を参照 / §3-2）
    SQLALCHEMY_DATABASE_URI = _resolve_database_uri()

    NEXT_PUBLIC_SITE_URL = os.environ.get("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    FLASK_API_BASE_URL = os.environ.get("FLASK_API_BASE_URL", "http://localhost:5000")
