# HSOP - Hospital Senador Ozires Pontes

Sistema de gestão hospitalar desenvolvido para o HSOP.

## Requisitos

- Python 3.8 ou superior
- PostgreSQL
- Bibliotecas Python listadas em requirements.txt

## Configuração

1. Clone o repositório para sua máquina local
2. Instale as dependências:
```
pip install -r requirements.txt
```
3. Configure o banco de dados PostgreSQL
4. Execute a aplicação:
```
python run.py
```

## Solução de Problemas

### Erro de dependência: flask_login

Se você encontrar o erro `ModuleNotFoundError: No module named 'flask_login'`, existem duas soluções possíveis:

1. **Instalar a dependência (Recomendado)**:
   ```
   pip install flask-login
   ```

2. **Solução temporária**:
   As seguintes modificações foram feitas para remover a dependência de flask_login:
   
   - `app/models.py`: A classe `Funcionario` não herda mais de `UserMixin`
   - `app/routes.py`: Implementação de um decorator `login_required` personalizado e função `get_current_user()` para substituir `current_user` do flask_login

### Erro de coluna inexistente no banco de dados

Se você encontrar o erro `sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedColumn) ERROR: column funcionarios.password_hash does not exist`, a coluna `password_hash` está definida no modelo mas não existe no banco de dados.

Solução:
- O modelo `Funcionario` foi modificado para remover a dependência da coluna `password_hash`
- A autenticação agora utiliza apenas a coluna `senha` existente no banco de dados

### Erro de rotas duplicadas

Se você encontrar o erro `AssertionError: View function mapping is overwriting an existing endpoint function`, verifique se há funções com o mesmo nome em routes.py. 

Neste projeto, havia duas funções chamadas `registrar_evolucao` e uma delas foi renomeada para `registrar_evolucao_internacao`.

## Acessando a Aplicação

Após iniciar o servidor com `python run.py`, acesse:

- **Página de login**: http://localhost:5000

## Estrutura do Projeto

- `app/`: Pasta principal da aplicação
  - `__init__.py`: Configuração da aplicação Flask
  - `models.py`: Modelos de dados (SQLAlchemy)
  - `routes.py`: Rotas da aplicação
  - `templates/`: Templates HTML
  - `static/`: Arquivos estáticos (CSS, JS, imagens)
- `run.py`: Script para iniciar a aplicação
- `requirements.txt`: Dependências do projeto
- `config.py`: Configurações da aplicação

## Observações importantes

O sistema utiliza um banco de dados PostgreSQL. Certifique-se de que ele está configurado corretamente em `app/__init__.py`. 