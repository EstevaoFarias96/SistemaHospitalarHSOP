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
import subprocess
import base64
from tempfile import NamedTemporaryFile
from docxtpl import DocxTemplate
from docx import Document
from io import BytesIO
from app import db
from app.models import Funcionario,Leito,AdmissaoEnfermagem, Paciente, Atendimento, InternacaoSae, Internacao, EvolucaoAtendimentoClinica, PrescricaoClinica, EvolucaoEnfermagem, PrescricaoEnfermagem, InternacaoEspecial, Aprazamento, ReceituarioClinica, AtestadoClinica, PacienteRN, now_brasilia
from app.timezone_helper import formatar_datetime_br_completo, formatar_datetime_br, converter_para_brasilia
from zoneinfo import ZoneInfo

# Cria o Blueprint principal
bp = Blueprint('main', __name__)

# Cria o Blueprint para internações especiais
internacoes_especiais_bp = Blueprint('internacoes_especiais', __name__)

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
            'timestamp': datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat()
        })
    except Exception as e:
        logging.error(f"Erro na rota de status: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat()
        }), 500


# GET /api/medico/nome
@bp.route('/api/medico/nome', methods=['GET'])
@login_required
def get_nome_medico():
    """
    Retorna o nome do médico logado.
    """
    try:
        # Usar o sistema de autenticação personalizado
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuário não autenticado.'}), 401
        
        if current_user.cargo.lower() != 'medico':
            return jsonify({'success': False, 'message': 'Usuário não é médico.'}), 403

        return jsonify({
            'success': True,
            'nome': current_user.nome
        })

    except Exception as e:
        logging.error(f"Erro ao buscar nome do médico: {str(e)}")
        logging.error(traceback.format_exc())
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
        # Usar o sistema de autenticação personalizado
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuário não autenticado.'}), 401
        
        if current_user.cargo.lower() != 'medico':
            return jsonify({'success': False, 'message': 'Usuário não é médico.'}), 403

        dados = request.get_json()
        if not dados:
            return jsonify({'success': False, 'message': 'Dados não fornecidos.'}), 400

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
        logging.error(f"Erro ao alterar senha do médico: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao alterar a senha.',
            'error': str(e)
        }), 500

# Rota protegida para médicos redirecionarem
@bp.route('/medico')
@login_required
def painel_medico():
    """
    Renderiza o painel do médico.
    """
    try:
        # Usar o sistema de autenticação personalizado
        current_user = get_current_user()
        if not current_user:
            flash('Sessão expirada. Por favor, faça login novamente.', 'warning')
            return redirect(url_for('main.index'))

        if current_user.cargo.strip().lower() != 'medico':
            flash('Acesso restrito a médicos.', 'danger')
            return redirect(url_for('main.index'))
        
        return render_template('medico.html')
        
    except Exception as e:
        logging.error(f"Erro ao acessar painel do médico: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar o painel. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.index'))
    
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
        
        # Buscar internações onde dieta != '1' OU dieta é NULL/vazia (excluir apenas dieta = '1')
        internacoes = Internacao.query.filter(
            (Internacao.dieta != '1') | (Internacao.dieta.is_(None)) | (Internacao.dieta == '')
        ).all()
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
                    'data_alta': internacao.data_alta.strftime('%Y-%m-%d %H:%M') if internacao.data_alta else None,
                    'diagnostico': internacao.diagnostico,
                    'diagnostico_inicial': internacao.diagnostico_inicial,
                    'cid_principal': internacao.cid_principal,
                    'carater_internacao': internacao.carater_internacao,
                    'tem_alta': internacao.data_alta is not None
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
        
        # Criar nova SAE com timestamp atual
        from datetime import datetime, timezone, timedelta
        
        nova_sae = InternacaoSae(
            paciente_id=dados['paciente_id'],
            enfermeiro_id=current_user.id,
            data_registro=datetime.now(timezone(timedelta(hours=-3))),  # Timestamp único para cada SAE
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
def listar_admissoes_enfermagem_old(internacao_id):  # Renomeada para evitar conflito
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
                'data_hora': (admissao.data_hora - timedelta(hours=3)).strftime('%d/%m/%Y %H:%M'),
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

        prescricoes = PrescricaoClinica.query.filter_by(atendimentos_clinica_id=internacao_id).order_by(PrescricaoClinica.horario_prescricao.desc()).all()

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
                            'data_hora': apz.data_hora_aprazamento.isoformat(),
                            'realizado': apz.realizado,
                            'enfermeiro_nome': enfermeiro_resp.nome if enfermeiro_resp else None,
                            'data_realizacao': apz.data_realizacao.isoformat() if apz.data_realizacao else None
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
                        'data_hora': apz.data_hora_aprazamento.isoformat(),
                        'realizado': apz.realizado,
                        'enfermeiro_nome': enfermeiro_resp.nome if enfermeiro_resp else None,
                        'data_realizacao': apz.data_realizacao.isoformat() if apz.data_realizacao else None
                    })

            # ----- MONTAR RESULTADO -----
            resultado.append({
                'id': prescricao.id,
                'data_prescricao': prescricao.horario_prescricao.isoformat() if prescricao.horario_prescricao else None,
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
                'data_evolucao': ev.data_evolucao.isoformat() if ev.data_evolucao else '',
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
    """
    Registra uma nova admissão de enfermagem usando a tabela específica AdmissaoEnfermagem.
    """
    try:
        # Verificar se o usuário é enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() != 'enfermeiro':
            return jsonify({
                'success': False,
                'message': 'Apenas enfermeiros podem registrar admissões'
            }), 403

        dados = request.get_json()
        
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        internacao_id = dados.get('internacao_id')
        admissao_texto = dados.get('admissao_texto')

        if not internacao_id or not admissao_texto:
            return jsonify({
                'success': False,
                'message': 'ID da internação e texto da admissão são obrigatórios'
            }), 400

        # Verificar se a internação existe
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Criar nova admissão de enfermagem
        nova_admissao = AdmissaoEnfermagem(
            internacao_id=internacao_id,
            enfermeiro_id=current_user.id,
            admissao_texto=admissao_texto,
            data_hora=datetime.now(timezone(timedelta(hours=-3)))
        )
        
        db.session.add(nova_admissao)

        # Também atualizar o campo legado na tabela Internacao (para compatibilidade)
        internacao.admissao_enfermagem = admissao_texto

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Admissão de enfermagem registrada com sucesso',
            'admissao_id': nova_admissao.id
        }), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao salvar admissão de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao registrar admissão: {str(e)}'
        }), 500

# API para buscar admissões de enfermagem de uma internação
@bp.route('/api/enfermagem/admissao/<int:internacao_id>', methods=['GET'])
@login_required
def buscar_admissao_enfermagem(internacao_id):
    """
    Busca a admissão de enfermagem mais recente de uma internação.
    """
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        # Verificar se a internação existe
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Buscar a admissão mais recente desta internação
        admissao = AdmissaoEnfermagem.query.filter_by(
            internacao_id=internacao_id
        ).order_by(
            AdmissaoEnfermagem.data_hora.desc()
        ).first()

        if admissao:
            # Buscar dados do enfermeiro
            enfermeiro = Funcionario.query.get(admissao.enfermeiro_id) if admissao.enfermeiro_id else None
            
            return jsonify({
                'success': True,
                'admissao': {
                    'id': admissao.id,
                    'admissao_texto': admissao.admissao_texto,
                    'data_hora': (admissao.data_hora - timedelta(hours=3)).strftime('%d/%m/%Y %H:%M'),
                    'enfermeiro_nome': enfermeiro.nome if enfermeiro else 'Não informado'
                }
            })
        else:
            # Se não há admissão na tabela específica, verificar campo legado
            if internacao.admissao_enfermagem:
                return jsonify({
                    'success': True,
                    'admissao': {
                        'id': None,
                        'admissao_texto': internacao.admissao_enfermagem,
                        'data_hora': 'Data não registrada',
                        'enfermeiro_nome': 'Não informado'
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Nenhuma admissão de enfermagem encontrada'
                }), 404

    except Exception as e:
        logging.error(f'Erro ao buscar admissão de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao buscar admissão: {str(e)}'
        }), 500

# API para listar todas as admissões de enfermagem de uma internação
@bp.route('/api/enfermagem/admissoes/<int:internacao_id>', methods=['GET'])
@login_required
def listar_admissoes_enfermagem(internacao_id):
    """
    Lista todas as admissões de enfermagem de uma internação.
    """
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403

        # Verificar se a internação existe
        internacao = Internacao.query.get(internacao_id)
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        # Buscar todas as admissões dessa internação
        admissoes = AdmissaoEnfermagem.query.filter_by(
            internacao_id=internacao_id
        ).order_by(
            AdmissaoEnfermagem.data_hora.desc()
        ).all()
        
        # Formatar a resposta
        resultado = []
        for admissao in admissoes:
            enfermeiro = Funcionario.query.get(admissao.enfermeiro_id) if admissao.enfermeiro_id else None
            resultado.append({
                'id': admissao.id,
                'data_hora': (admissao.data_hora - timedelta(hours=3)).strftime('%d/%m/%Y %H:%M'),
                'enfermeiro_nome': enfermeiro.nome if enfermeiro else 'Não informado',
                'admissao_texto': admissao.admissao_texto
            })
        
        return jsonify({
            'success': True,
            'admissoes': resultado
        })
        
    except Exception as e:
        logging.error(f'Erro ao listar admissões de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao listar admissões: {str(e)}'
        }), 500

# API para atualizar uma admissão de enfermagem
@bp.route('/api/enfermagem/admissao/<int:admissao_id>', methods=['PUT'])
@login_required
def atualizar_admissao_enfermagem(admissao_id):
    """
    Atualiza uma admissão de enfermagem existente.
    """
    try:
        # Verificar se o usuário é enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() != 'enfermeiro':
            return jsonify({
                'success': False,
                'message': 'Apenas enfermeiros podem atualizar admissões'
            }), 403

        dados = request.get_json()
        
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        # Buscar a admissão
        admissao = AdmissaoEnfermagem.query.get(admissao_id)
        if not admissao:
            return jsonify({
                'success': False,
                'message': 'Admissão não encontrada'
            }), 404

        # Atualizar o texto da admissão
        if 'admissao_texto' in dados:
            admissao.admissao_texto = dados['admissao_texto']
            
            # Também atualizar o campo legado na Internacao
            internacao = Internacao.query.get(admissao.internacao_id)
            if internacao:
                internacao.admissao_enfermagem = dados['admissao_texto']

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Admissão atualizada com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao atualizar admissão de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao atualizar admissão: {str(e)}'
        }), 500

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


