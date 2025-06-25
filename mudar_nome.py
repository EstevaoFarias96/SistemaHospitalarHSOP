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

app = create_app()

def atualizar_nome_funcionario(funcionario_id, novo_nome):
    funcionario = Funcionario.query.get(funcionario_id)
    if not funcionario:
        print(f"Funcionário com ID {funcionario_id} não encontrado.")
        return

    nome_antigo = funcionario.nome
    funcionario.nome = novo_nome
    db.session.commit()
    print(f"Nome atualizado de '{nome_antigo}' para '{novo_nome}' com sucesso.")

def listar_funcionario_por_id(funcionario_id):
    funcionario = Funcionario.query.get(funcionario_id)
    if funcionario:
        print(f"ID: {funcionario.id}, Nome: {funcionario.nome}, CPF: {funcionario.cpf}")
    else:
        print("Funcionário não encontrado.")

if __name__ == "__main__":
    with app.app_context():
        atualizar_nome_funcionario(funcionario_id=29, novo_nome="Silas Rarison dos Santos Cavalcante")
        listar_funcionario_por_id(funcionario_id=29)
