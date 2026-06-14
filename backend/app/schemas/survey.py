"""参加アンケートの入力バリデーション（回答=🔑 / 設問作成=👑）。"""
from pydantic import BaseModel, Field, field_validator

from ..utils import ALLOWED_VALUES


class SurveyAnswerIn(BaseModel):
    questionId: str
    answerText: str | None = None
    # 単一選択は文字列、複数選択は配列。DB には JSON 文字列で保存する。
    answerChoice: list[str] | str | None = None


class SurveyResponsesIn(BaseModel):
    responses: list[SurveyAnswerIn] = Field(min_length=1)


class SurveyQuestionIn(BaseModel):
    questionText: str = Field(min_length=1, max_length=500)
    inputType: str = "TEXT"  # TEXT | SINGLE | MULTI | SCALE
    options: list[str] | None = None
    required: bool = False
    orderIndex: int = 0

    @field_validator("inputType")
    @classmethod
    def _input_type(cls, v):
        if v not in ALLOWED_VALUES["survey_input_type"]:
            raise ValueError("inputType が不正です。")
        return v
