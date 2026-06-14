"""メンバー/マイページの入力バリデーション。"""
from pydantic import BaseModel, Field


class MeUpdateIn(BaseModel):
    """PATCH /api/me。送られたフィールドのみ更新（model_dump(exclude_unset=True)）。
    email/role/isActive 等の機微な項目はここでは変更不可。"""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    nameKana: str | None = Field(default=None, max_length=100)
    grade: str | None = Field(default=None, max_length=50)
    department: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    avatarUrl: str | None = Field(default=None, max_length=500)
