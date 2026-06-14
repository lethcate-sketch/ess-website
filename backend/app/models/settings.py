"""SiteSetting（Prisma: site_settings のミラー）。サイト全体のトグル設定（シングルトン）。"""
from sqlalchemy import Boolean, Column, String

from ..extensions import Base
from .types import PrismaDateTime, utcnow


class SiteSetting(Base):
    __tablename__ = "site_settings"  # Prisma @@map("site_settings")

    id = Column("id", String, primary_key=True, default="default")
    registrationEnabled = Column(
        "registration_enabled", Boolean, nullable=False, default=False
    )
    updatedAt = Column(
        "updated_at", PrismaDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )
