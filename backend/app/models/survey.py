"""EventSurveyQuestion / EventSurveyResponse（Prisma: event_survey_questions / _responses のミラー）。"""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..extensions import Base
from .types import PrismaDateTime, gen_uuid, utcnow


class EventSurveyQuestion(Base):
    __tablename__ = "event_survey_questions"  # Prisma @@map("event_survey_questions")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    eventId = Column("event_id", String, ForeignKey("events.id"), nullable=False)
    questionText = Column("question_text", String, nullable=False)
    inputType = Column("input_type", String, nullable=False, default="TEXT")  # TEXT|SINGLE|MULTI|SCALE
    options = Column("options", String, nullable=True)  # JSON文字列で選択肢を保持
    required = Column("required", Boolean, nullable=False, default=False)
    orderIndex = Column("order_index", Integer, nullable=False, default=0)

    event = relationship("Event", back_populates="surveyQuestions")
    responses = relationship("EventSurveyResponse", back_populates="question")


class EventSurveyResponse(Base):
    __tablename__ = "event_survey_responses"  # Prisma @@map("event_survey_responses")

    id = Column("id", String, primary_key=True, default=gen_uuid)
    questionId = Column("question_id", String, ForeignKey("event_survey_questions.id"), nullable=False)
    userId = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    answerText = Column("answer_text", String, nullable=True)
    answerChoice = Column("answer_choice", String, nullable=True)  # JSON文字列で複数選択対応
    createdAt = Column("created_at", PrismaDateTime, nullable=False, default=utcnow)

    question = relationship("EventSurveyQuestion", back_populates="responses")
    user = relationship("User", back_populates="surveyResponses")
