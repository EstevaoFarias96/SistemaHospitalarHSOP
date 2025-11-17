#!/usr/bin/env python3
"""
Script de migração: Adiciona colunas de prioridade na tabela Paciente

Este script:
1. Adiciona a coluna 'prioridade' (Boolean) na tabela Paciente
2. Adiciona a coluna 'desc_prioridade' (Text) na tabela Paciente

IMPORTANTE: Faça backup do banco de dados antes de executar!
"""

from app import create_app, db
from sqlalchemy import text

def migrate_prioridade():
    app = create_app()

    with app.app_context():
        print("=" * 60)
        print("MIGRAÇÃO: Adicionando colunas de prioridade em Paciente")
        print("=" * 60)

        # Adicionar coluna prioridade
        print("\n[1/2] Adicionando coluna 'prioridade'...")
        try:
            with db.engine.connect() as conn:
                # PostgreSQL
                conn.execute(text("""
                    ALTER TABLE pacientes
                    ADD COLUMN IF NOT EXISTS prioridade BOOLEAN NOT NULL DEFAULT FALSE
                """))
                conn.commit()
            print("✓ Coluna 'prioridade' adicionada com sucesso")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate column' in str(e).lower():
                print("✓ Coluna 'prioridade' já existe")
            else:
                print(f"✗ Erro ao adicionar coluna 'prioridade': {e}")
                return

        # Adicionar coluna desc_prioridade
        print("\n[2/2] Adicionando coluna 'desc_prioridade'...")
        try:
            with db.engine.connect() as conn:
                # PostgreSQL
                conn.execute(text("""
                    ALTER TABLE pacientes
                    ADD COLUMN IF NOT EXISTS desc_prioridade TEXT
                """))
                conn.commit()
            print("✓ Coluna 'desc_prioridade' adicionada com sucesso")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate column' in str(e).lower():
                print("✓ Coluna 'desc_prioridade' já existe")
            else:
                print(f"✗ Erro ao adicionar coluna 'desc_prioridade': {e}")
                return

        print("\n" + "=" * 60)
        print("MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        print("\nColunas adicionadas:")
        print("  - prioridade: Boolean (default: False)")
        print("  - desc_prioridade: Text (para descrever o tipo de prioridade)")
        print("\nExemplos de uso:")
        print("  - Idoso (60+ anos)")
        print("  - Gestante")
        print("  - Pessoa com deficiência")
        print("  - Lactante")
        print("  - Criança de colo")

if __name__ == '__main__':
    print("\n⚠️  ATENÇÃO: Faça backup do banco de dados antes de continuar!")
    resposta = input("\nDeseja continuar com a migração? (sim/não): ")

    if resposta.lower() in ['sim', 's', 'yes', 'y']:
        migrate_prioridade()
    else:
        print("\nMigração cancelada.")