# Buscar SAE por paciente_id
@bp.route('/api/enfermagem/sae/<int:paciente_id>', methods=['GET'])
def obter_sae_por_paciente(paciente_id):
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'Usuário não autenticado'
            }), 401
            
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para enfermeiros e médicos'
            }), 403
        
        # Buscar todas as SAEs do paciente, ordenadas por data
        saes = InternacaoSae.query.filter_by(paciente_id=paciente_id).order_by(InternacaoSae.data_registro.desc(), InternacaoSae.id.desc()).all()
        
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
                'data_registro': (sae.data_registro - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S') if sae.data_registro else None,
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
        saes = InternacaoSae.query.filter_by(paciente_id=paciente_id).order_by(InternacaoSae.data_registro.desc(), InternacaoSae.id.desc()).all()
        
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
                'data_registro': (sae.data_registro - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S') if sae.data_registro else None
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
            'data_registro': (sae.data_registro - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S') if sae.data_registro else None
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
                Funcionario.nome.label('enfermeiro_nome'),
                Funcionario.numero_profissional.label('enfermeiro_coren')
            )\
            .order_by(EvolucaoEnfermagem.data_evolucao.desc())\
            .all()
        
        resultado = []
        for ev in evolucoes:
            resultado.append({
                'id': ev.id,
                'atendimentos_clinica_id': ev.atendimentos_clinica_id,
                'data_evolucao': (ev.data_evolucao - timedelta(hours=3)).isoformat() if ev.data_evolucao else None,
                'texto': ev.texto,
                'enfermeiro_nome': ev.enfermeiro_nome,
                'enfermeiro_coren': ev.enfermeiro_coren
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
    Busca todas as prescrições de enfermagem para uma internação específica no dia atual.
    """
    try:
        # Define o intervalo de tempo (início e fim do dia atual)
        hoje = datetime.now().date()
        inicio_dia = datetime.combine(hoje, time.min)
        fim_dia = datetime.combine(hoje, time.max)

        prescricoes = db.session.query(
            PrescricaoEnfermagem.id,
            PrescricaoEnfermagem.atendimentos_clinica_id,
            PrescricaoEnfermagem.data_prescricao,
            PrescricaoEnfermagem.texto,
            Funcionario.nome.label("enfermeiro_nome"),
            Funcionario.numero_profissional.label("enfermeiro_coren")
        )\
        .outerjoin(Funcionario, PrescricaoEnfermagem.funcionario_id == Funcionario.id)\
        .filter(PrescricaoEnfermagem.atendimentos_clinica_id == internacao_id)\
        .filter(PrescricaoEnfermagem.data_prescricao >= inicio_dia)\
        .filter(PrescricaoEnfermagem.data_prescricao <= fim_dia)\
        .order_by(PrescricaoEnfermagem.data_prescricao.asc())\
        .all()

        resultado = [{
            'id': p.id,
            'atendimentos_clinica_id': p.atendimentos_clinica_id,
            'data_prescricao': (p.data_prescricao - timedelta(hours=3)).isoformat() if p.data_prescricao else None,
            'texto': p.texto,
            'enfermeiro_nome': p.enfermeiro_nome,
            'enfermeiro_coren': p.enfermeiro_coren
        } for p in prescricoes]

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
    try:
        prescricoes = db.session.query(
            PrescricaoEnfermagem.id,
            PrescricaoEnfermagem.atendimentos_clinica_id,
            PrescricaoEnfermagem.data_prescricao,
            PrescricaoEnfermagem.texto,
            Funcionario.nome.label("enfermeiro_nome"),
            Funcionario.numero_profissional.label("enfermeiro_coren")
        ).select_from(PrescricaoEnfermagem)\
        .join(Funcionario, PrescricaoEnfermagem.funcionario_id == Funcionario.id)\
        .order_by(PrescricaoEnfermagem.data_prescricao.asc())\
        .all()

        resultado = [{
            'id': presc.id,
            'atendimentos_clinica_id': presc.atendimentos_clinica_id,
            'data_prescricao': presc.data_prescricao.isoformat() if presc.data_prescricao else None,
            'texto': presc.texto,
            'enfermeiro_nome': presc.enfermeiro_nome,
            'enfermeiro_coren': presc.enfermeiro_coren
        } for presc in prescricoes]

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
        logging.info(f'Buscando internação com atendimento_id: {internacao_id}')
        
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
            logging.warning(f'Internação não encontrada para atendimento_id: {internacao_id}')
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        logging.info(f'Internação encontrada: ID={internacao.id}, paciente_id={internacao.paciente_id}')
        
        # Buscar dados do paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            logging.error(f'INCONSISTÊNCIA: Internação {internacao.id} tem paciente_id {internacao.paciente_id} que não existe na tabela pacientes')
            return jsonify({
                'success': False,
                'message': f'Dados do paciente inconsistentes para esta internação (paciente_id: {internacao.paciente_id})'
            }), 500
        
        logging.info(f'Paciente encontrado: ID={paciente.id}, nome={paciente.nome}')
        
        # Buscar dados do atendimento para obter anamnese_exame_fisico
        atendimento = Atendimento.query.filter_by(id=internacao_id).first()
        
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
            'conduta': internacao.conduta,
            'cuidados_gerais': internacao.cuidados_gerais,
            'antibiotico': internacao.antibiotico,  # Novo campo adicionado
            'carater_internacao': internacao.carater_internacao,  # Campo que estava faltando
            # Campo da tabela Internacao (correto)
            'anamnese_exame_fisico': internacao.folha_anamnese,  # Mapear folha_anamnese para o nome esperado
            # CAMPOS EXTRAS
            'justificativa_internacao_sinais_e_sintomas': internacao.justificativa_internacao_sinais_e_sintomas,
            'justificativa_internacao_condicoes': internacao.justificativa_internacao_condicoes,
            'justificativa_internacao_principais_resultados_diagnostico': internacao.justificativa_internacao_principais_resultados_diagnostico,
            'cid_10_secundario': internacao.cid_10_secundario,
            'cid_10_causas_associadas': internacao.cid_10_causas_associadas,
            'descr_procedimento_solicitado': internacao.descr_procedimento_solicitado,
            'codigo_procedimento': internacao.codigo_procedimento,
            'acidente_de_trabalho': internacao.acidente_de_trabalho
        }
        
        logging.info(f'Resposta preparada para atendimento_id {internacao_id}: paciente_id={resultado["paciente_id"]}')
        
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
    Monta o histórico da internação com: hda + folha_anamnese + conduta + exames_laboratoriais.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem registrar alta.'
            }), 403

        internacao = Internacao.query.filter_by(atendimento_id=internacao_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada.'
            }), 404

        if internacao.data_alta:
            return jsonify({
                'success': False,
                'message': 'Paciente já recebeu alta anteriormente.'
            }), 400

        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado enviado para registrar alta.'
            }), 400

        # Montar histórico da internação de forma organizada com cabeçalhos
        # Formato: seções bem definidas para melhor organização
        secoes_historico = []
        
        # HDA - História da Doença Atual
        if internacao.hda and internacao.hda.strip():
            secoes_historico.append(f"# HDA (História da Doença Atual):\n{internacao.hda.strip()}")
        
        # Anamnese
        if internacao.folha_anamnese and internacao.folha_anamnese.strip():
            secoes_historico.append(f"# ANAMNESE:\n{internacao.folha_anamnese.strip()}")
        
        # Conduta
        if internacao.conduta and internacao.conduta.strip():
            secoes_historico.append(f"# CONDUTA:\n{internacao.conduta.strip()}")
        
        # Exames Laboratoriais
        if internacao.exames_laboratoriais and internacao.exames_laboratoriais.strip():
            secoes_historico.append(f"# EXAMES LABORATORIAIS:\n{internacao.exames_laboratoriais.strip()}")
        
        # Juntar todas as seções com dupla quebra de linha para separação visual
        historico_final = '\n\n'.join(secoes_historico) if secoes_historico else 'Histórico da internação não disponível.'

        # Atualizar campos da internação com dados da alta
        internacao.historico_internacao = dados.get('historico_internacao', historico_final)  # Usar o enviado ou o montado automaticamente
        internacao.diagnostico = dados.get('diagnostico') or internacao.diagnostico
        internacao.cuidados_gerais = dados.get('cuidados_gerais') or internacao.cuidados_gerais
        internacao.data_alta = datetime.now(timezone(timedelta(hours=-3)))  # Horário de Brasília

        # Atualizar ocupação do leito
        if internacao.leito:
            leito = Leito.query.filter_by(nome=internacao.leito).first()
            if leito:
                if leito.ocupacao_atual > 0:
                    leito.ocupacao_atual -= 1
                if leito.status == 'Ocupado' and leito.ocupacao_atual < leito.capacidade_maxima:
                    leito.status = 'Disponível'
                db.session.add(leito)

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
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem realizar internações'
            }), 403

        dados = request.get_json()
        
        campos_paciente_obrigatorios = ['nome', 'cpf', 'data_nascimento', 'sexo']
        for campo in campos_paciente_obrigatorios:
            if campo not in dados or not dados[campo]:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório não informado: {campo}'
                }), 400

        campos_internacao_obrigatorios = ['diagnostico_inicial', 'leito']
        for campo in campos_internacao_obrigatorios:
            if campo not in dados or not dados[campo]:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório não informado: {campo}'
                }), 400

        paciente_existente = Paciente.query.filter_by(cpf=dados['cpf']).first()

        if paciente_existente:
            paciente = paciente_existente
        else:
            try:
                data_nascimento = datetime.strptime(dados['data_nascimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Formato de data de nascimento inválido. Use YYYY-MM-DD.'
                }), 400

            paciente = Paciente(
                nome=dados['nome'],
                filiacao=dados.get('filiacao', 'Não informado'),
                cpf=dados['cpf'],
                data_nascimento=data_nascimento,
                sexo=dados['sexo'],
                telefone=dados.get('telefone', 'Não informado'),
                endereco=dados.get('endereco', 'Não informado'),
                municipio=dados.get('municipio', 'Não informado'),
                bairro=dados.get('bairro', 'Não informado'),
                cartao_sus=dados.get('cartao_sus', ''),
                nome_social=dados.get('nome_social', ''),
                cor=dados.get('cor', 'Não informada'),
                identificado=True
            )
            db.session.add(paciente)
            db.session.flush()

        agora = datetime.now(ZoneInfo("America/Sao_Paulo"))
        atendimento_id = dados.get('atendimento_id')

        if atendimento_id and len(atendimento_id) > 8:
            return jsonify({
                'success': False,
                'message': 'ID de atendimento excede o limite máximo de 8 dígitos.'
            }), 400

        if not atendimento_id:
            prefixo_data = agora.strftime('%y%m%d')
            numero_unico = str(paciente.id)[-2:].zfill(2)
            atendimento_id = f"{prefixo_data}{numero_unico}"

        if Atendimento.query.get(atendimento_id):
            return jsonify({
                'success': False,
                'message': 'ID de atendimento já existe. Tente novamente.'
            }), 400

        atendimento = Atendimento(
            id=atendimento_id,
            paciente_id=paciente.id,
            funcionario_id=current_user.id,
            medico_id=current_user.id,
            data_atendimento=date.today(),
            hora_atendimento=time(agora.hour, agora.minute, agora.second),
            status='Internado',
            horario_internacao=agora,
            alergias=dados.get('alergias', '')
        )
        db.session.add(atendimento)
        db.session.flush()

        internacao = Internacao(
            atendimento_id=atendimento_id,
            paciente_id=paciente.id,
            medico_id=current_user.id,
            data_internacao=datetime.now(timezone(timedelta(hours=-3))),
            hda=dados.get('hda', ''),
            justificativa_internacao_sinais_e_sintomas=f"{dados.get('hda', '').strip()}\n\n{dados.get('folha_anamnese', '').strip()}",
            justificativa_internacao_condicoes="RISCO DE COMPLICAÇÃO",
            justificativa_internacao_principais_resultados_diagnostico="ANMNESE + EXAME FISICO",
            diagnostico_inicial=dados.get('diagnostico_inicial', ''),
            folha_anamnese=dados.get('folha_anamnese', ''),
            conduta=dados.get('conduta_inicial', 'Não informada'),
            carater_internacao=dados.get('carater_internacao', 'Não informado'),
            cid_principal=dados.get('cid_principal', ''),
            cid_10_secundario=dados.get('cid_10_secundario', ''),
            cid_10_causas_associadas=dados.get('cid_10_causas_associadas', ''),
            exames_laboratoriais=dados.get('exames_realizados', ''),
            leito=dados.get('leito', '')
        )

        db.session.add(internacao)
        leito_registrado = Leito.query.filter_by(nome=internacao.leito).first()
        if leito_registrado:
            leito_registrado.ocupacao_atual += 1

            # Se a ocupação chegou no limite, atualiza o status
            if leito_registrado.ocupacao_atual >= leito_registrado.capacidade_maxima:
                leito_registrado.status = 'Ocupado'
            else:
                leito_registrado.status = 'Disponível'

            db.session.add(leito_registrado)

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
    


@bp.route('/api/internacao/atualizar-hda', methods=['POST'])
@login_required
def atualizar_hda():
    """
    Atualiza a História da Doença Atual (HDA) de uma internação.
    """
    try:
        # Verificar se o usuário é médico (ignorar variações de capitalização e espaços)
        current_user = get_current_user()
        if current_user.cargo and current_user.cargo.strip().lower() != 'medico':
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
                aprazamento.data_realizacao = datetime.now(ZoneInfo("America/Sao_Paulo"))
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
        # Ensure medicamentos_json is parsed as a list
        if isinstance(prescricao.medicamentos_json, str):
            try:
                medicamentos_lista = json.loads(prescricao.medicamentos_json)
                if not isinstance(medicamentos_lista, list):
                    medicamentos_lista = []
            except json.JSONDecodeError:
                medicamentos_lista = []
        else:
            medicamentos_lista = prescricao.medicamentos_json if isinstance(prescricao.medicamentos_json, list) else []
        
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
        aprazamento.data_realizacao = datetime.now(ZoneInfo("America/Sao_Paulo"))
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
            Aprazamento.data_hora_aprazamento >= datetime.now(ZoneInfo("America/Sao_Paulo"))
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
            Aprazamento.data_hora_aprazamento >= datetime.now(ZoneInfo("America/Sao_Paulo"))
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
        
        if 'folha_anamnese' in dados:
            internacao.folha_anamnese = dados['folha_anamnese']
        
        if 'conduta' in dados:
            internacao.conduta = dados['conduta']
        
        if 'diagnostico_inicial' in dados:
            internacao.diagnostico_inicial = dados['diagnostico_inicial']
        
        if 'cid_principal' in dados:
            internacao.cid_principal = dados['cid_principal']
        
        if 'antibiotico' in dados:
            internacao.antibiotico = dados['antibiotico']
        
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


@bp.route('/clinica/impressoes/<int:id>')
@login_required
def lobby_impressoes(id):
    atendimento = Atendimento.query.filter_by(id=str(id)).first()
    internacao = Internacao.query.filter_by(atendimento_id=str(id)).first()

    if not atendimento or not internacao:
        return abort(404, description="Atendimento ou Internação não encontrados.")

    return render_template(
        'clinica_impressoes.html',
        id=id,
        atendimento=atendimento,
        internacao=internacao
    )




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
                'data_receita': formatar_datetime_br_completo(r.data_receita)
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
            'data': datetime.now(ZoneInfo("America/Sao_Paulo")).strftime('%d/%m/%Y'),
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
            data = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime('%y%m%d')
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
            data_atendimento=datetime.now(ZoneInfo("America/Sao_Paulo")).date(),
            hora_atendimento=datetime.now(ZoneInfo("America/Sao_Paulo")).time(),
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

@bp.route('/api/internacao/<string:internacao_id>', methods=['PUT'])
@login_required
def editar_internacao(internacao_id):
    """
    Permite que médicos editem os dados de uma internação existente.
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem editar dados de internação.'
            }), 403

        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(atendimento_id=internacao_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada.'
            }), 404

        # Obter dados enviados no JSON
        dados = request.get_json()

        # Atualizar os campos da internação
        campos_editaveis = [
            'diagnostico', 'diagnostico_inicial', 'cid_principal', 'historico_internacao',
            'relatorio_alta', 'conduta', 'cuidados_gerais', 'antibiotico',
            'carater_internacao', 'folha_anamnese',  # Campo correto para anamnese
            'justificativa_internacao_sinais_e_sintomas',
            'justificativa_internacao_condicoes',
            'justificativa_internacao_principais_resultados_diagnostico',
            'cid_10_secundario', 'cid_10_causas_associadas',
            'descr_procedimento_solicitado', 'codigo_procedimento',
            'acidente_de_trabalho'
            # Removidos: 'leito', 'data_internacao', 'data_alta' - não devem ser editáveis
        ]

        # Atualizar campos da internação
        for campo in campos_editaveis:
            if campo in dados:
                setattr(internacao, campo, dados[campo])

        # Se o campo anamnese_exame_fisico foi enviado, mapear para folha_anamnese
        if 'anamnese_exame_fisico' in dados:
            internacao.folha_anamnese = dados['anamnese_exame_fisico']

        db.session.commit()

        # Recarregar os dados atualizados para retornar na resposta
        db.session.refresh(internacao)

        return jsonify({
            'success': True,
            'message': 'Internação atualizada com sucesso.',
            'internacao': {
                'id': internacao.id,
                'diagnostico': internacao.diagnostico,
                'diagnostico_inicial': internacao.diagnostico_inicial,
                'cid_principal': internacao.cid_principal,
                'carater_internacao': internacao.carater_internacao,
                'antibiotico': internacao.antibiotico,
                'anamnese_exame_fisico': internacao.folha_anamnese,
                'conduta': internacao.conduta,
                'justificativa_internacao_sinais_e_sintomas': internacao.justificativa_internacao_sinais_e_sintomas,
                'justificativa_internacao_condicoes': internacao.justificativa_internacao_condicoes,
                'justificativa_internacao_principais_resultados_diagnostico': internacao.justificativa_internacao_principais_resultados_diagnostico,
                'cid_10_secundario': internacao.cid_10_secundario,
                'cid_10_causas_associadas': internacao.cid_10_causas_associadas,
                'descr_procedimento_solicitado': internacao.descr_procedimento_solicitado,
                'codigo_procedimento': internacao.codigo_procedimento,
                'acidente_de_trabalho': internacao.acidente_de_trabalho
            }
        })

    except Exception as e:
        logging.error(f'Erro ao editar internação: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao editar internação: {str(e)}'
        }), 500


