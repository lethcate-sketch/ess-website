"""認証系の入力バリデーション（pydantic v2 / §3-3 アプリ層バリデーション）。

email-validator への依存を避けるため EmailStr は使わず、軽量な形式チェックに留める。
"""
from pydantic import BaseModel, Field, field_validator


def _normalize_email(v: str) -> str:
    v = (v or "").strip().lower()
    if "@" not in v or "." not in v.rsplit("@", 1)[-1]:
        raise ValueError("メールアドレスの形式が正しくありません。")
    return v


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=72)  # bcrypt は 72バイトまで
    name: str = Field(min_length=1, max_length=100)
    nameKana: str | None = Field(default=None, max_length=100)
    grade: str | None = Field(default=None, max_length=50)
    department: str | None = Field(default=None, max_length=100)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return _normalize_email(v)


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return _normalize_email(v)
