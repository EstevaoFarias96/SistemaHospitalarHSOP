# Endpoint de Impressão de Alta Hospitalar

## Descrição
Foi criado um endpoint `/imprimir/alta/<atendimento_id>` que permite imprimir o relatório de alta hospitalar usando o template `impressao_alta.html`.

## Como usar

### URL
```
GET /imprimir/alta/<atendimento_id>
```

### Parâmetros
- `atendimento_id` (string): ID do atendimento para o qual deseja gerar a impressão de alta

### Exemplo de uso
```
http://localhost:5000/imprimir/alta/12345678
```

### Requisitos
- Usuário deve estar logado (`@login_required`)
- Usuário deve ser médico ou enfermeiro
- A internação deve ter uma data de alta registrada

### Dados passados para o template
O endpoint busca e passa os seguintes dados para o template `impressao_alta.html`:

- `internacao`: Objeto da internação com todos os campos
- `atendimento`: Objeto do atendimento relacionado
- `paciente`: Dados do paciente
- `medico`: Dados do médico responsável (se disponível)
- `idade`: Idade calculada do paciente
- `data_impressao`: Data/hora atual para rodapé
- `hospital_nome`: Nome do hospital ("HOSPITAL SENADOR OSIRES PONTES")

### Tratamento de erros
- 403: Acesso negado (apenas médicos e enfermeiros)
- 404: Atendimento não encontrado
- 404: Internação não encontrada
- 400: Paciente ainda não recebeu alta
- 500: Erro interno

### Arquivos criados
- `app/routes_extra.py`: Contém o endpoint
- Modificação em `app/__init__.py`: Importa o arquivo de rotas extras

### Template esperado
O template `impressao_alta.html` já existe e espera as variáveis mencionadas acima. 