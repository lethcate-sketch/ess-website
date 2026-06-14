"""M6 管理機能のスモークテスト（ASCII 出力 / cp932 対策）。

検証: §12-3（一般ユーザー -> 管理API -> 403）/ §12-6（イベント作成 -> 公開反映 ->
メンバー出欠 -> 管理集計）/ ダッシュボード統計 / メンバー権限・在籍管理 /
申込・問い合わせ対応 / アンケート設問作成・回答・集計。
作成データはすべて後始末する。
実行: backend/venv/Scripts/python.exe backend/tests/check_admin_flow.py
"""
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402
from app.extensions import SessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    Attendance,
    ContactInquiry,
    Event,
    EventSurveyQuestion,
    EventSurveyResponse,
    ParticipationRequest,
    RefreshToken,
    SiteSetting,
    User,
)

ADMIN_EMAIL = "lethcate@gmail.com"
ADMIN_PW = "ozawa2718"
PR_EMAIL = "m6pr@example.com"
CT_EMAIL = "m6ct@example.com"


def main() -> int:
    app = create_app()
    c = app.test_client()
    # 新規登録 API を使う検証のため受付を一時的に ON（既定は OFF）
    _ss = SessionLocal.query(SiteSetting).filter_by(id="default").first()
    if _ss is not None:
        _ss.registrationEnabled = True
        SessionLocal.commit()
    fails: list[str] = []

    def check(name, cond):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            fails.append(name)

    now = datetime.now(timezone.utc)
    start = (now + timedelta(days=3)).isoformat()
    end = (now + timedelta(days=3, hours=2)).isoformat()
    past = (now - timedelta(days=1)).isoformat()

    admin_access = c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}).get_json()[
        "accessToken"
    ]
    AH = {"Authorization": f"Bearer {admin_access}"}

    member_email = f"m6_{uuid.uuid4().hex[:8]}@example.com"
    reg = c.post("/api/auth/register", json={"email": member_email, "password": "member12345", "name": "M6 Member"})
    member_access = reg.get_json()["accessToken"]
    member_id = reg.get_json()["user"]["id"]
    MH = {"Authorization": f"Bearer {member_access}"}

    # --- §12-3: member -> admin API -> 403 ---
    check("member -> /admin/dashboard 403", c.get("/api/admin/dashboard", headers=MH).status_code == 403)
    check("member -> create event 403", c.post("/api/events", headers=MH, json={"title": "x", "startAt": start, "endAt": end}).status_code == 403)
    check("no-auth -> /admin/dashboard 401", c.get("/api/admin/dashboard").status_code == 401)

    # --- §12-6: admin creates PUBLISHED event ---
    ev = c.post(
        "/api/events",
        headers=AH,
        json={"title": "M6 Event", "type": "REGULAR", "startAt": start, "endAt": end,
              "status": "PUBLISHED", "isPublic": True, "location": "Room A", "capacity": 20},
    )
    check("admin create event 201", ev.status_code == 201)
    event_id = ev.get_json()["event"]["id"]

    up = c.get("/api/events/upcoming")
    check("event appears in public upcoming", any(e["id"] == event_id for e in up.get_json()["events"]))
    check("event invalid range -> 422", c.post("/api/events", headers=AH, json={"title": "x", "startAt": start, "endAt": past}).status_code == 422)

    att = c.post(f"/api/events/{event_id}/attendance", headers=MH, json={"status": "ATTENDING"})
    check("member attendance 201", att.status_code == 201)

    agg = c.get(f"/api/events/{event_id}/attendance", headers=AH)
    aj = agg.get_json()
    check("admin attendance summary (ATTENDING=1)", agg.status_code == 200 and aj["counts"]["ATTENDING"] == 1 and aj["total"] == 1)
    check("member cannot see aggregation 403", c.get(f"/api/events/{event_id}/attendance", headers=MH).status_code == 403)

    pa = c.patch(f"/api/events/{event_id}", headers=AH, json={"location": "Room B"})
    check("admin patch event", pa.status_code == 200 and pa.get_json()["event"]["location"] == "Room B")

    # --- dashboard ---
    db = c.get("/api/admin/dashboard", headers=AH).get_json()
    check("dashboard members >= 2", db["members"] >= 2)
    check("dashboard attendanceRate present", db["attendanceRate"] is not None)
    check("dashboard publishedEvents >= 1", db["publishedEvents"] >= 1)

    # --- participation / contact admin ---
    c.post("/api/participation-requests", json={"name": "PR", "email": PR_EMAIL, "type": "TRIAL"})
    prl = c.get("/api/participation-requests", headers=AH).get_json()["requests"]
    pr_row = next((r for r in prl if r["email"] == PR_EMAIL), None)
    check("admin participation list has row", pr_row is not None)
    prp = c.patch(f"/api/participation-requests/{pr_row['id']}", headers=AH, json={"status": "DONE"})
    check("participation status -> DONE", prp.status_code == 200 and prp.get_json()["request"]["status"] == "DONE")
    check("member cannot list participation 403", c.get("/api/participation-requests", headers=MH).status_code == 403)

    c.post("/api/contact", json={"name": "CT", "email": CT_EMAIL, "subject": "s", "message": "m"})
    ctl = c.get("/api/contact", headers=AH).get_json()["contacts"]
    check("admin contact list has row", any(x["email"] == CT_EMAIL for x in ctl))

    # --- survey: create question -> member answers -> admin aggregates ---
    q = c.post(f"/api/events/{event_id}/survey/questions", headers=AH, json={"questionText": "Why join?", "inputType": "TEXT", "required": True})
    check("admin create question 201", q.status_code == 201)
    q_id = q.get_json()["question"]["id"]
    sv = c.get(f"/api/events/{event_id}/survey", headers=MH).get_json()["questions"]
    check("member sees survey question", any(x["id"] == q_id for x in sv))
    resp = c.post(f"/api/events/{event_id}/survey/responses", headers=MH, json={"responses": [{"questionId": q_id, "answerText": "For practice"}]})
    check("member submit response 201", resp.status_code == 201)
    sr = c.get(f"/api/events/{event_id}/survey/responses", headers=AH).get_json()
    check("admin sees survey responses", len(sr["responses"]) >= 1 and sr["responses"][0].get("user") is not None)

    # --- members management (do disabling last) ---
    am = c.get("/api/admin/members", headers=AH).get_json()["members"]
    check("admin members list shows email", any("email" in m for m in am))
    rc = c.patch(f"/api/admin/members/{member_id}/role", headers=AH, json={"role": "ADMIN"})
    check("role -> ADMIN", rc.status_code == 200 and rc.get_json()["member"]["role"] == "ADMIN")
    c.patch(f"/api/admin/members/{member_id}/role", headers=AH, json={"role": "MEMBER"})
    sc = c.patch(f"/api/admin/members/{member_id}/status", headers=AH, json={"isActive": False})
    check("status -> disabled", sc.status_code == 200 and sc.get_json()["member"]["isActive"] is False)

    # --- cleanup (FK-safe order) ---
    s = SessionLocal
    qids = [x.id for x in s.query(EventSurveyQuestion).filter_by(eventId=event_id).all()]
    if qids:
        s.query(EventSurveyResponse).filter(EventSurveyResponse.questionId.in_(qids)).delete(synchronize_session=False)
    s.query(EventSurveyResponse).filter_by(userId=member_id).delete(synchronize_session=False)
    s.query(EventSurveyQuestion).filter_by(eventId=event_id).delete(synchronize_session=False)
    s.query(Attendance).filter_by(eventId=event_id).delete(synchronize_session=False)
    s.query(Attendance).filter_by(userId=member_id).delete(synchronize_session=False)
    s.query(ParticipationRequest).filter_by(email=PR_EMAIL).delete(synchronize_session=False)
    s.query(ContactInquiry).filter_by(email=CT_EMAIL).delete(synchronize_session=False)
    s.query(Event).filter_by(id=event_id).delete(synchronize_session=False)
    s.query(RefreshToken).filter_by(userId=member_id).delete(synchronize_session=False)
    s.query(User).filter_by(id=member_id).delete(synchronize_session=False)
    s.commit()
    check(
        "cleanup complete",
        s.query(Event).filter_by(id=event_id).first() is None
        and s.query(User).filter_by(id=member_id).first() is None,
    )

    print("RESULT " + ("OK" if not fails else f"FAIL {fails}"))
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
