"""CircleInfo / KeyMember（Prisma: circle_info / key_members のミラー）。

CircleInfo は活動内容・活動頻度を保持するシングルトン（id='default'）。
KeyMember は主要メンバー紹介（自由入力。管理画面から CRUD）。
"""
from sqlalchemy import Column, Integer, String

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class CircleInfo(Base):
    __tablename__ = "circle_info"  # Prisma @@map("circle_info")

    id = Column("id", String, primary_key=True, default="default")
    about = Column("about", String, nullable=False)
    frequency = Column("frequency", String, nullable=False)
    updatedAt = Column(
        "updated_at", PrismaDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )


class KeyMember(Base):
    __tablename__ = "key_members"  # Prisma @@map("key_members")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    name = Column("name", String, nullable=False)
    role = Column("role", String, nullable=False)  # サークルリーダー | 副リーダー 等（自由文字列）
    bio = Column("bio", String, nullable=True)
    avatarUrl = Column("avatar_url", String, nullable=True)
    userId = Column("user_id", String, nullable=True)  # 紐づく登録メンバー(User.id)。任意
    orderIndex = Column("order_index", Integer, nullable=False, default=0)
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)
    updatedAt = Column(
        "updated_at", PrismaDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )
