from app import create_app, db
from app.models import Funcionario
from werkzeug.security import generate_password_hash
from datetime import datetime

# Cria a aplicação Flask
app = create_app()

# Configura o contexto da aplicação
with app.app_context():
    # Dados do médico para teste
    medico_teste = {
        "nome": "Rogerio",
        "data_nascimento": datetime.strptime("1980-05-15", "%Y-%m-%d").date(),
        "cpf": "000.000.000-04",
        "email": "enfermeiro1@hospital.com",
        "telefone": "(11) 98765-4321",
        "senha": "senha123",
        "cargo": "Enfermeiro",  # Use um valor permitido
        "tipo_contrato": "Efetivo",
        "numero_profissional": "1234"
    }

    def registrar_medico_teste():
        # Verifica se o médico já está registrado
        medico_existente = Funcionario.query.filter_by(cpf=medico_teste["cpf"]).first()
        if medico_existente:
            print("Médico já registrado.")
            return

        # Cria um novo médico
        novo_medico = Funcionario(
            nome=medico_teste["nome"],
            data_nascimento=medico_teste["data_nascimento"],
            cpf=medico_teste["cpf"],
            email=medico_teste["email"],
            telefone=medico_teste["telefone"],
            senha=generate_password_hash(medico_teste["senha"]),  # Hash da senha
            cargo=medico_teste["cargo"],
            tipo_contrato=medico_teste["tipo_contrato"],
            numero_profissional=medico_teste["numero_profissional"]
        )

        # Adiciona o médico ao banco de dados
        db.session.add(novo_medico)
        db.session.commit()
        print("Médico registrado com sucesso!")

    def listar_funcionarios():
        # Busca todos os funcionários cadastrados
        funcionarios = Funcionario.query.all()
        if funcionarios:
            print("\nFuncionários cadastrados:")
            for funcionario in funcionarios:
                print(f"ID: {funcionario.id}, Nome: {funcionario.nome}, CPF: {funcionario.cpf}, Cargo: {funcionario.cargo}")
        else:
            print("Nenhum funcionário cadastrado.")

    # Registra o médico de teste
    registrar_medico_teste()

    # Lista todos os funcionários cadastrados
    listar_funcionarios()
