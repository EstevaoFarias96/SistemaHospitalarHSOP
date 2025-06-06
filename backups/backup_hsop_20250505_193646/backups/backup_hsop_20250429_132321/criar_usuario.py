from app import create_app
from app.models import Funcionario
from db import db
import datetime
import os

# Criar a aplicação
app = create_app()

# Assegurar que o banco de dados SQLite existe
db_path = 'app.db'
if not os.path.exists(db_path):
    open(db_path, 'w').close()
    print(f'Arquivo de banco de dados {db_path} criado')

def criar_usuario_medico():
    with app.app_context():
        # Criar todas as tabelas 
        db.create_all()
        print("Tabelas criadas no banco de dados!")
        
        # Verificar se já existe um usuário médico com esse CPF
        medico = Funcionario.query.filter_by(cpf="000000004").first()
        
        if not medico:
            # Criar um novo usuário médico
            novo_medico = Funcionario(
                nome="Médico Teste",
                data_nascimento=datetime.date(1985, 5, 15),
                cpf="000000004",
                email="medico@hsop.com",
                telefone="11988887777",
                cargo="Médico",
                tipo_contrato="CLT",
                numero_profissional="54321"
            )
            
            # Definir senha
            novo_medico.set_password("123456")
            
            # Adicionar ao banco de dados
            db.session.add(novo_medico)
            db.session.commit()
            print("Usuário médico criado com sucesso!")
            print("CPF: 000000004")
            print("Senha: 123456")
        else:
            print("Usuário médico já existe.")
            print("CPF: 000000004")
            print("Senha: 123456")

        # Verificar se o usuário foi realmente criado
        medico = Funcionario.query.filter_by(cpf="000000004").first()
        if medico:
            print(f"Usuário ID: {medico.id}, Nome: {medico.nome}, Cargo: {medico.cargo}")
        else:
            print("ERRO: Usuário não encontrado após criação!")

if __name__ == "__main__":
    criar_usuario_medico() 