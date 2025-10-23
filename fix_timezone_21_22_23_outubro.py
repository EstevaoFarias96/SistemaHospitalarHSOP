#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir horários cadastrados em UTC/Londres para horário de Brasília
Datas afetadas: 21, 22 e 23 de outubro de 2025
Criado em: 23/10/2025

ATENÇÃO: Execute este script apenas UMA VEZ após fazer BACKUP do banco de dados
"""

import sys
import os
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import db, create_app
from app.models import Atendimento, Internacao
from sqlalchemy import and_, or_

def corrigir_horarios_atendimentos():
    """
    Corrige horários da tabela atendimentos para os dias 21, 22 e 23/10/2025
    Subtrai 3 horas (UTC -> Brasília)
    """
    print("=" * 80)
    print("CORRIGINDO HORÁRIOS - TABELA ATENDIMENTOS")
    print("=" * 80)
    
    # Definir as datas a serem corrigidas
    datas_corrigir = [
        date(2025, 10, 21),
        date(2025, 10, 22),
        date(2025, 10, 23)
    ]
    
    total_corrigidos = 0
    
    for data_atend in datas_corrigir:
        print(f"\n📅 Processando data: {data_atend.strftime('%d/%m/%Y')}")
        
        # Buscar atendimentos dessa data
        atendimentos = Atendimento.query.filter(
            Atendimento.data_atendimento == data_atend
        ).all()
        
        print(f"   Encontrados: {len(atendimentos)} atendimentos")
        
        for atend in atendimentos:
            campos_corrigidos = []
            
            # Corrigir horario_triagem
            if atend.horario_triagem:
                novo_horario = atend.horario_triagem - timedelta(hours=3)
                if atend.horario_triagem != novo_horario:
                    print(f"   ⏰ Atendimento {atend.id} - horario_triagem: {atend.horario_triagem} -> {novo_horario}")
                    atend.horario_triagem = novo_horario
                    campos_corrigidos.append('horario_triagem')
            
            # Corrigir horario_consulta_medica
            if atend.horario_consulta_medica:
                novo_horario = atend.horario_consulta_medica - timedelta(hours=3)
                if atend.horario_consulta_medica != novo_horario:
                    print(f"   ⏰ Atendimento {atend.id} - horario_consulta_medica: {atend.horario_consulta_medica} -> {novo_horario}")
                    atend.horario_consulta_medica = novo_horario
                    campos_corrigidos.append('horario_consulta_medica')
            
            # Corrigir horario_observacao
            if atend.horario_observacao:
                novo_horario = atend.horario_observacao - timedelta(hours=3)
                if atend.horario_observacao != novo_horario:
                    print(f"   ⏰ Atendimento {atend.id} - horario_observacao: {atend.horario_observacao} -> {novo_horario}")
                    atend.horario_observacao = novo_horario
                    campos_corrigidos.append('horario_observacao')
            
            # Corrigir horario_internacao
            if atend.horario_internacao:
                novo_horario = atend.horario_internacao - timedelta(hours=3)
                if atend.horario_internacao != novo_horario:
                    print(f"   ⏰ Atendimento {atend.id} - horario_internacao: {atend.horario_internacao} -> {novo_horario}")
                    atend.horario_internacao = novo_horario
                    campos_corrigidos.append('horario_internacao')
            
            # Corrigir horario_alta
            if atend.horario_alta:
                novo_horario = atend.horario_alta - timedelta(hours=3)
                if atend.horario_alta != novo_horario:
                    print(f"   ⏰ Atendimento {atend.id} - horario_alta: {atend.horario_alta} -> {novo_horario}")
                    atend.horario_alta = novo_horario
                    campos_corrigidos.append('horario_alta')
            
            # Corrigir horario_medicacao
            if atend.horario_medicacao:
                novo_horario = atend.horario_medicacao - timedelta(hours=3)
                if atend.horario_medicacao != novo_horario:
                    print(f"   ⏰ Atendimento {atend.id} - horario_medicacao: {atend.horario_medicacao} -> {novo_horario}")
                    atend.horario_medicacao = novo_horario
                    campos_corrigidos.append('horario_medicacao')
            
            if campos_corrigidos:
                total_corrigidos += 1
                print(f"   ✅ Atendimento {atend.id} corrigido ({len(campos_corrigidos)} campos)")
        
        # Commit após cada data
        try:
            db.session.commit()
            print(f"   💾 Commit realizado com sucesso para {data_atend.strftime('%d/%m/%Y')}")
        except Exception as e:
            db.session.rollback()
            print(f"   ❌ ERRO ao fazer commit: {str(e)}")
            return False
    
    print(f"\n✅ Total de atendimentos corrigidos: {total_corrigidos}")
    return True


def corrigir_horarios_internacoes():
    """
    Corrige horários da tabela atendimentos_clinica (internações) para os dias 21, 22 e 23/10/2025
    Subtrai 3 horas (UTC -> Brasília)
    """
    print("\n" + "=" * 80)
    print("CORRIGINDO HORÁRIOS - TABELA INTERNAÇÕES (atendimentos_clinica)")
    print("=" * 80)
    
    # Buscar internações com data_internacao ou data_da_solicitacao_exame nos dias 21, 22, 23
    inicio = datetime(2025, 10, 21, 0, 0, 0)
    fim = datetime(2025, 10, 24, 0, 0, 0)  # Até o início do dia 24
    
    internacoes = Internacao.query.filter(
        or_(
            and_(Internacao.data_internacao >= inicio, Internacao.data_internacao < fim),
            and_(Internacao.data_alta >= inicio, Internacao.data_alta < fim),
            and_(Internacao.data_da_solicitacao_exame >= inicio, Internacao.data_da_solicitacao_exame < fim)
        )
    ).all()
    
    print(f"   Encontradas: {len(internacoes)} internações")
    
    total_corrigidos = 0
    
    for internacao in internacoes:
        campos_corrigidos = []
        
        # Corrigir data_internacao
        if internacao.data_internacao and inicio <= internacao.data_internacao < fim:
            novo_horario = internacao.data_internacao - timedelta(hours=3)
            print(f"   ⏰ Internação {internacao.id} - data_internacao: {internacao.data_internacao} -> {novo_horario}")
            internacao.data_internacao = novo_horario
            campos_corrigidos.append('data_internacao')
        
        # Corrigir data_alta
        if internacao.data_alta and inicio <= internacao.data_alta < fim:
            novo_horario = internacao.data_alta - timedelta(hours=3)
            print(f"   ⏰ Internação {internacao.id} - data_alta: {internacao.data_alta} -> {novo_horario}")
            internacao.data_alta = novo_horario
            campos_corrigidos.append('data_alta')
        
        # Corrigir data_da_solicitacao_exame
        if internacao.data_da_solicitacao_exame and inicio <= internacao.data_da_solicitacao_exame < fim:
            novo_horario = internacao.data_da_solicitacao_exame - timedelta(hours=3)
            print(f"   ⏰ Internação {internacao.id} - data_da_solicitacao_exame: {internacao.data_da_solicitacao_exame} -> {novo_horario}")
            internacao.data_da_solicitacao_exame = novo_horario
            campos_corrigidos.append('data_da_solicitacao_exame')
        
        if campos_corrigidos:
            total_corrigidos += 1
            print(f"   ✅ Internação {internacao.id} corrigida ({len(campos_corrigidos)} campos)")
    
    # Commit final
    try:
        db.session.commit()
        print(f"   💾 Commit realizado com sucesso")
        print(f"\n✅ Total de internações corrigidas: {total_corrigidos}")
        return True
    except Exception as e:
        db.session.rollback()
        print(f"   ❌ ERRO ao fazer commit: {str(e)}")
        return False


def main():
    """Função principal"""
    print("\n" + "=" * 80)
    print("CORREÇÃO DE TIMEZONE - DIAS 21, 22 e 23 DE OUTUBRO DE 2025")
    print("=" * 80)
    print("\n⚠️  ATENÇÃO: Este script vai:")
    print("   - Subtrair 3 horas de todos os horários dos dias 21, 22 e 23/10/2025")
    print("   - Converter horários de UTC/Londres para horário de Brasília")
    print("   - Afetar tabelas: atendimentos e atendimentos_clinica")
    print("\n⚠️  IMPORTANTE:")
    print("   - Execute este script apenas UMA VEZ")
    print("   - Certifique-se de ter feito BACKUP do banco de dados")
    print("   - Execute em um horário de baixo movimento")
    
    resposta = input("\n❓ Deseja continuar? (digite 'SIM' para confirmar): ")
    
    if resposta.strip().upper() != 'SIM':
        print("\n❌ Operação cancelada pelo usuário.")
        return
    
    print("\n🚀 Iniciando correção...")
    
    # Criar aplicação Flask
    app = create_app()
    
    with app.app_context():
        try:
            # Corrigir atendimentos
            sucesso_atend = corrigir_horarios_atendimentos()
            
            if not sucesso_atend:
                print("\n❌ Erro ao corrigir atendimentos. Abortando.")
                return
            
            # Corrigir internações
            sucesso_intern = corrigir_horarios_internacoes()
            
            if not sucesso_intern:
                print("\n❌ Erro ao corrigir internações. Atendimentos já foram corrigidos.")
                return
            
            print("\n" + "=" * 80)
            print("✅ CORREÇÃO CONCLUÍDA COM SUCESSO!")
            print("=" * 80)
            print("\n📊 Resumo:")
            print("   ✅ Atendimentos corrigidos")
            print("   ✅ Internações corrigidas")
            print("   ✅ Todos os horários agora estão em horário de Brasília")
            print("\n💡 Próximos passos:")
            print("   1. Verifique alguns registros no banco de dados")
            print("   2. Teste a aplicação para garantir que tudo está funcionando")
            print("   3. Este script NÃO deve ser executado novamente")
            
        except Exception as e:
            print(f"\n❌ ERRO FATAL: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()


if __name__ == '__main__':
    main()

