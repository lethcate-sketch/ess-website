"""SQLAlchemy モデル（Prisma スキーマのミラー / §3-2）。

すべてのモデルをここで import し、マッパー（リレーション）が解決されるようにする。
テーブル名は Prisma の @@map、列名は @map（snake_case）に一致。属性名は Prisma フィールド（camelCase）。
"""
from ..extensions import Base
from .attendance import Attendance
from .circle import CircleInfo, KeyMember
from .event import Event
from .form import ContactInquiry, ParticipationRequest
from .settings import SiteSetting
from .survey import EventSurveyQuestion, EventSurveyResponse
from .user import RefreshToken, User

__all__ = [
    "Base",
    "User",
    "RefreshToken",
    "Event",
    "Attendance",
    "EventSurveyQuestion",
    "EventSurveyResponse",
    "ParticipationRequest",
    "ContactInquiry",
    "CircleInfo",
    "KeyMember",
    "SiteSetting",
]
