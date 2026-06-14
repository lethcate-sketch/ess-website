"""管理者ガードのスモークテスト（ASCII 出力 / cp932 対策）。

- 自分自身の無効化は 409（CANNOT_DISABLE_SELF）
- 最後の有効 ADMIN の降格は 409（LAST_ADMIN）
- ADMIN が2名いれば降格・他メンバー無効化は許可（過剰ブロックしない）
- ESS Admin が壊れない（実行後も ADMIN かつ有効）
実行: backend/venv/Scripts/python.exe backend/tests/check_admin_guards.py
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


def code(resp):
    return (resp.get_json().get("error") or {}).get("code")


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

    login = c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}).get_json()
    AH = {"Authorization": f"Bearer {login['accessToken']}"}
    admin_id = login["user"]["id"]

    # --- self deactivate blocked ---
    r = c.patch(f"/api/admin/members/{admin_id}/status", headers=AH, json={"isActive": False})
    check("self deactivate -> 409 CANNOT_DISABLE_SELF", r.status_code == 409 and code(r) == "CANNOT_DISABLE_SELF")

    # --- last admin self-demote blocked (ESS Admin is the sole admin) ---
    r = c.patch(f"/api/admin/members/{admin_id}/role", headers=AH, json={"role": "MEMBER"})
    check("last-admin demote -> 409 LAST_ADMIN", r.status_code == 409 and code(r) == "LAST_ADMIN")

    me = c.get("/api/me", headers=AH).get_json()["user"]
    check("admin unchanged after blocks (ADMIN, active)", me["role"] == "ADMIN" and me["isActive"] is True)

    # --- positive path: with 2 admins, demote / deactivate allowed ---
    mem = f"guard_{uuid.uuid4().hex[:8]}@example.com"
    tmp_id = c.post("/api/auth/register", json={"email": mem, "password": "member12345", "name": "Guard Temp"}).get_json()["user"]["id"]
    pr = c.patch(f"/api/admin/members/{tmp_id}/role", headers=AH, json={"role": "ADMIN"})
    check("promote temp to ADMIN 200", pr.status_code == 200 and pr.get_json()["member"]["role"] == "ADMIN")
    dm = c.patch(f"/api/admin/members/{tmp_id}/role", headers=AH, json={"role": "MEMBER"})
    check("demote non-last admin allowed 200", dm.status_code == 200 and dm.get_json()["member"]["role"] == "MEMBER")
    ds = c.patch(f"/api/admin/members/{tmp_id}/status", headers=AH, json={"isActive": False})
    check("deactivate other member allowed 200", ds.status_code == 200 and ds.get_json()["member"]["isActive"] is False)

    # --- cleanup temp ---
    SessionLocal.query(RefreshToken).filter_by(userId=tmp_id).delete(synchronize_session=False)
    SessionLocal.query(User).filter_by(id=tmp_id).delete(synchronize_session=False)
    SessionLocal.commit()
    check("cleanup temp", SessionLocal.query(User).filter_by(id=tmp_id).first() is None)

    a = SessionLocal.query(User).filter_by(email=ADMIN_EMAIL).first()
    check("ESS Admin intact (ADMIN, active)", a.role == "ADMIN" and a.isActive is True)

    print("RESULT " + ("OK" if not fails else f"FAIL {fails}"))
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
