#!/usr/bin/env python3
"""
Script para criar medicamentos de teste para o sistema de prescrição
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models import MedicacaoClasse, MedicacaoItem, db
from datetime import date, timedelta

def criar_medicamentos_teste():
    """Cria medicamentos de teste para o sistema de prescrição"""

    app = create_app()

    with app.app_context():
        print("=== CRIANDO MEDICAMENTOS DE TESTE ===")

        # Verificar se já existem medicamentos
        total_medicamentos = MedicacaoClasse.query.count()
        print(f"Médicamentos existentes: {total_medicamentos}")

        if total_medicamentos >= 5:
            print("Já existem medicamentos suficientes. Saindo...")
            return

        # Medicamentos de teste
        medicamentos_teste = [
            {
                'nome': 'Paracetamol',
                'apresentacao': '500 mg comprimido',
                'classe': 'Analgésico/Antipirético',
                'codigo': 'PARA500',
                'unidade': 'comp',
                'quantidade': 200,
                'lote': 'LOTE-PARA-001',
                'validade': date.today() + timedelta(days=365)
            },
            {
                'nome': 'Amoxicilina',
                'apresentacao': '500 mg cápsula',
                'classe': 'Antibiótico',
                'codigo': 'AMOX500',
                'unidade': 'caps',
                'quantidade': 150,
                'lote': 'LOTE-AMOX-001',
                'validade': date.today() + timedelta(days=300)
            },
            {
                'nome': 'Omeprazol',
                'apresentacao': '20 mg cápsula',
                'classe': 'Antiácido',
                'codigo': 'OMEP20',
                'unidade': 'caps',
                'quantidade': 100,
                'lote': 'LOTE-OMEP-001',
                'validade': date.today() + timedelta(days=400)
            },
            {
                'nome': 'Losartana',
                'apresentacao': '50 mg comprimido',
                'classe': 'Anti-hipertensivo',
                'codigo': 'LOSA50',
                'unidade': 'comp',
                'quantidade': 80,
                'lote': 'LOTE-LOSA-001',
                'validade': date.today() + timedelta(days=500)
            },
            {
                'nome': 'Insulina Regular',
                'apresentacao': '100 UI/ml',
                'classe': 'Antidiabético',
                'codigo': 'INSU100',
                'unidade': 'frasco',
                'quantidade': 30,
                'lote': 'LOTE-INSU-001',
                'validade': date.today() + timedelta(days=200)
            }
        ]

        for med_data in medicamentos_teste:
            try:
                # Verificar se o medicamento já existe
                existente = MedicacaoClasse.query.filter_by(codigo=med_data['codigo']).first()
                if existente:
                    print(f"Medicamento {med_data['nome']} já existe, pulando...")
                    continue

                # Criar classe de medicação
                nova_classe = MedicacaoClasse(
                    nome=med_data['nome'],
                    apresentacao=med_data['apresentacao'],
                    classe=med_data['classe'],
                    codigo=med_data['codigo'],
                    unidade=med_data['unidade']
                )

                db.session.add(nova_classe)
                db.session.flush()  # Para obter o ID

                # Criar item de medicação
                novo_item = MedicacaoItem(
                    id_med_classe=nova_classe.id,
                    lote=med_data['lote'],
                    validade=med_data['validade'],
                    local='Farmácia Central',
                    quantidade=med_data['quantidade']
                )

                db.session.add(novo_item)

                print(f"✅ Criado: {med_data['nome']} - {med_data['quantidade']} {med_data['unidade']}")

            except Exception as e:
                db.session.rollback()
                print(f"❌ Erro ao criar {med_data['nome']}: {e}")
                continue

        try:
            db.session.commit()
            print("✅ Todos os medicamentos de teste foram criados com sucesso!")

            # Verificar resultado final
            total_final = MedicacaoClasse.query.count()
            print(f"Total de medicamentos no sistema: {total_final}")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Erro ao salvar medicamentos: {e}")

if __name__ == "__main__":
    criar_medicamentos_teste()




