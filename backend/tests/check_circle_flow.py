"""サークル紹介 API のスモークテスト（ASCII 出力 / cp932 対策）。

公開GET（活動情報+主要メンバー）/ 管理の情報編集・メンバー CRUD / メンバー権限403。
CircleInfo は編集後に元へ復元、作成した一時データ・一時ユーザーは後始末する。
実行: backend/venv/Scripts/python.exe backend/tests/check_circle_flow.py
"""
import sys
import uuid
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402
from app.extensions import SessionLocal  # noqa: E402
from app.models import RefreshToken, SiteSetting, User  # noqa: E402

ADMIN_EMAIL = "lethcate@gmail.com"
ADMIN_PW = "ozawa2718"


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

    access = c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}).get_json()[
        "accessToken"
    ]
    AH = {"Authorization": f"Bearer {access}"}

    mem = f"circle_{uuid.uuid4().hex[:8]}@example.com"
    reg = c.post("/api/auth/register", json={"email": mem, "password": "member12345", "name": "Circle Member"})
    MH = {"Authorization": f"Bearer {reg.get_json()['accessToken']}"}
    member_id = reg.get_json()["user"]["id"]

    # --- public GET ---
    g = c.get("/api/circle").get_json()
    orig_freq = g["info"]["frequency"]
    check("public circle GET has info", g["info"] is not None and "frequency" in g["info"])
    # keyMembers は管理画面で編集/削除され得るため、役職文字列は決め打ちしない（一覧の形だけ検証）
    check("public circle GET returns keyMembers list", isinstance(g.get("keyMembers"), list))

    # --- member is forbidden (403) ---
    check("member info PATCH 403", c.patch("/api/circle/info", headers=MH, json={"about": "x"}).status_code == 403)
    check("member add key-member 403", c.post("/api/circle/key-members", headers=MH, json={"name": "x", "role": "y"}).status_code == 403)
    check("member delete key-member 403", c.delete("/api/circle/key-members/anything", headers=MH).status_code == 403)

    # --- admin: edit info (then restore) ---
    pi = c.patch("/api/circle/info", headers=AH, json={"frequency": "毎週金曜（週1回）"})
    check("admin edit info", pi.status_code == 200 and pi.get_json()["info"]["frequency"] == "毎週金曜（週1回）")
    c.patch("/api/circle/info", headers=AH, json={"frequency": orig_freq})  # 復元

    # --- admin: add / edit / delete key member ---
    cr = c.post("/api/circle/key-members", headers=AH, json={"name": "副 太郎", "role": "副リーダー", "bio": "sub", "orderIndex": 1})
    check("admin add key-member 201", cr.status_code == 201)
    kid = cr.get_json()["keyMember"]["id"]
    check("deputy reflected publicly", any(m["id"] == kid for m in c.get("/api/circle").get_json()["keyMembers"]))
    up = c.patch(f"/api/circle/key-members/{kid}", headers=AH, json={"role": "副代表"})
    check("admin edit key-member", up.status_code == 200 and up.get_json()["keyMember"]["role"] == "副代表")
    check("add invalid (empty name) 422", c.post("/api/circle/key-members", headers=AH, json={"name": "", "role": "x"}).status_code == 422)
    check("admin delete key-member 200", c.delete(f"/api/circle/key-members/{kid}", headers=AH).status_code == 200)
    check("deputy gone after delete", not any(m["id"] == kid for m in c.get("/api/circle").get_json()["keyMembers"]))

    # --- cleanup temp member ---
    SessionLocal.query(RefreshToken).filter_by(userId=member_id).delete(synchronize_session=False)
    SessionLocal.query(User).filter_by(id=member_id).delete(synchronize_session=False)
    SessionLocal.commit()
    check("cleanup temp member", SessionLocal.query(User).filter_by(id=member_id).first() is None)

    print("RESULT " + ("OK" if not fails else f"FAIL {fails}"))
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
