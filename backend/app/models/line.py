"""LineLinkToken（Prisma: line_link_tokens のミラー）。

LINE 友だち紐付け用の招待コード。メンバーがトークに code を送ると Webhook(Next)が
照合して User.lineUserId を紐付ける。本テーブルへの書き込みは主に管理側（コード発行）で使う。
"""
from sqlalchemy import Column, String

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class LineLinkToken(Base):
    __tablename__ = "line_link_tokens"  # Prisma @@map("line_link_tokens")

    # 属性名は Prisma フィールド（camelCase）、第1引数の列名は @map の snake_case に一致。
    id = Column("id", String, primary_key=True, default=gen_uuid)
    code = Column("code", String, unique=True, nullable=False)
    userId = Column("user_id", String, nullable=True)  # ソフト参照（既存 User.id）。空なら新規作成
    note = Column("note", String, nullable=True)
    expiresAt = Column("expires_at", PrismaDateTime, nullable=True)
    usedAt = Column("used_at", PrismaDateTime, nullable=True)
    usedByLineUserId = Column("used_by_line_user_id", String, nullable=True)
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)
