"""Flask 認証フローのスモークテスト（ASCII 出力 / cp932 対策）。

register(temp) -> login -> me -> me(no token=401) -> wrong pw(401) -> invalid(422)
-> refresh(rotate) -> old refresh revoked(401) -> logout
-> admin login（bcryptjs $2a$ ハッシュ <-> Python bcrypt の相互運用検証）
実行: backend/venv/Scripts/python.exe backend/tests/check_auth_flow.py
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
    failures: list[str] = []

    def check(name: str, cond: bool):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            failures.append(name)

    temp_email = f"tmp_{uuid.uuid4().hex[:8]}@example.com"
    temp_pw = "testpass123"

    r = c.post("/api/auth/register", json={"email": temp_email, "password": temp_pw, "name": "Temp User"})
    check("register 201", r.status_code == 201)
    body = r.get_json() or {}
    check("register returns tokens", bool(body.get("accessToken")) and bool(body.get("refreshToken")))
    check("register role=MEMBER", (body.get("user") or {}).get("role") == "MEMBER")
    check("no passwordHash leaked", "passwordHash" not in (body.get("user") or {}))

    r = c.post("/api/auth/login", json={"email": temp_email, "password": temp_pw})
    check("login 200", r.status_code == 200)
    tok = r.get_json() or {}
    access, refresh = tok.get("accessToken"), tok.get("refreshToken")
    check("login tokens", bool(access) and bool(refresh))

    r = c.get("/api/auth/me", headers={"Authorization": f"Bearer {access}"})
    check("me 200", r.status_code == 200)
    check("me email matches", ((r.get_json() or {}).get("user") or {}).get("email") == temp_email)

    r = c.get("/api/auth/me")
    check("me no-token 401", r.status_code == 401)
    check("error envelope present", "error" in (r.get_json() or {}))

    r = c.post("/api/auth/login", json={"email": temp_email, "password": "wrongpass"})
    check("login wrong pw 401", r.status_code == 401)

    r = c.post("/api/auth/register", json={"email": "bad", "password": "short", "name": ""})
    check("register invalid 422", r.status_code == 422)

    r = c.post("/api/auth/refresh", json={"refreshToken": refresh})
    check("refresh 200", r.status_code == 200)
    new = r.get_json() or {}
    new_refresh = new.get("refreshToken")
    check("refresh rotated", bool(new.get("accessToken")) and bool(new_refresh) and new_refresh != refresh)

    r = c.post("/api/auth/refresh", json={"refreshToken": refresh})
    check("old refresh revoked 401", r.status_code == 401)

    r = c.post(
        "/api/auth/logout",
        json={"refreshToken": new_refresh},
        headers={"Authorization": f"Bearer {new.get('accessToken')}"},
    )
    check("logout 200", r.status_code == 200)

    r = c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    check("admin login 200 (bcrypt cross-compat)", r.status_code == 200)
    check("admin role=ADMIN", ((r.get_json() or {}).get("user") or {}).get("role") == "ADMIN")

    # cleanup temp user + refresh tokens
    u = SessionLocal.query(User).filter_by(email=temp_email).first()
    if u is not None:
        SessionLocal.query(RefreshToken).filter_by(userId=u.id).delete()
        SessionLocal.delete(u)
        SessionLocal.commit()
    check("cleanup temp user", SessionLocal.query(User).filter_by(email=temp_email).first() is None)

    print("RESULT " + ("OK" if not failures else f"FAIL ({len(failures)}): {failures}"))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
