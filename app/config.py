import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'uma_chave_secreta_muito_segura')
    
    # Corrigir o prefixo do Render se necessário
    raw_db_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:123@localhost:5432/postgres')
    SQLALCHEMY_DATABASE_URI = raw_db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_TRACK_MODIFICATIONS = False

