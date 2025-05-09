from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Carrega as configurações
    app.config.from_object('config.Config')

    # Inicializa o banco de dados
    db.init_app(app)

    # Importa e registra as rotas
    from . import routes
    app.register_blueprint(routes.bp)  # Se estiver usando Blueprints

    return app