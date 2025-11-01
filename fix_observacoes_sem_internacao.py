"""
Script para corrigir observações que não têm registro de Internacao.

Este script:
1. Busca todas as observações na tabela ListaObservacao
2. Verifica se cada uma tem um registro correspondente em Internacao
3. Cria o registro de Internacao para as que não têm
4. Registra todas as ações em log

Executar ANTES de usar o sistema corrigido para garantir consistência.
"""

import sys
import os

# Adicionar o diretório do app ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import ListaObservacao, Internacao, Atendimento
from datetime import datetime
from zoneinfo import ZoneInfo

def now_brasilia():
    return datetime.now(ZoneInfo("America/Sao_Paulo"))

def corrigir_observacoes_sem_internacao():
    """
    Corrige observações que não têm registro de Internacao
    """
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("🔍 VERIFICAÇÃO E CORREÇÃO DE OBSERVAÇÕES SEM REGISTRO DE INTERNAÇÃO")
        print("=" * 80)
        print()
        
        # Buscar todas as observações
        observacoes = ListaObservacao.query.all()
        total_observacoes = len(observacoes)
        
        print(f"📊 Total de observações encontradas: {total_observacoes}")
        print()
        
        corrigidas = 0
        erros = 0
        ja_ok = 0
        
        for obs in observacoes:
            atendimento_id = obs.id_atendimento
            
            # Verificar se existe registro de Internacao
            internacao = Internacao.query.filter_by(atendimento_id=atendimento_id).first()
            
            if internacao:
                ja_ok += 1
                print(f"✅ Atendimento {atendimento_id}: Já tem Internacao (ID: {internacao.id})")
            else:
                print(f"❌ Atendimento {atendimento_id}: SEM registro de Internacao - CORRIGINDO...")
                
                # Buscar o atendimento
                atendimento = Atendimento.query.get(atendimento_id)
                
                if not atendimento:
                    print(f"   ⚠️  ERRO: Atendimento {atendimento_id} não encontrado!")
                    erros += 1
                    continue
                
                try:
                    # Criar registro de Internacao
                    nova_internacao = Internacao(
                        atendimento_id=atendimento_id,
                        paciente_id=atendimento.paciente_id,
                        medico_id=atendimento.medico_id,
                        enfermeiro_id=None,
                        hda=f"Observação iniciada em {obs.data_entrada.strftime('%d/%m/%Y %H:%M') if obs.data_entrada else 'data não registrada'}",
                        diagnostico_inicial='Registro criado automaticamente para correção de dados',
                        data_internacao=obs.data_entrada or now_brasilia(),
                        leito='Observação',
                        carater_internacao='Observação',
                        dieta=None
                    )
                    
                    db.session.add(nova_internacao)
                    db.session.flush()
                    
                    print(f"   ✅ Internacao criada com sucesso (ID: {nova_internacao.id})")
                    corrigidas += 1
                    
                except Exception as e:
                    print(f"   ❌ ERRO ao criar Internacao: {str(e)}")
                    erros += 1
                    db.session.rollback()
        
        # Commit todas as alterações
        if corrigidas > 0:
            try:
                db.session.commit()
                print()
                print("💾 ✅ Todas as correções foram salvas no banco de dados!")
            except Exception as e:
                print()
                print(f"❌ ERRO ao salvar correções: {str(e)}")
                db.session.rollback()
        
        # Resumo final
        print()
        print("=" * 80)
        print("📊 RESUMO DA CORREÇÃO")
        print("=" * 80)
        print(f"Total de observações verificadas: {total_observacoes}")
        print(f"✅ Já estavam OK: {ja_ok}")
        print(f"🔧 Corrigidas: {corrigidas}")
        print(f"❌ Erros: {erros}")
        print("=" * 80)
        
        if corrigidas > 0:
            print()
            print("⚠️  IMPORTANTE: As observações foram corrigidas.")
            print("   Agora você pode usar o sistema normalmente.")
        elif ja_ok == total_observacoes:
            print()
            print("✅ Tudo OK! Todas as observações têm seus registros de Internacao.")
        
        return corrigidas, erros

if __name__ == '__main__':
    print()
    print("🏥 HSOP - Sistema de Correção de Observações")
    print()
    
    resposta = input("Deseja executar a correção? (s/n): ").strip().lower()
    
    if resposta in ['s', 'sim', 'y', 'yes']:
        print()
        corrigidas, erros = corrigir_observacoes_sem_internacao()
        print()
        
        if erros > 0:
            print("⚠️  Alguns erros ocorreram. Verifique os logs acima.")
            sys.exit(1)
        else:
            print("✅ Processo concluído com sucesso!")
            sys.exit(0)
    else:
        print("❌ Operação cancelada pelo usuário.")
        sys.exit(0)