@bp.route('/clinica/historico-internacao/<string:atendimento_id>', methods=['GET'])
@login_required
def historico_internacao(atendimento_id):
    atendimento = Atendimento.query.get_or_404(atendimento_id)
    paciente = Paciente.query.get_or_404(atendimento.paciente_id)
    medico = Funcionario.query.get(atendimento.medico_id)

    # Buscar a internação vinculada ao atendimento
    internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()

    if not internacao:
        return f"Nenhuma internação encontrada para o atendimento {atendimento_id}", 404

    return render_template(
        'clinica_evolucao_historico.html',
        internacao=internacao,
        atendimento=atendimento,
        paciente=paciente,
        medico=medico
    )

@bp.route('/api/internacao/<string:atendimento_id>', methods=['GET'])
@login_required
def get_internacao_por_id(internacao_id):
    internacao = Internacao.query.get_or_404(internacao_id)

    atendimento = Atendimento.query.get(internacao.atendimento_id)
    paciente = Paciente.query.get(atendimento.paciente_id)
    medico = Funcionario.query.get(atendimento.medico_id)

    return jsonify({
        'success': True,
        'internacao': {
            'nome_paciente': paciente.nome,
            'cpf': paciente.cpf,
            'data_internacao': internacao.data_internacao.isoformat() if internacao.data_internacao else None,
            'data_alta': internacao.data_alta.isoformat() if internacao.data_alta else None,
            'diagnostico': internacao.diagnostico,
            'historico_internacao': internacao.historico_internacao,
            'conduta': internacao.conduta,
            'cuidados_gerais': internacao.cuidados_gerais,
            'medico': medico.nome if medico else None
        }
    })

