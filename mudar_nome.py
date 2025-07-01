from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey  # <-- Adicione esta linha
from datetime import datetime
from sqlalchemy.orm import relationship



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

    atendimentos = db.relationship('Atendimento', foreign_keys='Atendimento.funcionario_id', back_populates="recepcionista")
    atendimentos_enfermeiro = db.relationship('Atendimento', foreign_keys='Atendimento.enfermeiro_id', back_populates="enfermeiro")
    atendimentos_medico = db.relationship('Atendimento', foreign_keys='Atendimento.medico_id', back_populates="medico")


class Atendimento(db.Model):
    __tablename__ = 'atendimentos'
    id = db.Column(db.String(8), primary_key=True)
    paciente_id = db.Column(db.Integer, ForeignKey('pacientes.id'), nullable=False)
    funcionario_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=False)
    enfermeiro_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=True)
    medico_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=True)

    data_atendimento = db.Column(db.Date, nullable=False)
    hora_atendimento = db.Column(db.Time, nullable=False)
    triagem = db.Column(db.Text)
    alergias = db.Column(db.Text)
    temp = db.Column(db.String(20))
    status = db.Column(db.String(20))
    sp02 = db.Column(db.String(20))
    prescricao_medica = db.Column(db.Text)
    pulso = db.Column(db.String(20))
    pressao = db.Column(db.String(20))
    peso = db.Column(db.Numeric(5, 2))
    observacao = db.Column(db.Text)
    fr = db.Column(db.String(20))
    dx = db.Column(db.Text)
    conduta_final = db.Column(db.Text)
    classificacao_risco = db.Column(db.String(50))
    anamnese_exame_fisico = db.Column(db.Text)
    altura = db.Column(db.Numeric(5, 2))
    reavaliacao = db.Column(db.Text)
    exames = db.Column(db.Text)

    horario_triagem = db.Column(db.DateTime)
    horario_consulta_medica = db.Column(db.DateTime)
    horario_observacao = db.Column(db.DateTime)
    horario_internacao = db.Column(db.DateTime)
    horario_alta = db.Column(db.DateTime)
    horario_medicacao = db.Column(db.DateTime)
    medicacao_utilizada = db.Column(db.Text)

    recepcionista = relationship('Funcionario', foreign_keys=[funcionario_id], back_populates="atendimentos")
    enfermeiro = relationship('Funcionario', foreign_keys=[enfermeiro_id], back_populates="atendimentos_enfermeiro")
    medico = relationship('Funcionario', foreign_keys=[medico_id], back_populates="atendimentos_medico")

class InternacaoSae(db.Model):
    __tablename__ = 'internacao_sae'
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, ForeignKey('pacientes.id'), nullable=False)
    enfermeiro_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=False)

    hipotese_diagnostica = db.Column(db.Text)
    pa = db.Column(db.String(20))
    fc = db.Column(db.String(20))
    sat = db.Column(db.String(20))
    dx = db.Column(db.String(100))
    r = db.Column(db.String(20))
    t = db.Column(db.String(20))
    medicacao = db.Column(db.Text)
    alergias = db.Column(db.Text)
    antecedentes_pessoais = db.Column(db.Text)
    sistema_neurologico = db.Column(db.Text)
    estado_geral = db.Column(db.Text)
    ventilacao = db.Column(db.Text)
    diagnostico_de_enfermagem = db.Column(db.Text)
    pele = db.Column(db.Text)
    sistema_gastrointerstinal = db.Column(db.Text)
    regulacao_vascular = db.Column(db.Text)
    pulso = db.Column(db.Text)
    regulacao_abdominal = db.Column(db.Text)
    rha = db.Column(db.Text)
    sistema_urinario = db.Column(db.Text)
    acesso_venoso = db.Column(db.Text)
    observacao = db.Column(db.Text)
    data_registro = db.Column(db.DateTime, default=lambda: datetime.now(timezone(timedelta(hours=-3))))

    enfermeiro = relationship('Funcionario', backref='saes_realizadas')

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
