"""イベント作成/編集の入力バリデーション（§6 👑）。"""
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..utils import ALLOWED_VALUES


class EventCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    type: str = "REGULAR"
    startAt: datetime
    endAt: datetime
    location: str | None = Field(default=None, max_length=200)
    capacity: int | None = Field(default=None, ge=0, le=100000)
    status: str = "DRAFT"
    isPublic: bool = True

    @field_validator("type")
    @classmethod
    def _type(cls, v):
        if v not in ALLOWED_VALUES["event_type"]:
            raise ValueError("type が不正です。")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v not in ALLOWED_VALUES["event_status"]:
            raise ValueError("status が不正です。")
        return v


class EventUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    type: str | None = None
    startAt: datetime | None = None
    endAt: datetime | None = None
    location: str | None = Field(default=None, max_length=200)
    capacity: int | None = Field(default=None, ge=0, le=100000)
    status: str | None = None
    isPublic: bool | None = None

    @field_validator("type")
    @classmethod
    def _type(cls, v):
        if v is not None and v not in ALLOWED_VALUES["event_type"]:
            raise ValueError("type が不正です。")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v is not None and v not in ALLOWED_VALUES["event_status"]:
            raise ValueError("status が不正です。")
        return v
