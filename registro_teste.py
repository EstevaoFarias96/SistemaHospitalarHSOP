from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import argparse
from urllib.parse import urlparse, urlunparse

# Lê URIs de banco a partir das configs do app
from app.config import ConfigProd, ConfigDev

db = SQLAlchemy()


def resolve_database_uri(env: str) -> str:
    if env == 'prod':
        return getattr(ConfigProd, 'SQLALCHEMY_DATABASE_URI', None)
    if env == 'dev':
        return getattr(ConfigDev, 'SQLALCHEMY_DATABASE_URI', None)
    raise ValueError("Ambiente inválido. Use 'prod' ou 'dev'.")


def mask_uri(uri: str) -> str:
    try:
        parsed = urlparse(uri)
        if parsed.username or parsed.password:
            netloc = parsed.hostname or ''
            if parsed.port:
                netloc += f":{parsed.port}"
            safe = parsed._replace(netloc=netloc)
            return urlunparse(safe)
        return uri
    except Exception:
        return uri


def create_app(database_uri: str) -> Flask:
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


class Funcionario(db.Model):
    __tablename__ = 'funcionarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    data_nascimento = db.Column(db.Date, nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    telefone = db.Column(db.String(15), nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    cargo = db.Column(db.String(50), nullable=False)
    tipo_contrato = db.Column(db.String(20), nullable=False)
    numero_profissional = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        self.senha = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha, password)

    def get_id(self):
        return str(self.id)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False


def registrar_medico_teste():
    medico_teste = {
        "nome": "Estevao",
        "data_nascimento": datetime.strptime("1996-10-21", "%Y-%m-%d").date(),
        "cpf": "046.851.983-10",
        "email": "estevaofariaspt@gmail.com",
        "telefone": "(88)999349844",
        "senha": "123",
        "cargo": "administrador",
        "tipo_contrato": "Contratado",
        "numero_profissional": "0"
    }

    existente = Funcionario.query.filter_by(cpf=medico_teste["cpf"]).first()
    if existente:
        print("Médico já registrado.")
        return

    novo_medico = Funcionario(
        nome=medico_teste["nome"],
        data_nascimento=medico_teste["data_nascimento"],
        cpf=medico_teste["cpf"],
        email=medico_teste["email"],
        telefone=medico_teste["telefone"],
        cargo=medico_teste["cargo"],
        tipo_contrato=medico_teste["tipo_contrato"],
        numero_profissional=medico_teste["numero_profissional"]
    )
    novo_medico.set_password(medico_teste["senha"])
    db.session.add(novo_medico)
    db.session.commit()
    print("Médico registrado com sucesso!")


def listar_funcionarios():
    funcionarios = Funcionario.query.all()
    if funcionarios:
        print("\nFuncionários cadastrados:")
        for f in funcionarios:
            print(f"ID: {f.id}, Nome: {f.nome}, CPF: {f.cpf}, Cargo: {f.cargo}")
    else:
        print("Nenhum funcionário cadastrado.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Registrar médico de teste na base (prod/dev)")
    parser.add_argument("--env", choices=["prod", "dev"], default="dev", help="Ambiente de destino: prod ou dev (padrão: dev)")
    args = parser.parse_args()

    uri = resolve_database_uri(args.env)
    if not uri:
        raise SystemExit("Não foi possível resolver a URI do banco para o ambiente escolhido.")

    print(f"Conectando ao banco ({args.env}): {mask_uri(uri)}")
    app = create_app(uri)
    with app.app_context():
        registrar_medico_teste()
        listar_funcionarios()
