from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

DATABASE_URL = "postgresql://hsop_db_user:KuCEMigzHdk8JW1Ku0shmR0pRZH1t44x@dpg-d11q0pruibrs73eg3o60-a.virginia-postgres.render.com/hsop_db?sslmode=require"

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app



class Paciente(db.Model):
    __tablename__ = 'pacientes'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cartao_sus = db.Column(db.String(20), unique=True)
    nome = db.Column(db.String(255))
    nome_social = db.Column(db.String(255))
    filiacao = db.Column(db.String(255))
    data_nascimento = db.Column(db.Date)
    sexo = db.Column(db.String(10))
    cpf = db.Column(db.String(14), unique=True)
    endereco = db.Column(db.String(255))
    municipio = db.Column(db.String(255))
    bairro = db.Column(db.String(255))
    telefone = db.Column(db.String(15))
    identificado = db.Column(db.Boolean, nullable=False, default=True)
    descricao_nao_identificado = db.Column(db.Text)
    cor = db.Column(db.String(20), default='Não informada')

    # Relacionamentos
    atendimentos = db.relationship('Atendimento', backref='paciente', lazy=True)
    internacoes_sae = db.relationship('InternacaoSae', backref='paciente', lazy=True)
    atendimentos_clinica = db.relationship('Internacao', backref='paciente', lazy=True)

app = create_app()

def atualizar_data_nascimento(paciente_id, nova_data_str):
    try:
        nova_data = datetime.strptime(nova_data_str, "%Y-%m-%d").date()
    except ValueError:
        print("Formato de data inválido. Use o padrão 'YYYY-MM-DD'.")
        return

    paciente = Paciente.query.get(paciente_id)
    if not paciente:
        print(f"Paciente com ID {paciente_id} não encontrado.")
        return

    data_antiga = paciente.data_nascimento
    paciente.data_nascimento = nova_data
    db.session.commit()
    print(f"Data de nascimento atualizada de {data_antiga} para {nova_data} com sucesso.")

def listar_paciente(paciente_id):
    paciente = Paciente.query.get(paciente_id)
    if paciente:
        print(f"ID: {paciente.id}")
        print(f"Nome: {paciente.nome}")
        print(f"Data de nascimento: {paciente.data_nascimento}")
        print(f"CPF: {paciente.cpf}")
        print(f"SUS: {paciente.cartao_sus}")
    else:
        print("Paciente não encontrado.")

if __name__ == "__main__":
    with app.app_context():
        atualizar_data_nascimento(paciente_id=44, nova_data_str="2024-07-12")
        listar_paciente(paciente_id=44)
