# Sistema de Backup HSOP

## Arquivos de Backup

Os backups são armazenados nesta pasta com o formato: `backup_hsop_AAAAMMDD_HHMMSS.zip`

O formato do nome inclui:
- **AAAAMMDD**: Ano, mês e dia
- **HHMMSS**: Hora, minuto e segundo

## Como criar um novo backup

Para criar um novo backup do projeto, execute o script `backup.py` na raiz do projeto:

```bash
python backup.py
```

O script irá:
1. Criar um arquivo ZIP com todos os arquivos relevantes do projeto
2. Excluir arquivos temporários e caches
3. Armazenar o backup nesta pasta com data e hora atual

## Como restaurar um backup

Para restaurar o projeto a partir de um backup:

1. Escolha o arquivo de backup que deseja restaurar
2. Extraia o arquivo ZIP para uma nova pasta
3. Configure o ambiente de acordo com o arquivo requirements.txt

Exemplo:
```bash
# Crie uma nova pasta para restauração
mkdir /caminho/para/restauracao

# Extraia o backup para a pasta
unzip backups/backup_hsop_AAAAMMDD_HHMMSS.zip -d /caminho/para/restauracao

# Navegue até a pasta de restauração
cd /caminho/para/restauracao

# Configure o ambiente
pip install -r requirements.txt

# Execute a aplicação
python run.py
```

## Conteúdo do backup

Cada backup contém:
- Código-fonte da aplicação
- Arquivos de configuração
- Templates e recursos estáticos
- Arquivos de banco de dados (se existirem)

Arquivos excluídos do backup:
- Cache Python (`__pycache__`)
- Arquivos temporários (`.pyc`)
- Arquivos de log (`.log`)
- Backups anteriores (`.zip`) 