@bp.route('/api/internacao/<int:internacao_id>/hda', methods=['GET'])
@login_required
def obter_hda(internacao_id):
    try:
        internacao = Internacao.query.get_or_404(internacao_id)
        
        return jsonify({
            'success': True,
            'hda': internacao.hda
        })
    
    except Exception as e:
        print(f"Erro ao obter HDA: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@bp.route('/imprimir/aih/<string:atendimento_id>')
@login_required
def imprimir_aih(atendimento_id):
    try:
        # Busca o atendimento
        atendimento = Atendimento.query.filter_by(id=atendimento_id).first()
        if not atendimento:
            return abort(404, description="Atendimento não encontrado")

        paciente = atendimento.paciente
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return abort(404, description="Internação não encontrada")

        # Verifica se o usuário logado é médico
        current_user = get_current_user()
        if not current_user or current_user.cargo.lower() != 'medico':
            return abort(403, description="Somente médicos podem imprimir AIH.")
        
        medico = current_user

        # Carrega template HTML
        caminho_template = os.path.join(current_app.root_path, 'static', 'impressos', 'AIH.html')
        
        try:
            with open(caminho_template, 'r', encoding='utf-8') as f:
                template_content = f.read()
        except Exception as e:
            logging.error(f"Erro ao carregar template HTML: {str(e)}")
            return abort(500, description=f"Erro ao carregar template: {str(e)}")

        # Contexto com as variáveis para substituição
        try:
            contexto = {
                'paciente_nome': paciente.nome or '',
                'id_atendimento': atendimento.id,
                'paciente_cartao_sus': paciente.cartao_sus or '',
                'paciente_data_nascimento': paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else '',
                'paciente_sexo': paciente.sexo or '',
                'paciente_nome_filiacao': paciente.filiacao or '',
                'paciente_telefone': paciente.telefone or '',
                'paciente_cor': paciente.cor or '',
                'paciente_endereco': paciente.endereco or '',
                'municipio_residencia': paciente.municipio or '',
                'sinais_e_sintomas': internacao.justificativa_internacao_sinais_e_sintomas or '',
                'justificativa_de_internacao': internacao.justificativa_internacao_condicoes or '',
                'exames': internacao.justificativa_internacao_principais_resultados_diagnostico or '',
                'diagnostico_inicial': internacao.diagnostico_inicial or '',
                'cid_principal': internacao.cid_principal or '',
                'cid_secundario': internacao.cid_10_secundario or '',
                'cid_causas_associadas': internacao.cid_10_causas_associadas or '',
                'descricao_procedimento': internacao.descr_procedimento_solicitado or '',
                'codigo_procedimento': internacao.codigo_procedimento or '',
                'leito': internacao.leito or '',
                'carater_de_internacao': internacao.carater_internacao or '',
                'funcionario_nome': medico.nome or '',
                'medico_cpf': medico.cpf or ''
            }
        except Exception as e:
            logging.error(f"Erro ao montar contexto: {str(e)}")
            return abort(500, description=f"Erro ao montar contexto: {str(e)}")

        # Renderiza e retorna o template HTML
        try:
            html_content = render_template_string(template_content, **contexto)
            return html_content
        except Exception as e:
            logging.error(f"Erro ao renderizar template: {str(e)}")
            return abort(500, description=f"Erro ao renderizar template: {str(e)}")

    except Exception as e:
        logging.error(f"Erro geral no endpoint imprimir_aih: {str(e)}")
        logging.error(traceback.format_exc())
        return abort(500, description=f"Erro interno: {str(e)}")

@bp.route('/api/leitos', methods=['GET'])
def listar_leitos():
    # Filtros opcionais via query string
    setor = request.args.get('setor')
    tipo = request.args.get('tipo')
    status = request.args.get('status')

    query = Leito.query

    if setor:
        query = query.filter(Leito.setor.ilike(f"%{setor}%"))
    if tipo:
        query = query.filter(Leito.tipo.ilike(f"%{tipo}%"))
    if status:
        query = query.filter(Leito.status.ilike(f"%{status}%"))

    leitos = query.order_by(Leito.nome).all()

    return jsonify([
        {
            'id': leito.id,
            'nome': leito.nome,
            'tipo': leito.tipo,
            'setor': leito.setor,
            'capacidade_maxima': leito.capacidade_maxima,
            'status': leito.status,
            'observacoes': leito.observacoes
        }
        for leito in leitos
    ])

@bp.route('/api/leitos/opcoes', methods=['GET'])
@login_required
def listar_opcoes_leitos():
    leitos = Leito.query.order_by(Leito.nome).all()
    return jsonify([
        {'nome': leito.nome, 'status': leito.status}
        for leito in leitos
    ])

@bp.route('/clinica/gestao-leitos')
@login_required
def gestao_leitos():
    leitos = Leito.query.order_by(Leito.nome).all()
    return render_template('gestao_leitos.html', leitos=leitos)

@bp.route('/api/internacoes/leito/<string:leito_nome>')
@login_required
def listar_internacoes_por_leito(leito_nome):
    """
    Lista todas as internações ativas (sem data de alta) de um leito específico.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'error': 'Acesso não autorizado'}), 403
        
        # Buscar internações ativas no leito especificado
        internacoes = Internacao.query.filter_by(
            leito=leito_nome,
            data_alta=None
        ).all()
        
        pacientes_list = []
        
        for internacao in internacoes:
            paciente = Paciente.query.get(internacao.paciente_id)
            if paciente:
                pacientes_list.append({
                    'id': paciente.id,
                    'paciente_id': paciente.id,
                    'nome': paciente.nome,
                    'cpf': paciente.cpf,
                    'data_nascimento': paciente.data_nascimento.strftime('%Y-%m-%d') if paciente.data_nascimento else None,
                    'data_internacao': internacao.data_internacao.strftime('%d/%m/%Y %H:%M') if internacao.data_internacao else None,
                    'diagnostico': internacao.diagnostico,
                    'atendimento_id': internacao.atendimento_id
                })
        
        return jsonify(pacientes_list)
        
    except Exception as e:
        logging.error(f"Erro ao listar pacientes do leito {leito_nome}: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bp.route('/api/realocar-paciente', methods=['POST'])
@login_required
def realocar_paciente():
    """
    Realoca um paciente de um leito para outro.
    """
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Apenas médicos e enfermeiros podem realocar pacientes'
            }), 403
        
        dados = request.get_json()
        atendimento_id = dados.get('atendimento_id')
        leito_destino = dados.get('leito_destino')
        
        if not atendimento_id or not leito_destino:
            return jsonify({
                'success': False,
                'message': 'Atendimento ID e leito destino são obrigatórios'
            }), 400
        
        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(
            atendimento_id=atendimento_id,
            data_alta=None
        ).first()
        
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação ativa não encontrada para este atendimento'
            }), 404
        
        # Verificar se o leito destino existe
        leito = Leito.query.filter_by(nome=leito_destino).first()
        if not leito:
            return jsonify({
                'success': False,
                'message': f'Leito {leito_destino} não encontrado'
            }), 404
        
        # Verificar capacidade do leito destino
        internacoes_destino = Internacao.query.filter_by(
            leito=leito_destino,
            data_alta=None
        ).count()
        
        if internacoes_destino >= leito.capacidade_maxima:
            return jsonify({
                'success': False,
                'message': f'Leito {leito_destino} está com capacidade máxima'
            }), 400
        
        # Salvar leito anterior para log
        leito_anterior = internacao.leito
        
        # Atualizar o leito da internação
        internacao.leito = leito_destino
        
        # Registrar a mudança no histórico
        if internacao.historico_internacao:
            internacao.historico_internacao += f"\n\n[{datetime.now(ZoneInfo('America/Sao_Paulo')).strftime('%d/%m/%Y %H:%M')}] Paciente realocado do leito {leito_anterior} para o leito {leito_destino} por {current_user.nome}"
        else:
            internacao.historico_internacao = f"[{datetime.now(ZoneInfo('America/Sao_Paulo')).strftime('%d/%m/%Y %H:%M')}] Paciente realocado do leito {leito_anterior} para o leito {leito_destino} por {current_user.nome}"
                
        db.session.commit()
        
        # Buscar dados do paciente para o log
        paciente = Paciente.query.get(internacao.paciente_id)
        
        logging.info(f"Paciente {paciente.nome} (ID: {paciente.id}) realocado do leito {leito_anterior} para {leito_destino} por {current_user.nome}")
        
        return jsonify({
            'success': True,
            'message': 'Paciente realocado com sucesso',
            'leito_anterior': leito_anterior,
            'leito_novo': leito_destino
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Erro ao realocar paciente: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao realocar paciente: {str(e)}'
        }), 500

# POST /api/enfermeiro/mudar-senha
@bp.route('/api/enfermeiro/mudar-senha', methods=['POST'])
@login_required
def mudar_senha_enfermeiro():
    """
    Permite que o enfermeiro altere a própria senha.
    """
    try:
        # Usar o sistema de autenticação personalizado
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuário não autenticado.'}), 401
        
        if current_user.cargo.lower() != 'enfermeiro':
            return jsonify({'success': False, 'message': 'Usuário não é enfermeiro.'}), 403

        dados = request.get_json()
        if not dados:
            return jsonify({'success': False, 'message': 'Dados não fornecidos.'}), 400

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
        logging.error(f"Erro ao alterar senha do enfermeiro: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao alterar a senha.',
            'error': str(e)
        }), 500

# POST /api/recepcionista/mudar-senha
@bp.route('/api/recepcionista/mudar-senha', methods=['POST'])
@login_required
def mudar_senha_recepcionista():
    """
    Permite que o recepcionista altere a própria senha.
    """
    try:
        # Usar o sistema de autenticação personalizado
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuário não autenticado.'}), 401
        
        if current_user.cargo.lower() != 'recepcionista':
            return jsonify({'success': False, 'message': 'Usuário não é recepcionista.'}), 403

        dados = request.get_json()
        if not dados:
            return jsonify({'success': False, 'message': 'Dados não fornecidos.'}), 400

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
        logging.error(f"Erro ao alterar senha do recepcionista: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao alterar a senha.',
            'error': str(e)
        }), 500

# GET /api/recepcionista/nome
@bp.route('/api/recepcionista/nome', methods=['GET'])
@login_required
def get_nome_recepcionista():
    """
    Retorna o nome do recepcionista logado.
    """
    try:
        # Usar o sistema de autenticação personalizado
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuário não autenticado.'}), 401
        
        if current_user.cargo.lower() != 'recepcionista':
            return jsonify({'success': False, 'message': 'Usuário não é recepcionista.'}), 403

        return jsonify({
            'success': True,
            'nome': current_user.nome
        })

    except Exception as e:
        logging.error(f"Erro ao buscar nome do recepcionista: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro ao buscar nome do recepcionista.',
            'error': str(e)
        }), 500

# Buscar SAE por atendimento_id (novo)
@bp.route('/api/enfermagem/sae/atendimento/<string:atendimento_id>', methods=['GET'])
def obter_sae_por_atendimento(atendimento_id):
    try:
        # Verificar se o usuário é médico ou enfermeiro
        current_user = get_current_user()
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'Usuário não autenticado'
            }), 401
            
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para enfermeiros e médicos'
            }), 403
        
        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({'success': False, 'error': 'Internação não encontrada'}), 404
        
        # Buscar todas as SAEs do paciente, ordenadas por data
        saes = InternacaoSae.query.filter_by(paciente_id=internacao.paciente_id).order_by(InternacaoSae.data_registro.desc(), InternacaoSae.id.desc()).all()
        
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
                'data_registro': (sae.data_registro - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S') if sae.data_registro else None,
                'eh_hoje': True if sae_hoje and sae.id == sae_hoje.id else False
            }
        })
    except Exception as e:
        logging.error(f'Erro ao buscar SAE por atendimento: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Erro ao buscar SAE: {str(e)}'}), 500

# Buscar SAE por paciente_id (original)@bp.route('/api/enfermagem/sae/<int:paciente_id>', methods=['GET'])
def obter_sae_por_paciente(paciente_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuário não autenticado'}), 401
        
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({'success': False, 'message': 'Acesso permitido apenas para enfermeiros e médicos'}), 403

        # Recuperar todas as SAEs do paciente, ordenadas por data mais recente
        saes = InternacaoSae.query.filter_by(paciente_id=paciente_id).order_by(InternacaoSae.data_registro.desc(), InternacaoSae.id.desc()).all()

        if not saes:
            return jsonify({'success': False, 'message': 'Nenhuma SAE registrada para este paciente.'}), 404

        # Selecionar SAE de hoje, se existir; senão, a mais recente anterior
        hoje = datetime.now(timezone(timedelta(hours=-3))).date()
        sae_hoje = next((s for s in saes if s.data_registro.date() == hoje), None)
        sae = sae_hoje if sae_hoje else saes[0]

        resposta_sae = {
            'id': sae.id,
            'paciente_id': sae.paciente_id,
            'enfermeiro_id': sae.enfermeiro_id,
            'hipotese_diagnostica': sae.hipotese_diagnostica,
            'pa': sae.pa,
            'fc': sae.fc,
            'fr': sae.fr,
            'temperatura': sae.temperatura,
            'saturacao': sae.saturacao,
            'glasgow': sae.glasgow,
            'data_registro': sae.data_registro.isoformat()
        }

        return jsonify({'success': True, 'sae': resposta_sae}), 200

    except Exception as e:
        logging.error(f"Erro ao obter SAE do paciente {paciente_id}: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500


@bp.route('/api/pacientes/buscar', methods=['POST'])
@login_required
def buscar_paciente():
    """
    Busca paciente por CPF (exato) ou nome (parcial, case-insensitive).
    Permissão restrita a médicos e enfermeiros.
    """
    try:
        current_user = get_current_user()
        if not current_user or current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({'success': False, 'message': 'Acesso não autorizado.'}), 403

        dados = request.get_json()
        if not dados:
            return jsonify({'success': False, 'message': 'Dados não fornecidos.'}), 400

        cpf = dados.get('cpf', '').strip()
        nome = dados.get('nome', '').strip()

        if not cpf and not nome:
            return jsonify({'success': False, 'message': 'Informe o CPF ou nome do paciente.'}), 400

        query = Paciente.query

        if cpf:
            cpf_limpo = re.sub(r'\D', '', cpf)  # Remove pontos e traços
            paciente = query.filter_by(cpf=cpf_limpo).first()
        else:
            paciente = query.filter(Paciente.nome.ilike(f'%{nome}%')).first()

        if not paciente:
            return jsonify({'success': False, 'message': 'Paciente não encontrado.'}), 404

        paciente_data = {
            'id': paciente.id,
            'nome': paciente.nome,
            'cpf': paciente.cpf,
            'data_nascimento': paciente.data_nascimento.isoformat() if paciente.data_nascimento else None,
            'sexo': paciente.sexo,
            'filiacao': paciente.filiacao,
            'telefone': paciente.telefone,
            'endereco': paciente.endereco,
            'bairro': paciente.bairro,
            'municipio': paciente.municipio,
            'cartao_sus': getattr(paciente, 'cartao_sus', None),
            'cor': getattr(paciente, 'cor', None)
        }

        return jsonify({'success': True, 'paciente': paciente_data}), 200

    except Exception as e:
        logging.error(f"Erro ao buscar paciente: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Erro interno do servidor.'}), 500

@bp.route('/api/internacao/<string:internacao_id>/alta', methods=['GET'])
@login_required
def buscar_informacoes_alta(internacao_id):
    """
    Busca as informações de alta de uma internação específica.
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
        if not paciente:
            return jsonify({
                'success': False,
                'message': 'Paciente não encontrado'
            }), 404

        # Montar histórico automaticamente se ainda não houver data de alta
        historico_internacao = internacao.historico_internacao
        if not internacao.data_alta:
            secoes_historico = []

            # HDA - História da Doença Atual
            if internacao.hda and internacao.hda.strip():
                secoes_historico.append(f"# HDA (História da Doença Atual):\n{internacao.hda.strip()}")

            # Evolução médica (última)
            ultima_evolucao = (
                EvolucaoAtendimentoClinica.query
                .filter_by(atendimentos_clinica_id=internacao.id)
                .order_by(EvolucaoAtendimentoClinica.data_evolucao.desc())
                .first()
            )
            if ultima_evolucao and ultima_evolucao.evolucao and ultima_evolucao.evolucao.strip():
                secoes_historico.append(f"# EVOLUÇÃO MÉDICA:\n{ultima_evolucao.evolucao.strip()}")

            # Anamnese
            if internacao.folha_anamnese and internacao.folha_anamnese.strip():
                secoes_historico.append(f"# ANAMNESE:\n{internacao.folha_anamnese.strip()}")

            # Conduta
            if internacao.conduta and internacao.conduta.strip():
                secoes_historico.append(f"# CONDUTA:\n{internacao.conduta.strip()}")

            # Exames Laboratoriais
            if internacao.exames_laboratoriais and internacao.exames_laboratoriais.strip():
                secoes_historico.append(f"# EXAMES LABORATORIAIS:\n{internacao.exames_laboratoriais.strip()}")

            historico_internacao = '\n\n'.join(secoes_historico) if secoes_historico else 'Histórico será montado automaticamente'

        # Formatar resposta
        resultado = {
            'success': True,
            'data_alta': internacao.data_alta.strftime('%d/%m/%Y %H:%M') if internacao.data_alta else None,
            'diagnostico': internacao.diagnostico or 'Não informado',
            'historico_internacao': historico_internacao or 'Não informado',
            'cuidados_gerais': internacao.cuidados_gerais or 'Não informado',
            'nome_paciente': paciente.nome or 'Não informado',
            'cpf_paciente': paciente.cpf or 'Não informado'
        }

        return jsonify(resultado)

    except Exception as e:
        logging.error(f'Erro ao buscar informações de alta para impressão: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao buscar informações de alta: {str(e)}'
        }), 500



