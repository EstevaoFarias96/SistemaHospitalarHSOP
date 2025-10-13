#!/usr/bin/env python3
"""
Script para corrigir os dados da tabela fluxo_disp após mudança de tipo
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models import FluxoDisp, Atendimento, db

def corrigir_dados_fluxo_disp():
    """Corrige os dados da tabela fluxo_disp convertendo id_atendimento para string"""

    app = create_app()

    with app.app_context():
        print("=== CORREÇÃO DOS DADOS DA TABELA FLUXO_DISP ===")

        # Buscar todos os registros
        todos_registros = FluxoDisp.query.all()
        print(f"Encontrados {len(todos_registros)} registros na tabela fluxo_disp")

        # Verificar se os dados já estão corretos
        registros_para_corrigir = []
        for registro in todos_registros:
            if isinstance(registro.id_atendimento, int):
                registros_para_corrigir.append(registro)

        print(f"Registros que precisam ser corrigidos: {len(registros_para_corrigir)}")

        if len(registros_para_corrigir) == 0:
            print("✅ Todos os registros já estão com tipos corretos!")
            return

        # Corrigir os registros
        for registro in registros_para_corrigir:
            print(f"Corrigindo registro ID {registro.id}:")
            print(f"  id_atendimento atual: {registro.id_atendimento} (tipo: {type(registro.id_atendimento)})")

            # Converter para string
            novo_id_atendimento = str(registro.id_atendimento)

            # Verificar se o atendimento existe
            atendimento = Atendimento.query.get(novo_id_atendimento)
            if atendimento:
                print(f"  ✅ Atendimento encontrado: {atendimento.id}")

                # Atualizar o registro
                registro.id_atendimento = novo_id_atendimento
                print(f"  ✅ Registro atualizado com sucesso")
            else:
                print(f"  ❌ Atendimento {novo_id_atendimento} não encontrado!")
                # Vamos tentar encontrar um atendimento similar
                atendimentos_similares = Atendimento.query.filter(Atendimento.id.like(f'%{registro.id_atendimento}%')).all()
                if atendimentos_similares:
                    print(f"  📝 Atendimentos similares encontrados: {[a.id for a in atendimentos_similares]}")
                    # Usar o primeiro encontrado
                    registro.id_atendimento = atendimentos_similares[0].id
                    print(f"  ✅ Usando atendimento: {atendimentos_similares[0].id}")
                else:
                    print(f"  ❌ Nenhum atendimento similar encontrado. Mantendo valor original.")

        # Salvar as mudanças
        try:
            db.session.commit()
            print("✅ Todas as correções foram salvas com sucesso!")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erro ao salvar correções: {e}")
            return

        # Verificar resultado final
        print("\n=== VERIFICAÇÃO FINAL ===")
        registros_corrigidos = FluxoDisp.query.all()
        pendentes = FluxoDisp.query.filter_by(id_responsavel=0).count()

        print(f"Total de registros: {len(registros_corrigidos)}")
        print(f"Registros pendentes (id_responsavel=0): {pendentes}")

        # Testar se a query funciona agora
        print("\n=== TESTE DE FUNCIONAMENTO ===")
        prescricoes_pendentes = FluxoDisp.query.filter_by(id_responsavel=0).all()

        for prescricao in prescricoes_pendentes:
            atendimento = Atendimento.query.get(prescricao.id_atendimento)
            if atendimento:
                print(f"✅ Prescrição ID {prescricao.id}: Atendimento {atendimento.id} encontrado")
            else:
                print(f"❌ Prescrição ID {prescricao.id}: Atendimento {prescricao.id_atendimento} não encontrado")

if __name__ == "__main__":
    corrigir_dados_fluxo_disp()




