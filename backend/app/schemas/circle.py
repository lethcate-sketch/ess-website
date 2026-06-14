"""サークル紹介（CircleInfo / KeyMember）の入力バリデーション。"""
from pydantic import BaseModel, Field


class CircleInfoUpdateIn(BaseModel):
    about: str | None = Field(default=None, max_length=5000)
    frequency: str | None = Field(default=None, max_length=500)


class KeyMemberIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    avatarUrl: str | None = Field(default=None, max_length=500)
    orderIndex: int = Field(default=0, ge=0)


class KeyMemberUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    role: str | None = Field(default=None, min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    avatarUrl: str | None = Field(default=None, max_length=500)
    orderIndex: int | None = Field(default=None, ge=0)