@bp.route('/api/imprimir-prescricao/<int:prescricao_id>', methods=['GET'])
def imprimir_prescricao(prescricao_id):
    prescricao = PrescricaoClinica.query.get(prescricao_id)
    if not prescricao:
        return abort(404, 'Prescrição não encontrada.')

    internacao = prescricao.internacao
    if not internacao:
        return abort(404, 'Internação não vinculada à prescrição.')

        atendimento = Atendimento.query.get(internacao.atendimento_id)
    if not atendimento:
        return abort(404, 'Atendimento não encontrado.')

    paciente = atendimento.paciente
    if not paciente:
        return abort(404, 'Paciente não encontrado.')

    # Abrir o modelo
    doc = Document('app/static/impressos/prescricao.docx')

    def substituir_variaveis(doc, substituicoes):
        substituicoes_realizadas = 0
        
        # Processar parágrafos
        for p in doc.paragraphs:
            for chave, valor in substituicoes.items():
                if chave in p.text:
                    p.text = p.text.replace(chave, str(valor))
                    substituicoes_realizadas += 1
                    
        # Processar tabelas
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for chave, valor in substituicoes.items():
                            if chave in p.text:
                                p.text = p.text.replace(chave, str(valor))
                                substituicoes_realizadas += 1
        
        logging.info(f"Realizadas {substituicoes_realizadas} substituições")
        return substituicoes_realizadas

    # Preencher os campos principais
    substituicoes = {
        '{{ paciente_nome }}': paciente.nome or '',
        '{{ id_atendimento}}': atendimento.id,
        '{{paciente_cor }}': paciente.cor or '',
        '{{ paciente_data_nascimento }}': paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else '',
        '{{paciente_sexo }}': paciente.sexo or '',
        '{{ paciente_cartao_sus }}': paciente.cartao_sus or '',
        '{{ paciente_telefone}}': paciente.telefone or '',
        '{{internamento_leito}}': internacao.leito or '',
        '{{internamento_data}}': internacao.data_internacao.strftime('%d/%m/%Y %H:%M') if internacao.data_internacao else '',
        '{{ paciente_nome_filiacao}}': paciente.filiacao or '',
        '{{ paciente_endereço }}': paciente.endereco or '',
        '{{ municipio_residencia }}': paciente.municipio or '',
        '{{atendimentos_alergia}}': atendimento.alergias or '',
        '{{ prescricao_dieta }}': prescricao.texto_dieta or '',
    }

    substituir_variaveis(doc, substituicoes)

    # Substituir medicamentos da lista JSON
    medicamentos = prescricao.medicamentos_json or []
    data_prescricao = prescricao.horario_prescricao.strftime('%d/%m/%Y %H:%M') if prescricao.horario_prescricao else ''

    for med in medicamentos:
        doc_texto = doc.get_paragraphs()
        for p in doc.paragraphs:
            if '{{ prescricao_medicamento }}' in p.text:
                p.text = p.text.replace('{{ prescricao_medicamento }}', med.get('nome_medicamento', ''))
                break
        for p in doc.paragraphs:
            if '{{ prescricao_descricao }}' in p.text:
                p.text = p.text.replace('{{ prescricao_descricao }}', med.get('descricao_uso', ''))
                break
        for p in doc.paragraphs:
            if '{{ prescricao_datahorario }}' in p.text:
                p.text = p.text.replace('{{ prescricao_datahorario }}', data_prescricao)
                break

    # Salvar temporariamente em memória
    output = BytesIO()
    doc.save(output)
    output.seek(0)

    # Enviar para download
    nome_arquivo = f"prescricao_{prescricao.id}_{paciente.nome.replace(' ', '_')}.docx"
    return send_file(output, as_attachment=True, download_name=nome_arquivo, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

@bp.route('/imprimir/prescricao/<string:atendimento_id>', methods=['GET'])
def imprimir_prescricao_por_atendimento(atendimento_id):
    """
    Gera a prescrição mais recente de um atendimento específico
    """
    try:
        logging.info(f"Iniciando geração de prescrição para atendimento: {atendimento_id}")
        
        # Buscar o atendimento
        atendimento = Atendimento.query.get(atendimento_id)
        if not atendimento:
            return abort(404, 'Atendimento não encontrado.')

        # Buscar a internação relacionada ao atendimento
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return abort(404, 'Internação não encontrada para este atendimento.')

        # Buscar a prescrição mais recente desta internação
        prescricao = PrescricaoClinica.query.filter_by(
            atendimentos_clinica_id=internacao.id
        ).order_by(PrescricaoClinica.horario_prescricao.desc()).first()
        
        if not prescricao:
            return abort(404, 'Nenhuma prescrição encontrada para este atendimento.')

        paciente = atendimento.paciente
        if not paciente:
            return abort(404, 'Paciente não encontrado.')

        # Abrir o modelo
        doc = Document('app/static/impressos/prescricao.docx')

        def substituir_variaveis(doc, substituicoes):
            substituicoes_realizadas = 0
            
            # Processar parágrafos
            for p in doc.paragraphs:
                for chave, valor in substituicoes.items():
                    if chave in p.text:
                        p.text = p.text.replace(chave, str(valor))
                        substituicoes_realizadas += 1
                        
            # Processar tabelas
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for p in cell.paragraphs:
                            for chave, valor in substituicoes.items():
                                if chave in p.text:
                                    p.text = p.text.replace(chave, str(valor))
                                    substituicoes_realizadas += 1
            
            logging.info(f"Realizadas {substituicoes_realizadas} substituições")
            return substituicoes_realizadas

        # Preencher os campos principais
        substituicoes = {
            '{{ paciente_nome }}': paciente.nome or '',
            '{{ id_atendimento}}': str(atendimento.id),
            '{{paciente_cor }}': paciente.cor or '',
            '{{ paciente_data_nascimento }}': paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else '',
            '{{paciente_sexo }}': paciente.sexo or '',
            '{{ paciente_cartao_sus }}': paciente.cartao_sus or '',
            '{{ paciente_telefone}}': paciente.telefone or '',
            '{{internamento_leito}}': internacao.leito or '',
            '{{internamento_data}}': internacao.data_internacao.strftime('%d/%m/%Y %H:%M') if internacao.data_internacao else '',
            '{{ paciente_nome_filiacao}}': paciente.filiacao or '',
            '{{ paciente_endereço }}': paciente.endereco or '',
            '{{ municipio_residencia }}': paciente.municipio or '',
            '{{atendimentos_alergia}}': atendimento.alergias or '',
            '{{ prescricao_dieta }}': prescricao.texto_dieta or '',
        }

        substituir_variaveis(doc, substituicoes)

        # Substituir medicamentos da lista JSON
        medicamentos = prescricao.medicamentos_json or []
        data_prescricao = prescricao.horario_prescricao.strftime('%d/%m/%Y %H:%M') if prescricao.horario_prescricao else ''

        logging.info(f"Processando {len(medicamentos)} medicamentos")

        # Processar medicamentos
        if medicamentos:
            primeiro_med = medicamentos[0]
            substituicoes_medicamentos = {
                '{{ prescricao_medicamento }}': primeiro_med.get('nome_medicamento', ''),
                '{{ prescricao_descricao }}': primeiro_med.get('descricao_uso', ''),
                '{{ prescricao_datahorario }}': data_prescricao
            }
            
            logging.info(f"Medicamento: {primeiro_med.get('nome_medicamento', 'N/A')}")
            substituir_variaveis(doc, substituicoes_medicamentos)
        else:
            # Limpar placeholders se não houver medicamentos
            substituicoes_vazias = {
                '{{ prescricao_medicamento }}': '',
                '{{ prescricao_descricao }}': '',
                '{{ prescricao_datahorario }}': data_prescricao
            }
            substituir_variaveis(doc, substituicoes_vazias)

        # Salvar temporariamente em memória
        output = BytesIO()
        doc.save(output)
        output.seek(0)

        # Enviar para download
        nome_arquivo = f"prescricao_{atendimento_id}_{paciente.nome.replace(' ', '_').replace('/', '')}.docx"
        return send_file(output, as_attachment=True, download_name=nome_arquivo, 
                        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    except Exception as e:
        logging.error(f"Erro ao gerar prescrição para atendimento {atendimento_id}: {str(e)}")
        return abort(500, f'Erro interno do servidor: {str(e)}')

@bp.route('/api/imprimir-prescricao-html/<int:prescricao_id>', methods=['GET'])
@login_required
def imprimir_prescricao_html(prescricao_id):
    """
    Gera uma página HTML para impressão de prescrição médica
    Formatada para papel A4 horizontal com design profissional
    """
    try:
        # Buscar a prescrição
        prescricao = PrescricaoClinica.query.get(prescricao_id)
        if not prescricao:
            abort(404, 'Prescrição não encontrada.')

        # Buscar a internação relacionada
        internacao = prescricao.internacao
        if not internacao:
            abort(404, 'Internação não vinculada à prescrição.')

        # Buscar o atendimento
        atendimento = Atendimento.query.get(internacao.atendimento_id)
        if not atendimento:
            abort(404, 'Atendimento não encontrado.')

        # Buscar o paciente
        paciente = atendimento.paciente
        if not paciente:
            abort(404, 'Paciente não encontrado.')

        # Buscar o médico que prescreveu
        medico = Funcionario.query.get(prescricao.medico_id) if prescricao.medico_id else None

        # Buscar aprazamentos relacionados a esta prescrição
        aprazamentos = Aprazamento.query.filter_by(prescricao_id=prescricao_id).order_by(
            Aprazamento.data_hora_aprazamento
        ).all()

        # Organizar medicamentos com seus respectivos aprazamentos
        medicamentos_com_aprazamentos = []
        medicamentos_json = prescricao.medicamentos_json or []
        
        for medicamento in medicamentos_json:
            nome_med = medicamento.get('nome_medicamento', '')
            aprazamentos_med = [a for a in aprazamentos if a.nome_medicamento == nome_med]
            medicamentos_com_aprazamentos.append({
                'medicamento': medicamento,
                'aprazamentos': aprazamentos_med
            })

        # Renderizar template HTML para impressão
        return render_template('impressao_prescricao.html',
                             prescricao=prescricao,
                             internacao=internacao,
                             atendimento=atendimento,
                             paciente=paciente,
                             medico=medico,
                             medicamentos_com_aprazamentos=medicamentos_com_aprazamentos)

    except Exception as e:
        logging.error(f"Erro ao gerar impressão de prescrição: {str(e)}")
        abort(500, f'Erro interno: {str(e)}')

@bp.route('/api/imprimir-evolucao-html/<int:evolucao_id>', methods=['GET'])
@login_required
def imprimir_evolucao_html(evolucao_id):
    """
    Gera uma página HTML para impressão de evolução médica
    Formatada para papel A4 com design profissional
    """
    try:
        # Buscar a evolução
        evolucao = EvolucaoAtendimentoClinica.query.get(evolucao_id)
        if not evolucao:
            abort(404, 'Evolução não encontrada.')

        # Buscar a internação relacionada
        internacao = Internacao.query.get(evolucao.atendimentos_clinica_id)
        if not internacao:
            abort(404, 'Internação não vinculada à evolução.')

        # Buscar o atendimento
        atendimento = Atendimento.query.get(internacao.atendimento_id)
        if not atendimento:
            abort(404, 'Atendimento não encontrado.')

        # Buscar o paciente
        paciente = atendimento.paciente
        if not paciente:
            abort(404, 'Paciente não encontrado.')

        # Buscar o médico que fez a evolução
        medico = Funcionario.query.get(evolucao.funcionario_id) if evolucao.funcionario_id else None

        # Renderizar template HTML para impressão
        return render_template('impressao_evolucao.html',
                             evolucao=evolucao,
                             internacao=internacao,
                             atendimento=atendimento,
                             paciente=paciente,
                             medico=medico)

    except Exception as e:
        logging.error(f"Erro ao gerar impressão de evolução: {str(e)}")
        abort(500, f'Erro interno: {str(e)}')

@bp.route('/imprimir/sae/<string:atendimento_id>')
@login_required
def imprimir_sae(atendimento_id):
    """
    Gera uma página HTML para impressão da SAE (Sistematização da Assistência de Enfermagem)
    """
    try:
        from datetime import datetime
        
        # Buscar o atendimento
        atendimento = Atendimento.query.filter_by(id=atendimento_id).first()
        if not atendimento:
            abort(404, 'Atendimento não encontrado.')

        # Buscar a internação relacionada ao atendimento
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            abort(404, 'Internação não encontrada para este atendimento.')

        # Buscar o paciente
        paciente = atendimento.paciente
        if not paciente:
            abort(404, 'Paciente não encontrado.')

        # Buscar a SAE mais recente para este paciente
        sae = InternacaoSae.query.filter_by(
            paciente_id=internacao.paciente_id
        ).order_by(
            InternacaoSae.data_registro.desc()
        ).first()
        
        if not sae:
            flash('Nenhuma SAE encontrada para este paciente.', 'warning')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('impressao_sae_enfermagem.html',
                             paciente=paciente,
                             internacao=internacao,
                             atendimento=atendimento,
                             sae=sae,
                             atendimento_id=atendimento_id)

    except Exception as e:
        logging.error(f"Erro ao gerar impressão de SAE: {str(e)}")
        abort(500, f'Erro interno: {str(e)}')

@bp.route('/imprimir/ficha_admissao/<string:atendimento_id>')
@login_required
def imprimir_ficha_admissao(atendimento_id):
    """
    Gera uma página HTML para impressão da Ficha de Admissão
    Formatada para papel A4 horizontal com design profissional
    """
    try:
        from datetime import datetime
        
        # Buscar o atendimento
        atendimento = Atendimento.query.filter_by(id=atendimento_id).first()
        if not atendimento:
            abort(404, 'Atendimento não encontrado.')

        # Buscar a internação relacionada ao atendimento
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            abort(404, 'Internação não encontrada para este atendimento.')

        # Buscar o paciente
        paciente = atendimento.paciente
        if not paciente:
            abort(404, 'Paciente não encontrado.')

        # Buscar o médico responsável
        medico = None
        if internacao.medico_id:
            medico = Funcionario.query.get(internacao.medico_id)
        elif atendimento.medico_id:
            medico = Funcionario.query.get(atendimento.medico_id)

        # Buscar enfermeiro responsável
        enfermeiro = None
        if internacao.enfermeiro_id:
            enfermeiro = Funcionario.query.get(internacao.enfermeiro_id)
        elif atendimento.enfermeiro_id:
            enfermeiro = Funcionario.query.get(atendimento.enfermeiro_id)

        # Data atual para o rodapé
        data_impressao = datetime.now(ZoneInfo("America/Sao_Paulo"))

        # Calcular idade do paciente
        idade = None
        if paciente.data_nascimento:
            hoje = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
            idade = hoje.year - paciente.data_nascimento.year
            if hoje.month < paciente.data_nascimento.month or (hoje.month == paciente.data_nascimento.month and hoje.day < paciente.data_nascimento.day):
                idade -= 1

        # Renderizar template HTML para impressão
        return render_template('imprimir_ficha_admissao.html',
                             internacao=internacao,
                             atendimento=atendimento,
                             paciente=paciente,
                             medico=medico,
                             enfermeiro=enfermeiro,
                             idade=idade,
                             data_impressao=data_impressao,
                             hospital_nome='Hospital Sistema HSOP')

    except Exception as e:
        logging.error(f"Erro ao gerar impressão de ficha de admissão: {str(e)}")
        abort(500, f'Erro interno: {str(e)}')

@bp.route('/imprimir/identificacao_paciente/<string:atendimento_id>')
@login_required
def imprimir_identificacao_paciente(atendimento_id):
    """
    Gera uma página HTML para impressão de identificação do paciente
    Formatada para uso em pulseiras, adesivos ou etiquetas de identificação
    Focada nos dados do paciente, leito, diagnóstico e informações para enfermeiros e técnicos
    """
    try:
        from datetime import datetime
        
        # Buscar o atendimento
        atendimento = Atendimento.query.filter_by(id=atendimento_id).first()
        if not atendimento:
            abort(404, 'Atendimento não encontrado.')

        # Buscar a internação relacionada ao atendimento
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            abort(404, 'Internação não encontrada para este atendimento.')

        # Buscar o paciente
        paciente = atendimento.paciente
        if not paciente:
            abort(404, 'Paciente não encontrado.')

        # Buscar o médico responsável
        medico = None
        if internacao.medico_id:
            medico = Funcionario.query.get(internacao.medico_id)
        elif atendimento.medico_id:
            medico = Funcionario.query.get(atendimento.medico_id)

        # Buscar enfermeiro responsável
        enfermeiro = None
        if internacao.enfermeiro_id:
            enfermeiro = Funcionario.query.get(internacao.enfermeiro_id)
        elif atendimento.enfermeiro_id:
            enfermeiro = Funcionario.query.get(atendimento.enfermeiro_id)

        # Calcular idade do paciente
        idade = None
        if paciente.data_nascimento:
            hoje = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
            idade = hoje.year - paciente.data_nascimento.year
            if hoje.month < paciente.data_nascimento.month or (hoje.month == paciente.data_nascimento.month and hoje.day < paciente.data_nascimento.day):
                idade -= 1

        # Data atual para o rodapé
        data_impressao = datetime.now(ZoneInfo("America/Sao_Paulo"))

        # Buscar prescrições médicas ativas para alertas
        prescricoes = PrescricaoClinica.query.filter_by(atendimentos_clinica_id=internacao.id).order_by(
            PrescricaoClinica.horario_prescricao.desc()
        ).limit(3).all()

        # Renderizar template HTML para impressão
        return render_template('imprimir_identificacao_paciente.html',
                             internacao=internacao,
                             atendimento=atendimento,
                             paciente=paciente,
                             medico=medico,
                             enfermeiro=enfermeiro,
                             idade=idade,
                             data_impressao=data_impressao,
                             prescricoes=prescricoes,
                             hospital_nome='Hospital Sistema HSOP')

    except Exception as e:
        logging.error(f"Erro ao gerar impressão de identificação do paciente: {str(e)}")
        abort(500, f'Erro interno: {str(e)}')

# API para verificar duplicatas de pacientes
@bp.route('/api/pacientes/verificar-duplicatas', methods=['POST'])
@login_required
def verificar_duplicatas_pacientes():
    """
    Verifica se já existe um paciente com o mesmo CPF ou Cartão SUS.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso não autorizado'
            }), 403

        dados = request.get_json()
        
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        cpf = dados.get('cpf', '').strip()
        cartao_sus = dados.get('cartao_sus', '').strip()

        if not cpf and not cartao_sus:
            return jsonify({
                'success': True,
                'duplicata_encontrada': False,
                'message': 'Nenhum documento fornecido para verificação'
            })

        paciente_encontrado = None
        campo_duplicado = None

        # Verificar duplicata por CPF
        if cpf:
            paciente_encontrado = Paciente.query.filter_by(cpf=cpf).first()
            if paciente_encontrado:
                campo_duplicado = 'cpf'

        # Se não encontrou por CPF, verificar por Cartão SUS
        if not paciente_encontrado and cartao_sus:
            paciente_encontrado = Paciente.query.filter_by(cartao_sus=cartao_sus).first()
            if paciente_encontrado:
                campo_duplicado = 'cartao_sus'

        if paciente_encontrado:
            return jsonify({
                'success': True,
                'duplicata_encontrada': True,
                'campo_duplicado': campo_duplicado,
                'paciente_existente': {
                    'id': paciente_encontrado.id,
                    'nome': paciente_encontrado.nome,
                    'cpf': paciente_encontrado.cpf,
                    'cartao_sus': paciente_encontrado.cartao_sus,
                    'data_nascimento': paciente_encontrado.data_nascimento.isoformat() if paciente_encontrado.data_nascimento else None,
                    'sexo': paciente_encontrado.sexo
                }
            })

        return jsonify({
            'success': True,
            'duplicata_encontrada': False,
            'message': 'Nenhuma duplicata encontrada'
        })

    except Exception as e:
        logging.error(f'Erro ao verificar duplicatas: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500


        return render_template('clinica_evolucao_paciente_enfermeiro.html', 
                            paciente=paciente, 
                            internacao=internacao)
        
    except Exception as e:
        logging.error(f"Erro ao acessar evolução do paciente (enfermeiro): {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar a evolução do paciente. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

@bp.route('/clinica/impressoes-enfermagem/<string:atendimento_id>')
@login_required
def impressoes_enfermagem(atendimento_id):
    try:
        # Buscar dados do paciente e internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        
        return render_template('impressoes_enfermagem.html', 
                            paciente=paciente, 
                            internacao=internacao,
                            atendimento_id=atendimento_id)
        
    except Exception as e:
        logging.error(f"Erro ao acessar impressões de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao acessar as impressões de enfermagem. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

@bp.route('/imprimir/admissao_enfermagem/<string:atendimento_id>')
@login_required
def imprimir_admissao_enfermagem(atendimento_id):
    """
    Imprime a admissão de enfermagem do paciente
    """
    try:
        # Buscar o atendimento
        atendimento = Atendimento.query.get(atendimento_id)
        if not atendimento:
            flash('Atendimento não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))

        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar o paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar a admissão de enfermagem mais recente
        admissao = AdmissaoEnfermagem.query.filter_by(
            internacao_id=internacao.id
        ).order_by(
            AdmissaoEnfermagem.data_hora.desc()
        ).first()
        
        # Buscar dados do enfermeiro responsável pela admissão
        enfermeiro = None
        if admissao and admissao.enfermeiro_id:
            enfermeiro = Funcionario.query.get(admissao.enfermeiro_id)
        
        # Se não houver admissão na tabela específica, verificar campo legado
        texto_admissao = None
        data_admissao = None
        
        if admissao:
            texto_admissao = admissao.admissao_texto
            data_admissao = admissao.data_hora
        elif internacao.admissao_enfermagem:
            texto_admissao = internacao.admissao_enfermagem
            data_admissao = internacao.data_internacao
        
        if not texto_admissao:
            flash('Nenhuma admissão de enfermagem encontrada para este paciente.', 'warning')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('impressao_admissao_enfermagem.html',
                             paciente=paciente,
                             internacao=internacao,
                             atendimento=atendimento,
                             admissao=admissao,
                             texto_admissao=texto_admissao,
                             data_admissao=data_admissao,
                             enfermeiro=enfermeiro,
                             atendimento_id=atendimento_id)
        
    except Exception as e:
        logging.error(f"Erro ao imprimir admissão de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao gerar impressão da admissão de enfermagem. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

@bp.route('/imprimir/sae_enfermagem/<string:atendimento_id>')
@login_required
def imprimir_sae_enfermagem(atendimento_id):
    """
    Imprime a SAE (Sistematização da Assistência de Enfermagem) do paciente
    """
    try:
        # Buscar o atendimento
        atendimento = Atendimento.query.get(atendimento_id)
        if not atendimento:
            flash('Atendimento não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))

        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar o paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar a SAE mais recente deste paciente
        sae = InternacaoSae.query.filter_by(
            paciente_id=internacao.paciente_id
        ).order_by(
            InternacaoSae.data_registro.desc()
        ).first()
        
        if not sae:
            flash('Nenhuma SAE encontrada para este paciente.', 'warning')
            return redirect(url_for('main.pacientes_internados'))
        
        return render_template('impressao_sae_enfermagem.html',
                             paciente=paciente,
                             internacao=internacao,
                             atendimento=atendimento,
                             sae=sae,
                             atendimento_id=atendimento_id)
        
    except Exception as e:
        logging.error(f"Erro ao imprimir SAE de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao gerar impressão da SAE. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.pacientes_internados'))

# API para listar datas disponíveis das evoluções de enfermagem
@bp.route('/api/enfermagem/evolucoes/datas/<string:atendimento_id>', methods=['GET'])
@login_required
def listar_datas_evolucoes_enfermagem(atendimento_id):
    """
    Lista as datas disponíveis das evoluções de enfermagem para um atendimento específico.
    """
    try:
        # Verificar se o usuário é enfermeiro ou médico
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para enfermeiros e médicos'
            }), 403

        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Buscar as datas das evoluções
        evolucoes = EvolucaoEnfermagem.query\
            .filter_by(atendimentos_clinica_id=internacao.id)\
            .order_by(EvolucaoEnfermagem.data_evolucao.desc())\
            .all()

        # Agrupar por data
        datas_disponiveis = {}
        for evolucao in evolucoes:
            if evolucao.data_evolucao:
                data_str = evolucao.data_evolucao.strftime('%Y-%m-%d')
                data_display = evolucao.data_evolucao.strftime('%d/%m/%Y')
                
                if data_str not in datas_disponiveis:
                    datas_disponiveis[data_str] = {
                        'data': data_str,
                        'data_display': data_display,
                        'quantidade': 0
                    }
                datas_disponiveis[data_str]['quantidade'] += 1

        # Converter para lista ordenada
        datas_lista = list(datas_disponiveis.values())
        datas_lista.sort(key=lambda x: x['data'], reverse=True)

        return jsonify({
            'success': True,
            'datas': datas_lista
        }), 200

    except Exception as e:
        logging.error(f'Erro ao listar datas das evoluções de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# Rota para imprimir evoluções de enfermagem de uma data específica
@bp.route('/imprimir/evolucoes_enfermagem/<string:atendimento_id>')
@login_required
def imprimir_evolucoes_enfermagem(atendimento_id):
    """
    Imprime as evoluções de enfermagem de uma data específica
    """
    try:
        # Pegar a data da query string
        data_selecionada_str = request.args.get('data')
        if not data_selecionada_str:
            flash('Data não especificada para impressão.', 'warning')
            return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))

        # Converter a data
        try:
            data_selecionada = datetime.strptime(data_selecionada_str, '%Y-%m-%d').date()
        except ValueError:
            flash('Formato de data inválido.', 'danger')
            return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))

        # Buscar o atendimento
        atendimento = Atendimento.query.get(atendimento_id)
        if not atendimento:
            flash('Atendimento não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))

        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar o paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar as evoluções da data selecionada
        inicio_dia = datetime.combine(data_selecionada, datetime.min.time())
        fim_dia = datetime.combine(data_selecionada, datetime.max.time())
        
        evolucoes = EvolucaoEnfermagem.query\
            .filter_by(atendimentos_clinica_id=internacao.id)\
            .filter(EvolucaoEnfermagem.data_evolucao >= inicio_dia)\
            .filter(EvolucaoEnfermagem.data_evolucao <= fim_dia)\
            .join(Funcionario, EvolucaoEnfermagem.funcionario_id == Funcionario.id)\
            .add_columns(
                EvolucaoEnfermagem.id,
                EvolucaoEnfermagem.data_evolucao,
                EvolucaoEnfermagem.texto,
                Funcionario.nome.label('enfermeiro_nome'),
                Funcionario.numero_profissional.label('enfermeiro_coren')
            )\
            .order_by(EvolucaoEnfermagem.data_evolucao.asc())\
            .all()
        
        if not evolucoes:
            flash(f'Nenhuma evolução de enfermagem encontrada para o dia {data_selecionada.strftime("%d/%m/%Y")}.', 'warning')
            return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))
        
        # Preparar dados das evoluções
        evolucoes_dados = []
        for evolucao in evolucoes:
            evolucoes_dados.append({
                'id': evolucao.id,
                'data_evolucao': evolucao.data_evolucao,
                'texto': evolucao.texto,
                'enfermeiro_nome': evolucao.enfermeiro_nome,
                'enfermeiro_coren': evolucao.enfermeiro_coren
            })
        
        return render_template('impressao_evolucoes_enfermagem.html',
                             paciente=paciente,
                             internacao=internacao,
                             atendimento=atendimento,
                             evolucoes=evolucoes_dados,
                             data_selecionada=data_selecionada,
                             data_geracao=datetime.now(ZoneInfo("America/Sao_Paulo")),
                             atendimento_id=atendimento_id)
        
    except Exception as e:
        logging.error(f"Erro ao imprimir evoluções de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao gerar impressão das evoluções de enfermagem. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))

# API para listar datas disponíveis das prescrições de enfermagem
@bp.route('/api/enfermagem/prescricoes/datas/<string:atendimento_id>', methods=['GET'])
@login_required
def listar_datas_prescricoes_enfermagem(atendimento_id):
    """
    Lista as datas disponíveis das prescrições de enfermagem para um atendimento específico.
    """
    try:
        # Verificar se o usuário é enfermeiro ou médico
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['enfermeiro', 'medico']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para enfermeiros e médicos'
            }), 403

        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Buscar as datas das prescrições
        prescricoes = db.session.query(
            PrescricaoEnfermagem.data_prescricao
        ).filter(PrescricaoEnfermagem.atendimentos_clinica_id == internacao.id)\
            .filter(PrescricaoEnfermagem.data_prescricao.isnot(None))\
            .all()

        # Agrupar por data
        datas_disponiveis = {}
        for prescricao in prescricoes:
            if prescricao.data_prescricao:
                data_str = prescricao.data_prescricao.strftime('%Y-%m-%d')
                data_display = prescricao.data_prescricao.strftime('%d/%m/%Y')
                
                if data_str not in datas_disponiveis:
                    datas_disponiveis[data_str] = {
                        'data': data_str,
                        'data_display': data_display,
                        'quantidade': 0
                    }
                datas_disponiveis[data_str]['quantidade'] += 1

        # Converter para lista ordenada
        datas_lista = list(datas_disponiveis.values())
        datas_lista.sort(key=lambda x: x['data'], reverse=True)

        return jsonify({
            'success': True,
            'datas': datas_lista
        }), 200

    except Exception as e:
        logging.error(f'Erro ao listar datas das prescrições de enfermagem: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

# Rota para imprimir prescrições de enfermagem de uma data específica
@bp.route('/imprimir/prescricoes_enfermagem/<string:atendimento_id>')
@login_required
def imprimir_prescricoes_enfermagem(atendimento_id):
    """
    Imprime as prescrições de enfermagem de uma data específica
    """
    try:
        # Pegar a data da query string
        data_selecionada_str = request.args.get('data')
        if not data_selecionada_str:
            flash('Data não especificada para impressão.', 'warning')
            return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))

        # Converter a data
        try:
            data_selecionada = datetime.strptime(data_selecionada_str, '%Y-%m-%d').date()
        except ValueError:
            flash('Formato de data inválido.', 'danger')
            return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))

        # Buscar o atendimento
        atendimento = Atendimento.query.get(atendimento_id)
        if not atendimento:
            flash('Atendimento não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))

        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            flash('Internação não encontrada.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar o paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        if not paciente:
            flash('Paciente não encontrado.', 'danger')
            return redirect(url_for('main.pacientes_internados'))
        
        # Buscar as prescrições da data selecionada
        inicio_dia = datetime.combine(data_selecionada, datetime.min.time())
        fim_dia = datetime.combine(data_selecionada, datetime.max.time())
        
        prescricoes = db.session.query(
            PrescricaoEnfermagem.id,
            PrescricaoEnfermagem.data_prescricao,
            PrescricaoEnfermagem.texto,
            Funcionario.nome.label("enfermeiro_nome"),
            Funcionario.numero_profissional.label("enfermeiro_coren")
        ).select_from(PrescricaoEnfermagem)\
            .join(Funcionario, PrescricaoEnfermagem.funcionario_id == Funcionario.id)\
            .filter(PrescricaoEnfermagem.atendimentos_clinica_id == internacao.id)\
            .filter(PrescricaoEnfermagem.data_prescricao >= inicio_dia)\
            .filter(PrescricaoEnfermagem.data_prescricao <= fim_dia)\
            .order_by(PrescricaoEnfermagem.data_prescricao.asc())\
            .all()
        
        if not prescricoes:
            flash(f'Nenhuma prescrição de enfermagem encontrada para o dia {data_selecionada.strftime("%d/%m/%Y")}.', 'warning')
            return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))
        
        # Preparar dados das prescrições
        prescricoes_dados = []
        for prescricao in prescricoes:
            prescricoes_dados.append({
                'id': prescricao.id,
                'data_prescricao': prescricao.data_prescricao,
                'texto': prescricao.texto,
                'enfermeiro_nome': prescricao.enfermeiro_nome,
                'enfermeiro_coren': prescricao.enfermeiro_coren
            })
        
        return render_template('impressao_prescricoes_enfermagem.html',
                             paciente=paciente,
                             internacao=internacao,
                             atendimento=atendimento,
                             prescricoes=prescricoes_dados,
                             data_selecionada=data_selecionada,
                             data_geracao=datetime.now(ZoneInfo("America/Sao_Paulo")),
                             atendimento_id=atendimento_id)
        
    except Exception as e:
        logging.error(f"Erro ao imprimir prescrições de enfermagem: {str(e)}")
        logging.error(traceback.format_exc())
        flash('Erro ao gerar impressão das prescrições de enfermagem. Por favor, tente novamente.', 'danger')
        return redirect(url_for('main.impressoes_enfermagem', atendimento_id=atendimento_id))

@bp.route('/api/paciente/<int:paciente_id>/historico-internamentos', methods=['GET'])
@login_required
def obter_historico_internamentos_paciente(paciente_id):
    """
    Busca o histórico de internações de um paciente específico.
    Exclui a internação atual se fornecida via query parameter.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso permitido apenas para médicos e enfermeiros'
            }), 403
        
        # Verificar se o paciente existe
        paciente = Paciente.query.get(paciente_id)
        if not paciente:
            return jsonify({
                'success': False,
                'message': 'Paciente não encontrado'
            }), 404
        
        # Obter atendimento atual para excluir da listagem
        atendimento_atual = request.args.get('atendimento_atual')
        
        # Buscar todas as internações do paciente
        query = Internacao.query.filter_by(paciente_id=paciente_id)
        
        # Excluir internação atual se fornecido
        if atendimento_atual:
            query = query.filter(Internacao.atendimento_id != atendimento_atual)
        
        # Ordenar por data de internação (mais recente primeiro)
        internacoes = query.order_by(Internacao.data_internacao.desc()).all()
        
        # Formatar resposta
        internamentos = []
        for internacao in internacoes:
            # Buscar dados do médico responsável
            medico = None
            if internacao.medico_id:
                medico = Funcionario.query.get(internacao.medico_id)
            
            internamentos.append({
                'id': internacao.id,
                'atendimento_id': internacao.atendimento_id,
                'data_internacao': internacao.data_internacao.isoformat() if internacao.data_internacao else None,
                'data_alta': internacao.data_alta.isoformat() if internacao.data_alta else None,
                'diagnostico': internacao.diagnostico,
                'diagnostico_inicial': internacao.diagnostico_inicial,
                'leito': internacao.leito,
                'medico_nome': medico.nome if medico else None,
                'cid_principal': internacao.cid_principal,
                'carater_internacao': internacao.carater_internacao
            })
        
        return jsonify({
            'success': True,
            'internamentos': internamentos
        })
        
    except Exception as e:
        logging.error(f"Erro ao obter histórico de internamentos do paciente {paciente_id}: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@bp.route('/api/prescricoes/<int:prescricao_id>/base', methods=['GET'])
@login_required
def buscar_prescricao_base(prescricao_id):
    """
    Buscar dados de uma prescrição específica para usar como base para nova prescrição
    """
    try:
        prescricao = PrescricaoClinica.query.get(prescricao_id)
        
        if not prescricao:
            return jsonify({
                'success': False,
                'error': 'Prescrição não encontrada'
            }), 404
        
        # Verificar se o usuário tem acesso à prescrição
        if prescricao.internacao.paciente_id != prescricao.internacao.paciente_id:
            return jsonify({
                'success': False,
                'error': 'Acesso negado'
            }), 403
        
        # Preparar dados da prescrição para ser base
        prescricao_base = {
            'id': prescricao.id,
            'texto_dieta': prescricao.texto_dieta,
            'texto_procedimento_medico': prescricao.texto_procedimento_medico,
            'texto_procedimento_multi': prescricao.texto_procedimento_multi,
            'medicamentos': prescricao.medicamentos_json if prescricao.medicamentos_json else []
        }
        
        return jsonify({
            'success': True,
            'prescricao_base': prescricao_base
        })

    except Exception as e:
        current_app.logger.error(f"Erro ao buscar prescrição base: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

# API para fechar prontuário (define dieta = '1')
@bp.route('/api/internacao/<string:internacao_id>/fechar-prontuario', methods=['POST'])
@login_required
def fechar_prontuario(internacao_id):
    """
    Fecha o prontuário de um paciente que já teve alta, definindo dieta = '1'.
    Isso remove o paciente da listagem de pacientes internados.
    """
    try:
        current_user = get_current_user()
        if current_user.cargo.lower() not in ['medico', 'enfermeiro']:
            return jsonify({
                'success': False,
                'message': 'Acesso não autorizado. Apenas médicos e enfermeiros podem fechar prontuários.'
            }), 403
        
        # Buscar a internação
        internacao = Internacao.query.filter_by(atendimento_id=internacao_id).first()
        
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada.'
            }), 404
        
        # Verificar se o paciente já teve alta
        if not internacao.data_alta:
            return jsonify({
                'success': False,
                'message': 'Só é possível fechar prontuário de pacientes que já tiveram alta.'
            }), 400
        
        # Verificar se o prontuário já foi fechado
        if internacao.dieta == '1':
            return jsonify({
                'success': False,
                'message': 'Prontuário já foi fechado anteriormente.'
            }), 400
        
        # Fechar o prontuário definindo dieta = '1'
        internacao.dieta = '1'
        
        # Commit das alterações
        db.session.commit()
        
        # Log da ação
        logging.info(f"Prontuário fechado pelo {current_user.cargo} {current_user.nome} (ID: {current_user.id}) para internação {internacao_id}")
        
        return jsonify({
            'success': True,
            'message': 'Prontuário fechado com sucesso.'
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erro ao fechar prontuário: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor ao fechar prontuário.'
        }), 500


