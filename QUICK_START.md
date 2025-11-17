# ⚡ Quick Start - Migração Alergias e Prioridade

## 🚀 Execução Rápida (3 Comandos)

```bash
# 1. BACKUP
pg_dump -h localhost -U postgres -d hsop > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. MIGRAÇÃO
psql -h localhost -U postgres -d hsop -f migration.sql

# 3. VERIFICAÇÃO
psql -h localhost -U postgres -d hsop -f verify_migration.sql
```

## ✅ Checklist Mínimo

- [ ] Backup criado
- [ ] Migration executada sem erros
- [ ] Verificação mostra "✓ COLUNAS CRIADAS"
- [ ] Verificação mostra "✓ DADOS MIGRADOS"
- [ ] Sistema testado (triagem + cadastro)

## 📁 Arquivos

| Arquivo | Quando Usar |
|---------|-------------|
| `migration.sql` | **PRIMEIRO** - Adiciona colunas e migra dados |
| `verify_migration.sql` | **SEGUNDO** - Verifica se deu certo |
| `migration_cleanup.sql` | **DEPOIS** - Remove coluna antiga (opcional) |

## 🔧 Ajustes para Seu Ambiente

### Railway
```bash
# Conectar
railway connect

# Executar
railway run psql -f migration.sql
```

### Heroku
```bash
# Executar
heroku pg:psql -a seu-app < migration.sql
```

### Docker
```bash
# Copiar arquivo
docker cp migration.sql container_postgres:/tmp/

# Executar
docker exec -it container_postgres psql -U postgres -d hsop -f /tmp/migration.sql
```

## ⚠️ Importante

1. **NÃO REMOVA** a coluna antiga ainda
2. Teste por **pelo menos 1 semana**
3. Só execute `migration_cleanup.sql` após testes

## 🆘 Problemas?

**Erro de conexão?**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar credenciais no config.py
```

**Erro de permissão?**
```bash
# Usar usuário com privilégios
psql -U postgres ...
```

**Dados não migraram?**
```bash
# Verificar se havia dados
psql -d hsop -c "SELECT COUNT(*) FROM atendimentos WHERE alergias IS NOT NULL"
```

## 📖 Documentação Completa

Leia [MIGRATION_README.md](MIGRATION_README.md) para detalhes completos.
