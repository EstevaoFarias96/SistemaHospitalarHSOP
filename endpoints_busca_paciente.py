# Endpoints para busca de pacientes - Adicionar ao routes.py

# Endpoint para buscar paciente por nome
@app.route('/api/pacientes/buscar/nome', methods=['GET'])
@login_required
def buscar_paciente_por_nome():
    try:
        valor = request.args.get('valor', '').strip()
        
        if not valor:
            return jsonify({'success': False, 'message': 'Nome não fornecido'})
        
        if len(valor) < 3:
            return jsonify({'success': False, 'message': 'Digite pelo menos 3 caracteres'})
        
        # Buscar pacientes cujo nome contenha o valor (case insensitive)
        pacientes = Paciente.query.filter(
            Paciente.nome.ilike(f'%{valor}%')
        ).order_by(Paciente.nome).limit(20).all()
        
        # Converter para dicionário
        pacientes_data = []
        for paciente in pacientes:
            pacientes_data.append({
                'id': paciente.id,
                'nome': paciente.nome,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento.strftime('%Y-%m-%d') if paciente.data_nascimento else None,
                'sexo': paciente.sexo,
                'telefone': paciente.telefone,
                'cartao_sus': paciente.cartao_sus,
                'endereco': paciente.endereco
            })
        
        return jsonify({
            'success': True,
            'pacientes': pacientes_data,
            'total': len(pacientes_data)
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar paciente por nome: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'})


# Endpoint para buscar paciente por CPF
@app.route('/api/pacientes/buscar/cpf', methods=['GET'])
@login_required
def buscar_paciente_por_cpf():
    try:
        valor = request.args.get('valor', '').strip()
        
        if not valor:
            return jsonify({'success': False, 'message': 'CPF não fornecido'})
        
        # Remover formatação do CPF
        cpf_limpo = re.sub(r'\D', '', valor)
        
        if len(cpf_limpo) != 11:
            return jsonify({'success': False, 'message': 'CPF deve ter 11 dígitos'})
        
        # Buscar paciente pelo CPF exato
        paciente = Paciente.query.filter_by(cpf=cpf_limpo).first()
        
        pacientes_data = []
        if paciente:
            pacientes_data.append({
                'id': paciente.id,
                'nome': paciente.nome,
                'cpf': paciente.cpf,
                'data_nascimento': paciente.data_nascimento.strftime('%Y-%m-%d') if paciente.data_nascimento else None,
                'sexo': paciente.sexo,
                'telefone': paciente.telefone,
                'cartao_sus': paciente.cartao_sus,
                'endereco': paciente.endereco
            })
        
        return jsonify({
            'success': True,
            'pacientes': pacientes_data,
            'total': len(pacientes_data)
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar paciente por CPF: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'})


# Observações para implementação:
"""
1. Adicione estes endpoints ao seu arquivo routes.py
2. Certifique-se de que os imports estão corretos:
   - from flask import jsonify, request
   - import re
   - from app.models import Paciente
   
3. O decorator @login_required assume que você tem autenticação implementada
4. Ajuste o nome da classe Paciente se for diferente no seu modelo
5. Ajuste os campos conforme sua estrutura de banco de dados
6. O logger assume que você tem logging configurado, se não tiver, pode usar print() para debug

Exemplo de como adicionar ao routes.py:

# No início do arquivo, certifique-se dos imports:
import re
from flask import jsonify, request

# Cole os endpoints onde apropriado no arquivo
"""