# ======= NOVOS ENDPOINTS PARA DIAGNÓSTICO E ANAMNESE =======

@bp.route('/api/internacao/<string:atendimento_id>/diagnostico', methods=['PUT'])
@login_required
def atualizar_diagnostico_internacao(atendimento_id):
    """
    Atualiza dados de diagnóstico e classificação de uma internação
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem atualizar diagnósticos'
            }), 403

        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Obter dados do JSON
        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        # Campos permitidos para atualização de diagnóstico
        campos_diagnostico = [
            'diagnostico_inicial',
            'cid_principal', 
            'diagnostico',
            'cid_10_secundario',
            'cid_10_causas_associadas',
            'justificativa_internacao_sinais_e_sintomas',
            'justificativa_internacao_condicoes',
            'justificativa_internacao_principais_resultados_diagnostico'
        ]

        # Atualizar campos de diagnóstico
        for campo in campos_diagnostico:
            if campo in dados:
                setattr(internacao, campo, dados[campo])

        # Salvar alterações
        db.session.commit()

        # Log da ação
        logging.info(f"Diagnóstico atualizado pelo médico {current_user.nome} (ID: {current_user.id}) para internação {atendimento_id}")

        return jsonify({
            'success': True,
            'message': 'Diagnóstico atualizado com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f"Erro ao atualizar diagnóstico da internação {atendimento_id}: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'error': str(e)
        }), 500


@bp.route('/api/internacao/<string:atendimento_id>/anamnese-conduta', methods=['PUT'])
@login_required
def atualizar_anamnese_conduta_internacao(atendimento_id):
    """
    Atualiza dados de anamnese e conduta médica de uma internação
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem atualizar anamnese e conduta'
            }), 403

        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Obter dados do JSON
        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        # Atualizar campos específicos com mapeamento correto
        if 'anamnese_exame_fisico' in dados:
            internacao.folha_anamnese = dados['anamnese_exame_fisico']
            
        if 'hda' in dados:
            internacao.hda = dados['hda']
            
        if 'conduta' in dados:
            internacao.conduta = dados['conduta']
            
        if 'exames_laboratoriais' in dados:
            internacao.exames_laboratoriais = dados['exames_laboratoriais']
            
        if 'descr_procedimento_solicitado' in dados:
            internacao.descr_procedimento_solicitado = dados['descr_procedimento_solicitado']
            
        if 'codigo_procedimento' in dados:
            internacao.codigo_procedimento = dados['codigo_procedimento']

        # Salvar alterações
        db.session.commit()

        # Log da ação
        logging.info(f"Anamnese e conduta atualizadas pelo médico {current_user.nome} (ID: {current_user.id}) para internação {atendimento_id}")

        return jsonify({
            'success': True,
            'message': 'Anamnese e conduta atualizadas com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f"Erro ao atualizar anamnese e conduta da internação {atendimento_id}: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'error': str(e)
        }), 500

