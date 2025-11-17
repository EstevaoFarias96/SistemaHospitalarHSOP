#!/usr/bin/env python3
"""
Script de migração: Move a coluna 'alergias' de Atendimento para Paciente

Este script:
1. Adiciona a coluna 'alergias' na tabela Paciente (se não existir)
2. Copia os dados de alergias do primeiro atendimento de cada paciente
3. Remove a coluna 'alergias' da tabela Atendimento

IMPORTANTE: Faça backup do banco de dados antes de executar!
"""

from app import create_app, db
from app.models import Paciente, Atendimento
from sqlalchemy import text

def migrate_alergias():
    app = create_app()

    with app.app_context():
        print("=" * 60)
        print("MIGRAÇÃO: Movendo 'alergias' de Atendimento para Paciente")
        print("=" * 60)

        # Passo 1: Adicionar coluna alergias na tabela pacientes (se não existir)
        print("\n[1/4] Verificando/adicionando coluna 'alergias' em pacientes...")
        try:
            # Tenta adicionar a coluna (se já existir, vai dar erro e pulamos)
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE pacientes ADD COLUMN alergias TEXT"))
                conn.commit()
            print("✓ Coluna 'alergias' adicionada em pacientes")
        except Exception as e:
            if 'already exists' in str(e) or 'duplicate column' in str(e).lower():
                print("✓ Coluna 'alergias' já existe em pacientes")
            else:
                print(f"⚠ Aviso: {e}")

        # Passo 2: Copiar dados de alergias dos atendimentos para pacientes
        print("\n[2/4] Copiando dados de alergias...")

        # Buscar todos os atendimentos com alergias preenchidas
        atendimentos_com_alergias = Atendimento.query.filter(
            Atendimento.alergias.isnot(None),
            Atendimento.alergias != ''
        ).all()

        print(f"   Encontrados {len(atendimentos_com_alergias)} atendimentos com alergias")

        # Agrupar por paciente e pegar a primeira alergia (mais recente ou primeira)
        pacientes_alergias = {}
        for atendimento in atendimentos_com_alergias:
            if atendimento.paciente_id not in pacientes_alergias:
                pacientes_alergias[atendimento.paciente_id] = atendimento.alergias

        # Atualizar pacientes com as alergias
        count = 0
        for paciente_id, alergia in pacientes_alergias.items():
            paciente = Paciente.query.get(paciente_id)
            if paciente:
                # Se o paciente já tem alergias, concatena; senão, define
                if paciente.alergias:
                    if alergia not in paciente.alergias:
                        paciente.alergias += f"; {alergia}"
                else:
                    paciente.alergias = alergia
                count += 1

        db.session.commit()
        print(f"✓ {count} pacientes atualizados com alergias")

        # Passo 3: Remover coluna alergias da tabela atendimentos
        print("\n[3/4] Removendo coluna 'alergias' de atendimentos...")
        try:
            with db.engine.connect() as conn:
                # PostgreSQL
                conn.execute(text("ALTER TABLE atendimentos DROP COLUMN IF EXISTS alergias"))
                conn.commit()
            print("✓ Coluna 'alergias' removida de atendimentos")
        except Exception as e:
            print(f"✗ Erro ao remover coluna: {e}")
            print("   Você pode precisar remover manualmente ou ajustar o script")

        # Passo 4: Verificação
        print("\n[4/4] Verificando migração...")
        pacientes_com_alergias = Paciente.query.filter(
            Paciente.alergias.isnot(None),
            Paciente.alergias != ''
        ).count()
        print(f"✓ {pacientes_com_alergias} pacientes agora têm alergias registradas")

        print("\n" + "=" * 60)
        print("MIGRAÇÃO CONCLUÍDA!")
        print("=" * 60)
        print("\nPróximos passos:")
        print("1. Verifique se os dados foram migrados corretamente")
        print("2. Atualize o código que usa Atendimento.alergias para Paciente.alergias")
        print("3. Remova a linha 'alergias = db.Column(db.Text)' do model Atendimento")

if __name__ == '__main__':
    print("\n⚠️  ATENÇÃO: Faça backup do banco de dados antes de continuar!")
    resposta = input("\nDeseja continuar com a migração? (sim/não): ")

    if resposta.lower() in ['sim', 's', 'yes', 'y']:
        migrate_alergias()
    else:
        print("\nMigração cancelada.")
