from flask_login import login_required, current_user, LoginManager, login_user, logout_user
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, Flask, send_file, current_app, abort, render_template_string
import pdfkit
from datetime import datetime, timezone, timedelta, date, time
import logging
import traceback
import re
import json
import chardet
import os
import random
from docxtpl import DocxTemplate
from app import db
from app.models import Funcionario, Paciente, Atendimento, InternacaoSae, Internacao, EvolucaoAtendimentoClinica, PrescricaoClinica, EvolucaoEnfermagem, PrescricaoEnfermagem, InternacaoEspecial, Aprazamento, ReceituarioClinica, AtestadoClinica, PacienteRN
# from flask_login import login_required, current_user

# Cria o Blueprint principal
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


# GET /api/medico/nome
@bp.route('/api/medico/nome', methods=['GET'])
@login_required
def get_nome_medico():
    """
    Retorna o nome do médico logado.
    """
    try:
        if current_user.cargo.lower() != 'medico':
            return jsonify({'success': False, 'message': 'Usuário não é médico.'}), 403

        return jsonify({
            'success': True,
            'nome': current_user.nome
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao buscar nome do médico.',
            'error': str(e)
        }), 500

# POST /api/medico/mudar-senha
@bp.route('/api/medico/mudar-senha', methods=['POST'])
@login_required
def mudar_senha_medico():
    """
    Permite que o médico altere a própria senha.
    """
    try:
        dados = request.get_json()

        senha_atual = dados.get('senha_atual')
        nova_senha = dados.get('nova_senha')

        if not senha_atual or not nova_senha:
            return jsonify({'success': False, 'message': 'Campos obrigatórios não preenchidos.'}), 400

        # Verificar se a senha atual confere
        if not current_user.check_password(senha_atual):
            return jsonify({'success': False, 'message': 'Senha atual incorreta.'}), 400

        # Atualizar a senha
        current_user.set_password(nova_senha)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Senha alterada com sucesso.'})

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Erro ao alterar a senha.',
            'error': str(e)
        }), 500

# Rota protegida para médicos redirecionarem
@bp.route('/medico')
@login_required
def painel_medico():
    if not current_user.is_authenticated:
        # Se o usuário não está autenticado, redireciona para login
        return redirect(url_for('main.login'))


    funcionario = Funcionario.query.get(current_user.get_id())
    if funcionario and funcionario.cargo.strip().lower() == 'medico':
        return render_template('medico.html')
    else:
        return redirect(url_for('main.login'))
    
@bp.route('/enfermeiro')
@login_required
def painel_enfermeiro():
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





@bp.route('/api/pacientes/internados')
@login_required
def listar_pacientes_internados():
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'error': 'Acesso não autorizado'}), 403
        
        # Buscar internações ativas (sem data de alta)
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
                    'diagnostico': internacao.diagnostico,
                    'diagnostico_inicial': internacao.diagnostico_inicial,
                    'cid_principal': internacao.cid_principal,
                    'carater_internacao': internacao.carater_internacao
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

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            # Log para diagnóstico
            logging.info("Recebendo requisição de login")
            
            # Obter dados do formulário
            cpf = request.form.get('cpf')
            senha = request.form.get('senha')
            
            if not cpf or not senha:
                logging.warning("Tentativa de login sem CPF ou senha")
                return jsonify({
                    'success': False,
                    'error': 'CPF e senha são obrigatórios.'
                }), 400
            
            # Log para diagnóstico
            logging.info(f"Tentativa de login para CPF: {cpf}")
            
            # Buscar funcionário pelo CPF
            funcionario = Funcionario.query.filter_by(cpf=cpf).first()
            
            if not funcionario:
                logging.warning(f"Login falhou: CPF {cpf} não encontrado")
                return jsonify({
                    'success': False,
                    'error': 'CPF ou senha inválidos.'
                })
            
            # Verificar a senha
            if not funcionario.check_password(senha):
                logging.warning(f"Login falhou: Senha incorreta para CPF {cpf}")
                return jsonify({
                    'success': False,
                    'error': 'CPF ou senha inválidos.'
                })
            
            # Login bem-sucedido
            login_user(funcionario)
            
            # Armazenar dados na sessão
            session['cargo'] = funcionario.cargo
            session['user_id'] = funcionario.id
            
            # Log para diagnóstico
            logging.info(f"Usuário {funcionario.nome} (ID: {funcionario.id}) com cargo {funcionario.cargo} logado com sucesso")
            
            return jsonify({
                'success': True,
                'cargo': funcionario.cargo
            })
            
        except Exception as e:
            # Log detalhado do erro
            logging.error(f"Erro no processamento do login: {str(e)}")
            logging.error(traceback.format_exc())
            
            # Retornar resposta de erro
            return jsonify({
                'success': False,
                'error': 'Erro interno do servidor. Por favor, tente novamente.'
            }), 500
    else:
        return render_template('login.html')


# API para registrar SAE
@bp.route('/api/enfermagem/sae', methods=['POST'])
@login_required
def registrar_sae():
    try:
        # Verificar se o usuário é enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() != 'enfermeiro':
            return jsonify({
                'success': False,
                'message': 'Apenas enfermeiros podem registrar SAE'
            }), 403
        
        dados = request.get_json()
        
        # Validar dados obrigatórios
        campos_obrigatorios = [
            'paciente_id',
            'hipotese_diagnostica',
            'pa', 'fc', 'sat', 'dx', 'r', 't',
            'medicacao', 'alergias', 'antecedentes_pessoais',
            'sistema_neurologico', 'estado_geral', 'ventilacao',
            'diagnostico_de_enfermagem', 'pele',
            'sistema_gastrointerstinal', 'regulacao_vascular',
            'pulso', 'regulacao_abdominal', 'rha',
            'sistema_urinario', 'acesso_venoso', 'observacao'
        ]
        
        for campo in campos_obrigatorios:
            if campo not in dados:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório ausente: {campo}'
                }), 400
        
        # Criar nova SAE
        nova_sae = InternacaoSae(
            paciente_id=dados['paciente_id'],
            enfermeiro_id=current_user.id,
            hipotese_diagnostica=dados['hipotese_diagnostica'],
            pa=dados['pa'],
            fc=dados['fc'],
            sat=dados['sat'],
            dx=dados['dx'],
            r=dados['r'],
            t=dados['t'],
            medicacao=dados['medicacao'],
            alergias=dados['alergias'],
            antecedentes_pessoais=dados['antecedentes_pessoais'],
            sistema_neurologico=dados['sistema_neurologico'],
            estado_geral=dados['estado_geral'],
            ventilacao=dados['ventilacao'],
            diagnostico_de_enfermagem=dados['diagnostico_de_enfermagem'],
            pele=dados['pele'],
            sistema_gastrointerstinal=dados['sistema_gastrointerstinal'],
            regulacao_vascular=dados['regulacao_vascular'],
            pulso=dados['pulso'],
            regulacao_abdominal=dados['regulacao_abdominal'],
            rha=dados['rha'],
            sistema_urinario=dados['sistema_urinario'],
            acesso_venoso=dados['acesso_venoso'],
            observacao=dados['observacao']
        )
        
        db.session.add(nova_sae)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'SAE registrada com sucesso',
            'id': nova_sae.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar SAE: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
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

@bp.route('/api/medicamentos', methods=['GET'])
@login_required
def api_listar_medicamentos():
    try:
        # Verificar autenticação
        autenticado, _ = esta_autenticado()
        if not autenticado:
            return jsonify({'success': False, 'message': 'Usuário não autenticado'}), 401

        # Buscar medicamentos a partir dos aprazamentos
        aprazamentos = Aprazamento.query.all()

        result = []
        nomes_unicos = set()

        for apr in aprazamentos:
            chave = (apr.nome_medicamento.strip().lower(), (apr.descricao_uso or '').strip().lower())
            if chave not in nomes_unicos:
                nomes_unicos.add(chave)
                result.append({
                    'nome_medicamento': apr.nome_medicamento,
                    'descricao_uso': apr.descricao_uso or '',
                    'aprazamento': '',  
                    'enfermeiro_nome': ''  
                })

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


@bp.route('/api/prescricoes/<int:internacao_id>', methods=['GET'])
@login_required
def listar_prescricoes(internacao_id):
    """
    Lista todas as prescrições médicas de uma internação.
    Inclui aprazamentos da nova tabela Aprazamento.
    """
    try:
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        prescricoes = PrescricaoClinica.query.filter_by(atendimentos_clinica_id=internacao_id).all()

        # ------- Função para corrigir o formato do aprazamento -------
        from datetime import date

        def corrigir_aprazamento(aprazamento_raw):
            if not aprazamento_raw:
                return ""
            aprazamento_str = str(aprazamento_raw).strip()

            padrao_completo = r'^\d{2}/\d{2}/\d{4}\s*:\s*\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*(?:\s*;\s*\d{2}/\d{2}/\d{4}\s*:\s*\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*)*$'
            padrao_apenas_horarios = r'^\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2})*$'

            if re.match(padrao_completo, aprazamento_str):
                return aprazamento_str

            if re.match(padrao_apenas_horarios, aprazamento_str):
                hoje = date.today()
                return f"{hoje.day:02d}/{hoje.month:02d}/{hoje.year}: {aprazamento_str}"

            # Corrigir formatos quebrados
            partes = aprazamento_str.split(':')
            if len(partes) > 2:
                data_match = re.match(r'^(\d{2}/\d{2}/\d{4})', aprazamento_str)
                if data_match:
                    data = data_match.group(1)
                    horarios_match = re.findall(r'(\d{2}:\d{2})(?:,\s*|$)', aprazamento_str)
                    if horarios_match:
                        return f"{data}: {', '.join(horarios_match)}"

            return aprazamento_str

        # --------------------------------------------------------------

        resultado = []
        for prescricao in prescricoes:
            medico = Funcionario.query.get(prescricao.medico_id)
            enfermeiro = Funcionario.query.get(prescricao.enfermeiro_id) if prescricao.enfermeiro_id else None

            # ----- PROCESSAR MEDICAMENTOS -----
            medicamentos = prescricao.medicamentos_json or []
            if isinstance(medicamentos, str):
                import json
                try:
                    medicamentos = json.loads(medicamentos)
                except:
                    medicamentos = []

            medicamentos_formatados = []
            for med in medicamentos:
                aprazamento_corrigido = corrigir_aprazamento(med.get('aprazamento'))
                
                # Obter aprazamentos da nova tabela para este medicamento
                aprazamentos_novos = []
                if med.get('nome_medicamento'):
                    aprazamentos_db = Aprazamento.query.filter_by(
                        prescricao_id=prescricao.id, 
                        nome_medicamento=med.get('nome_medicamento')
                    ).order_by(Aprazamento.data_hora_aprazamento).all()
                    
                    for apz in aprazamentos_db:
                        enfermeiro_resp = Funcionario.query.get(apz.enfermeiro_responsavel_id) if apz.enfermeiro_responsavel_id else None
                        
                        aprazamentos_novos.append({
                            'id': apz.id,
                            'data_hora': apz.data_hora_aprazamento.strftime('%d/%m/%Y %H:%M'),
                            'realizado': apz.realizado,
                            'enfermeiro_nome': enfermeiro_resp.nome if enfermeiro_resp else None,
                            'data_realizacao': apz.data_realizacao.strftime('%d/%m/%Y %H:%M') if apz.data_realizacao else None
                        })
                
                medicamentos_formatados.append({
                    'nome_medicamento': med.get('nome_medicamento'),
                    'descricao_uso': med.get('descricao_uso'),
                    'aprazamentos_novos': aprazamentos_novos  # Novos aprazamentos da tabela
                })

            # ----- BUSCAR APRAZAMENTOS GERAIS DA PRESCRIÇÃO -----
            aprazamentos_gerais = []
            aprazamentos_db = Aprazamento.query.filter_by(
                prescricao_id=prescricao.id
            ).order_by(Aprazamento.data_hora_aprazamento).all()
            
            for apz in aprazamentos_db:
                enfermeiro_resp = Funcionario.query.get(apz.enfermeiro_responsavel_id) if apz.enfermeiro_responsavel_id else None
                
                # Verificar se já existe na lista de medicamentos
                ja_incluido = False
                for med in medicamentos_formatados:
                    if med['nome_medicamento'] == apz.nome_medicamento:
                        ja_incluido = True
                        break
                
                # Se não foi incluído nos medicamentos específicos, adicionar aos gerais
                if not ja_incluido:
                    aprazamentos_gerais.append({
                        'id': apz.id,
                        'nome_medicamento': apz.nome_medicamento,
                        'descricao_uso': apz.descricao_uso,
                        'data_hora': apz.data_hora_aprazamento.strftime('%d/%m/%Y %H:%M'),
                        'realizado': apz.realizado,
                        'enfermeiro_nome': enfermeiro_resp.nome if enfermeiro_resp else None,
                        'data_realizacao': apz.data_realizacao.strftime('%d/%m/%Y %H:%M') if apz.data_realizacao else None
                    })

            # ----- MONTAR RESULTADO -----
            resultado.append({
                'id': prescricao.id,
                'data_prescricao': prescricao.horario_prescricao.strftime('%d/%m/%Y %H:%M') if prescricao.horario_prescricao else None,
                'medico_nome': medico.nome if medico else 'Não informado',
                'enfermeiro_nome': enfermeiro.nome if enfermeiro else None,
                'texto_dieta': prescricao.texto_dieta,
                'texto_procedimento_medico': prescricao.texto_procedimento_medico,
                'texto_procedimento_multi': prescricao.texto_procedimento_multi,
                'aprazamentos_gerais': aprazamentos_gerais,  # Novos aprazamentos da tabela
                'medicamentos': medicamentos_formatados
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
            'message': 'Erro ao listar prescrições',
            'error': str(e)
        }), 500


# API para registrar ou atualizar prescrição
@bp.route('/api/prescricoes', methods=['POST'])
@login_required
def registrar_prescricao():
    """
    Registra uma nova prescrição médica.
    Agora também cria registros na tabela Aprazamento para todos os medicamentos com informações de aprazamento.
    """
    try:
        current_user = get_current_user()
        dados = request.get_json()
        
        if not dados.get('atendimentos_clinica_id'):
            return jsonify({
                'success': False,
                'message': 'ID da internação é obrigatório'
            }), 400
        
        internacao = Internacao.query.get(dados['atendimentos_clinica_id'])
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        nova_prescricao = PrescricaoClinica(
            atendimentos_clinica_id=dados['atendimentos_clinica_id'],
            medico_id=current_user.id,
            texto_dieta=dados.get('texto_dieta'),
            texto_procedimento_medico=dados.get('texto_procedimento_medico'),
            texto_procedimento_multi=dados.get('texto_procedimento_multi'),
            horario_prescricao=datetime.now(timezone(timedelta(hours=-3)))
        )

        # Se vierem medicamentos, usa o setter automático
        if 'medicamentos' in dados:
            nova_prescricao.medicamentos_json = dados['medicamentos']

        db.session.add(nova_prescricao)
        db.session.flush()  # Gera o ID da nova prescrição sem fazer commit

        # Processar os aprazamentos dos medicamentos, caso existam
        if 'medicamentos' in dados and isinstance(dados['medicamentos'], list):
            for medicamento in dados['medicamentos']:
                # Verificar se existe informação de aprazamento
                if medicamento.get('aprazamento'):
                    try:
                        # Processar o texto de aprazamento para criar registros individuais
                        aprazamento_texto = medicamento.get('aprazamento')
                        
                        # Formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
                        dias = aprazamento_texto.split(';')
                        
                        for dia in dias:
                            dia = dia.strip()
                            if not dia:
                                continue
                                
                            partes = dia.split(':')
                            if len(partes) < 2:
                                continue
                                
                            data_str = partes[0].strip()
                            horarios_str = ':'.join(partes[1:]).strip()  # Reconectar caso haja múltiplos ":" após o primeiro
                            
                            horarios = [h.strip() for h in horarios_str.split(',')]
                            
                            try:
                                # Converter data no formato DD/MM/YYYY para objeto Date
                                dia, mes, ano = map(int, data_str.split('/'))
                                
                                for horario in horarios:
                                    if not horario:
                                        continue
                                        
                                    # Converter horário no formato HH:MM para objeto Time
                                    hora, minuto = map(int, horario.split(':'))
                                    
                                    # Criar o objeto DateTime combinando a data e o horário
                                    data_hora = datetime(ano, mes, dia, hora, minuto)
                                    
                                    # Criar registro de Aprazamento
                                    novo_aprazamento = Aprazamento(
                                        prescricao_id=nova_prescricao.id,
                                        nome_medicamento=medicamento.get('nome_medicamento', ''),
                                        descricao_uso=medicamento.get('descricao_uso', ''),
                                        data_hora_aprazamento=data_hora,
                                        enfermeiro_responsavel_id=dados.get('enfermeiro_id')
                                    )
                                    
                                    db.session.add(novo_aprazamento)
                                    
                            except Exception as e:
                                logging.error(f"Erro ao processar aprazamento para a data {data_str}: {str(e)}")
                                continue
                    except Exception as e:
                        logging.error(f"Erro ao processar aprazamento do medicamento {medicamento.get('nome_medicamento')}: {str(e)}")
                        continue

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
            'message': 'Erro interno do servidor'
        }), 500


# API para atualizar prescrição existente
@bp.route('/api/prescricoes/<int:prescricao_id>', methods=['PUT'])
@login_required
def atualizar_prescricao(prescricao_id):
    """
    Atualiza uma prescrição médica existente.
    Agora também atualiza os registros na tabela Aprazamento quando os medicamentos são alterados.
    """
    try:
        current_user = get_current_user()
        dados = request.get_json()
        
        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            return jsonify({
                'success': False,
                'message': 'Prescrição não encontrada'
            }), 404
        
        if 'texto_dieta' in dados:
            prescricao.texto_dieta = dados['texto_dieta']
        if 'texto_procedimento_medico' in dados:
            prescricao.texto_procedimento_medico = dados['texto_procedimento_medico']
        if 'texto_procedimento_multi' in dados:
            prescricao.texto_procedimento_multi = dados['texto_procedimento_multi']
        
        if 'medicamentos' in dados:
            # Obter lista anterior de medicamentos para comparar
            medicamentos_anteriores = prescricao.medicamentos_json
            
            # Atualizar medicamentos na prescrição
            prescricao.medicamentos_json = dados['medicamentos']
            
            # Processar aprazamentos atualizados
            if isinstance(dados['medicamentos'], list):
                # Manter um registro dos medicamentos que ainda existem
                nomes_medicamentos_atuais = set()
                
                for medicamento in dados['medicamentos']:
                    nome_medicamento = medicamento.get('nome_medicamento', '')
                    nomes_medicamentos_atuais.add(nome_medicamento)
                    
                    # Verificar se existe informação de aprazamento
                    if medicamento.get('aprazamento'):
                        # Se for um medicamento novo ou se o aprazamento foi alterado, atualizar
                        medicamento_anterior = None
                        if isinstance(medicamentos_anteriores, list):
                            for med_ant in medicamentos_anteriores:
                                if med_ant.get('nome_medicamento') == nome_medicamento:
                                    medicamento_anterior = med_ant
                                    break
                        
                        aprazamento_alterado = (
                            not medicamento_anterior or 
                            medicamento_anterior.get('aprazamento') != medicamento.get('aprazamento')
                        )
                        
                        if aprazamento_alterado:
                            # Remover aprazamentos anteriores deste medicamento
                            Aprazamento.query.filter_by(
                                prescricao_id=prescricao_id, 
                                nome_medicamento=nome_medicamento
                            ).delete()
                            
                            try:
                                # Processar o texto de aprazamento para criar registros individuais
                                aprazamento_texto = medicamento.get('aprazamento')
                                
                                # Formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
                                dias = aprazamento_texto.split(';')
                                
                                for dia in dias:
                                    dia = dia.strip()
                                    if not dia:
                                        continue
                                        
                                    partes = dia.split(':')
                                    if len(partes) < 2:
                                        continue
                                        
                                    data_str = partes[0].strip()
                                    horarios_str = ':'.join(partes[1:]).strip()  # Reconectar caso haja múltiplos ":" após o primeiro
                                    
                                    horarios = [h.strip() for h in horarios_str.split(',')]
                                    
                                    try:
                                        # Converter data no formato DD/MM/YYYY para objeto Date
                                        dia, mes, ano = map(int, data_str.split('/'))
                                        
                                        for horario in horarios:
                                            if not horario:
                                                continue
                                                
                                            # Converter horário no formato HH:MM para objeto Time
                                            hora, minuto = map(int, horario.split(':'))
                                            
                                            # Criar o objeto DateTime combinando a data e o horário
                                            data_hora = datetime(ano, mes, dia, hora, minuto)
                                            
                                            # Criar registro de Aprazamento
                                            novo_aprazamento = Aprazamento(
                                                prescricao_id=prescricao_id,
                                                nome_medicamento=nome_medicamento,
                                                descricao_uso=medicamento.get('descricao_uso', ''),
                                                data_hora_aprazamento=data_hora,
                                                enfermeiro_responsavel_id=dados.get('enfermeiro_id')
                                            )
                                            
                                            db.session.add(novo_aprazamento)
                                            
                                    except Exception as e:
                                        logging.error(f"Erro ao processar aprazamento para a data {data_str}: {str(e)}")
                                        continue
                            except Exception as e:
                                logging.error(f"Erro ao processar aprazamento do medicamento {nome_medicamento}: {str(e)}")
                                continue
                
                # Remover aprazamentos de medicamentos que não existem mais
                if isinstance(medicamentos_anteriores, list):
                    for med_ant in medicamentos_anteriores:
                        nome_ant = med_ant.get('nome_medicamento', '')
                        if nome_ant and nome_ant not in nomes_medicamentos_atuais:
                            # Este medicamento foi removido, então devemos remover seus aprazamentos
                            Aprazamento.query.filter_by(
                                prescricao_id=prescricao_id, 
                                nome_medicamento=nome_ant
                            ).delete()

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
            'message': 'Erro interno do servidor'
        }), 500


@bp.route('/clinica/evolucao-paciente-enfermeiro/<string:atendimento_id>')
@login_required
def evolucao_paciente_enfermeiro(atendimento_id):
    try:
        # Verificar se o usuário é enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() != 'enfermeiro':
            flash('Acesso restrito a enfermeiros.', 'danger')
            return redirect(url_for('main.index'))
        
        # Buscar dados do paciente e internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('clinica_evolucao_paciente_enfermeiro.html', 
                            paciente=paciente, 
                            internacao=internacao)
        
    except Exception as e:
        logging.error(f"Erro ao acessar evolução do paciente (enfermeiro): {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a evolução do paciente. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

@bp.route('/clinica/evolucao-paciente-medico/<string:atendimento_id>')
@login_required
def evolucao_paciente_medico(atendimento_id):
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            flash('Acesso restrito a médicos.', 'danger')
            return redirect(url_for('main.index'))
        
        # Buscar dados do paciente e internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('clinica_evolucao_paciente_medico.html', 
                            paciente=paciente, 
                            internacao=internacao)
        
    except Exception as e:
        logging.error(f"Erro ao acessar evolução do paciente (médico): {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a evolução do paciente. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

## Evoluçao:

@bp.route('/api/evolucoes/<int:internacao_id>', methods=['GET'])
def get_evolucoes(internacao_id):
    try:
        # Buscar todas as evoluções dessa internação
        evolucoes = EvolucaoAtendimentoClinica.query \
            .filter_by(atendimentos_clinica_id=internacao_id) \
            .join(Funcionario, EvolucaoAtendimentoClinica.funcionario_id == Funcionario.id) \
            .add_columns(
                EvolucaoAtendimentoClinica.id,
                EvolucaoAtendimentoClinica.data_evolucao,
                EvolucaoAtendimentoClinica.evolucao,
                Funcionario.nome.label('nome_medico')
            ) \
            .order_by(EvolucaoAtendimentoClinica.data_evolucao.desc()) \
            .all()

        evolucoes_list = []
        for ev in evolucoes:
            evolucao_dict = {
                'id': ev.id,
                'data_evolucao': ev.data_evolucao.strftime('%d/%m/%Y %H:%M') if ev.data_evolucao else '',
                'evolucao': ev.evolucao or '',
                'nome_medico': ev.nome_medico or ''
            }
            evolucoes_list.append(evolucao_dict)

        return jsonify({
            'success': True,
            'evolucoes': evolucoes_list
        })

    except Exception as e:
        print('Erro ao buscar evoluções:', str(e))
        return jsonify({
            'success': False,
            'message': 'Erro ao buscar evoluções',
            'error': str(e)
        }), 500
    

@bp.route('/api/evolucoes/registrar', methods=['POST'])
def registrar_evolucao():
    try:
        data = request.get_json()

        # Aceitar tanto internacao_id quanto atendimentos_clinica_id
        atendimentos_clinica_id = data.get('atendimentos_clinica_id')
        if not atendimentos_clinica_id:
            atendimentos_clinica_id = data.get('internacao_id')
        
        funcionario_id = data.get('funcionario_id')
        evolucao_texto = data.get('evolucao')

        if not atendimentos_clinica_id or not funcionario_id or not evolucao_texto:
            return jsonify({
                'success': False,
                'message': 'Campos obrigatórios não foram preenchidos.'
            }), 400

        # Logging para debug
        print(f"Registrando evolução - atendimentos_clinica_id: {atendimentos_clinica_id}, funcionario_id: {funcionario_id}")
        
        nova_evolucao = EvolucaoAtendimentoClinica(
            atendimentos_clinica_id=atendimentos_clinica_id,
            funcionario_id=funcionario_id,
            data_evolucao=datetime.now(timezone(timedelta(hours=-3))),
            evolucao=evolucao_texto
        )

        db.session.add(nova_evolucao)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Evolução registrada com sucesso.'
        })

    except Exception as e:
        print('Erro ao registrar evolução:', str(e))
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Erro ao registrar evolução.',
            'error': str(e)
        }), 500


