# API para obter o nome do enfermeiro logado
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, Flask, send_file, current_app
from datetime import datetime, timezone, timedelta, date, time
import logging
import traceback
from app import db
from app.models import Funcionario, Paciente, Atendimento, Internacao, EvolucaoAtendimentoClinica, PrescricaoClinica, EvolucaoEnfermagem, AdmissaoEnfermagem
# from flask_login import login_required, current_user

# Cria o Blueprint
bp = Blueprint('main', __name__)

# Login required decorator personalizado
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor, faça login para acessar esta página', 'warning')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

# Helper para obter o usuário atual
def get_current_user():
    if 'user_id' not in session:
        return None
    return Funcionario.query.get(session['user_id'])

# Rota de teste simples para diagnóstico
@bp.route('/api/status')
def api_status():
    try:
        # Tentar fazer uma consulta simples ao banco de dados
        count = Funcionario.query.count()
        return jsonify({
            'status': 'online',
            'database': 'connected',
            'funcionarios_count': count,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logging.error(f"Erro na rota de status: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@bp.route('/api/pacientes/internados')
@login_required
def listar_pacientes_internados():
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'error': 'Acesso não autorizado'}), 403
        
        internacoes = Internacao.query.filter_by(data_alta=None).all()
        pacientes_list = []
        
        for internacao in internacoes:
            paciente = Paciente.query.get(internacao.paciente_id)
            if paciente:
                pacientes_list.append({
                    'atendimento_id': internacao.atendimento_id,
                    'nome': paciente.nome,
                    'cpf': paciente.cpf,
                    'data_nascimento': paciente.data_nascimento.strftime('%Y-%m-%d') if paciente.data_nascimento else None,
                    'leito': internacao.leito,
                    'data_internacao': internacao.data_internacao.strftime('%Y-%m-%d %H:%M') if internacao.data_internacao else None,
                    'diagnostico': internacao.diagnostico
                })
        
        return jsonify({
            'success': True,
            'pacientes': pacientes_list
        })
        
    except Exception as e:
        logging.error(f"Erro ao listar pacientes internados: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Erro interno do servidor'}), 500

# API para obter o nome do enfermeiro logado
@bp.route('/api/enfermeiro/nome')
@login_required
def get_enfermeiro_nome():
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() != 'enfermeiro':
            return jsonify({'error': 'Acesso não autorizado'}), 403
        
        return jsonify({
            'nome': current_user.nome,
            'cargo': current_user.cargo
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter nome do enfermeiro: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Rota principal
@bp.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        logging.error(f"Erro na rota index: {str(e)}")
        logging.error(traceback.format_exc())
        return f"Erro ao renderizar página: {str(e)}", 500

# Rota principal da clínica
@bp.route('/clinica')
@login_required
def clinica():
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            flash('Acesso restrito a médicos e enfermeiros.', 'danger')
            return redirect(url_for('main.index'))
        
        return render_template('clinica.html')
        
    except Exception as e:
        logging.error(f"Erro ao acessar página da clínica: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a página. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.index'))

# Rota para listar pacientes internados
@bp.route('/clinica/pacientes-internados')
@login_required
def pacientes_internados():
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            flash('Acesso restrito a médicos e enfermeiros.', 'danger')
            return redirect(url_for('main.index'))
        
        return render_template('pacientes_internados.html')
        
    except Exception as e:
        logging.error(f"Erro ao acessar lista de pacientes internados: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a lista de pacientes. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.clinica'))

# Rota de login com tratamento de erro mais robusto
@bp.route('/login', methods=['POST'])
def login():
    try:
        # Adicionando logs para depurar problemas
        logging.info("Recebida requisição de login")
        
        # Obter dados do formulário
        cpf = request.form.get('cpf')
        senha = request.form.get('senha')
        
        if not cpf or not senha:
            logging.error(f"Dados de login incompletos - CPF: {cpf is not None}, Senha: {len(senha) > 0 if senha else False}")
            return jsonify({'error': 'CPF ou senha não fornecidos'}), 400
        
        logging.info(f"Tentativa de login - CPF: {cpf}")
        
        try:
            # Verificar se o funcionário existe
            funcionario = Funcionario.query.filter_by(cpf=cpf).first()
            logging.info(f"Consulta ao banco de dados realizada - Funcionário encontrado: {funcionario is not None}")
        except Exception as e:
            logging.error(f"Erro ao consultar banco de dados: {str(e)}")
            logging.error(traceback.format_exc())
            return jsonify({'error': 'Erro interno ao verificar usuário'}), 500
        
        if funcionario:
            logging.info(f"Funcionário encontrado: ID={funcionario.id}, Nome={funcionario.nome}, Cargo={funcionario.cargo}")
            
            try:
                # Verificar a senha
                senha_correta = funcionario.check_password(senha)
                logging.info(f"Senha verificada - Resultado: {senha_correta}")
            except Exception as e:
                logging.error(f"Erro ao verificar senha: {str(e)}")
                logging.error(traceback.format_exc())
                return jsonify({'error': 'Erro interno ao validar credenciais'}), 500
            
            if senha_correta:
                # Atualizar sessão
                try:
                    session['user_id'] = funcionario.id
                    session['cargo'] = funcionario.cargo
                    logging.info(f"Login bem-sucedido: user_id={funcionario.id}, cargo={funcionario.cargo} adicionados à sessão")
                    return jsonify({'cargo': funcionario.cargo})
                except Exception as e:
                    logging.error(f"Erro ao configurar sessão: {str(e)}")
                    logging.error(traceback.format_exc())
                    return jsonify({'error': 'Erro interno ao iniciar sessão'}), 500
            else:
                logging.info("Falha no login: senha incorreta")
                return jsonify({'error': 'CPF ou senha inválidos'}), 401
        else:
            logging.info(f"Falha no login: usuário com CPF {cpf} não encontrado")
            
            # Para depuração: listar todos os funcionários
            try:
                todos_funcionarios = Funcionario.query.all()
                logging.info(f"Total de funcionários no banco: {len(todos_funcionarios)}")
                for f in todos_funcionarios:
                    logging.info(f"  - ID: {f.id}, CPF: {f.cpf}, Nome: {f.nome}, Cargo: {f.cargo}")
            except Exception as e:
                logging.error(f"Erro ao listar funcionários para depuração: {str(e)}")
                logging.error(traceback.format_exc())
            
            return jsonify({'error': 'CPF ou senha inválidos'}), 401
    except Exception as e:
        # Log para exceções gerais não capturadas
        logging.error(f"Erro não tratado na rota de login: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Rota para a página do enfermeiro
@bp.route('/enfermeiro')
@login_required
def enfermeiro_painel():
    try:
        # Verificar se o usuário é enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() != 'enfermeiro':
            flash('Acesso restrito a enfermeiros.', 'danger')
            return redirect(url_for('main.index'))
        
        # Renderizar o template do painel do enfermeiro
        return render_template('enfermeiro.html')
        
    except Exception as e:
        logging.error(f"Erro ao acessar painel do enfermeiro: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar o painel. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.index'))

# ------------------------------
# Rotas para Evolução de Pacientes
# ------------------------------

# Helper para verificar autenticação
def esta_autenticado():
    user_id = session.get('user_id')
    if not user_id:
        return False, None
    funcionario = Funcionario.query.get(user_id)
    if not funcionario:
        return False, None
    return True, funcionario

# Rota principal de evolução - redirecionamento com base no cargo
@bp.route('/clinica/evolucao/<int:atendimento_id>')
@login_required
def clinica_evolucao_paciente(atendimento_id):
    # Verificar se o usuário é médico ou enfermeiro
    current_user = get_current_user()
    if current_user.cargo.lower() == 'médico' or current_user.cargo.lower() == 'medico':
        return redirect(url_for('main.clinica_evolucao_medico', atendimento_id=atendimento_id))
    elif current_user.cargo.lower() == 'enfermeiro':
        return redirect(url_for('main.clinica_evolucao_enfermeiro', atendimento_id=atendimento_id))
    else:
        flash('Acesso não autorizado.', 'danger')
        return redirect(url_for('main.index'))

# Rota para evolução médica
@bp.route('/clinica/evolucao/medico/<int:atendimento_id>')
@login_required
def clinica_evolucao_medico(atendimento_id):
    # Verificar se o usuário é médico
    current_user = get_current_user()
    if current_user.cargo.lower() != 'médico' and current_user.cargo.lower() != 'medico':
        flash('Acesso restrito a médicos.', 'danger')
        return redirect(url_for('main.index'))
    
    try:
        # Converter atendimento_id para string antes de fazer a consulta
        atendimento_id_str = str(atendimento_id)
        logging.info(f"Buscando internação com atendimento_id: {atendimento_id_str} (convertido de {atendimento_id})")
        
        # Buscar dados do paciente e da internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id_str).first()
        
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        paciente = Paciente.query.get(internacao.paciente_id)
        
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('clinica_evolucao_paciente_medico.html', 
                              internacao=internacao, 
                              paciente=paciente, 
                              atendimento_id=atendimento_id)
    
    except Exception as e:
        logging.error(f"Erro ao acessar evolução médica: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a evolução. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

# Rota para evolução de enfermagem
@bp.route('/clinica/evolucao/enfermeiro/<int:atendimento_id>')
@login_required
def clinica_evolucao_enfermeiro(atendimento_id):
    # Verificar se o usuário é enfermeiro
    current_user = get_current_user()
    if current_user.cargo.lower() != 'enfermeiro':
        flash('Acesso restrito a enfermeiros.', 'danger')
        return redirect(url_for('main.index'))
    
    try:
        # Converter atendimento_id para string antes de fazer a consulta
        atendimento_id_str = str(atendimento_id)
        logging.info(f"Buscando internação com atendimento_id: {atendimento_id_str} (convertido de {atendimento_id})")
        
        # Buscar dados do paciente e da internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id_str).first()
        
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        paciente = Paciente.query.get(internacao.paciente_id)
        
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('clinica_evolucao_paciente_enfermeiro.html', 
                              internacao=internacao, 
                              paciente=paciente, 
                              atendimento_id=atendimento_id)
    
    except Exception as e:
        logging.error(f"Erro ao acessar evolução de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a evolução. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

# API para listar evoluções de uma internação
@bp.route('/api/evolucoes/<int:internacao_id>', methods=['GET'])
def listar_evolucoes_internacao(internacao_id):
    try:
        # Verificar autenticação
        autenticado, _ = esta_autenticado()
        if not autenticado:
            return jsonify({'success': False, 'message': 'Usuário não autenticado'}), 401
        
        try:
            # Obter evoluções (ajustar conforme modelo de dados correto)
            evolucoes = EvolucaoAtendimentoClinica.query.filter_by(
                atendimentos_clinica_id=internacao_id
            ).order_by(
                EvolucaoAtendimentoClinica.data_evolucao.desc()
            ).all()
            
            resultado = []
            for e in evolucoes:
                # Preencher com campos corretos do modelo
                medico_nome = e.funcionario.nome if hasattr(e, 'funcionario') and e.funcionario else 'Desconhecido'
                
                resultado.append({
                    'id': e.id,
                    'data_evolucao': e.data_evolucao.strftime('%d/%m/%Y %H:%M') if hasattr(e, 'data_evolucao') else '',
                    'nome_medico': medico_nome,
                    'evolucao': e.evolucao if hasattr(e, 'evolucao') else ''
                })
            
            return jsonify({'success': True, 'evolucoes': resultado})
        except Exception as e:
            logging.error(f"Erro ao listar evoluções: {str(e)}")
            logging.error(traceback.format_exc())
            return jsonify({'success': False, 'message': 'Erro ao buscar evoluções'}), 500
    except Exception as e:
        logging.error(f"Erro não tratado ao listar evoluções: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500
        
# API para registrar evolução
@bp.route('/api/evolucoes/registrar', methods=['POST'])
def registrar_evolucao():
    try:
        # Verificar autenticação
        autenticado, funcionario = esta_autenticado()
        if not autenticado:
            return jsonify({'success': False, 'message': 'Usuário não autenticado'}), 401
        
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'Dados não fornecidos'}), 400
        
        atendimentos_clinica_id = data.get('atendimentos_clinica_id')
        evolucao = data.get('evolucao')
        
        if not atendimentos_clinica_id or not evolucao:
            return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
        
        try:
            # Criar nova evolução (ajustar conforme modelo de dados correto)
            nova_evolucao = EvolucaoAtendimentoClinica(
                atendimentos_clinica_id=atendimentos_clinica_id,
                funcionario_id=funcionario.id,
                data_evolucao=datetime.now(timezone(timedelta(hours=-3))),
                evolucao=evolucao
            )
            
            db.session.add(nova_evolucao)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Evolução registrada com sucesso'})
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erro ao salvar evolução: {str(e)}")
            logging.error(traceback.format_exc())
            return jsonify({'success': False, 'message': 'Erro ao salvar evolução'}), 500
    except Exception as e:
        logging.error(f"Erro não tratado ao registrar evolução: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

# API para listar evoluções de uma internação
@bp.route('/api/internacao/evolucoes', methods=['GET'])
@login_required
def get_evolucoes_internacao():
    try:
        current_user = get_current_user()
        internacao_id = request.args.get('internacao_id')
        
        if not internacao_id:
            return jsonify({'error': 'ID de internação não fornecido'}), 400
        
        evolucoes = EvolucaoAtendimentoClinica.query.filter_by(atendimentos_clinica_id=internacao_id).order_by(EvolucaoAtendimentoClinica.data_evolucao.desc()).all()
        
        evolucoes_list = []
        for evolucao in evolucoes:
            funcionario = Funcionario.query.get(evolucao.funcionario_id)
            evolucao_data = {
                'id': evolucao.id,
                'data_evolucao': evolucao.data_evolucao.strftime('%d/%m/%Y %H:%M'),
                'evolucao': evolucao.evolucao,
                'funcionario_nome': funcionario.nome if funcionario else 'Desconhecido',
                'funcionario_cargo': funcionario.cargo if funcionario else 'Desconhecido'
            }
            evolucoes_list.append(evolucao_data)
            
        return jsonify({'evolucoes': evolucoes_list})
    
    except Exception as e:
        logging.error(f"Erro ao buscar evoluções: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Erro ao buscar evoluções'}), 500
        
@bp.route('/api/internacao/evolucao', methods=['POST'])
@login_required
def registrar_evolucao_internacao():
    try:
        dados = request.get_json()
        current_user = get_current_user()
        
        # Verificar se todos os campos necessários estão presentes
        campos_necessarios = ['internacao_id', 'evolucao']
        if not all(campo in dados for campo in campos_necessarios):
            return jsonify({'error': 'Campos obrigatórios ausentes'}), 400
        
        # Criar nova evolução
        nova_evolucao = EvolucaoAtendimentoClinica(
            atendimentos_clinica_id=dados['internacao_id'],
            funcionario_id=current_user.id,
            evolucao=dados['evolucao'],
            data_evolucao=datetime.now(timezone(timedelta(hours=-3)))
        )
        
        db.session.add(nova_evolucao)
        db.session.commit()
        
        return jsonify({'message': 'Evolução registrada com sucesso', 'id': nova_evolucao.id})
    
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erro ao registrar evolução: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Erro ao registrar evolução'}), 500

# API para listar evoluções de enfermagem de uma internação
@bp.route('/api/enfermagem/evolucoes', methods=['GET'])
@login_required
def get_evolucoes_enfermagem():
    try:
        current_user = get_current_user()
        internacao_id = request.args.get('internacao_id')
        
        if not internacao_id:
            return jsonify({'success': False, 'message': 'ID de internação não fornecido'}), 400
        
        evolucoes = EvolucaoEnfermagem.query.filter_by(atendimentos_clinica_id=internacao_id).order_by(EvolucaoEnfermagem.data_evolucao.desc()).all()
        
        evolucoes_list = []
        for evolucao in evolucoes:
            funcionario = Funcionario.query.get(evolucao.funcionario_id)
            evolucao_data = {
                'id': evolucao.id,
                'data_evolucao': evolucao.data_evolucao.strftime('%d/%m/%Y %H:%M'),
                'texto': evolucao.texto,
                'funcionario_nome': funcionario.nome if funcionario else 'Desconhecido',
                'funcionario_cargo': funcionario.cargo if funcionario else 'Desconhecido'
            }
            evolucoes_list.append(evolucao_data)
            
        return jsonify({'success': True, 'evolucoes': evolucoes_list})
    
    except Exception as e:
        logging.error(f"Erro ao buscar evoluções de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Erro ao buscar evoluções: {str(e)}'}), 500
        
@bp.route('/api/enfermagem/evolucao', methods=['POST'])
@login_required
def registrar_evolucao_enfermagem():
    try:
        dados = request.get_json()
        current_user = get_current_user()
        
        # Verificar se o usuário é enfermeiro
        if current_user.cargo.lower() != 'enfermeiro':
            return jsonify({'success': False, 'message': 'Apenas enfermeiros podem registrar evoluções de enfermagem'}), 403
        
        # Verificar se todos os campos necessários estão presentes
        campos_necessarios = ['internacao_id', 'texto']
        if not all(campo in dados for campo in campos_necessarios):
            return jsonify({'success': False, 'message': 'Campos obrigatórios ausentes'}), 400
        
        # Criar nova evolução de enfermagem
        nova_evolucao = EvolucaoEnfermagem(
            atendimentos_clinica_id=dados['internacao_id'],
            funcionario_id=current_user.id,
            texto=dados['texto'],
            data_evolucao=datetime.now(timezone(timedelta(hours=-3)))
        )
        
        db.session.add(nova_evolucao)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Evolução de enfermagem registrada com sucesso', 'id': nova_evolucao.id})
    
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erro ao registrar evolução de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Erro ao registrar evolução: {str(e)}'}), 500

# API para registrar admissão de enfermagem
@bp.route('/api/enfermagem/admissao', methods=['POST'])
@login_required
def registrar_admissao_enfermagem():
    """
    Registra uma nova admissão de enfermagem.
    ---
    tags:
      - Enfermagem
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - internacao_id
            - admissao_texto
          properties:
            internacao_id:
              type: integer
              description: ID da internação
            admissao_texto:
              type: string
              description: Texto da admissão de enfermagem
    responses:
      201:
        description: Admissão registrada com sucesso
      400:
        description: Dados inválidos ou incompletos
      401:
        description: Usuário não autorizado
      404:
        description: Internação não encontrada
      500:
        description: Erro interno do servidor
    """
    try:
        # Verifica se o usuário é enfermeiro
        current_user = get_current_user()
        funcionario = Funcionario.query.get(current_user.id)
        if not funcionario or funcionario.cargo.lower() != 'enfermeiro':
            return jsonify({
                'status': 'erro',
                'mensagem': 'Apenas enfermeiros podem registrar admissões'
            }), 401
        
        dados = request.get_json()
        
        # Valida os campos obrigatórios
        campos_obrigatorios = ['internacao_id', 'admissao_texto']
        for campo in campos_obrigatorios:
            if campo not in dados or not dados[campo]:
                return jsonify({
                    'status': 'erro',
                    'mensagem': f'O campo {campo} é obrigatório'
                }), 400
        
        # Verifica se a internação existe
        internacao = Internacao.query.get(dados['internacao_id'])
        if not internacao:
            return jsonify({
                'status': 'erro',
                'mensagem': 'Internação não encontrada'
            }), 404
        
        # Atualiza o campo admissao_enfermagem na internação
        internacao.admissao_enfermagem = dados['admissao_texto']
        
        # Cria o registro de admissão
        nova_admissao = AdmissaoEnfermagem(
            internacao_id=dados['internacao_id'],
            enfermeiro_id=current_user.id,
            admissao_texto=dados['admissao_texto'],
            data_hora=datetime.now()
        )
        
        db.session.add(nova_admissao)
        db.session.commit()
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Admissão de enfermagem registrada com sucesso',
            'id': nova_admissao.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Erro ao registrar admissão de enfermagem: {str(e)}')
        return jsonify({
            'status': 'erro',
            'mensagem': 'Erro interno do servidor'
        }), 500

# API para listar admissões de enfermagem de uma internação
@bp.route('/api/enfermagem/admissoes/<int:internacao_id>', methods=['GET'])
@login_required
def listar_admissoes_enfermagem(internacao_id):
    """
    Lista todas as admissões de enfermagem de uma internação.
    ---
    tags:
      - Enfermagem
    parameters:
      - name: internacao_id
        in: path
        type: integer
        required: true
        description: ID da internação
    responses:
      200:
        description: Lista de admissões
      404:
        description: Internação não encontrada
      500:
        description: Erro interno do servidor
    """
    try:
        # Verifica se a internação existe
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'status': 'erro',
                'mensagem': 'Internação não encontrada'
            }), 404
        
        # Busca todas as admissões dessa internação
        admissoes = AdmissaoEnfermagem.query.filter_by(internacao_id=internacao_id).all()
        
        # Formata a resposta
        resultado = []
        for admissao in admissoes:
            enfermeiro = Funcionario.query.get(admissao.enfermeiro_id)
            resultado.append({
                'id': admissao.id,
                'data_hora': admissao.data_hora.strftime('%d/%m/%Y %H:%M'),
                'enfermeiro': enfermeiro.nome if enfermeiro else 'Não informado',
                'admissao_texto': admissao.admissao_texto
            })
        
        return jsonify({
            'status': 'sucesso',
            'admissoes': resultado
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Erro ao listar admissões de enfermagem: {str(e)}')
        return jsonify({
            'status': 'erro',
            'mensagem': 'Erro interno do servidor'
        }), 500

# API para listar medicamentos
@bp.route('/api/medicamentos', methods=['GET'])
@login_required
def api_listar_medicamentos():
    try:
        # Verificar autenticação
        autenticado, _ = esta_autenticado()
        if not autenticado:
            return jsonify({'success': False, 'message': 'Usuário não autenticado'}), 401
        
        # Buscar medicamentos do banco de dados
        medicamentos = PrescricaoClinica.query.with_entities(PrescricaoClinica.medicamentos_json).all()
        
        # Processar os dados
        result = []
        for medicamento in medicamentos:
            if medicamento.medicamentos_json:
                import json
                try:
                    medicamentos_data = json.loads(medicamento.medicamentos_json)
                    for med in medicamentos_data:
                        result.append({
                            'nome_medicamento': med.get('nome_medicamento', ''),
                            'descricao_uso': med.get('descricao_uso', ''),
                            'aprazamento': med.get('aprazamento', ''),
                            'enfermeiro_nome': ''
                        })
                except json.JSONDecodeError:
                    logging.error(f"Erro ao decodificar JSON de medicamentos para prescrição ID {medicamento.id}")
        
        return jsonify({
            'success': True,
            'medicamentos': result
        })
    
    except Exception as e:
        logging.error(f"Erro ao buscar medicamentos: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar medicamentos'
        }), 500

# API para listar prescrições médicas
@bp.route('/api/prescricoes/<int:internacao_id>', methods=['GET'])
@login_required
def listar_prescricoes(internacao_id):
    """
    Lista todas as prescrições médicas de uma internação.
    ---
    tags:
      - Prescrições
    parameters:
      - name: internacao_id
        in: path
        type: integer
        required: true
        description: ID da internação
    responses:
      200:
        description: Lista de prescrições
      404:
        description: Internação não encontrada
      500:
        description: Erro interno do servidor
    """
    try:
        # Verificar se a internação existe
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        # Buscar todas as prescrições dessa internação
        prescricoes = PrescricaoClinica.query.filter_by(atendimentos_clinica_id=internacao_id).all()
        
        # Formatar a resposta
        resultado = []
        for prescricao in prescricoes:
            medico = Funcionario.query.get(prescricao.medico_id)
            enfermeiro = None
            if prescricao.enfermeiro_id:
                enfermeiro = Funcionario.query.get(prescricao.enfermeiro_id)
            
            # Processar medicamentos do JSON, se existirem
            medicamentos = []
            if prescricao.medicamentos_json:
                import json
                try:
                    medicamentos_data = json.loads(prescricao.medicamentos_json)
                    medicamentos = medicamentos_data
                except json.JSONDecodeError:
                    logging.error(f"Erro ao decodificar JSON de medicamentos para prescrição ID {prescricao.id}")
            
            resultado.append({
                'id': prescricao.id,
                'data_prescricao': prescricao.horario_prescricao.strftime('%d/%m/%Y %H:%M') if prescricao.horario_prescricao else None,
                'medico': medico.nome if medico else 'Não informado',
                'enfermeiro': enfermeiro.nome if enfermeiro else None,
                'texto_dieta': prescricao.texto_dieta,
                'texto_procedimento_medico': prescricao.texto_procedimento_medico,
                'texto_procedimento_multi': prescricao.texto_procedimento_multi,
                'medicamentos': medicamentos
            })
        
        return jsonify({
            'success': True,
            'prescricoes': resultado
        }), 200
        
    except Exception as e:
        logging.error(f'Erro ao listar prescrições: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor'
        }), 500

# API para registrar ou atualizar prescrição
@bp.route('/api/prescricoes', methods=['POST'])
@login_required
def registrar_prescricao():
    """
    Registra uma nova prescrição médica.
    ---
    tags:
      - Prescrições
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - atendimentos_clinica_id
          properties:
            atendimentos_clinica_id:
              type: integer
              description: ID da internação
            texto_dieta:
              type: string
              description: Texto da dieta prescrita
            texto_procedimento_medico:
              type: string
              description: Texto do procedimento médico
            texto_procedimento_multi:
              type: string
              description: Texto do procedimento multidisciplinar
            medicamentos:
              type: array
              description: Lista de medicamentos prescritos
    responses:
      201:
        description: Prescrição registrada com sucesso
      400:
        description: Dados inválidos ou incompletos
      401:
        description: Usuário não autorizado
      404:
        description: Internação não encontrada
      500:
        description: Erro interno do servidor
    """
    try:
        current_user = get_current_user()
        dados = request.get_json()
        
        # Valida os campos obrigatórios
        if not dados.get('atendimentos_clinica_id'):
            return jsonify({
                'success': False,
                'message': 'ID da internação é obrigatório'
            }), 400
        
        # Verifica se a internação existe
        internacao = Internacao.query.get(dados['atendimentos_clinica_id'])
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        # Serializa a lista de medicamentos como JSON se existir
        medicamentos_json = None
        if 'medicamentos' in dados and dados['medicamentos']:
            import json
            medicamentos_json = json.dumps(dados['medicamentos'])
        
        # Cria a nova prescrição
        nova_prescricao = PrescricaoClinica(
            atendimentos_clinica_id=dados['atendimentos_clinica_id'],
            medico_id=current_user.id,
            texto_dieta=dados.get('texto_dieta'),
            texto_procedimento_medico=dados.get('texto_procedimento_medico'),
            texto_procedimento_multi=dados.get('texto_procedimento_multi'),
            medicamentos_json=medicamentos_json,
            horario_prescricao=datetime.now()
        )
        
        db.session.add(nova_prescricao)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prescrição registrada com sucesso',
            'id': nova_prescricao.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar prescrição: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# API para atualizar prescrição existente
@bp.route('/api/prescricoes/<int:prescricao_id>', methods=['PUT'])
@login_required
def atualizar_prescricao(prescricao_id):
    """
    Atualiza uma prescrição médica existente.
    ---
    tags:
      - Prescrições
    parameters:
      - name: prescricao_id
        in: path
        type: integer
        required: true
        description: ID da prescrição
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            texto_dieta:
              type: string
              description: Texto da dieta prescrita
            texto_procedimento_medico:
              type: string
              description: Texto do procedimento médico
            texto_procedimento_multi:
              type: string
              description: Texto do procedimento multidisciplinar
            medicamentos:
              type: array
              description: Lista de medicamentos prescritos
    responses:
      200:
        description: Prescrição atualizada com sucesso
      400:
        description: Dados inválidos
      401:
        description: Usuário não autorizado
      404:
        description: Prescrição não encontrada
      500:
        description: Erro interno do servidor
    """
    try:
        current_user = get_current_user()
        dados = request.get_json()
        
        # Verifica se a prescrição existe
        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            return jsonify({
                'success': False,
                'message': 'Prescrição não encontrada'
            }), 404
        
        # Serializa a lista de medicamentos como JSON se existir
        if 'medicamentos' in dados and dados['medicamentos']:
            import json
            prescricao.medicamentos_json = json.dumps(dados['medicamentos'])
        
        # Atualiza os campos da prescrição
        if 'texto_dieta' in dados:
            prescricao.texto_dieta = dados['texto_dieta']
        if 'texto_procedimento_medico' in dados:
            prescricao.texto_procedimento_medico = dados['texto_procedimento_medico']
        if 'texto_procedimento_multi' in dados:
            prescricao.texto_procedimento_multi = dados['texto_procedimento_multi']
        
        # Salva as alterações
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prescrição atualizada com sucesso'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao atualizar prescrição: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# ------------------------------
# O resto do arquivo permanece igual
# ------------------------------
