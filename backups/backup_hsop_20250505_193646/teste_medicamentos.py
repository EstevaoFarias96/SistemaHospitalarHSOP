from app import create_app
from app.models import db, Medicacao
from datetime import date, timedelta
import random

# Cria a aplicação e ativa o contexto
app = create_app()

with app.app_context():
    nomes_medicamentos = [
        "Paracetamol", "Dipirona", "Amoxicilina", "Ibuprofeno", "Omeprazol",
        "Loratadina", "Losartana", "Metformina", "Simeticona", "Salbutamol"
    ]

    for nome in nomes_medicamentos:
        validade = date.today() + timedelta(days=random.randint(30, 365))
        entrada = date.today() - timedelta(days=random.randint(1, 30))

        medicamento = Medicacao(
            nome=nome,
            quantidade=random.randint(10, 200),
            validade=validade,
            lote=f"LOTE{random.randint(1000, 9999)}",
            local=random.choice(["Farmácia Central", "Farmácia Satélite"]),
            saida=random.choice(["", "Uso Interno", "Prescrição Externa"]),
            data_de_entrada=entrada,
            id_funcionario_farmacia_central=None,
            id_funcionario_farmacia_satelite=None,
            id_medico=None
        )

        db.session.add(medicamento)

    db.session.commit()
    print("Medicamentos de teste adicionados com sucesso!")
