"""ParticipationRequest / ContactInquiry（Prisma: participation_requests / contact_inquiries のミラー）。"""
from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class ParticipationRequest(Base):
    __tablename__ = "participation_requests"  # Prisma @@map("participation_requests")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    eventId = Column("event_id", String, ForeignKey("events.id"), nullable=True)
    name = Column("name", String, nullable=False)
    email = Column("email", String, nullable=False)
    type = Column("type", String, nullable=False, default="TRIAL")  # TRIAL | JOIN
    message = Column("message", String, nullable=True)
    status = Column("status", String, nullable=False, default="NEW")  # NEW | CONTACTED | DONE
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)

    event = relationship("Event", back_populates="participationRequests")


class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"  # Prisma @@map("contact_inquiries")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    name = Column("name", String, nullable=False)
    email = Column("email", String, nullable=False)
    subject = Column("subject", String, nullable=False)
    message = Column("message", String, nullable=False)
    status = Column("status", String, nullable=False, default="NEW")  # NEW | REPLIED | CLOSED
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)
