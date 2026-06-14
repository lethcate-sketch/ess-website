"""Flask 拡張とSQLAlchemy土台。

- Base: SQLAlchemy 宣言ベース（モデルが継承）。テーブルは Prisma Migrate が作成するため
  create_all は使わず、既存テーブルの読み書きにのみ用いる（§3-1, §3-2）。
- SessionLocal: スコープ付きセッション。エンジンは create_app で bind する。
- jwt: flask-jwt-extended の JWTManager（Flask が JWT を発行・検証 / §3-4）。
"""
from flask_jwt_extended import JWTManager
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

Base = declarative_base()

SessionLocal = scoped_session(
    sessionmaker(autoflush=False, autocommit=False, expire_on_commit=False)
)

jwt = JWTManager()
