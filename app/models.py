from datetime import datetime, date, time, timezone, timedelta
from sqlalchemy import func, Column, Integer, String, Date, Time, Text, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from . import db
from werkzeug.security import generate_password_hash, check_password_hash
import json


from datetime import datetime
from zoneinfo import ZoneInfo

def now_brasilia():
    return datetime.now(ZoneInfo("America/Sao_Paulo"))

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

    atendimentos = relationship('Atendimento', foreign_keys=lambda: [Atendimento.funcionario_id], back_populates="recepcionista", lazy=True)
    atendimentos_enfermeiro = relationship('Atendimento', foreign_keys=lambda: [Atendimento.enfermeiro_id], back_populates="enfermeiro", lazy=True)
    atendimentos_medico = relationship('Atendimento', foreign_keys=lambda: [Atendimento.medico_id], back_populates="medico", lazy=True)
    evolucoes_enfermagem = relationship('EvolucaoEnfermagem', back_populates='funcionario')
    evolucoes_atendimentos = relationship('EvolucaoAtendimentoClinica', back_populates='funcionario')

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

    atendimentos = relationship('Atendimento', backref='paciente', lazy=True)
    internacoes_sae = relationship('InternacaoSae', backref='paciente', lazy=True)
    atendimentos_clinica = relationship('Internacao', backref='paciente', lazy=True)

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
    data_registro = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))

    enfermeiro = relationship('Funcionario', backref='saes_realizadas')

class Internacao(db.Model):
    __tablename__ = 'atendimentos_clinica'
    id = db.Column(db.Integer, primary_key=True)
    atendimento_id = db.Column(db.String, ForeignKey('atendimentos.id'), nullable=False)
    paciente_id = db.Column(db.Integer, ForeignKey('pacientes.id'), nullable=False)
    medico_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=False)
    enfermeiro_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=True)

    justificativa_internacao_sinais_e_sintomas = db.Column(db.Text)
    justificativa_internacao_condicoes = db.Column(db.Text)
    justificativa_internacao_principais_resultados_diagnostico = db.Column(db.Text)
    diagnostico_inicial = db.Column(db.Text)
    cid_principal = db.Column(db.String(20))
    cid_10_secundario = db.Column(db.String(100))
    cid_10_causas_associadas = db.Column(db.String(255))
    descr_procedimento_solicitado = db.Column(db.Text)
    codigo_procedimento = db.Column(db.String(50))
    leito = db.Column(db.String(50))
    carater_internacao = db.Column(db.String(100))
    data_da_solicitacao_exame = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))
    acidente_de_trabalho = db.Column(db.Boolean, default=False)
    diagnostico = db.Column(db.Text)
    hda = db.Column(db.Text)
    parametros = db.Column(db.Text)
    exames_laboratoriais = db.Column(db.Text)
    conduta = db.Column(db.Text)
    admissao_enfermagem = db.Column(db.Text)
    prescricao_enfermagem = db.Column(db.Text)
    checklist_enfermagem = db.Column(db.Text)
    folha_anamnese = db.Column(db.Text)
    imagens = db.Column(db.Text)
    historico_internacao = db.Column(db.Text)
    relatorio_alta = db.Column(db.Text)
    data_alta = db.Column(db.DateTime(timezone=True))
    data_internacao = db.Column(db.DateTime(timezone=True))
    folha_de_anamnese = db.Column(db.Text)
    dieta = db.Column(db.Text)
    hidratacao = db.Column(db.Text)
    antibiotico = db.Column(db.Text)
    procedimento = db.Column(db.Text)
    cuidados_gerais = db.Column(db.Text)

    evolucoes_enfermagem = relationship('EvolucaoEnfermagem', back_populates='atendimento_clinica')

class EvolucaoAtendimentoClinica(db.Model):
    __tablename__ = 'evolucoes_atendimentos_clinica'
    id = db.Column(db.Integer, primary_key=True)
    atendimentos_clinica_id = db.Column(db.Integer, ForeignKey('atendimentos_clinica.id'), nullable=False)
    funcionario_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=False)
    data_evolucao = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))
    hda = db.Column(db.Text)
    evolucao = db.Column(db.Text)
    conduta = db.Column(db.Text)
    parametros = db.Column(db.Text)
    exames_laboratoriais = db.Column(db.Text)

    funcionario = relationship('Funcionario', back_populates='evolucoes_atendimentos')
    internacao = relationship('Internacao', backref='evolucoes')

