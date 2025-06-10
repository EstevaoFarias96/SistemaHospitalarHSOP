import os
import logging

basedir = os.path.abspath(os.path.dirname(__file__))

class ConfigProd:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'uma_chave_secreta_muito_segura')

    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        logging.info(f"DATABASE_URL encontrada: {database_url[:50]}...")
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
            logging.info("Prefixo postgres:// corrigido para postgresql://")
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        logging.warning("DATABASE_URL não encontrada, usando SQLite como fallback")
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "app.db")}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    logging.info(f"[PRODUÇÃO] SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI.split('@')[0] if '@' in SQLALCHEMY_DATABASE_URI else SQLALCHEMY_DATABASE_URI}")


class ConfigDev:
    SECRET_KEY = 'uma_chave_secreta_muito_segura'
    SQLALCHEMY_DATABASE_URI = 'postgresql://hsop:senha123@localhost:5432/hospital_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    logging.info(f"[DESENVOLVIMENTO] SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI.split('@')[0] if '@' in SQLALCHEMY_DATABASE_URI else SQLALCHEMY_DATABASE_URI}")


# === ATIVAR UMA DAS CONFIGURAÇÕES ABAIXO ===
# Config = ConfigProd  # Produção (Render, Railway, etc.)

Config = ConfigDev    # Desenvolvimento/teste local
