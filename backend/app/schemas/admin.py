"""管理者操作の入力バリデーション（§6 👑）。"""
from pydantic import BaseModel, field_validator

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