@bp.route('/api/enfermagem/evolucoes', methods=['GET', 'POST'])
def evolucoes_enfermagem():
    if request.method == 'POST':
        data = request.get_json()
        try:
            nova_evolucao = EvolucaoEnfermagem(
                atendimentos_clinica_id=data['atendimentos_clinica_id'],
                funcionario_id=data['funcionario_id'],
                texto=data['texto']
            )
            db.session.add(nova_evolucao)
            db.session.commit()
            return jsonify({'message': 'Evolução de enfermagem criada com sucesso.'}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    elif request.method == 'GET':
        evolucoes = EvolucaoEnfermagem.query.all()
        resultado = []
        for evolucao in evolucoes:
            resultado.append({
                'id': evolucao.id,
                'atendimentos_clinica_id': evolucao.atendimentos_clinica_id,
                'funcionario_id': evolucao.funcionario_id,
                'data_evolucao': evolucao.data_evolucao.isoformat(),
                'texto': evolucao.texto
            })
        return jsonify(resultado), 200
    
@bp.route('/api/enfermagem/evolucao', methods=['GET'])
def listar_evolucoes_enfermagem():
    evolucoes = EvolucaoEnfermagem.query.all()
    resultado = []
    for evolucao in evolucoes:
        resultado.append({
            'id': evolucao.id,
            'atendimentos_clinica_id': evolucao.atendimentos_clinica_id,
            'funcionario_id': evolucao.funcionario_id,
            'data_evolucao': evolucao.data_evolucao.isoformat(),
            'texto': evolucao.texto
        })
    return jsonify(resultado), 200

# Adicionar rota POST para registrar evolução de enfermagem
@bp.route('/api/enfermagem/evolucao', methods=['POST'])
def registrar_evolucao_enfermagem():
    data = request.get_json()
    if not data:
        return jsonify({'erro': 'Dados não fornecidos'}), 400

    try:
        nova_evolucao = EvolucaoEnfermagem(
            atendimentos_clinica_id=data['atendimentos_clinica_id'],
            funcionario_id=data['funcionario_id'],
            texto=data['texto'],
            data_evolucao=datetime.now(timezone(timedelta(hours=-3)))
        )
        db.session.add(nova_evolucao)
        db.session.commit()
        
        return jsonify({
            'mensagem': 'Evolução de enfermagem registrada com sucesso!',
            'evolucao_id': nova_evolucao.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar evolução de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'erro': f'Erro ao registrar evolução: {str(e)}'}), 500


@bp.route('/api/enfermagem/admissao', methods=['POST'])
def salvar_admissao_enfermagem():
    dados = request.get_json()
    try:
        nova_evolucao = EvolucaoEnfermagem(
            atendimentos_clinica_id=dados['atendimentos_clinica_id'],
            funcionario_id=dados['funcionario_id'],
            texto=dados['texto'],
            data_evolucao=datetime.now(timezone(timedelta(hours=-3)))
        )
        db.session.add(nova_evolucao)
        
        # Também atualizar o campo admissao_enfermagem na tabela Internacao
        internacao = Internacao.query.get(dados['atendimentos_clinica_id'])
        if internacao:
            internacao.admissao_enfermagem = dados['texto']
        
        # Salvar todas as alterações
        db.session.commit()
        
        return jsonify({
            'mensagem': 'Admissão de enfermagem registrada com sucesso',
            'evolucao_id': nova_evolucao.id
        }), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao salvar admissão de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'erro': str(e)}), 400
    
