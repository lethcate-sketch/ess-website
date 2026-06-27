"""管理者操作の入力バリデーション（§6 👑）。"""
from pydantic import BaseModel, Field, field_validator, model_validator

from ..utils import ALLOWED_VALUES


class RoleUpdateIn(BaseModel):
    role: str  # MEMBER | ADMIN

    @field_validator("role")
    @classmethod
    def _role(cls, v):
        if v not in ALLOWED_VALUES["user_role"]:
            raise ValueError("role は MEMBER または ADMIN。")
        return v


class StatusUpdateIn(BaseModel):
    isActive: bool


class RequestStatusIn(BaseModel):
    status: str  # NEW | CONTACTED | DONE

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v not in ALLOWED_VALUES["participation_status"]:
            raise ValueError("status が不正です。")
        return v


class ContactStatusIn(BaseModel):
    status: str  # NEW | REPLIED | CLOSED

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v not in ALLOWED_VALUES["contact_status"]:
            raise ValueError("status が不正です。")
        return v


class SettingsUpdateIn(BaseModel):
    registrationEnabled: bool | None = None


class ImageUpdateIn(BaseModel):
    # ローカルパス / 外部URL / data URL（アップロード時）のいずれか。
    # data URL を許容するため上限は大きめ（約6MB）。
    url: str = Field(min_length=1, max_length=6_000_000)


class LineTokenCreateIn(BaseModel):
    """LINE 招待コード発行。generic=汎用コードを count 個 / member=指定メンバー専用に1個。"""

    kind: str = "generic"  # generic | member
    count: int = Field(default=1, ge=1, le=100)
    userId: str | None = None
    note: str | None = Field(default=None, max_length=200)
    expiresInDays: int | None = Field(default=None, ge=1, le=365)

    @field_validator("kind")
    @classmethod
    def _kind(cls, v):
        if v not in {"generic", "member"}:
            raise ValueError("kind は generic または member。")
        return v

    @model_validator(mode="after")
    def _require_user_for_member(self):
        if self.kind == "member" and not self.userId:
            raise ValueError("kind=member には userId が必要です。")
        return self
