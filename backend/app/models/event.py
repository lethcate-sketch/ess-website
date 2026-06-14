"""Event（Prisma: events のミラー）。"""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class Event(Base):
    __tablename__ = "events"  # Prisma @@map("events")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    title = Column("title", String, nullable=False)
    description = Column("description", String, nullable=True)
    type = Column("type", String, nullable=False, default="REGULAR")  # REGULAR|SPECIAL|SOCIAL|EXTERNAL
    startAt = Column("start_at", PrismaDateTime, nullable=False)
    endAt = Column("end_at", PrismaDateTime, nullable=False)
    location = Column("location", String, nullable=True)
    capacity = Column("capacity", Integer, nullable=True)
    status = Column("status", String, nullable=False, default="DRAFT")  # DRAFT|PUBLISHED|CLOSED|ARCHIVED
    isPublic = Column("is_public", Boolean, nullable=False, default=True)
    createdById = Column("created_by_id", String, ForeignKey("users.id"), nullable=False)
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)
    updatedAt = Column(
        "updated_at", PrismaDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    createdBy = relationship("User", back_populates="createdEvents")
    attendances = relationship("Attendance", back_populates="event")
    surveyQuestions = relationship("EventSurveyQuestion", back_populates="event")
    participationRequests = relationship("ParticipationRequest", back_populates="event")