@bp.route('/api/enfermagem/atualizar/<int:id>', methods=['PUT'])
def atualizar_evolucao_enfermagem(id):
    dados = request.get_json()
    try:
        evolucao = EvolucaoEnfermagem.query.get_or_404(id)
        evolucao.texto = dados.get('texto', evolucao.texto)
        evolucao.data_evolucao = datetime.now(timezone(timedelta(hours=-3)))
        db.session.commit()
        return jsonify({'mensagem': 'Evolução de enfermagem atualizada com sucesso.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 400
    

@bp.route('/api/enfermagem/sae', methods=['POST'])
def criar_sae():
    data = request.get_json()

    try:
        novo_sae = InternacaoSae(
            paciente_id=data['paciente_id'],
            enfermeiro_id=data['enfermeiro_id'],
            hipotese_diagnostica=data.get('hipotese_diagnostica'),
            pa=data.get('pa'),
            fc=data.get('fc'),
            sat=data.get('sat'),
            dx=data.get('dx'),
            r=data.get('r'),
            t=data.get('t'),
            medicacao=data.get('medicacao'),
            alergias=data.get('alergias'),
            antecedentes_pessoais=data.get('antecedentes_pessoais'),
            sistema_neurologico=data.get('sistema_neurologico'),
            estado_geral=data.get('estado_geral'),
            ventilacao=data.get('ventilacao'),
            diagnostico_de_enfermagem=data.get('diagnostico_de_enfermagem'),
            pele=data.get('pele'),
            sistema_gastrointerstinal=data.get('sistema_gastrointerstinal'),
            regulacao_vascular=data.get('regulacao_vascular'),
            pulso=data.get('pulso'),
            regulacao_abdominal=data.get('regulacao_abdominal'),
            rha=data.get('rha'),
            sistema_urinario=data.get('sistema_urinario'),
            acesso_venoso=data.get('acesso_venoso'),
            observacao=data.get('observacao'),
        )
        db.session.add(novo_sae)
        db.session.commit()

        return jsonify({'success': True, 'message': 'SAE registrado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400


# Buscar SAE por paciente_id
@bp.route('/api/enfermagem/sae/<int:paciente_id>', methods=['GET'])
def obter_sae_por_paciente(paciente_id):
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para enfermeiros e médicos'
            }), 403
            
        # Buscar todas as SAEs do paciente, ordenadas por data
        saes = InternacaoSae.query.filter_by(paciente_id=paciente_id).order_by(InternacaoSae.data_registro.desc()).all()
        
        if not saes:
            return jsonify({'success': False, 'error': 'SAE não registrada'}), 404
        
        # Separar SAEs de hoje e anteriores (como nas evoluções)
        hoje = datetime.now(timezone(timedelta(hours=-3))).date()
        sae_hoje = None
        sae_antiga = None
        
        for sae in saes:
            data_sae = sae.data_registro.date()
            if data_sae == hoje and not sae_hoje:
                sae_hoje = sae
            elif not sae_antiga:
                sae_antiga = sae
        
        # Priorizar SAE de hoje, se existir
        sae = sae_hoje if sae_hoje else sae_antiga
        
        # Formatar a resposta
        return jsonify({
            'success': True,
            'sae': {
                'id': sae.id,
                'paciente_id': sae.paciente_id,
                'enfermeiro_id': sae.enfermeiro_id,
                'hipotese_diagnostica': sae.hipotese_diagnostica,
                'pa': sae.pa,
                'fc': sae.fc,
                'sat': sae.sat,
                'dx': sae.dx,
                'r': sae.r,
                't': sae.t,
                'medicacao': sae.medicacao,
                'alergias': sae.alergias,
                'antecedentes_pessoais': sae.antecedentes_pessoais,
                'sistema_neurologico': sae.sistema_neurologico,
                'estado_geral': sae.estado_geral,
                'ventilacao': sae.ventilacao,
                'diagnostico_de_enfermagem': sae.diagnostico_de_enfermagem,
                'pele': sae.pele,
                'sistema_gastrointerstinal': sae.sistema_gastrointerstinal,
                'regulacao_vascular': sae.regulacao_vascular,
                'pulso': sae.pulso,
                'regulacao_abdominal': sae.regulacao_abdominal,
                'rha': sae.rha,
                'sistema_urinario': sae.sistema_urinario,
                'acesso_venoso': sae.acesso_venoso,
                'observacao': sae.observacao,
                'data_registro': sae.data_registro.strftime('%Y-%m-%d %H:%M:%S'),
                'eh_hoje': True if sae_hoje and sae.id == sae_hoje.id else False
            }
        })
    except Exception as e:
        logging.error(f'Erro ao buscar SAE: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Erro ao buscar SAE: {str(e)}'}), 500

# Nova rota para listar o histórico completo de SAE do paciente
@bp.route('/api/enfermagem/sae/historico/<int:paciente_id>', methods=['GET'])
def obter_historico_sae_paciente(paciente_id):
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para enfermeiros e médicos'
            }), 403
            
        # Buscar todas as SAEs do paciente, ordenadas por data
        saes = InternacaoSae.query.filter_by(paciente_id=paciente_id).order_by(InternacaoSae.data_registro.desc()).all()
        
        if not saes:
            return jsonify({'success': False, 'error': 'SAE não registrada'}), 404
        
        # Formatar a resposta para incluir todos os registros SAE
        resultado = []
        for sae in saes:
            resultado.append({
                'id': sae.id,
                'paciente_id': sae.paciente_id,
                'enfermeiro_id': sae.enfermeiro_id,
                'hipotese_diagnostica': sae.hipotese_diagnostica,
                'pa': sae.pa,
                'fc': sae.fc,
                'sat': sae.sat,
                'dx': sae.dx,
                'r': sae.r,
                't': sae.t,
                'medicacao': sae.medicacao,
                'alergias': sae.alergias,
                'antecedentes_pessoais': sae.antecedentes_pessoais,
                'sistema_neurologico': sae.sistema_neurologico,
                'estado_geral': sae.estado_geral,
                'ventilacao': sae.ventilacao,
                'diagnostico_de_enfermagem': sae.diagnostico_de_enfermagem,
                'pele': sae.pele,
                'sistema_gastrointerstinal': sae.sistema_gastrointerstinal,
                'regulacao_vascular': sae.regulacao_vascular,
                'pulso': sae.pulso,
                'regulacao_abdominal': sae.regulacao_abdominal,
                'rha': sae.rha,
                'sistema_urinario': sae.sistema_urinario,
                'acesso_venoso': sae.acesso_venoso,
                'observacao': sae.observacao,
                'data_registro': sae.data_registro.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify({
            'success': True,
            'sae': resultado
        })
    except Exception as e:
        logging.error(f'Erro ao buscar histórico SAE: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Erro ao buscar histórico SAE: {str(e)}'}), 500

# Atualizar SAE existente
@bp.route('/api/enfermagem/sae/<int:id>', methods=['PUT'])
def atualizar_sae(id):
    data = request.get_json()
    sae = InternacaoSae.query.get(id)

    if not sae:
        return jsonify({'success': False, 'error': 'Registro não encontrado'}), 404

    try:
        for campo, valor in data.items():
            if hasattr(sae, campo):
                setattr(sae, campo, valor)
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'SAE atualizado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400


# Listar todos os registros (opcional)
@bp.route('/api/enfermagem/sae', methods=['GET'])
def listar_saes():
    saes = InternacaoSae.query.all()
    resultado = []
    for sae in saes:
        resultado.append({
            'id': sae.id,
            'paciente_id': sae.paciente_id,
            'enfermeiro_id': sae.enfermeiro_id,
            'data_registro': sae.data_registro.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify({'success': True, 'saes': resultado})

# Rota para buscar evoluções de enfermagem por ID de internação
@bp.route('/api/enfermagem/evolucao/<int:internacao_id>', methods=['GET'])
def buscar_evolucoes_enfermagem_por_internacao(internacao_id):
    """
    Busca todas as evoluções de enfermagem para uma internação específica.
    """
    try:
        evolucoes = EvolucaoEnfermagem.query\
            .filter_by(atendimentos_clinica_id=internacao_id)\
            .join(Funcionario, EvolucaoEnfermagem.funcionario_id == Funcionario.id)\
            .add_columns(
                EvolucaoEnfermagem.id,
                EvolucaoEnfermagem.atendimentos_clinica_id,
                EvolucaoEnfermagem.data_evolucao,
                EvolucaoEnfermagem.texto,
                Funcionario.nome.label('enfermeiro_nome')
            )\
            .order_by(EvolucaoEnfermagem.data_evolucao.desc())\
            .all()
        
        resultado = []
        for ev in evolucoes:
            resultado.append({
                'id': ev.id,
                'atendimentos_clinica_id': ev.atendimentos_clinica_id,
                'data_evolucao': ev.data_evolucao.isoformat() if ev.data_evolucao else None,
                'texto': ev.texto,
                'enfermeiro_nome': ev.enfermeiro_nome
            })
        
        return jsonify(resultado), 200
    except Exception as e:
        logging.error(f'Erro ao buscar evoluções de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'erro': f'Erro ao buscar evoluções: {str(e)}'}), 500

# API para listar prescrições de enfermagem por ID de internação
@bp.route('/api/enfermagem/prescricao/<int:internacao_id>', methods=['GET'])
def buscar_prescricoes_enfermagem_por_internacao(internacao_id):
    """
    Busca todas as prescrições de enfermagem para uma internação específica.
    """
    try:
        prescricoes = PrescricaoEnfermagem.query\
            .filter_by(atendimentos_clinica_id=internacao_id)\
            .join(Funcionario, PrescricaoEnfermagem.funcionario_id == Funcionario.id)\
            .add_columns(
                PrescricaoEnfermagem.id,
                PrescricaoEnfermagem.atendimentos_clinica_id,
                PrescricaoEnfermagem.data_prescricao,
                PrescricaoEnfermagem.texto,
                Funcionario.nome.label('enfermeiro_nome')
            )\
            .order_by(PrescricaoEnfermagem.data_prescricao.desc())\
            .all()
        
        resultado = []
        for presc in prescricoes:
            resultado.append({
                'id': presc.id,
                'atendimentos_clinica_id': presc.atendimentos_clinica_id,
                'data_prescricao': presc.data_prescricao.isoformat() if presc.data_prescricao else None,
                'texto': presc.texto,
                'enfermeiro_nome': presc.enfermeiro_nome
            })
        
        return jsonify(resultado), 200
    except Exception as e:
        logging.error(f'Erro ao buscar prescrições de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'erro': f'Erro ao buscar prescrições: {str(e)}'}), 500

# API para registrar nova prescrição de enfermagem
@bp.route('/api/enfermagem/prescricao', methods=['POST'])
def registrar_prescricao_enfermagem():
    data = request.get_json()
    if not data:
        return jsonify({'erro': 'Dados não fornecidos'}), 400

    try:
        nova_prescricao = PrescricaoEnfermagem(
            atendimentos_clinica_id=data['atendimentos_clinica_id'],
            funcionario_id=data['funcionario_id'],
            texto=data['texto'],
            data_prescricao=datetime.now(timezone(timedelta(hours=-3)))
        )
        db.session.add(nova_prescricao)
        db.session.commit()
        
        return jsonify({
            'mensagem': 'Prescrição de enfermagem registrada com sucesso!',
            'prescricao_id': nova_prescricao.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar prescrição de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'erro': f'Erro ao registrar prescrição: {str(e)}'}), 500

# API para atualizar prescrição de enfermagem
@bp.route('/api/enfermagem/prescricao/<int:id>', methods=['PUT'])
def atualizar_prescricao_enfermagem(id):
    dados = request.get_json()
    try:
        prescricao = PrescricaoEnfermagem.query.get_or_404(id)
        prescricao.texto = dados.get('texto', prescricao.texto)
        prescricao.data_prescricao = datetime.now(timezone(timedelta(hours=-3)))
        db.session.commit()
        return jsonify({'mensagem': 'Prescrição de enfermagem atualizada com sucesso.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 400

# API para listar todas as prescrições de enfermagem (opcional)
@bp.route('/api/enfermagem/prescricao', methods=['GET'])
def listar_prescricoes_enfermagem():
    prescricoes = PrescricaoEnfermagem.query.all()
    resultado = []
    for prescricao in prescricoes:
        resultado.append({
            'id': prescricao.id,
            'atendimentos_clinica_id': prescricao.atendimentos_clinica_id,
            'funcionario_id': prescricao.funcionario_id,
            'data_prescricao': prescricao.data_prescricao.isoformat(),
            'texto': prescricao.texto
        })
    return jsonify(resultado), 200

# API para médicos visualizarem prescrições de enfermagem por ID de internação
@bp.route('/api/medico/prescricoes-enfermagem/<int:internacao_id>', methods=['GET'])
@login_required
def medico_visualizar_prescricoes_enfermagem(internacao_id):
    """
    Permite que médicos visualizem prescrições de enfermagem para uma internação específica.
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos'
            }), 403
        
        # Buscar todas as prescrições de enfermagem para esta internação
        prescricoes = PrescricaoEnfermagem.query\
            .filter_by(atendimentos_clinica_id=internacao_id)\
            .join(Funcionario, PrescricaoEnfermagem.funcionario_id == Funcionario.id)\
            .add_columns(
                PrescricaoEnfermagem.id,
                PrescricaoEnfermagem.atendimentos_clinica_id,
                PrescricaoEnfermagem.data_prescricao,
                PrescricaoEnfermagem.texto,
                Funcionario.nome.label('enfermeiro_nome')
            )\
            .order_by(PrescricaoEnfermagem.data_prescricao.desc())\
            .all()
        
        resultado = []
        for presc in prescricoes:
            resultado.append({
                'id': presc.id,
                'atendimentos_clinica_id': presc.atendimentos_clinica_id,
                'data_prescricao': presc.data_prescricao.isoformat() if presc.data_prescricao else None,
                'texto': presc.texto,
                'enfermeiro_nome': presc.enfermeiro_nome
            })
        
        return jsonify({
            'success': True,
            'prescricoes': resultado
        }), 200
    except Exception as e:
        logging.error(f'Erro ao buscar prescrições de enfermagem para médico: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False, 
            'message': f'Erro ao buscar prescrições: {str(e)}'
        }), 500

# API para buscar detalhes de uma internação específica
@bp.route('/api/internacao/<string:internacao_id>', methods=['GET'])
@login_required
def buscar_internacao(internacao_id):
    """
    Busca os detalhes de uma internação específica.
    """
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403
        
        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=internacao_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        # Buscar dados do paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        
        # Formatar resposta
        resultado = {
            'id': internacao.id,
            'atendimento_id': internacao.atendimento_id,
            'paciente_id': internacao.paciente_id,
            'nome_paciente': paciente.nome if paciente else 'Não informado',
            'leito': internacao.leito,
            'data_internacao': internacao.data_internacao.isoformat() if internacao.data_internacao else None,
            'data_alta': internacao.data_alta.isoformat() if internacao.data_alta else None,
            'diagnostico': internacao.diagnostico,
            'diagnostico_inicial': internacao.diagnostico_inicial,
            'cid_principal': internacao.cid_principal,
            'historico_internacao': internacao.historico_internacao,
            'relatorio_alta': internacao.relatorio_alta,
            'conduta': internacao.conduta,
            'cuidados_gerais': internacao.cuidados_gerais
        }
        
        return jsonify({
            'success': True,
            'internacao': resultado
        })
        
    except Exception as e:
        logging.error(f'Erro ao buscar internação: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao buscar internação: {str(e)}'
        }), 500

# API para registrar alta de paciente
@bp.route('/api/internacao/<string:internacao_id>/alta', methods=['POST'])
@login_required
def registrar_alta_paciente(internacao_id):
    """
    Registra a alta de um paciente internado, atribuindo a data de alta.
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem registrar alta.'
            }), 403
        
        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=internacao_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada.'
            }), 404
        
        # Verificar se já tem alta
        if internacao.data_alta:
            return jsonify({
                'success': False,
                'message': 'Paciente já recebeu alta anteriormente.'
            }), 400
        
        # Obter dados do formulário (JSON enviado)
        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado enviado para registrar alta.'
            }), 400
        
        # Atualizar dados da internação com segurança
        internacao.diagnostico = dados.get('diagnostico') or internacao.diagnostico
        internacao.historico_internacao = dados.get('historico_internacao') or internacao.historico_internacao
        internacao.relatorio_alta = dados.get('relatorio_alta') or internacao.relatorio_alta
        internacao.conduta = dados.get('conduta') or internacao.conduta
        internacao.cuidados_gerais = dados.get('cuidados_gerais') or internacao.cuidados_gerais
        internacao.medicacao_alta = dados.get('medicacao') or getattr(internacao, 'medicacao_alta', None)  # Se tiver o campo no modelo

        # Atualizar a data de alta
        internacao.data_alta = datetime.now(timezone(timedelta(hours=-3)))  # Horário de Brasília
        
        # Salvar no banco de dados
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Alta registrada com sucesso.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar alta: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor ao registrar alta.'
        }), 500

