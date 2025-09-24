#!/usr/bin/env python3
"""
Script para testar a funcionalidade de dispensações do fluxo_disp
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models import FluxoDisp, Atendimento, Paciente, Funcionario, db
from datetime import date, time

def testar_fluxo_disp():
    """Testa a funcionalidade de dispensações do fluxo_disp"""

    app = create_app()

    with app.app_context():
        print("=== TESTE DA TABELA FLUXO_DISP ===")

        # Verificar total de registros
        total = FluxoDisp.query.count()
        print(f"Total de registros na tabela fluxo_disp: {total}")

        # Verificar registros pendentes (id_responsavel=0)
        pendentes = FluxoDisp.query.filter_by(id_responsavel=0).count()
        print(f"Registros pendentes (id_responsavel=0): {pendentes}")

        # Listar todos os registros
        todos = FluxoDisp.query.all()
        print(f"\n=== TODOS OS REGISTROS ===")
        for registro in todos:
            print(f"ID: {registro.id}")
            print(f"  Atendimento ID: {registro.id_atendimento}")
            print(f"  Médico ID: {registro.id_medico}")
            print(f"  Responsável ID: {registro.id_responsavel}")
            print(f"  Medicamento: {registro.medicamento}")
            print(f"  Quantidade: {registro.quantidade}")
            print(f"  Data: {registro.data}")
            print(f"  Hora: {registro.hora}")
            print("---")

        # Se não há registros pendentes, criar um de teste
        if pendentes == 0:
            print("\n=== CRIANDO REGISTRO DE TESTE ===")

            # Verificar se existem atendimentos e pacientes
            atendimento_count = Atendimento.query.count()
            paciente_count = Paciente.query.count()
            medico_count = Funcionario.query.count()

            print(f"Atendimentos existentes: {atendimento_count}")
            print(f"Pacientes existentes: {paciente_count}")
            print(f"Médicos existentes: {medico_count}")

            if atendimento_count > 0 and paciente_count > 0 and medico_count > 0:
                # Pegar primeiro atendimento, paciente e médico
                atendimento = Atendimento.query.first()
                paciente = Paciente.query.first()
                medico = Funcionario.query.filter(Funcionario.cargo.ilike('%medico%')).first()

                if medico is None:
                    medico = Funcionario.query.first()

                print(f"Usando atendimento ID: {atendimento.id}")
                print(f"Usando paciente: {paciente.nome}")
                print(f"Usando médico: {medico.nome}")

                # Criar registro de teste
                novo_registro = FluxoDisp(
                    id_atendimento=atendimento.id,
                    id_medico=medico.id,
                    id_responsavel=0,  # Pendente
                    id_prescricao=1,  # ID fictício
                    hora=time(10, 30),
                    data=date.today(),
                    medicamento="Dipirona 500mg - Teste",
                    quantidade=10
                )

                try:
                    db.session.add(novo_registro)
                    db.session.commit()
                    print("✅ Registro de teste criado com sucesso!")
                    print(f"   ID do novo registro: {novo_registro.id}")
                except Exception as e:
                    db.session.rollback()
                    print(f"❌ Erro ao criar registro de teste: {e}")
            else:
                print("❌ Não há dados suficientes para criar registro de teste")
        else:
            print("✅ Já existem registros pendentes!")

if __name__ == "__main__":
    testar_fluxo_disp()