@bp.route('/api/internacao/<string:atendimento_id>/justificativas', methods=['PUT'])
@login_required
def atualizar_justificativas_internacao(atendimento_id):
    """
    Atualiza dados de justificativas da internação
    """
    try:
        # Verificar se o usuário é médico
        current_user = get_current_user()
        if current_user.cargo.lower() != 'medico':
            return jsonify({
                'success': False,
                'message': 'Apenas médicos podem atualizar justificativas'
            }), 403

        # Buscar a internação pelo atendimento_id
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404

        # Obter dados do JSON
        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'message': 'Dados não fornecidos'
            }), 400

        # Campos permitidos para atualização de justificativas
        campos_justificativas = [
            'justificativa_internacao_sinais_e_sintomas',
            'justificativa_internacao_condicoes',
            'justificativa_internacao_principais_resultados_diagnostico'
        ]

        # Atualizar campos de justificativas
        for campo in campos_justificativas:
            if campo in dados:
                setattr(internacao, campo, dados[campo])

        # Salvar alterações
        db.session.commit()

        # Log da ação
        logging.info(f"Justificativas atualizadas pelo médico {current_user.nome} (ID: {current_user.id}) para internação {atendimento_id}")

        return jsonify({
            'success': True,
            'message': 'Justificativas atualizadas com sucesso'
        })

    except Exception as e:
        db.session.rollback()
        logging.error(f"Erro ao atualizar justificativas da internação {atendimento_id}: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'error': str(e)
        }), 500

