"""出欠の入力バリデーション。"""
from pydantic import BaseModel, Field, field_validator

from ..utils import ALLOWED_VALUES


class AttendanceIn(BaseModel):
    status: str | None = None  # ATTENDING | ABSENT | UNDECIDED | LATE
    comment: str | None = Field(default=None, max_length=1000)

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v is not None and v not in ALLOWED_VALUES["attendance_status"]:
            raise ValueError("status は ATTENDING/ABSENT/UNDECIDED/LATE のいずれか。")
        return v
