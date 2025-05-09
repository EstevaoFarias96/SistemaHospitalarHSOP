from flask import render_template, request, redirect, url_for, flash, jsonify
from .models import Funcionario, Paciente, Atendimento
from datetime import datetime
from . import db
from flask import Blueprint
from werkzeug.security import generate_password_hash, check_password_hash

# Cria um Blueprint para as rotas
bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

# Rotas para Funcionários
@bp.route('/funcionarios', methods=['GET', 'POST'])
def funcionarios():
    if request.method == 'POST':
        nome = request.form['nome']
        data_nascimento = datetime.strptime(request.form['data_nascimento'], '%Y-%m-%d').date()
        cpf = request.form['cpf']
        email = request.form['email']
        telefone = request.form['telefone']
        senha = request.form['senha']
        cargo = request.form['cargo']
        tipo_contrato = request.form['tipo_contrato']
        numero_profissional = request.form['numero_profissional']

        novo_funcionario = Funcionario(
            nome=nome,
            data_nascimento=data_nascimento,
            cpf=cpf,
            email=email,
            telefone=telefone,
            cargo=cargo,
            tipo_contrato=tipo_contrato,
            numero_profissional=numero_profissional
        )
        novo_funcionario.set_password(senha)  # Hash da senha
        db.session.add(novo_funcionario)
        db.session.commit()
        flash('Funcionário cadastrado com sucesso!', 'success')
        return redirect(url_for('main.funcionarios'))

    funcionarios = Funcionario.query.all()
    return render_template('funcionarios.html', funcionarios=funcionarios)

# Rotas para Pacientes
@bp.route('/pacientes', methods=['GET', 'POST'])
def pacientes():
    if request.method == 'POST':
        cartao_sus = request.form['cartao_sus']
        nome = request.form['nome']
        nome_social = request.form['nome_social']
        filiacao = request.form['filiacao']
        data_nascimento = datetime.strptime(request.form['data_nascimento'], '%Y-%m-%d').date()
        sexo = request.form['sexo']
        cpf = request.form['cpf']
        endereco = request.form['endereco']
        municipio = request.form['municipio']
        bairro = request.form['bairro']
        telefone = request.form['telefone']
        identificado = 'identificado' in request.form
        descricao_nao_identificado = request.form['descricao_nao_identificado']

        novo_paciente = Paciente(
            cartao_sus=cartao_sus,
            nome=nome,
            nome_social=nome_social,
            filiacao=filiacao,
            data_nascimento=data_nascimento,
            sexo=sexo,
            cpf=cpf,
            endereco=endereco,
            municipio=municipio,
            bairro=bairro,
            telefone=telefone,
            identificado=identificado,
            descricao_nao_identificado=descricao_nao_identificado
        )
        db.session.add(novo_paciente)
        db.session.commit()
        flash('Paciente cadastrado com sucesso!', 'success')
        return redirect(url_for('main.pacientes'))

    pacientes = Paciente.query.all()
    return render_template('pacientes.html', pacientes=pacientes)

# Rotas para Atendimentos
@bp.route('/atendimentos', methods=['GET', 'POST'])
def atendimentos():
    if request.method == 'POST':
        paciente_id = request.form['paciente_id']
        funcionario_id = request.form['funcionario_id']

        novo_atendimento = Atendimento(
            paciente_id=paciente_id,
            funcionario_id=funcionario_id
        )
        db.session.add(novo_atendimento)
        db.session.commit()
        flash('Atendimento registrado com sucesso!', 'success')
        return redirect(url_for('main.atendimentos'))

    atendimentos = Atendimento.query.all()
    pacientes = Paciente.query.all()
    funcionarios = Funcionario.query.all()
    return render_template('atendimentos.html', atendimentos=atendimentos, pacientes=pacientes, funcionarios=funcionarios)

# Rota de Login
@bp.route('/login', methods=['POST'])
def login():
    cpf = request.form.get('cpf')
    senha = request.form.get('senha')

    print(f"CPF recebido: {cpf}")
    print(f"Senha recebida: {senha}")

    funcionario = Funcionario.query.filter_by(cpf=cpf).first()

    if funcionario:
        print(f"Funcionário encontrado: {funcionario.nome}")
        print(f"Senha correta? {check_password_hash(funcionario.senha, senha)}")
    else:
        print("Funcionário não encontrado.")

    if funcionario and check_password_hash(funcionario.senha, senha):
        return jsonify({'cargo': funcionario.cargo})
    else:
        return jsonify({'error': 'CPF ou senha inválidos'}), 401
    


# Rotas para as páginas de cada cargo
@bp.route('/medico')
def medico():
    return render_template('medico.html')

@bp.route('/enfermeiro')
def enfermeiro():
    return render_template('enfermeiro.html')

@bp.route('/nutricionista')
def nutricionista():
    return render_template('nutricionista.html')

@bp.route('/assistente_social')
def assistente_social():
    return render_template('assistente_social.html')

@bp.route('/recepcionista')
def recepcionista():
    return render_template('recepcionista.html')

@bp.route('/administrador')
def administrador():
    return render_template('administrador.html')

@bp.route('/fisioterapeuta')
def fisioterapeuta():
    return render_template('fisioterapeuta.html')