"""M5 メンバー機能のスモークテスト（ASCII 出力 / cp932 対策）。

members 一覧/詳細 + /me 取得/更新 + 出欠 POST/PATCH + /me/attendance + survey GET/POST。
管理者でログインして検証し、作成データは後始末する。
実行: backend/venv/Scripts/python.exe backend/tests/check_member_flow.py
"""
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402
from app.extensions import SessionLocal  # noqa: E402
from app.models import Attendance, User  # noqa: E402

ADMIN_EMAIL = "lethcate@gmail.com"
ADMIN_PW = "ozawa2718"
EVENT_ID = "00000000-0000-4000-8000-000000000001"


def main() -> int:
    app = create_app()
    c = app.test_client()
    fails: list[str] = []

    def check(name: str, cond: bool):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            fails.append(name)

    access = c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}).get_json()[
        "accessToken"
    ]
    H = {"Authorization": f"Bearer {access}"}

    # --- members ---
    r = c.get("/api/members", headers=H)
    members = (r.get_json() or {}).get("members", [])
    check("members 200", r.status_code == 200)
    check("members includes admin", any(m.get("role") == "ADMIN" for m in members))
    check("members list hides email", all("email" not in m for m in members))
    check("members requires auth (401)", c.get("/api/members").status_code == 401)

    # --- me get/patch ---
    r = c.get("/api/me", headers=H)
    check("me 200 + email present", r.status_code == 200 and r.get_json()["user"]["email"] == ADMIN_EMAIL)
    r = c.patch("/api/me", headers=H, json={"bio": "M5 test bio", "grade": "B3"})
    check("patch me 200 + updated", r.status_code == 200 and r.get_json()["user"]["bio"] == "M5 test bio")
    check("patch me invalid name -> 422", c.patch("/api/me", headers=H, json={"name": ""}).status_code == 422)

    # --- attendance ---
    r = c.post(f"/api/events/{EVENT_ID}/attendance", headers=H, json={"status": "ATTENDING", "comment": "going"})
    check("attendance POST 201 ATTENDING", r.status_code == 201 and r.get_json()["attendance"]["status"] == "ATTENDING")
    r = c.patch(f"/api/events/{EVENT_ID}/attendance", headers=H, json={"status": "ABSENT"})
    check("attendance PATCH 200 ABSENT", r.status_code == 200 and r.get_json()["attendance"]["status"] == "ABSENT")
    check(
        "attendance invalid status -> 422",
        c.post(f"/api/events/{EVENT_ID}/attendance", headers=H, json={"status": "NOPE"}).status_code == 422,
    )
    check(
        "attendance unknown event -> 404",
        c.post("/api/events/nope-id/attendance", headers=H, json={"status": "ATTENDING"}).status_code == 404,
    )

    # --- my attendance history ---
    r = c.get("/api/me/attendance", headers=H)
    items = (r.get_json() or {}).get("attendance", [])
    check(
        "me/attendance includes event with detail",
        r.status_code == 200 and any(i["eventId"] == EVENT_ID and i.get("event") for i in items),
    )

    # --- survey (no questions yet -> empty / 404) ---
    r = c.get(f"/api/events/{EVENT_ID}/survey", headers=H)
    check("survey GET 200 empty list", r.status_code == 200 and r.get_json()["questions"] == [])
    check(
        "survey responses without questions -> 404",
        c.post(
            f"/api/events/{EVENT_ID}/survey/responses",
            headers=H,
            json={"responses": [{"questionId": "x", "answerText": "a"}]},
        ).status_code
        == 404,
    )

    # --- cleanup ---
    u = SessionLocal.query(User).filter_by(email=ADMIN_EMAIL).first()
    SessionLocal.query(Attendance).filter_by(userId=u.id, eventId=EVENT_ID).delete()
    u.bio = None
    u.grade = None
    SessionLocal.commit()
    check(
        "cleanup (attendance removed, profile reset)",
        SessionLocal.query(Attendance).filter_by(userId=u.id, eventId=EVENT_ID).count() == 0,
    )

    print("RESULT " + ("OK" if not fails else f"FAIL {fails}"))
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
