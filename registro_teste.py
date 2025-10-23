from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

DATABASE_URL = "postgresql://hsop_db_user:KuCEMigzHdk8JW1Ku0shmR0pRZH1t44x@dpg-d11q0pruibrs73eg3o60-a.virginia-postgres.render.com/hsop_db?sslmode=require"

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
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


app = create_app()


def registrar_medico_teste():
    medico_teste = {
        "nome": "Alincio Marvio Sousa Barbosa",
        "data_nascimento": datetime.strptime("01/06/1976", "%d/%m/%Y").date(),
        "cpf": "013.443.923-69",
        "email": "marvio_alincio@hotmail.com",
        "telefone": "8896562436",
        "senha": "123",
        "cargo": "Enfermeiro",
        "tipo_contrato": "Contratado",
        "numero_profissional": "425661"
    }

    if Funcionario.query.filter_by(cpf=medico_teste["cpf"]).first():
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
    with app.app_context():
        registrar_medico_teste()
        listar_funcionarios()
