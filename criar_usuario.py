from app import create_app, db
from app.models import Funcionario
from datetime import date
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
                data_nascimento=date(1985, 5, 15),
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

def criar_usuario_administrador():
    with app.app_context():
        # Verificar se já existe um funcionário com o CPF
        funcionario = Funcionario.query.filter_by(cpf='12345678900').first()
        
        if funcionario:
            print(f"Funcionário já existe: {funcionario.nome} - {funcionario.cargo}")
        else:
            # Criar um novo funcionário (administrador)
            admin = Funcionario(
                nome='Admin Teste',
                data_nascimento=date(1990, 1, 1),
                cpf='12345678900',
                email='admin@teste.com',
                telefone='1234567890',
                cargo='administrador',
                tipo_contrato='CLT',
                numero_profissional='123456'
            )
            
            # Definir senha
            admin.set_password('123456')
            
            # Salvar no banco
            db.session.add(admin)
            db.session.commit()
            
            print("Usuário administrador criado com sucesso!")
            print("CPF: 12345678900")
            print("Senha: 123456")

if __name__ == "__main__":
    criar_usuario_medico()
    criar_usuario_administrador() 