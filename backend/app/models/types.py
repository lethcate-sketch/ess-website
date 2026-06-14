"""Prisma スキーマとの相互運用のためのカスタム SQLAlchemy 型・共通ヘルパー。

§3-2 の「Flask は Prisma と同一 DB を読み書き」を成立させるための要。
実測（typeof(created_at)=='integer'）のとおり、Prisma は SQLite に DateTime を
**Unix エポックのミリ秒（整数）** で保存する。SQLAlchemy 既定の DateTime は
文字列前提のため非互換。よって SQLite では整数ms、PostgreSQL ではネイティブ
TIMESTAMP を用いる dialect 対応型を定義する（§9 の本番切替にも追従）。

アプリ内の datetime は常に **aware UTC** で扱う（§3-7: UTC で保存）。
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime
from sqlalchemy.types import TypeDecorator


def gen_uuid() -> str:
    """Prisma の @default(uuid()) 相当（Flask 側 INSERT 用）。"""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Prisma の @default(now()) / @updatedAt 相当。aware UTC。"""
    return datetime.now(timezone.utc)


class PrismaDateTime(TypeDecorator):
    """Prisma 互換の DateTime。

    - SQLite : 整数（エポックms）として保存/読込（Prisma と一致）。
    - その他（PostgreSQL）: ネイティブ TIMESTAMP(timezone=True)。
    値は常に aware UTC datetime として返す。
    """

    impl = DateTime
    cache_ok = True

    def load_dialect_impl(self, dialect):  # DDL/bind の基底型を方言ごとに差し替え
        if dialect.name == "sqlite":
            return dialect.type_descriptor(BigInteger())
        return dialect.type_descriptor(DateTime(timezone=True))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "sqlite":
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                return int(value.timestamp() * 1000)
            if isinstance(value, (int, float)):
                return int(value)
            raise TypeError(f"Unsupported datetime bind value: {value!r}")
        # PostgreSQL 等: aware UTC の datetime を渡す
        if isinstance(value, datetime) and value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc)
        if isinstance(value, str):
            # 念のための文字列フォールバック（CURRENT_TIMESTAMP 等）
            s = value.strip()
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"
            try:
                dt = datetime.fromisoformat(s)
            except ValueError:
                dt = datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        raise TypeError(f"Unsupported stored datetime: {value!r}")