# API para registrar paciente e internação
@bp.route('/api/internar-paciente', methods=['POST'])
@login_required
def internar_paciente():
    """
    Registra um novo paciente e cria uma internação associada.
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem realizar internações'
            }), 403
        
        dados = request.get_json()
        
        # Verificar dados obrigatórios para o paciente (reduzido)
        campos_paciente_obrigatorios = ['nome', 'cpf', 'data_nascimento', 'sexo']
        for campo in campos_paciente_obrigatorios:
            if campo not in dados or not dados[campo]:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório não informado: {campo}'
                }), 400
        
        # Verificar dados obrigatórios para a internação
        campos_internacao_obrigatorios = ['diagnostico_inicial', 'leito']
        for campo in campos_internacao_obrigatorios:
            if campo not in dados or not dados[campo]:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório não informado: {campo}'
                }), 400
        
        # Verificar se já existe paciente com o mesmo CPF
        paciente_existente = Paciente.query.filter_by(cpf=dados['cpf']).first()
        
        if paciente_existente:
            paciente = paciente_existente
        else:
            # Converter data de nascimento de string para objeto date
            try:
                data_nascimento = datetime.strptime(dados['data_nascimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Formato de data de nascimento inválido. Use YYYY-MM-DD.'
                }), 400
            
            # Usar valores padrão para campos não obrigatórios
            telefone = dados.get('telefone') if dados.get('telefone') else 'Não informado'
            endereco = dados.get('endereco') if dados.get('endereco') else 'Não informado'
            municipio = dados.get('municipio') if dados.get('municipio') else 'Não informado'
            bairro = dados.get('bairro') if dados.get('bairro') else 'Não informado'
            
            # Criar novo paciente
            paciente = Paciente(
                nome=dados['nome'],
                cpf=dados['cpf'],
                data_nascimento=data_nascimento,
                sexo=dados['sexo'],
                telefone=telefone,
                endereco=endereco,
                municipio=municipio,
                bairro=bairro,
                cartao_sus=dados.get('cartao_sus', ''),
                nome_social=dados.get('nome_social', ''),
                identificado=True
            )
            db.session.add(paciente)
            db.session.flush()  # Obter ID do paciente antes do commit
        
        # Usar ID de atendimento fornecido pelo frontend ou gerar um se não fornecido
        agora = datetime.now()
        atendimento_id = dados.get('atendimento_id')
        
        # Verificar se o ID de atendimento está dentro do limite de 8 dígitos
        if atendimento_id and len(atendimento_id) > 8:
            return jsonify({
                'success': False,
                'message': 'ID de atendimento excede o limite máximo de 8 dígitos.'
            }), 400
            
        if not atendimento_id:
            # Fallback para gerar ID no servidor caso o cliente não envie
            # Formato: AAMMDD + último(s) dígito(s) do ID do paciente para respeitar limite de 8 dígitos
            prefixo_data = agora.strftime('%y%m%d')
            numero_unico = str(paciente.id)[-2:].zfill(2)  # Pega os últimos 2 dígitos do ID do paciente
            atendimento_id = f"{prefixo_data}{numero_unico}"
        
        # Verificar se o ID de atendimento já existe
        atendimento_existente = Atendimento.query.get(atendimento_id)
        if atendimento_existente:
            return jsonify({
                'success': False,
                'message': 'ID de atendimento já existe. Tente novamente.'
            }), 400
        
        # Criar registro de atendimento
        atendimento = Atendimento(
            id=atendimento_id,
            paciente_id=paciente.id,
            funcionario_id=current_user.id,
            medico_id=current_user.id,
            data_atendimento=date.today(),
            hora_atendimento=time(agora.hour, agora.minute, agora.second),
            status='Internado',
            horario_internacao=agora
        )
        db.session.add(atendimento)
        db.session.flush()  # Obter ID antes do commit
        
        # Usar valores padrão para campos não obrigatórios da internação
        justificativa = dados.get('justificativa_internacao') if dados.get('justificativa_internacao') else 'Não informada'
        conduta = dados.get('conduta_inicial') if dados.get('conduta_inicial') else 'Não informada'
        carater = dados.get('carater_internacao') if dados.get('carater_internacao') else 'Não informado'
        
        # Criar nova internação
        internacao = Internacao(
            atendimento_id=atendimento_id,
            paciente_id=paciente.id,
            medico_id=current_user.id,
            data_internacao=datetime.now(timezone(timedelta(hours=-3))),
            diagnostico_inicial=dados['diagnostico_inicial'],
            cid_principal=dados.get('cid_principal', ''),
            carater_internacao=carater,
            justificativa_internacao_sinais_e_sintomas=justificativa,
            exames_laboratoriais=dados.get('exames_realizados', ''),
            conduta=conduta,
            leito=dados['leito']
        )
        
        db.session.add(internacao)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Paciente internado com sucesso',
            'paciente_id': paciente.id,
            'internacao_id': internacao.id,
            'atendimento_id': atendimento_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao internar paciente: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# Rota para a página de histórico de internações
@bp.route('/clinica/historico-internacoes')
@login_required
def historico_internacoes():
    """
    Página que exibe o histórico de pacientes que receberam alta.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            flash('Acesso restrito a médicos e enfermeiros.', 'danger')
            return redirect(url_for('main.index'))
        
        return render_template('historico_internacoes.html')
        
    except Exception as e:
        logging.error(f"Erro ao acessar histórico de internações: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar o histórico. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.clinica'))

# API para listar histórico de internações (com alta)
@bp.route('/api/internacoes/historico')
@login_required
def listar_historico_internacoes():
    """
    Lista todas as internações que já receberam alta.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'error': 'Acesso não autorizado'}), 403
        
        # Verificar se há filtro por mês
        filtro_mes = request.args.get('mes')
        
        # Buscar internações que possuem data de alta
        query = Internacao.query.filter(Internacao.data_alta != None)
        
        # Aplicar filtro por mês se fornecido
        if filtro_mes:
            # Formato esperado: YYYY-MM
            try:
                ano, mes = filtro_mes.split('-')
                ano = int(ano)
                mes = int(mes)
                # Filtra pelo mês e ano da alta
                query = query.filter(
                    db.extract('year', Internacao.data_alta) == ano,
                    db.extract('month', Internacao.data_alta) == mes
                )
            except (ValueError, AttributeError):
                # Se formato inválido, ignora o filtro
                pass
        
        # Ordenar por data de alta (mais recente primeiro)
        internacoes = query.order_by(Internacao.data_alta.desc()).all()
        
        # Listar internações com detalhes do paciente
        resultado = []
        for internacao in internacoes:
            paciente = Paciente.query.get(internacao.paciente_id)
            if paciente:
                resultado.append({
                    'id': internacao.id,
                    'atendimento_id': internacao.atendimento_id,
                    'nome_paciente': paciente.nome,
                    'cpf': paciente.cpf,
                    'data_nascimento': paciente.data_nascimento.strftime('%Y-%m-%d') if paciente.data_nascimento else None,
                    'leito': internacao.leito,
                    'data_internacao': internacao.data_internacao.strftime('%Y-%m-%d %H:%M') if internacao.data_internacao else None,
                    'data_alta': internacao.data_alta.strftime('%Y-%m-%d %H:%M') if internacao.data_alta else None,
                    'diagnostico': internacao.diagnostico,
                    'relatorio_alta': internacao.relatorio_alta
                })
        
        return jsonify({
            'success': True,
            'internacoes': resultado
        })
        
    except Exception as e:
        logging.error(f"Erro ao listar histórico de internações: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'Erro interno do servidor'}), 500

# Rota para relatório do paciente (somente leitura)
@bp.route('/clinica/relatorio-paciente/<int:internacao_id>')
@login_required
def relatorio_paciente(internacao_id):
    try:
        # Verificar autenticação
        current_user = get_current_user()
        
        # Buscar dados do paciente e da internação
        internacao = Internacao.query.get(internacao_id)
        
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        paciente = Paciente.query.get(internacao.paciente_id)
        
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar evoluções médicas
        evolucoes = EvolucaoAtendimentoClinica.query.filter_by(
            atendimentos_clinica_id=internacao_id
        ).order_by(
            EvolucaoAtendimentoClinica.data_evolucao.desc()
        ).all()
        
        # Formatar dados das evoluções
        evolucoes_formatadas = []
        for e in evolucoes:
            medico_nome = e.funcionario.nome if hasattr(e, 'funcionario') and e.funcionario else 'Desconhecido'
            evolucoes_formatadas.append({
                'id': e.id,
                'data_evolucao': e.data_evolucao.strftime('%d/%m/%Y %H:%M') if hasattr(e, 'data_evolucao') else '',
                'nome_medico': medico_nome,
                'evolucao': e.evolucao if hasattr(e, 'evolucao') else ''
            })
        
        # Buscar prescrições médicas
        prescricoes = PrescricaoClinica.query.filter_by(
            atendimentos_clinica_id=internacao_id
        ).order_by(
            PrescricaoClinica.horario_prescricao.desc()
        ).all()
        
        # Formatar dados das prescrições
        prescricoes_formatadas = []
        for p in prescricoes:
            medico_nome = p.funcionario.nome if hasattr(p, 'funcionario') and p.funcionario else 'Desconhecido'
            
            # Buscar medicamentos da prescrição
            medicamentos = []
            if hasattr(p, 'medicamentos_json') and p.medicamentos_json:
                import json
                try:
                    medicamentos_data = json.loads(p.medicamentos_json)
                    medicamentos = medicamentos_data
                except json.JSONDecodeError:
                    logging.error(f"Erro ao decodificar JSON de medicamentos para prescrição ID {p.id}")
            
            prescricoes_formatadas.append({
                'id': p.id,
                'data_prescricao': p.horario_prescricao.strftime('%d/%m/%Y %H:%M') if hasattr(p, 'horario_prescricao') else '',
                'medico_nome': medico_nome,
                'texto_dieta': p.texto_dieta,
                'texto_procedimento_medico': p.texto_procedimento_medico,
                'texto_procedimento_multi': p.texto_procedimento_multi,
                'medicamentos': medicamentos
            })
        
        # Buscar evoluções de enfermagem
        evolucoes_enfermagem = []
        try:
            evolucoes_enf = EvolucaoEnfermagem.query.filter_by(
                atendimentos_clinica_id=internacao_id
            ).order_by(
                EvolucaoEnfermagem.data_evolucao.desc()
            ).all()
            
            for e in evolucoes_enf:
                enfermeiro = Funcionario.query.get(e.funcionario_id) if e.funcionario_id else None
                evolucoes_enfermagem.append({
                    'data_evolucao': e.data_evolucao.strftime('%d/%m/%Y %H:%M') if hasattr(e, 'data_evolucao') else '',
                    'enfermeiro_nome': enfermeiro.nome if enfermeiro else 'Não informado',
                    'texto': e.texto
                })
        except Exception as e:
            logging.error(f"Erro ao buscar evoluções de enfermagem: {str(e)}")
        
        # Buscar prescrições de enfermagem
        prescricoes_enfermagem = []
        try:
            prescricoes_enf = PrescricaoEnfermagem.query.filter_by(
                atendimentos_clinica_id=internacao_id
            ).order_by(
                PrescricaoEnfermagem.data_prescricao.desc()
            ).all()
            
            for p in prescricoes_enf:
                enfermeiro = Funcionario.query.get(p.funcionario_id) if p.funcionario_id else None
                prescricoes_enfermagem.append({
                    'data_prescricao': p.data_prescricao.strftime('%d/%m/%Y %H:%M') if hasattr(p, 'data_prescricao') else '',
                    'enfermeiro_nome': enfermeiro.nome if enfermeiro else 'Não informado',
                    'texto': p.texto
                })
        except Exception as e:
            logging.error(f"Erro ao buscar prescrições de enfermagem: {str(e)}")
        
        # Obter data e hora atual do Brasil
        now = datetime.now(timezone(timedelta(hours=-3)))
        
        return render_template('clinica_relatorio_paciente.html', 
                              internacao=internacao, 
                              paciente=paciente, 
                              evolucoes=evolucoes_formatadas,
                              prescricoes=prescricoes_formatadas,
                              evolucoes_enfermagem=evolucoes_enfermagem,
                              prescricoes_enfermagem=prescricoes_enfermagem,
                              now=lambda: datetime.now(timezone(timedelta(hours=-3))))
    
    except Exception as e:
        logging.error(f"Erro ao gerar relatório do paciente: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao gerar relatório. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))
    
from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models import Paciente, InternacaoEspecial  # ajuste os imports conforme seu projeto

# Renomeando o blueprint para internacoes_especiais_bp para exportação
internacoes_especiais_bp = Blueprint('internacoes_especiais', __name__)

@internacoes_especiais_bp.route('/api/internacoes-especiais/registrar', methods=['POST'])
def registrar_internacao_especial():
    data = request.json

    # Verifica se o paciente já existe
    paciente = Paciente.query.filter_by(cpf=data.get('cpf')).first()

    if not paciente:
        # Cria novo paciente
        paciente = Paciente(
            nome=data.get('nome'),
            cpf=data.get('cpf'),
            data_nascimento=datetime.strptime(data.get('data_nascimento'), "%Y-%m-%d"),
            sexo=data.get('sexo'),
            cartao_sus=data.get('cartao_sus'),
            telefone=data.get('telefone'),
            endereco=data.get('endereco'),
            municipio=data.get('municipio'),
            bairro=data.get('bairro')
        )
        db.session.add(paciente)
        db.session.flush()  # obtém o ID

    # Cria nova internação especial
    internacao = InternacaoEspecial(
        paciente_id=paciente.id,
        medico_id=data.get('medico_id'),
        enfermeiro_id=data.get('enfermeiro_id'),
        justificativa_internacao_sinais_e_sintomas=data.get('justificativaInternacao'),
        diagnostico_inicial=data.get('diagnosticoInicial'),
        cid_principal=data.get('cidPrincipal'),
        carater_internacao=data.get('caraterInternacao'),
        exames_laboratoriais=data.get('examesRealizados'),
        conduta=data.get('condutaInicial'),
        leito=data.get('leito'),
        data_internacao=datetime.now()
    )

    db.session.add(internacao)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Internação especial registrada com sucesso.', 'internacao_id': internacao.id})

@bp.route('/api/internacao/atualizar-hda', methods=['POST'])
@login_required
def atualizar_hda():
    """
    Atualiza a História da Doença Atual (HDA) de uma internação.
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem atualizar o HDA'
            }), 403
        
        dados = request.get_json()
        
        if not dados or 'atendimentos_clinica_id' not in dados or 'hda' not in dados:
            return jsonify({
                'success': False,
                'message': 'Dados obrigatórios não fornecidos'
            }), 400
            
        # Log para debug
        print(f"Recebendo atualização de HDA - ID: {dados['atendimentos_clinica_id']}, HDA: {dados['hda'][:50]}...")
        
        # Buscar a internação
        internacao = Internacao.query.filter_by(id=dados['atendimentos_clinica_id']).first()
        if not internacao:
            # Tentar buscar por atendimento_id se não encontrar por id
            internacao = Internacao.query.filter_by(atendimento_id=dados['atendimentos_clinica_id']).first()
            if not internacao:
                return jsonify({
                    'success': False,
                    'message': 'Internação não encontrada'
                }), 404
        
        # Atualizar o HDA
        internacao.hda = dados['hda']
        db.session.commit()
        
        # Log para confirmar atualização
        print(f"HDA atualizado com sucesso para internação {internacao.id}")
        
        return jsonify({
            'success': True,
            'message': 'HDA atualizado com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao atualizar HDA: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao atualizar HDA',
            'error': str(e)
        }), 500

