"""Attendance（Prisma: attendances のミラー）。"""
from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class Attendance(Base):
    __tablename__ = "attendances"  # Prisma @@map("attendances")
    # Prisma @@unique([userId, eventId]) に対応
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="attendances_user_id_event_id_key"),
    )

    id = Column("id", String, primary_key=True, default=gen_uuid)
    userId = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    eventId = Column("event_id", String, ForeignKey("events.id"), nullable=False)
    status = Column("status", String, nullable=False, default="UNDECIDED")  # ATTENDING|ABSENT|UNDECIDED|LATE
    comment = Column("comment", String, nullable=True)
    respondedAt = Column("responded_at", PrismaDateTime, nullable=False, default=utcnow)

    user = relationship("User", back_populates="attendances")
    event = relationship("Event", back_populates="attendances")
