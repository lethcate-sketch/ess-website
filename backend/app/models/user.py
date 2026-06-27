"""User / RefreshToken（Prisma: users / refresh_tokens のミラー）。"""
from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class User(Base):
    __tablename__ = "users"  # Prisma @@map("users")

    # 属性名は Prisma フィールド（camelCase）、第1引数の列名は @map の snake_case に一致させる。
    id = Column("id", String, primary_key=True, default=gen_uuid)
    email = Column("email", String, unique=True, nullable=False)
    passwordHash = Column("password_hash", String, nullable=False)
    name = Column("name", String, nullable=False)
    nameKana = Column("name_kana", String, nullable=True)
    role = Column("role", String, nullable=False, default="MEMBER")  # MEMBER | ADMIN
    # LINE userId（友だち紐付け用）。未連携は null・連携済みは一意。Prisma @map("line_user_id")
    lineUserId = Column("line_user_id", String, unique=True, nullable=True)
    grade = Column("grade", String, nullable=True)
    department = Column("department", String, nullable=True)
    bio = Column("bio", String, nullable=True)
    avatarUrl = Column("avatar_url", String, nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)
    joinedAt = Column("joined_at", PrismaDateTime, nullable=False, default=utcnow)
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)
    updatedAt = Column(
        "updated_at", PrismaDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    attendances = relationship("Attendance", back_populates="user")
    surveyResponses = relationship("EventSurveyResponse", back_populates="user")
    createdEvents = relationship("Event", back_populates="createdBy")
    refreshTokens = relationship("RefreshToken", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"  # Prisma @@map("refresh_tokens")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    userId = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    tokenHash = Column("token_hash", String, unique=True, nullable=False)
    expiresAt = Column("expires_at", PrismaDateTime, nullable=False)
    revoked = Column("revoked", Boolean, nullable=False, default=False)
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)

    user = relationship("User", back_populates="refreshTokens")
