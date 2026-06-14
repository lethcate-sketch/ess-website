"""新規登録 受付トグルのスモークテスト（ASCII 出力 / cp932 対策）。

OFF 時は register -> 403 / 管理者が PATCH /api/admin/settings で ON -> register 201 /
設定 API は 👑 のみ（member 403 / 未認証 401）/ 終了時は OFF（安全側）に戻す。
実行: backend/venv/Scripts/python.exe backend/tests/check_registration_toggle.py
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


def _set_reg(value: bool):
    s = SessionLocal.query(SiteSetting).filter_by(id="default").first()
    if s is None:
        s = SiteSetting(id="default", registrationEnabled=value)
        SessionLocal.add(s)
    s.registrationEnabled = value
    SessionLocal.commit()


def code(resp):
    return (resp.get_json().get("error") or {}).get("code")


def main() -> int:
    app = create_app()
    c = app.test_client()
    fails: list[str] = []

    def check(name, cond):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            fails.append(name)

    AH = {"Authorization": f"Bearer {c.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PW}).get_json()['accessToken']}"}
    email = f"reg_{uuid.uuid4().hex[:8]}@example.com"

    # --- OFF: register blocked ---
    _set_reg(False)
    r = c.post("/api/auth/register", json={"email": email, "password": "member12345", "name": "Reg Test"})
    check("register OFF -> 403 REGISTRATION_DISABLED", r.status_code == 403 and code(r) == "REGISTRATION_DISABLED")
    check("admin GET settings shows false", c.get("/api/admin/settings", headers=AH).get_json()["settings"]["registrationEnabled"] is False)
    check("settings PATCH no-auth -> 401", c.patch("/api/admin/settings", json={"registrationEnabled": True}).status_code == 401)

    # --- admin enables via API ---
    ps = c.patch("/api/admin/settings", headers=AH, json={"registrationEnabled": True})
    check("admin enable settings -> 200 true", ps.status_code == 200 and ps.get_json()["settings"]["registrationEnabled"] is True)

    r2 = c.post("/api/auth/register", json={"email": email, "password": "member12345", "name": "Reg Test"})
    check("register ON -> 201", r2.status_code == 201)
    new_id = r2.get_json()["user"]["id"] if r2.status_code == 201 else None

    # --- member cannot touch settings ---
    if new_id:
        macc = c.post("/api/auth/login", json={"email": email, "password": "member12345"}).get_json()["accessToken"]
        check("member PATCH settings -> 403", c.patch("/api/admin/settings", headers={"Authorization": f"Bearer {macc}"}, json={"registrationEnabled": False}).status_code == 403)

    # --- OFF again ---
    _set_reg(False)
    r3 = c.post("/api/auth/register", json={"email": f"x_{uuid.uuid4().hex[:6]}@example.com", "password": "member12345", "name": "X"})
    check("register OFF again -> 403", r3.status_code == 403)

    # --- cleanup + leave OFF (secure default) ---
    if new_id:
        SessionLocal.query(RefreshToken).filter_by(userId=new_id).delete(synchronize_session=False)
        SessionLocal.query(User).filter_by(id=new_id).delete(synchronize_session=False)
        SessionLocal.commit()
    check("cleanup new user", new_id is None or SessionLocal.query(User).filter_by(id=new_id).first() is None)
    _set_reg(False)
    check("final state OFF", SessionLocal.query(SiteSetting).filter_by(id="default").first().registrationEnabled is False)

    print("RESULT " + ("OK" if not fails else f"FAIL {fails}"))
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
