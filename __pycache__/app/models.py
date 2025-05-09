from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Funcionario(db.Model):
    __tablename__ = 'funcionarios'  # Nome da tabela no banco de dados
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

    # Relacionamento com a tabela Atendimento
    atendimentos = db.relationship('Atendimento', backref='funcionario_relacionado', lazy=True)

    def set_password(self, senha):
        self.senha = generate_password_hash(senha)

    def check_password(self, senha):
        return check_password_hash(self.senha, senha)

class Paciente(db.Model):
    __tablename__ = 'pacientes'  # Nome da tabela no banco de dados
    id = db.Column(db.Integer, primary_key=True)
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

    # Relacionamento com a tabela Atendimento
    atendimentos = db.relationship('Atendimento', backref='paciente_relacionado', lazy=True)

class Atendimento(db.Model):
    __tablename__ = 'atendimentos'  # Nome da tabela no banco de dados
    id = db.Column(db.String(8), primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)
    funcionario_id = db.Column(db.Integer, db.ForeignKey('funcionarios.id'), nullable=False)
    data_atendimento = db.Column(db.Date, default=db.func.current_date())
    hora_atendimento = db.Column(db.Time, default=db.func.current_time())

    # Relacionamentos
    paciente = db.relationship('Paciente', backref='atendimentos_relacionados')
    funcionario = db.relationship('Funcionario', backref='atendimentos_relacionados')