@bp.route('/api/internacao/<string:atendimento_id>/informacoes-alta', methods=['GET'])
@login_required
def buscar_informacoes_alta_para_impressao(atendimento_id):
    """
    API específica para buscar informações de alta formatadas para impressão.
    Usada pela página de pacientes internados para imprimir informações de alta.
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
        internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
        if not internacao:
            return jsonify({
                'success': False,
                'message': 'Internação não encontrada'
            }), 404
        
        # Buscar dados do paciente
        paciente = Paciente.query.get(internacao.paciente_id)
        
        # Se ainda não teve alta, montar histórico automaticamente
        historico_internacao = internacao.historico_internacao
        if not internacao.data_alta:
            # Montar histórico automaticamente usando: HDA + Anamnese + Conduta + Exames
            partes_historico = [
                internacao.hda or '',
                internacao.folha_anamnese or '',
                internacao.conduta or '',
                internacao.exames_laboratoriais or ''
            ]
            
            # Filtrar partes vazias e juntar com uma linha simples de separação
            historico_automatico = '\n'.join([parte.strip() for parte in partes_historico if parte.strip()])
            historico_internacao = historico_automatico or 'Histórico será montado automaticamente'
        if not paciente:
            return jsonify({
                'success': False,
                'message': 'Paciente não encontrado'
            }), 404
        
        # Formatar resposta com as informações de alta no formato esperado pelo JavaScript
        resultado = {
            'success': True,
            'informacoes_alta': {
                'data_alta': internacao.data_alta.isoformat() if internacao.data_alta else None,
            'diagnostico': internacao.diagnostico or 'Não informado',
            'historico_internacao': historico_internacao or 'Não informado', 
                'conduta': internacao.conduta or 'Não informado',
                'medicacao': getattr(internacao, 'medicacao_alta', None) or internacao.medicacao or 'Não informado',
                'cuidados_gerais': internacao.cuidados_gerais or 'Não informado'
            },
            'paciente': {
                'nome': paciente.nome or 'Não informado',
                'cpf': paciente.cpf or 'Não informado'
            }
        }
        
        return jsonify(resultado)
        
    except Exception as e:
        logging.error(f'Erro ao buscar informações de alta para impressão: {str(e)}')
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Erro ao buscar informações de alta: {str(e)}'
        }), 500

@bp.route('/clinica/receituario/<int:receituario_id>/imprimir_html')
def imprimir_receita_comum(receituario_id):
    receituario = ReceituarioClinica.query.get(receituario_id)
    if not receituario or receituario.tipo_receita != 'normal':
        return '<h3>Receita não encontrada ou não é do tipo comum.</h3>', 404
    atendimento = receituario.atendimento
    paciente = atendimento.paciente
    medico = receituario.medico
    return render_template(
        'imprimir_receita_comum.html',
        paciente=paciente,
        medico=medico,
        receituario=receituario
    )