class PrescricaoClinica(db.Model):
    __tablename__ = 'prescricoes_clinica'

    id = db.Column(db.Integer, primary_key=True)
    atendimentos_clinica_id = db.Column(db.Integer, db.ForeignKey('atendimentos_clinica.id'), nullable=False)
    medico_id = db.Column(db.Integer, db.ForeignKey('funcionarios.id'), nullable=False)
    enfermeiro_id = db.Column(db.Integer, db.ForeignKey('funcionarios.id'), nullable=True)

    texto_dieta = db.Column(db.Text)
    texto_procedimento_medico = db.Column(db.Text)
    texto_procedimento_multi = db.Column(db.Text)
    horario_prescricao = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))

    # JSON de medicamentos
    medicamentos_json_raw = db.Column('medicamentos_json', db.Text)

    # Relacionamentos
    internacao = relationship('Internacao', backref='prescricoes')
    aprazamentos = relationship(
        'Aprazamento',
        back_populates='prescricao',
        cascade="all, delete-orphan"
    )

    @property
    def medicamentos_json(self):
        if self.medicamentos_json_raw:
            try:
                return json.loads(self.medicamentos_json_raw)
            except json.JSONDecodeError:
                return []
        return []

    @medicamentos_json.setter
    def medicamentos_json(self, value):
        if isinstance(value, (dict, list)):
            self.medicamentos_json_raw = json.dumps(value, ensure_ascii=False)
        elif isinstance(value, str):
            self.medicamentos_json_raw = value
        else:
            raise ValueError(
                'O campo medicamentos_json deve ser lista, dict ou string JSON válida.'
            )


class EvolucaoEnfermagem(db.Model):
    __tablename__ = 'evolucoes_enfermagem'
    id = db.Column(db.Integer, primary_key=True)
    atendimentos_clinica_id = db.Column(db.Integer, ForeignKey('atendimentos_clinica.id'), nullable=False)
    funcionario_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=False)
    data_evolucao = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))
    texto = db.Column(db.Text)

    atendimento_clinica = relationship('Internacao', back_populates='evolucoes_enfermagem')
    funcionario = relationship('Funcionario', back_populates='evolucoes_enfermagem')

class PrescricaoEnfermagem(db.Model):
    __tablename__ = 'prescricoes_enfermagem'

    id = db.Column(db.Integer, primary_key=True)
    atendimentos_clinica_id = db.Column(db.Integer, ForeignKey('atendimentos_clinica.id'), nullable=False)
    funcionario_id = db.Column(db.Integer, ForeignKey('funcionarios.id'), nullable=False)
    data_prescricao = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))
    texto = db.Column(db.Text)

    atendimento_clinica = relationship('Internacao', backref='prescricoes_enfermagem')
    funcionario = relationship('Funcionario', backref='prescricoes_enfermagem')

    def __repr__(self):
        return f'<PrescricaoEnfermagem {self.id} - {self.data_prescricao}>'
    

class InternacaoEspecial(db.Model):
    __tablename__ = 'internacoes_especiais'

    id = Column(Integer, primary_key=True)
    paciente_id = Column(Integer, ForeignKey('pacientes.id'), nullable=False)
    medico_id = Column(Integer, ForeignKey('funcionarios.id'), nullable=False)
    enfermeiro_id = Column(Integer, ForeignKey('funcionarios.id'), nullable=True)

    justificativa_internacao_sinais_e_sintomas = Column(Text)
    justificativa_internacao_condicoes = Column(Text)
    justificativa_internacao_principais_resultados_diagnostico = Column(Text)
    diagnostico_inicial = Column(Text)
    cid_principal = Column(String(20))
    cid_10_secundario = Column(String(100))
    cid_10_causas_associadas = Column(String(255))
    descr_procedimento_solicitado = Column(Text)
    codigo_procedimento = Column(String(50))
    leito = Column(String(50))
    carater_internacao = Column(String(100))
    data_da_solicitacao_exame = Column(DateTime(timezone=True), default=now_brasilia)
    acidente_de_trabalho = Column(Boolean, default=False)
    diagnostico = Column(Text)
    hda = Column(Text)
    parametros = Column(Text)
    exames_laboratoriais = Column(Text)
    conduta = Column(Text)
    admissao_enfermagem = Column(Text)
    prescricao_enfermagem = Column(Text)
    checklist_enfermagem = Column(Text)
    folha_anamnese = Column(Text)
    imagens = Column(Text)
    historico_internacao = Column(Text)
    relatorio_alta = Column(Text)
    data_alta = Column(DateTime(timezone=True))
    data_internacao = Column(DateTime(timezone=True))
    folha_de_anamnese = Column(Text)
    dieta = Column(Text)
    hidratacao = Column(Text)
    antibiotico = Column(Text)
    procedimento = Column(Text)
    cuidados_gerais = Column(Text)