# API para registrar aprazamento
@bp.route('/api/aprazamentos', methods=['POST'])
@login_required
def registrar_aprazamento():
    """
    Registra um novo aprazamento para uma prescrição médica usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        dados = request.get_json()
        
        if not dados or 'prescricao_id' not in dados or 'nome_medicamento' not in dados or 'data_hora_aprazamento' not in dados:
            return jsonify({
                'success': False,
                'message': 'Dados obrigatórios não fornecidos (prescricao_id, nome_medicamento, data_hora_aprazamento)'
            }), 400

        prescricao = PrescricaoClinica.query.get(dados['prescricao_id'])
        if not prescricao:
            return jsonify({
                'success': False,
                'message': 'Prescrição não encontrada'
            }), 404

        # Converter string para datetime, se for string
        data_hora = dados['data_hora_aprazamento']
        if isinstance(data_hora, str):
            from datetime import datetime
            try:
                # Formato esperado: DD/MM/YYYY HH:MM ou YYYY-MM-DD HH:MM:SS
                if '/' in data_hora:
                    data_hora = datetime.strptime(data_hora, '%d/%m/%Y %H:%M')
                else:
                    data_hora = datetime.strptime(data_hora, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Formato de data/hora inválido'
                }), 400

        # Criar novo registro de aprazamento
        novo_aprazamento = Aprazamento(
            prescricao_id=dados['prescricao_id'],
            nome_medicamento=dados['nome_medicamento'],
            descricao_uso=dados.get('descricao_uso', ''),
            data_hora_aprazamento=data_hora,
            enfermeiro_responsavel_id=dados.get('enfermeiro_responsavel_id', current_user.id)
        )
        
        db.session.add(novo_aprazamento)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Aprazamento registrado com sucesso',
            'id': novo_aprazamento.id
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar aprazamento: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao registrar aprazamento',
            'error': str(e)
        }), 500

# API para listar aprazamentos
@bp.route('/api/aprazamentos/<int:prescricao_id>', methods=['GET'])
@login_required
def listar_aprazamentos(prescricao_id):
    """
    Lista os aprazamentos de uma prescrição específica usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            return jsonify({
                'success': False,
                'message': 'Prescrição não encontrada'
            }), 404

        # Buscar aprazamentos da tabela
        aprazamentos = Aprazamento.query.filter_by(prescricao_id=prescricao_id).order_by(Aprazamento.data_hora_aprazamento).all()
        
        aprazamentos_formatados = []
        for apr in aprazamentos:
            enfermeiro = Funcionario.query.get(apr.enfermeiro_responsavel_id) if apr.enfermeiro_responsavel_id else None
            
            aprazamentos_formatados.append({
                'id': apr.id,
                'nome_medicamento': apr.nome_medicamento,
                'descricao_uso': apr.descricao_uso,
                'data_hora_aprazamento': apr.data_hora_aprazamento.strftime('%d/%m/%Y %H:%M'),
                'realizado': apr.realizado,
                'enfermeiro_responsavel': enfermeiro.nome if enfermeiro else None,
                'enfermeiro_responsavel_id': apr.enfermeiro_responsavel_id,
                'data_realizacao': apr.data_realizacao.strftime('%d/%m/%Y %H:%M') if apr.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados,
            'prescricao_id': prescricao_id
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos',
            'error': str(e)
        }), 500

# API para atualizar aprazamento
@bp.route('/api/aprazamentos/<int:aprazamento_id>', methods=['PUT'])
@login_required
def atualizar_aprazamento(aprazamento_id):
    """
    Atualiza um aprazamento específico usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        aprazamento = Aprazamento.query.get(aprazamento_id)
        if not aprazamento:
            return jsonify({
                'success': False,
                'message': 'Aprazamento não encontrado'
            }), 404

        # Atualizar campos do aprazamento
        if 'nome_medicamento' in dados:
            aprazamento.nome_medicamento = dados['nome_medicamento']
            
        if 'descricao_uso' in dados:
            aprazamento.descricao_uso = dados['descricao_uso']
            
        if 'data_hora_aprazamento' in dados:
            data_hora = dados['data_hora_aprazamento']
            if isinstance(data_hora, str):
                from datetime import datetime
                try:
                    # Formato esperado: DD/MM/YYYY HH:MM ou YYYY-MM-DD HH:MM:SS
                    if '/' in data_hora:
                        data_hora = datetime.strptime(data_hora, '%d/%m/%Y %H:%M')
                    else:
                        data_hora = datetime.strptime(data_hora, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Formato de data/hora inválido'
                    }), 400
            aprazamento.data_hora_aprazamento = data_hora
            
        if 'realizado' in dados:
            aprazamento.realizado = dados['realizado']
            # Se o medicamento foi marcado como administrado, registrar a data
            if dados['realizado']:
                from datetime import datetime
                aprazamento.data_realizacao = datetime.now()
            else:
                aprazamento.data_realizacao = None
                
        if 'enfermeiro_responsavel_id' in dados:
            aprazamento.enfermeiro_responsavel_id = dados['enfermeiro_responsavel_id']
            
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Aprazamento atualizado com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao atualizar aprazamento: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao atualizar aprazamento',
            'error': str(e)
        }), 500

# API para excluir aprazamento
@bp.route('/api/aprazamentos/<int:aprazamento_id>', methods=['DELETE'])
@login_required
def excluir_aprazamento(aprazamento_id):
    """
    Remove um aprazamento específico usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        aprazamento = Aprazamento.query.get(aprazamento_id)
        if not aprazamento:
            return jsonify({
                'success': False,
                'message': 'Aprazamento não encontrado'
            }), 404

        # Excluir o aprazamento
        db.session.delete(aprazamento)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Aprazamento removido com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao excluir aprazamento: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao excluir aprazamento',
            'error': str(e)
        }), 500

@bp.route('/api/prescricoes/aprazamento', methods=['POST'])
@login_required
def registrar_aprazamento_prescricao():
    """
    Registra novos aprazamentos para uma prescrição médica seguindo a nova modelagem.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'success': False, 'message': 'Acesso permitido apenas para médicos e enfermeiros'}), 403

        dados = request.get_json()

        if not dados or 'prescricao_id' not in dados or 'aprazamentos' not in dados:
            return jsonify({'success': False, 'message': 'Dados obrigatórios não fornecidos'}), 400

        prescricao = PrescricaoClinica.query.get(dados['prescricao_id'])
        if not prescricao:
            return jsonify({'success': False, 'message': 'Prescrição não encontrada'}), 404

        # Recuperar o medicamento específico usando o índice, se fornecido
        medicamento_index = dados.get('medicamento_index')
        medicamento_nome = None
        
        # Obter os medicamentos como lista JSON
        medicamentos_lista = prescricao.medicamentos_json
        
        if medicamento_index is not None and medicamentos_lista and len(medicamentos_lista) > medicamento_index:
            medicamento = medicamentos_lista[medicamento_index]
            medicamento_nome = medicamento.get('nome_medicamento')
            
            # Deletar aprazamentos existentes apenas para este medicamento
            if medicamento_nome:
                Aprazamento.query.filter_by(
                    prescricao_id=prescricao.id,
                    nome_medicamento=medicamento_nome
                ).delete()
                db.session.commit()
        
        # ID do enfermeiro responsável
        enfermeiro_id = dados.get('enfermeiro_id') or current_user.id

        aprazamentos_recebidos = dados['aprazamentos']  # Lista de objetos com detalhes de aprazamento
        aprazamentos_validos = 0
        erros_aprazamento = []

        for apr in aprazamentos_recebidos:
            nome_medicamento = apr.get('nome_medicamento')
            descricao_uso = apr.get('descricao_uso', '')
            data_hora_str = apr.get('data_hora_aprazamento')

            if not nome_medicamento or not data_hora_str:
                continue  # Pular registros incompletos
                
            try:
                # Verificar formato da data/hora (deve ser DD/MM/YYYY HH:MM)
                if not re.match(r'^\d{2}/\d{2}/\d{4} \d{2}:\d{2}$', data_hora_str):
                    erros_aprazamento.append(f"Formato inválido: {data_hora_str}")
                    continue
                    
                # Converte a string para datetime
                data_hora = datetime.strptime(data_hora_str, '%d/%m/%Y %H:%M')
                
                novo_aprazamento = Aprazamento(
                    prescricao_id=prescricao.id,
                    nome_medicamento=nome_medicamento,
                    descricao_uso=descricao_uso,
                    data_hora_aprazamento=data_hora,
                    enfermeiro_responsavel_id=enfermeiro_id
                )
                db.session.add(novo_aprazamento)
                aprazamentos_validos += 1
            except ValueError as e:
                # Registrar erro específico de formatação de data/hora
                erros_aprazamento.append(f"Erro na data/hora '{data_hora_str}': {str(e)}")
                logging.warning(f"Erro ao converter data/hora: '{data_hora_str}' - {str(e)}")
                continue
            except Exception as e:
                # Registrar outros erros
                erros_aprazamento.append(f"Erro desconhecido: {str(e)}")
                logging.error(f"Erro desconhecido ao processar aprazamento: {str(e)}")
                continue

        # Se nenhum aprazamento válido foi processado
        if aprazamentos_validos == 0:
            if erros_aprazamento:
                return jsonify({
                    'success': False, 
                    'message': f'Nenhum aprazamento válido processado. Erros: {"; ".join(erros_aprazamento[:5])}'
                }), 400
            else:
                return jsonify({
                    'success': False,
                    'message': 'Nenhum aprazamento válido encontrado nos dados enviados'
                }), 400

        db.session.commit()

        return jsonify({
            'success': True, 
            'message': f'Aprazamentos registrados com sucesso ({aprazamentos_validos} horários)'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao registrar aprazamentos: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Erro ao registrar aprazamentos', 'error': str(e)}), 500

@bp.route('/api/prescricoes/aprazamento/<int:prescricao_id>', methods=['GET'])
@login_required
def listar_aprazamento_prescricao(prescricao_id):
    """
    Lista os aprazamentos da nova tabela relacionados à prescrição.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({'success': False, 'message': 'Acesso permitido apenas para médicos e enfermeiros'}), 403

        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            return jsonify({'success': False, 'message': 'Prescrição não encontrada'}), 404

        aprazamentos_formatados = []
        for apr in prescricao.aprazamentos:
            enfermeiro_nome = apr.enfermeiro_responsavel.nome if apr.enfermeiro_responsavel else None
            aprazamentos_formatados.append({
                'id': apr.id,
                'nome_medicamento': apr.nome_medicamento,
                'descricao_uso': apr.descricao_uso,
                'data_hora_aprazamento': apr.data_hora_aprazamento.strftime('%d/%m/%Y %H:%M'),
                'realizado': apr.realizado,
                'enfermeiro_responsavel': enfermeiro_nome,
                'data_realizacao': apr.data_realizacao.strftime('%d/%m/%Y %H:%M') if apr.data_realizacao else None
            })

        return jsonify({'success': True, 'aprazamentos': aprazamentos_formatados})

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Erro ao listar aprazamentos', 'error': str(e)}), 500


