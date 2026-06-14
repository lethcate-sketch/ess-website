"""公開フォームの入力バリデーション（§6 公開フォーム / §3-3）。"""
from pydantic import BaseModel, Field, field_validator

from .auth import _normalize_email


class ParticipationRequestIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    type: str = "TRIAL"  # TRIAL | JOIN
    message: str | None = Field(default=None, max_length=2000)
    eventId: str | None = None

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return _normalize_email(v)

    @field_validator("type")
    @classmethod
    def _type(cls, v: str) -> str:
        if v not in {"TRIAL", "JOIN"}:
            raise ValueError("type は TRIAL または JOIN を指定してください。")
        return v


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=4000)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return _normalize_email(v)
