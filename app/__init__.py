import logging
import os
import traceback
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import login_required, current_user, LoginManager

# Importa a classe Config já selecionada (Prod ou Dev) dentro do config.py
from app.config import Config

# Criar instâncias globais
db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configuração de logging
    try:
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)
        log_file = os.path.join(logs_dir, 'app.log')

        logger = logging.getLogger('hsop')
        logger.setLevel(logging.DEBUG)

        if logger.handlers:
            logger.handlers.clear()

        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter('%(asctime)s [%(levelname)s] %(module)s:%(lineno)d - %(message)s')
        file_handler.setFormatter(file_format)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter('%(asctime)s [%(levelname)s] - %(message)s')
        console_handler.setFormatter(console_format)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        logger.info(f"Logging configurado: {log_file}")
    except Exception as e:
        print(f"Erro ao configurar logging: {str(e)}")
        logging.basicConfig(level=logging.DEBUG)
        logger = logging.getLogger('hsop')

    # Configurações principais
    try:
        # Debug das configurações
        logger.info(f"SECRET_KEY configurada: {'✓' if app.config.get('SECRET_KEY') else '✗'}")
        logger.info(f"SQLALCHEMY_DATABASE_URI configurada: {'✓' if app.config.get('SQLALCHEMY_DATABASE_URI') else '✗'}")

        if app.config.get('SQLALCHEMY_DATABASE_URI'):
            db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
            logger.info(f"Banco de dados: {db_uri.split('@')[0] if '@' in db_uri else db_uri}")
        else:
            raise ValueError("SQLALCHEMY_DATABASE_URI não foi configurada")

        logger.info("Configurações básicas definidas")

        # Inicializar Banco de Dados
        db.init_app(app)
        logger.info("Banco de dados inicializado com sucesso")

        # Inicializar LoginManager
        login_manager.login_view = 'main.login'
        login_manager.init_app(app)
        logger.info("LoginManager inicializado com sucesso")

        # Importar aqui dentro para evitar erro de importação circular
        from app.models import Funcionario

        @login_manager.user_loader
        def load_user(user_id):
            return Funcionario.query.get(int(user_id))

    except Exception as e:
        logger.error(f"Erro durante configuração inicial: {str(e)}")
        logger.error(traceback.format_exc())

    # Registrar Blueprints
    try:
        from app.routes import bp as main_bp, internacoes_especiais_bp
        app.register_blueprint(main_bp)
        app.register_blueprint(internacoes_especiais_bp)
        logger.info("Blueprints registrados com sucesso")
    except Exception as e:
        logger.error(f"Erro ao registrar blueprint: {str(e)}")
        logger.error(traceback.format_exc())

    # Criar Tabelas
    try:
        with app.app_context():
            db.create_all()
            logger.info("Tabelas do banco de dados criadas/verificadas")
    except Exception as e:
        logger.error(f"Erro ao criar tabelas: {str(e)}")
        logger.error(traceback.format_exc())

    # Rotas básicas de teste
    @app.route('/test')
    def test_route():
        return "Aplicação funcionando!"

    @app.route('/api/status')
    def api_status():
        try:
            with app.app_context():
                db_status = True
                error_msg = None
                try:
                    from app.models import Funcionario
                    count = Funcionario.query.count()
                    db_info = {'count_funcionarios': count}
                except Exception as e:
                    db_status = False
                    error_msg = str(e)
                    db_info = {'error': error_msg}

                return jsonify({
                    'status': 'online',
                    'database_connected': db_status,
                    'database_info': db_info
                })
        except Exception as e:
            logger.error(f"Erro ao verificar status da API: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'status': 'error', 'message': str(e)}), 500

    # Handler global de erro 500
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Erro 500: {str(error)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Erro interno do servidor'}), 500

    # Importar rotas extras
    from . import routes_extra

    return app