# Rota para logout
@bp.route('/logout')
def logout():
    try:
        # Remover dados da sessão
        session.pop('user_id', None)
        session.pop('cargo', None)
        # Fazer logout do flask-login
        logout_user()
        # Redirecionar para a página inicial
        return redirect(url_for('main.index'))
    except Exception as e:
        logging.error(f"Erro ao fazer logout: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao fazer logout. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.index'))

@bp.route('/api/aprazamentos/<int:aprazamento_id>/realizar', methods=['PUT'])
@login_required
def marcar_aprazamento_realizado(aprazamento_id):
    """
    Marca um aprazamento como realizado.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'success': False, 'message': 'Acesso permitido apenas para médicos e enfermeiros'}), 403

        aprazamento = Aprazamento.query.get(aprazamento_id)
        if not aprazamento:
            return jsonify({'success': False, 'message': 'Aprazamento não encontrado'}), 404

        if aprazamento.realizado:
            return jsonify({'success': False, 'message': 'Este aprazamento já foi realizado'}), 400

        aprazamento.realizado = True
        aprazamento.data_realizacao = datetime.now()
        aprazamento.enfermeiro_responsavel_id = current_user.id

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Aprazamento marcado como realizado',
            'data_realizacao': aprazamento.data_realizacao.strftime('%d/%m/%Y %H:%M')
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao marcar aprazamento como realizado: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Erro ao marcar aprazamento como realizado', 'error': str(e)}), 500


@bp.route('/api/aprazamentos/realizados', methods=['GET'])
@login_required
def listar_aprazamentos_realizados():
    """
    Lista todos os aprazamentos realizados usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Buscar aprazamentos realizados
        aprazamentos = Aprazamento.query.filter(
            Aprazamento.realizado == True
        ).order_by(
            Aprazamento.data_realizacao.desc()
        ).all()

        # Formatar resposta
        aprazamentos_formatados = []
        for aprazamento in aprazamentos:
            aprazamentos_formatados.append({
                'id': aprazamento.id,
                'prescricao_id': aprazamento.prescricao_id,
                'nome_medicamento': aprazamento.nome_medicamento,
                'descricao_uso': aprazamento.descricao_uso,
                'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                'realizado': aprazamento.realizado,
                'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos realizados: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos realizados',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/ativos', methods=['GET'])
@login_required
def listar_aprazamentos_ativos():
    """
    Lista todos os aprazamentos ativos usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Buscar aprazamentos ativos
        aprazamentos = Aprazamento.query.filter(
            Aprazamento.realizado == False,
            Aprazamento.data_hora_aprazamento >= datetime.now()
        ).order_by(
            Aprazamento.data_hora_aprazamento
        ).all()

        # Formatar resposta
        aprazamentos_formatados = []
        for aprazamento in aprazamentos:
            aprazamentos_formatados.append({
                'id': aprazamento.id,
                'prescricao_id': aprazamento.prescricao_id,
                'nome_medicamento': aprazamento.nome_medicamento,
                'descricao_uso': aprazamento.descricao_uso,
                'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                'realizado': aprazamento.realizado,
                'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos ativos: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos ativos',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/prescricao/<int:prescricao_id>', methods=['GET'])
@login_required
def listar_aprazamentos_por_prescricao(prescricao_id):
    """
    Lista todos os aprazamentos de uma prescrição específica usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Verificar se a prescrição existe
        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            return jsonify({
                'success': False,
                'message': 'Prescrição não encontrada'
            }), 404

        # Buscar aprazamentos da prescrição
        aprazamentos = Aprazamento.query.filter(
            Aprazamento.prescricao_id == prescricao_id
        ).order_by(
            Aprazamento.data_hora_aprazamento
        ).all()

        # Formatar resposta
        aprazamentos_formatados = []
        for aprazamento in aprazamentos:
            aprazamentos_formatados.append({
                'id': aprazamento.id,
                'prescricao_id': aprazamento.prescricao_id,
                'nome_medicamento': aprazamento.nome_medicamento,
                'descricao_uso': aprazamento.descricao_uso,
                'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                'realizado': aprazamento.realizado,
                'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos por prescrição: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/data/<data>', methods=['GET'])
@login_required
def listar_aprazamentos_por_data(data):
    """
    Lista todos os aprazamentos de uma data específica usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Converter a data para datetime
        try:
            data_inicio = datetime.strptime(data, '%Y-%m-%d')
            data_fim = data_inicio + timedelta(days=1)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Formato de data inválido. Use YYYY-MM-DD'
            }), 400

        # Buscar aprazamentos da data
        aprazamentos = Aprazamento.query.filter(
            Aprazamento.data_hora_aprazamento >= data_inicio,
            Aprazamento.data_hora_aprazamento < data_fim
        ).order_by(
            Aprazamento.data_hora_aprazamento
        ).all()

        # Formatar resposta
        aprazamentos_formatados = []
        for aprazamento in aprazamentos:
            aprazamentos_formatados.append({
                'id': aprazamento.id,
                'prescricao_id': aprazamento.prescricao_id,
                'nome_medicamento': aprazamento.nome_medicamento,
                'descricao_uso': aprazamento.descricao_uso,
                'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                'realizado': aprazamento.realizado,
                'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos por data: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos',
            'message': 'Erro ao listar aprazamentos pendentes',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/enfermeiro/<int:enfermeiro_id>', methods=['GET'])
@login_required
def listar_aprazamentos_por_enfermeiro(enfermeiro_id):
    """
    Lista todos os aprazamentos realizados por um enfermeiro específico usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Buscar aprazamentos do enfermeiro
        aprazamentos = Aprazamento.query.filter(
            Aprazamento.enfermeiro_responsavel_id == enfermeiro_id
        ).order_by(
            Aprazamento.data_hora_aprazamento
        ).all()

        # Formatar resposta
        aprazamentos_formatados = []
        for aprazamento in aprazamentos:
            aprazamentos_formatados.append({
                'id': aprazamento.id,
                'prescricao_id': aprazamento.prescricao_id,
                'nome_medicamento': aprazamento.nome_medicamento,
                'descricao_uso': aprazamento.descricao_uso,
                'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                'realizado': aprazamento.realizado,
                'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos por enfermeiro: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/pendentes', methods=['GET'])
@login_required
def listar_aprazamentos_pendentes():
    """
    Lista todos os aprazamentos pendentes usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Buscar aprazamentos pendentes
        aprazamentos = Aprazamento.query.filter(
            Aprazamento.realizado == False,
            Aprazamento.data_hora_aprazamento >= datetime.now()
        ).order_by(
            Aprazamento.data_hora_aprazamento
        ).all()

        # Formatar resposta
        aprazamentos_formatados = []
        for aprazamento in aprazamentos:
            aprazamentos_formatados.append({
                'id': aprazamento.id,
                'prescricao_id': aprazamento.prescricao_id,
                'nome_medicamento': aprazamento.nome_medicamento,
                'descricao_uso': aprazamento.descricao_uso,
                'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                'realizado': aprazamento.realizado,
                'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos pendentes: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos pendentes',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/paciente/<int:paciente_id>', methods=['GET'])
@login_required
def listar_aprazamentos_por_paciente(paciente_id):
    """
    Lista todos os aprazamentos de um paciente específico usando o novo modelo Aprazamento.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos, enfermeiros e administradores'
            }), 403

        # Buscar todas as prescrições do paciente
        prescricoes = PrescricaoClinica.query.join(
            Internacao, PrescricaoClinica.atendimentos_clinica_id == Internacao.id
        ).filter(
            Internacao.paciente_id == paciente_id
        ).all()

        # Coletar todos os aprazamentos das prescrições
        aprazamentos_formatados = []
        for prescricao in prescricoes:
            aprazamentos = Aprazamento.query.filter_by(
                prescricao_id=prescricao.id
            ).order_by(
                Aprazamento.data_hora_aprazamento
            ).all()

            for aprazamento in aprazamentos:
                enfermeiro = Funcionario.query.get(aprazamento.enfermeiro_responsavel_id) if aprazamento.enfermeiro_responsavel_id else None
                
                aprazamentos_formatados.append({
                    'id': aprazamento.id,
                    'prescricao_id': aprazamento.prescricao_id,
                    'nome_medicamento': aprazamento.nome_medicamento,
                    'descricao_uso': aprazamento.descricao_uso,
                    'data_hora_aprazamento': aprazamento.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M:%S'),
                    'realizado': aprazamento.realizado,
                    'enfermeiro_responsavel': enfermeiro.nome if enfermeiro else None,
                    'enfermeiro_responsavel_id': aprazamento.enfermeiro_responsavel_id,
                    'data_realizacao': aprazamento.data_realizacao.strftime('%Y-%m-%d %H:%M:%S') if aprazamento.data_realizacao else None
                })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao listar aprazamentos por paciente: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao listar aprazamentos',
            'error': str(e)
        }), 500

@bp.route('/api/prescricoes/aprazamento_horarios/<int:prescricao_id>/<int:medicamento_index>', methods=['GET'])
@login_required
def buscar_horarios_aprazamento(prescricao_id, medicamento_index):
    """
    Busca os horários de aprazamento para um medicamento específico de uma prescrição.
    """
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        # Buscar a prescrição
        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            return jsonify({
                'success': False,
                'message': 'Prescrição não encontrada'
            }), 404

        # Obter o nome do medicamento da lista de medicamentos da prescrição
        medicamentos = prescricao.medicamentos_json
        if not medicamentos or medicamento_index >= len(medicamentos):
            return jsonify({
                'success': False,
                'message': 'Medicamento não encontrado'
            }), 404

        nome_medicamento = medicamentos[medicamento_index].get('nome_medicamento')
        if not nome_medicamento:
            return jsonify({
                'success': False,
                'message': 'Nome do medicamento não encontrado'
            }), 404

        # Buscar aprazamentos para este medicamento
        aprazamentos = Aprazamento.query.filter_by(
            prescricao_id=prescricao_id,
            nome_medicamento=nome_medicamento
        ).order_by(Aprazamento.data_hora_aprazamento).all()

        # Formatar horários
        horarios = []
        for apr in aprazamentos:
            horario = apr.data_hora_aprazamento.strftime('%d/%m/%Y %H:%M')
            status = "Realizado" if apr.realizado else "Pendente"
            enfermeiro = Funcionario.query.get(apr.enfermeiro_responsavel_id) if apr.enfermeiro_responsavel_id else None
            
            horarios.append({
                'horario': horario,
                'status': status,
                'enfermeiro': enfermeiro.nome if enfermeiro else None,
                'data_realizacao': apr.data_realizacao.strftime('%d/%m/%Y %H:%M') if apr.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'horarios': horarios
        })

    except Exception as e:
        logging.error(f'Erro ao buscar horários de aprazamento: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao buscar horários de aprazamento',
            'error': str(e)
        }), 500

@bp.route('/api/aprazamentos/atendimento/<string:atendimento_id>/medicamento/<path:nome_medicamento>', methods=['GET'])
@login_required
def buscar_aprazamentos_por_medicamento(atendimento_id, nome_medicamento):
    """
    Busca aprazamentos filtrados por atendimento e medicamento.
    """
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Buscar prescrições da internação
        prescricoes = PrescricaoClinica.query.filter_by(atendimentos_clinica_id=internacao.id).all()
        prescricao_ids = [p.id for p in prescricoes]

        # Buscar aprazamentos
        aprazamentos = Aprazamento.query\
            .filter(Aprazamento.prescricao_id.in_(prescricao_ids))\
            .filter(Aprazamento.nome_medicamento == nome_medicamento)\
            .order_by(Aprazamento.data_hora_aprazamento)\
            .all()

        # Formatar resposta
        aprazamentos_formatados = []
        for apr in aprazamentos:
            enfermeiro = None
            if apr.enfermeiro_responsavel_id:
                enfermeiro = Funcionario.query.get(apr.enfermeiro_responsavel_id)

            # Verificar se está atrasado
            agora = datetime.now(timezone(timedelta(hours=-3)))
            data_hora_apz = apr.data_hora_aprazamento.replace(tzinfo=timezone(timedelta(hours=-3)))
            atrasado = not apr.realizado and data_hora_apz < agora

            aprazamentos_formatados.append({
                'id': apr.id,
                'data_hora_aprazamento': apr.data_hora_aprazamento.strftime('%Y-%m-%d %H:%M'),
                'realizado': apr.realizado,
                'atrasado': atrasado,
                'enfermeiro_responsavel': enfermeiro.nome if enfermeiro else None,
                'data_realizacao': apr.data_realizacao.strftime('%Y-%m-%d %H:%M') if apr.data_realizacao else None
            })

        return jsonify({
            'success': True,
            'aprazamentos': aprazamentos_formatados
        })

    except Exception as e:
        logging.error(f'Erro ao buscar aprazamentos: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao buscar aprazamentos',
            'error': str(e)
        }), 500

