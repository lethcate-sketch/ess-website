"""参加アンケート（§6 /api/events/:id/survey）。設問取得・回答送信は 🔑。集計/設問作成は M6 admin。"""
import json

from flask import Blueprint, g, jsonify, request

from ..extensions import SessionLocal
from ..models import Event, EventSurveyQuestion, EventSurveyResponse
from ..schemas.serializers import (
    serialize_survey_question,
    serialize_survey_response,
    serialize_user,
)
from ..schemas.survey import SurveyQuestionIn, SurveyResponsesIn
from ..utils import error_response, validate
from ..utils.auth import admin_required, login_required

bp = Blueprint("survey", __name__, url_prefix="/api")


@bp.get("/events/<event_id>/survey")
@login_required
def get_survey(event_id):
    event = SessionLocal.query(Event).filter_by(id=event_id).first()
    if event is None or event.status == "DRAFT":
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    qs = (
        SessionLocal.query(EventSurveyQuestion)
        .filter_by(eventId=event_id)
        .order_by(EventSurveyQuestion.orderIndex.asc())
        .all()
    )
    return jsonify({"questions": [serialize_survey_question(q) for q in qs]})


@bp.post("/events/<event_id>/survey/responses")
@login_required
def submit_responses(event_id):
    data, err = validate(SurveyResponsesIn, request.get_json(silent=True) or {})
    if err:
        return err

    q_ids = {
        q.id
        for q in SessionLocal.query(EventSurveyQuestion).filter_by(eventId=event_id).all()
    }
    if not q_ids:
        return error_response("NO_SURVEY", "このイベントにはアンケートがありません。", 404)

    saved = []
    for ans in data.responses:
        if ans.questionId not in q_ids:
            return error_response("INVALID_QUESTION", "不正な設問IDが含まれます。", 422)
        choice = ans.answerChoice
        choice_str = (
            json.dumps(choice, ensure_ascii=False)
            if isinstance(choice, (list, dict))
            else choice
        )
        existing = (
            SessionLocal.query(EventSurveyResponse)
            .filter_by(questionId=ans.questionId, userId=g.current_user.id)
            .first()
        )
        if existing is not None:
            existing.answerText = ans.answerText
            existing.answerChoice = choice_str
            saved.append(existing)
        else:
            r = EventSurveyResponse(
                questionId=ans.questionId,
                userId=g.current_user.id,
                answerText=ans.answerText,
                answerChoice=choice_str,
            )
            SessionLocal.add(r)
            saved.append(r)
    SessionLocal.commit()
    return jsonify({"responses": [serialize_survey_response(r) for r in saved]}), 201


# ---------- 管理 👑: 設問作成・回答集計 ----------
@bp.post("/events/<event_id>/survey/questions")
@admin_required
def create_question(event_id):
    event = SessionLocal.query(Event).filter_by(id=event_id).first()
    if event is None:
        return error_response("NOT_FOUND", "イベントが見つかりません。", 404)
    data, err = validate(SurveyQuestionIn, request.get_json(silent=True) or {})
    if err:
        return err
    options_str = json.dumps(data.options, ensure_ascii=False) if data.options else None
    q = EventSurveyQuestion(
        eventId=event_id,
        questionText=data.questionText,
        inputType=data.inputType,
        options=options_str,
        required=data.required,
        orderIndex=data.orderIndex,
    )
    SessionLocal.add(q)
    SessionLocal.commit()
    return jsonify({"question": serialize_survey_question(q)}), 201


@bp.get("/events/<event_id>/survey/responses")
@admin_required
def survey_responses(event_id):
    questions = (
        SessionLocal.query(EventSurveyQuestion)
        .filter_by(eventId=event_id)
        .order_by(EventSurveyQuestion.orderIndex.asc())
        .all()
    )
    qids = [q.id for q in questions]
    rows = (
        SessionLocal.query(EventSurveyResponse)
        .filter(EventSurveyResponse.questionId.in_(qids))
        .all()
        if qids
        else []
    )
    responses = []
    for r in rows:
        item = serialize_survey_response(r)
        item["user"] = serialize_user(r.user, include_email=False) if r.user else None
        responses.append(item)
    return jsonify(
        {
            "questions": [serialize_survey_question(q) for q in questions],
            "responses": responses,
        }
    )