class Aprazamento(db.Model):
    __tablename__ = 'aprazamentos'

    id = db.Column(db.Integer, primary_key=True)
    prescricao_id = db.Column(
        db.Integer,
        db.ForeignKey('prescricoes_clinica.id', ondelete='CASCADE'),
        nullable=False
    )
    nome_medicamento = db.Column(db.String(100), nullable=False)
    descricao_uso = db.Column(db.Text)
    data_hora_aprazamento = db.Column(db.DateTime(timezone=True), nullable=False)
    realizado = db.Column(db.Boolean, default=False)
    enfermeiro_responsavel_id = db.Column(
        db.Integer,
        db.ForeignKey('funcionarios.id'),
        nullable=True
    )
    data_realizacao = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relacionamentos
    prescricao = relationship('PrescricaoClinica', back_populates='aprazamentos')
    enfermeiro_responsavel = relationship(
        'Funcionario',
        foreign_keys=[enfermeiro_responsavel_id]
    )

    def __repr__(self):
        return f'<Aprazamento {self.nome_medicamento} - {self.data_hora_aprazamento} - Realizado: {self.realizado}>'


class ReceituarioClinica(db.Model):
    __tablename__ = 'receituarios_clinica'

    id = db.Column(db.Integer, primary_key=True)
    atendimento_id = db.Column(db.String(8), db.ForeignKey('atendimentos.id'), nullable=False)
    medico_id = db.Column(db.Integer, db.ForeignKey('funcionarios.id'), nullable=False)
    tipo_receita = db.Column(db.String(20), nullable=False)
    conteudo_receita = db.Column(db.Text, nullable=False)
    data_receita = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))

    # RELACIONAMENTOS (opcional, se quiser facilitar joins)
    atendimento = db.relationship('Atendimento', backref=db.backref('receituarios', lazy=True))
    medico = db.relationship('Funcionario', backref=db.backref('receituarios', lazy=True))

    def __repr__(self):
        return f'<ReceituarioClinica {self.id} - Atendimento {self.atendimento_id}>'


class AtestadoClinica(db.Model):
    __tablename__ = 'atestados_clinica'

    id = db.Column(db.Integer, primary_key=True)
    atendimento_id = db.Column(db.String(8), db.ForeignKey('atendimentos.id'), nullable=False)
    medico_id = db.Column(db.Integer, db.ForeignKey('funcionarios.id'), nullable=False)
    conteudo_atestado = db.Column(db.Text, nullable=False)
    dias_afastamento = db.Column(db.Integer)
    data_atestado = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))

    atendimento = db.relationship('Atendimento', backref=db.backref('atestados', lazy=True))
    medico = db.relationship('Funcionario', backref=db.backref('atestados', lazy=True))

    def __repr__(self):
        return f'<AtestadoClinica {self.id} - Atendimento {self.atendimento_id}>'
    
class PacienteRN(db.Model):
    __tablename__ = 'pacientes_rn'

    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)

    data_nascimento = db.Column(db.Date)
    tipo_parto = db.Column(db.String(50))
    idade_gestacional = db.Column(db.String(50))
    peso_ao_nascer = db.Column(db.Numeric(5,2))
    observacoes = db.Column(db.Text)

    paciente = db.relationship('Paciente', foreign_keys=[paciente_id], backref=db.backref('dados_rn', uselist=False))
    responsavel = db.relationship('Paciente', foreign_keys=[responsavel_id], backref='filhos_rn')

    def __repr__(self):
        return f'<PacienteRN RN={self.paciente_id} Responsavel={self.responsavel_id}>'


class Leito(db.Model):
    __tablename__ = 'leitos'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), unique=True, nullable=False)  # ex: "UTI-01", "Enfermaria A - 03"
    tipo = db.Column(db.String(50), nullable=False)               # ex: "UTI", "Enfermaria", "Observação"
    setor = db.Column(db.String(50), nullable=True)               # ex: "Ala A", "Pediatria"
    capacidade_maxima = db.Column(db.Integer, nullable=False)     # Número máximo de pacientes que podem ocupar o leito
    status = db.Column(db.String(30), nullable=False, default='Disponível')  # ex: "Disponível", "Ocupado", "Interditado"
    ocupacao_atual = db.Column(db.Integer, nullable=False, default=0)
    observacoes = db.Column(db.Text, nullable=True)


class AdmissaoEnfermagem(db.Model):
    __tablename__ = 'admissoes_enfermagem'

    id = db.Column(db.Integer, primary_key=True)

    internacao_id = db.Column(
        db.Integer,
        db.ForeignKey('atendimentos_clinica.id', ondelete='CASCADE'),
        nullable=False
    )
    enfermeiro_id = db.Column(
        db.Integer,
        db.ForeignKey('funcionarios.id', ondelete='SET NULL'),
        nullable=True
    )

    data_hora = db.Column(db.DateTime, default=datetime.now(timezone(timedelta(hours=-3))))
    admissao_texto = db.Column(db.Text)

    internacao = relationship("Internacao", backref="admissoes_enfermagem", passive_deletes=True)
    enfermeiro = relationship("Funcionario", backref="admissoes_enfermagem", passive_deletes=True)
