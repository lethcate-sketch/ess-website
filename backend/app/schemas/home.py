"""トップページ編集の入力バリデーション（§6 👑 PATCH /api/home）。"""
from pydantic import BaseModel, Field


class FeatureItemIn(BaseModel):
    # id から画像キー "feature-<id>" を作るため、許可文字を制限する
    id: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(default="", max_length=600)


class GalleryItemIn(BaseModel):
    id: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    label: str = Field(min_length=1, max_length=60)


class HomeUpdateIn(BaseModel):
    """PATCH /api/home。送られたフィールドのみ更新（exclude_unset）。"""

    heroTitle: str | None = Field(default=None, min_length=1, max_length=120)
    heroSubtitle: str | None = Field(default=None, max_length=600)
    featureEyebrow: str | None = Field(default=None, max_length=60)
    featureTitle: str | None = Field(default=None, min_length=1, max_length=120)
    featureItems: list[FeatureItemIn] | None = Field(default=None, max_length=12)
    galleryEyebrow: str | None = Field(default=None, max_length=60)
    galleryTitle: str | None = Field(default=None, min_length=1, max_length=120)
    galleryItems: list[GalleryItemIn] | None = Field(default=None, max_length=12)
