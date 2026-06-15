"""SiteImage（Prisma: site_images のミラー）。管理画面から差し替え可能なサイト画像。"""
from sqlalchemy import Column, String

from ..extensions import Base
from .types import PrismaDateTime, utcnow


class SiteImage(Base):
    __tablename__ = "site_images"  # Prisma @@map("site_images")

    key = Column("key", String, primary_key=True)
    url = Column("url", String, nullable=False)
    updatedAt = Column(
        "updated_at", PrismaDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )
