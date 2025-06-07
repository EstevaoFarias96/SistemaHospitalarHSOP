import os
import logging

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'uma_chave_secreta_muito_segura')
    
    # Debug de variáveis de ambiente
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        logging.info(f"DATABASE_URL encontrada: {database_url[:50]}...")
        # Corrigir o prefixo do Render se necessário
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
            logging.info("Prefixo postgres:// corrigido para postgresql://")
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        logging.warning("DATABASE_URL não encontrada, usando SQLite como fallback")
        # Fallback para SQLite em desenvolvimento
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "app.db")}'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Log da configuração final (sem mostrar credenciais)
    logging.info(f"SQLALCHEMY_DATABASE_URI configurada: {SQLALCHEMY_DATABASE_URI.split('@')[0] if '@' in SQLALCHEMY_DATABASE_URI else SQLALCHEMY_DATABASE_URI}")