# API para atualizar dados da internação
@bp.route('/api/internacao/<int:internacao_id>/atualizar', methods=['PUT'])
@login_required
def atualizar_internacao(internacao_id):
    """
    Atualiza dados específicos de uma internação.
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem atualizar dados da internação'
            }), 403
        
        # Buscar a internação
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        dados = request.get_json()
        
        # Atualizar campos permitidos
        if 'exames_laboratoriais' in dados:
            internacao.exames_laboratoriais = dados['exames_laboratoriais']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Dados da internação atualizados com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao atualizar dados da internação: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao atualizar dados da internação',
            'error': str(e)
        }), 500


@bp.route('/clinica/impressoes', defaults={'id': None})
@bp.route('/clinica/impressoes/<int:id>')
@login_required
def lobby_impressoes(id):
    return render_template('clinica_impressoes.html', id=id)


# ---------------------------
# REGISTRAR NOVO RECEITUÁRIO
# ---------------------------
@bp.route('/api/receituarios', methods=['POST'])
@login_required
def criar_receituario():
    try:
        dados = request.get_json()

        atendimento_id = dados.get('atendimento_id')
        medico_id = dados.get('medico_id')
        tipo_receita = dados.get('tipo_receita')
        conteudo_receita = dados.get('conteudo_receita')

        # Validações básicas
        if not atendimento_id or not medico_id or not tipo_receita or not conteudo_receita:
            return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios.'}), 400

        if tipo_receita not in ['normal', 'especial']:
            return jsonify({'success': False, 'message': 'Tipo de receita inválido.'}), 400

        novo_receituario = ReceituarioClinica(
            atendimento_id=atendimento_id,
            medico_id=medico_id,
            tipo_receita=tipo_receita,
            conteudo_receita=conteudo_receita
        )
        db.session.add(novo_receituario)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Receituário criado com sucesso.', 'id': novo_receituario.id})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar receituário: {str(e)}'}), 500

# --------------------------------------
# CONSULTAR RECEITUÁRIOS POR ATENDIMENTO
# --------------------------------------
@bp.route('/api/receituarios/<string:atendimento_id>', methods=['GET'])
@login_required
def listar_receituarios(atendimento_id):
    try:
        receituarios = ReceituarioClinica.query.filter_by(atendimento_id=atendimento_id).all()

        resultado = []
        for r in receituarios:
            resultado.append({
                'id': r.id,
                'atendimento_id': r.atendimento_id,
                'medico_id': r.medico_id,
                'tipo_receita': r.tipo_receita,
                'conteudo_receita': r.conteudo_receita,
                'data_receita': r.data_receita.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify({'success': True, 'receituarios': resultado})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar receituários: {str(e)}'}), 500
    
@bp.route('/clinica/receituario/<int:receituario_id>/gerar_pdf')
def gerar_receita_pdf(receituario_id):
    try:
        receituario = ReceituarioClinica.query.get(receituario_id)
        atendimento = receituario.atendimento
        paciente = atendimento.paciente
        medico = receituario.medico

        contexto = {
            'paciente_nome': paciente.nome,
            'data': datetime.now().strftime('%d/%m/%Y'),
            'endereco': paciente.endereco or "Não informado",
            'medicamentos': receituario.conteudo_receita,
            'medico': medico.nome
        }

        # Caminho do HTML (modelo exportado do Word)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        template_path = os.path.join(base_dir, 'templates_docx', 'modelo_receita.htm')

        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Template não encontrado em: {template_path}")

        # Corrigido: usar encoding latin1 para arquivos exportados do Word
        with open(template_path, 'r', encoding='latin1') as f:
            html_content = f.read()

        html_renderizado = render_template_string(html_content, **contexto)

        temp_dir = os.path.join(base_dir, 'temp')
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)

        output_pdf = os.path.join(temp_dir, f"receita_{receituario_id}.pdf")

        # Configuração do caminho do wkhtmltopdf
        config = pdfkit.configuration(wkhtmltopdf=r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe')

        # Gerar o PDF
        pdfkit.from_string(html_renderizado, output_pdf, configuration=config)

        return send_file(output_pdf, as_attachment=True)

    except Exception as e:
        return f"<h2>Erro ao gerar receita:</h2><pre>{str(e)}</pre>", 500
    

# -------------------------------------------
# REGISTRAR NOVO ATESTADO
# -------------------------------------------a
@bp.route('/api/atestados', methods=['POST'])
@login_required
def criar_atestado():
    try:
        dados = request.get_json()

        atendimento_id = dados.get('atendimento_id')
        medico_id = dados.get('medico_id')
        conteudo_atestado = dados.get('conteudo_atestado')
        dias_afastamento = dados.get('dias_afastamento')  # Pode ser None

        # Validação básica
        if not atendimento_id or not medico_id or not conteudo_atestado:
            return jsonify({'success': False, 'message': 'Campos obrigatórios não preenchidos.'}), 400

        novo_atestado = AtestadoClinica(
            atendimento_id=atendimento_id,
            medico_id=medico_id,
            conteudo_atestado=conteudo_atestado,
            dias_afastamento=dias_afastamento
        )

        db.session.add(novo_atestado)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Atestado criado com sucesso.', 'id': novo_atestado.id})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar atestado: {str(e)}'}), 500

# ----------------------------------------------------
# CONSULTAR ATESTADOS POR ATENDIMENTO
# ----------------------------------------------------
@bp.route('/api/atestados/<string:atendimento_id>', methods=['GET'])
@login_required
def listar_atestados(atendimento_id):
    try:
        atestados = AtestadoClinica.query.filter_by(atendimento_id=atendimento_id).all()

        resultado = []
        for a in atestados:
            resultado.append({
                'id': a.id,
                'atendimento_id': a.atendimento_id,
                'medico_id': a.medico_id,
                'conteudo_atestado': a.conteudo_atestado,
                'dias_afastamento': a.dias_afastamento,
                'data_atestado': a.data_atestado.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify({'success': True, 'atestados': resultado})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar atestados: {str(e)}'}), 500

# -----------------------------------------
# REGISTRAR NOVO RN
# -----------------------------------------
@bp.route('/api/pacientes_rn', methods=['POST'])
@login_required
def criar_rn():
    try:
        dados = request.get_json()

        paciente_id = dados.get('paciente_id')  # RN
        responsavel_id = dados.get('responsavel_id')  # Mãe ou responsável

        data_nascimento = dados.get('data_nascimento')
        tipo_parto = dados.get('tipo_parto')
        idade_gestacional = dados.get('idade_gestacional')
        peso_ao_nascer = dados.get('peso_ao_nascer')
        observacoes = dados.get('observacoes')

        # Validação básica
        if not paciente_id or not responsavel_id:
            return jsonify({'success': False, 'message': 'Paciente RN e responsável são obrigatórios.'}), 400

        # Verifica se já existe esse vínculo
        existente = PacienteRN.query.filter_by(paciente_id=paciente_id).first()
        if existente:
            return jsonify({'success': False, 'message': 'Este paciente já está registrado como RN.'}), 400

        novo_rn = PacienteRN(
            paciente_id=paciente_id,
            responsavel_id=responsavel_id,
            data_nascimento=datetime.strptime(data_nascimento, '%Y-%m-%d') if data_nascimento else None,
            tipo_parto=tipo_parto,
            idade_gestacional=idade_gestacional,
            peso_ao_nascer=peso_ao_nascer,
            observacoes=observacoes
        )

        db.session.add(novo_rn)
        db.session.commit()

        return jsonify({'success': True, 'message': 'RN registrado com sucesso.', 'id': novo_rn.id})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar RN: {str(e)}'}), 500

# -----------------------------------------
# LISTAR RNs DE UM RESPONSÁVEL
# -----------------------------------------
@bp.route('/api/pacientes_rn/responsavel/<int:responsavel_id>', methods=['GET'])
@login_required
def listar_rns_responsavel(responsavel_id):
    try:
        rns = PacienteRN.query.filter_by(responsavel_id=responsavel_id).all()

        resultado = []
        for rn in rns:
            paciente = Paciente.query.get(rn.paciente_id)
            resultado.append({
                'rn_id': rn.id,
                'paciente_id': rn.paciente_id,
                'nome': paciente.nome if paciente else 'Desconhecido',
                'data_nascimento': rn.data_nascimento.strftime('%Y-%m-%d') if rn.data_nascimento else None,
                'tipo_parto': rn.tipo_parto,
                'idade_gestacional': rn.idade_gestacional,
                'peso_ao_nascer': float(rn.peso_ao_nascer) if rn.peso_ao_nascer else None,
                'observacoes': rn.observacoes
            })

        return jsonify({'success': True, 'rns': resultado})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar RNs: {str(e)}'}), 500

# -----------------------------------------
# CONSULTAR DADOS DE UM RN ESPECÍFICO
# -----------------------------------------
@bp.route('/api/pacientes_rn/<int:rn_id>', methods=['GET'])
@login_required
def consultar_rn(rn_id):
    try:
        rn = PacienteRN.query.get(rn_id)
        if not rn:
            return jsonify({'success': False, 'message': 'RN não encontrado.'}), 404

        paciente = Paciente.query.get(rn.paciente_id)
        responsavel = Paciente.query.get(rn.responsavel_id)

        resultado = {
            'rn_id': rn.id,
            'paciente_id': rn.paciente_id,
            'nome': paciente.nome if paciente else 'Desconhecido',
            'responsavel_id': rn.responsavel_id,
            'nome_responsavel': responsavel.nome if responsavel else 'Desconhecido',
            'data_nascimento': rn.data_nascimento.strftime('%Y-%m-%d') if rn.data_nascimento else None,
            'tipo_parto': rn.tipo_parto,
            'idade_gestacional': rn.idade_gestacional,
            'peso_ao_nascer': float(rn.peso_ao_nascer) if rn.peso_ao_nascer else None,
            'observacoes': rn.observacoes
        }

        return jsonify({'success': True, 'rn': resultado})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao consultar RN: {str(e)}'}), 500    

@bp.route('/api/pacientes', methods=['POST'])
@login_required
def criar_paciente():
    try:
        dados = request.get_json()
        logging.info(f'[criar_paciente] Dados recebidos: {dados}')
        
        if not dados:
            return jsonify({'success': False, 'message': 'Dados não fornecidos'}), 400

        # Gerar CPF temporário se não fornecido
        if not dados.get('cpf'):
            # Formato: RN + AAMMDD + 4 dígitos aleatórios (total: 12 caracteres)
            import random
            data = datetime.now().strftime('%y%m%d')
            random_digits = str(random.randint(0, 9999)).zfill(4)
            dados['cpf'] = f'RN{data}{random_digits}'[:14]  # Garante máximo de 14 caracteres
            logging.info(f'[criar_paciente] CPF gerado: {dados["cpf"]}')

        # Converter data de nascimento
        try:
            data_nascimento = datetime.strptime(dados['data_nascimento'], '%Y-%m-%d').date()
            logging.info(f'[criar_paciente] Data de nascimento convertida: {data_nascimento}')
        except (ValueError, KeyError) as e:
            logging.error(f'[criar_paciente] Erro ao converter data: {str(e)}')
            return jsonify({
                'success': False,
                'message': 'Data de nascimento inválida ou não fornecida'
            }), 400

        # Criar paciente
        try:
            paciente = Paciente()
            paciente.nome = dados['nome']
            paciente.cpf = dados['cpf']
            paciente.data_nascimento = data_nascimento
            paciente.sexo = dados['sexo'].upper()
            paciente.telefone = 'Não informado'
            paciente.endereco = 'Não informado'
            paciente.municipio = 'Não informado'
            paciente.bairro = 'Não informado'
            paciente.filiacao = dados.get('filiacao', 'Não informado')
            paciente.identificado = True

            logging.info(f'[criar_paciente] Objeto paciente criado: {paciente.nome}, {paciente.cpf}, {paciente.data_nascimento}')

            db.session.add(paciente)
            logging.info('[criar_paciente] Paciente adicionado à sessão')
            
            db.session.commit()
            logging.info(f'[criar_paciente] Commit realizado com sucesso. ID do paciente: {paciente.id}')

            return jsonify({
                'success': True,
                'message': 'Paciente criado com sucesso',
                'paciente_id': paciente.id
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f'[criar_paciente] Erro ao criar objeto paciente: {str(e)}')
            logging.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'message': f'Erro ao criar paciente: {str(e)}'
            }), 500

    except Exception as e:
        logging.error(f'[criar_paciente] Erro geral: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao processar requisição: {str(e)}'
        }), 500
    
@bp.route('/api/criar_atendimento_rn', methods=['POST'])
def criar_atendimento_rn():
    try:
        dados = request.get_json()

        paciente_id = dados.get('paciente_id')
        funcionario_id = dados.get('profissional_id')
        medico_id = dados.get('medico_id')
        enfermeiro_id = dados.get('enfermeiro_id')

        if not paciente_id or not funcionario_id:
            return jsonify({
                'success': False,
                'message': 'Campos obrigatórios ausentes: paciente_id e profissional_id'
            }), 400

        # Gerar ID que começa com 999
        def gerar_id_rn():
            while True:
                sufixo = str(random.randint(0, 99999)).zfill(5)
                novo_id = f"999{sufixo}"
                if not Atendimento.query.get(novo_id):
                    return novo_id

        novo_atendimento = Atendimento(
            id=gerar_id_rn(),
            paciente_id=paciente_id,
            funcionario_id=funcionario_id,
            medico_id=medico_id,
            enfermeiro_id=enfermeiro_id,
            data_atendimento=datetime.now().date(),
            hora_atendimento=datetime.now().time(),
            status='internado'  # fixo para RN
        )

        db.session.add(novo_atendimento)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Atendimento RN criado com sucesso',
            'atendimento_id': novo_atendimento.id
        })

    except Exception as e:
        print('[ERRO criar_atendimento_rn]:', e)
        return jsonify({'success': False, 'message': 'Erro ao criar atendimento do RN'}), 500
    
@bp.route('/api/internacao/paciente/<int:paciente_id>/ativo', methods=['GET'])
def verificar_internacao_ativa(paciente_id):
    try:
        internacao = Internacao.query.filter_by(paciente_id=paciente_id, status='ativo').first()
        if internacao:
            return jsonify({
                'success': True,
                'internacao_id': internacao.id
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Nenhuma internação ativa encontrada.'
            }), 404
    except Exception as e:
        print('[ERRO verificar_internacao_ativa]:', e)
        return jsonify({'success': False, 'message': 'Erro interno'}), 500
