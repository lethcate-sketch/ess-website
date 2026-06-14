"""WSGI エントリポイント。開発: `python wsgi.py` で http://localhost:5000 起動。
本番: `gunicorn wsgi:app`（§10 コメント参照）。"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
