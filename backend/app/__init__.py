"""Flask アプリケーションファクトリ（§4 create_app / CORS / JWT）。

- Prisma が作成したテーブルを SQLAlchemy で読み書きする（create_all は行わない / §3-1,2）。
- JWT は Authorization ヘッダから検証（Next.js BFF が Cookie から取り出し中継 / §3-4）。
- Blueprint は各マイルストーンで register_blueprints に追加していく。
"""
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine

from .config import Config
from .extensions import SessionLocal, jwt
from .utils import error_response


def create_app(config_object: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)
    app.json.ensure_ascii = False  # 日本語のメッセージを UTF-8 のまま返す

    # --- CORS ---
    # 本設計では Next.js BFF からのサーバ間通信が基本。念のため dev origin を許可する。
    CORS(
        app,
        resources={r"/api/*": {"origins": [app.config["NEXT_PUBLIC_SITE_URL"]]}},
        supports_credentials=True,
    )

    # --- JWT（Flask が発行・検証）---
    jwt.init_app(app)
    _register_jwt_handlers()

    # --- DB エンジン + スコープ付きセッション ---
    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    connect_args = {"check_same_thread": False} if uri.startswith("sqlite") else {}
    engine = create_engine(uri, future=True, connect_args=connect_args)
    SessionLocal.configure(bind=engine)
    app.extensions["engine"] = engine

    # モデルを読み込み、マッパー（リレーション）を登録
    from . import models  # noqa: F401

    @app.teardown_appcontext
    def _remove_session(exception=None):  # noqa: ANN001
        SessionLocal.remove()

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    register_blueprints(app)
    _register_error_handlers(app)
    return app


def _register_jwt_handlers() -> None:
    """§6 のエラー規約に合わせ、JWT のエラーを 401 + 統一フォーマットで返す。"""

    @jwt.unauthorized_loader
    def _missing_token(reason):  # noqa: ANN001
        return error_response("UNAUTHORIZED", "認証が必要です。", 401)

    @jwt.invalid_token_loader
    def _invalid_token(reason):  # noqa: ANN001
        return error_response("INVALID_TOKEN", "トークンが不正です。", 401)

    @jwt.expired_token_loader
    def _expired_token(header, payload):  # noqa: ANN001
        return error_response("TOKEN_EXPIRED", "トークンの有効期限が切れています。", 401)


def _register_error_handlers(app: Flask) -> None:
    """未定義ルート・未処理例外も §6 形式の JSON で返す。"""
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(HTTPException)
    def _http_error(e: HTTPException):
        code = (e.name or "HTTP_ERROR").upper().replace(" ", "_")
        return error_response(code, e.description or e.name or "エラー", e.code or 500)

    @app.errorhandler(Exception)
    def _unhandled(e: Exception):
        app.logger.exception("Unhandled exception")
        SessionLocal.remove()
        return error_response("INTERNAL_ERROR", "サーバ内部エラーが発生しました。", 500)


def register_blueprints(app: Flask) -> None:
    """各マイルストーンで Blueprint を追加する。

    M3: events(公開GET) / M4: forms / M5: members・attendance・survey / M6: admin。
    """
    from .routes.admin import bp as admin_bp
    from .routes.attendance import bp as attendance_bp
    from .routes.auth import bp as auth_bp
    from .routes.circle import bp as circle_bp
    from .routes.events import bp as events_bp
    from .routes.forms import bp as forms_bp
    from .routes.home import bp as home_bp
    from .routes.members import bp as members_bp
    from .routes.survey import bp as survey_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(forms_bp)
    app.register_blueprint(members_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(survey_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(circle_bp)
    app.register_blueprint(home_bp)
