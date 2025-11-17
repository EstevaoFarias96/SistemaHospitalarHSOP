# 📋 Guia de Migração - Alergias e Prioridade

## 🎯 Objetivo

Migrar a coluna `alergias` de `atendimentos` para `pacientes` e adicionar campos de prioridade administrativa.

## 📦 Arquivos de Migração

### Scripts SQL
- **[migration.sql](migration.sql)** - Script principal de migração (EXECUTE ESTE PRIMEIRO)
- **[migration_cleanup.sql](migration_cleanup.sql)** - Limpeza da coluna antiga (EXECUTE APÓS TESTES)

### Scripts Python (Alternativos)
- **[migrate_alergias.py](migrate_alergias.py)** - Migração via Python/SQLAlchemy
- **[migrate_prioridade.py](migrate_prioridade.py)** - Adiciona prioridade via Python

### Documentação
- **[MUDANCAS_ALERGIAS.md](MUDANCAS_ALERGIAS.md)** - Documentação completa
- **[MUDANCAS_PRIORIDADE.md](MUDANCAS_PRIORIDADE.md)** - Detalhes sobre prioridade

---

## 🚀 Passo a Passo - Método Recomendado (SQL)

### 1️⃣ Backup do Banco de Dados

**CRÍTICO: Sempre faça backup antes de qualquer migração!**

```bash
# PostgreSQL
pg_dump -h localhost -U seu_usuario -d hsop > backup_antes_migracao_$(date +%Y%m%d_%H%M%S).sql

# Ou se estiver usando Railway/Heroku
# Use o comando específico da plataforma
```

### 2️⃣ Executar Migração Principal

```bash
# Conectar ao banco PostgreSQL
psql -h localhost -U seu_usuario -d hsop

# Ou se estiver em ambiente de produção
# Ajuste os parâmetros conforme necessário
```

Dentro do psql:

```sql
-- Executar o script de migração
\i migration.sql

-- OU executar linha por linha para maior controle
```

### 3️⃣ Verificar Resultado

O script `migration.sql` mostra automaticamente:
- ✅ Colunas adicionadas
- ✅ Dados migrados
- ✅ Estatísticas
- ✅ Exemplos de registros

**Verifique manualmente:**

```sql
-- Ver estrutura da tabela pacientes
\d pacientes

-- Ver pacientes com alergias
SELECT id, nome, alergias
FROM pacientes
WHERE alergias IS NOT NULL
LIMIT 10;

-- Ver pacientes com prioridade
SELECT id, nome, prioridade, desc_prioridade
FROM pacientes
WHERE prioridade = TRUE
LIMIT 10;
```

### 4️⃣ Testar o Sistema

**IMPORTANTE: Não remova a coluna antiga ainda!**

1. Inicie a aplicação: `python run.py`
2. Teste as seguintes funcionalidades:
   - ✅ Cadastro de novo paciente
   - ✅ Triagem de paciente
   - ✅ Visualização de ficha de atendimento
   - ✅ Atualização de dados do paciente
   - ✅ Impressão de documentos

3. Verifique se alergias aparecem corretamente
4. Teste por pelo menos 1 semana em produção

### 5️⃣ Limpeza (Após Testes)

**Somente após confirmar que tudo está funcionando:**

```bash
psql -h localhost -U seu_usuario -d hsop
```

```sql
-- Executar script de limpeza
\i migration_cleanup.sql

-- Siga as instruções dentro do script
-- DESCOMENTE a linha de remoção apenas quando tiver certeza
```

---

## 🐍 Método Alternativo (Python)

Se preferir usar os scripts Python:

```bash
# 1. Migrar alergias
python migrate_alergias.py

# 2. Adicionar prioridade
python migrate_prioridade.py
```

**Vantagens do método Python:**
- ✅ Usa SQLAlchemy (mesma ORM da aplicação)
- ✅ Mais fácil de debugar
- ✅ Confirmação interativa

**Vantagens do método SQL:**
- ✅ Mais rápido para grandes volumes
- ✅ Transações atômicas
- ✅ Verificações automáticas
- ✅ Comentários nas colunas

---

## 📊 O Que a Migração Faz

### 1. Alergias

**Antes:**
```
atendimentos
├── id: "2501170"
├── paciente_id: 123
└── alergias: "Dipirona, Penicilina"
```

**Depois:**
```
pacientes
├── id: 123
└── alergias: "Dipirona, Penicilina"
    ↑ Consolidado de todos os atendimentos
```

### 2. Prioridade

**Adicionado:**
```
pacientes
├── id: 456
├── nome: "João Silva"
├── data_nascimento: 1950-05-15
├── prioridade: TRUE
└── desc_prioridade: "Idoso - 74 anos"
    ↑ Detectado automaticamente
```

---

## ⚙️ Detalhes Técnicos

### Colunas Adicionadas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `pacientes.alergias` | TEXT | Sim | NULL | Alergias conhecidas |
| `pacientes.prioridade` | BOOLEAN | Não | FALSE | Tem prioridade? |
| `pacientes.desc_prioridade` | TEXT | Sim | NULL | Tipo de prioridade |

### Índices Criados

```sql
CREATE INDEX idx_pacientes_prioridade
ON pacientes(prioridade)
WHERE prioridade = TRUE;
```

### Migração de Dados

1. **Consolidação de Alergias:**
   - Busca todas as alergias de cada paciente em seus atendimentos
   - Concatena valores únicos (separados por `;`)
   - Atualiza `pacientes.alergias`

2. **Detecção de Idosos:**
   - Calcula idade a partir de `data_nascimento`
   - Se >= 60 anos: marca como prioridade
   - Define `desc_prioridade` automaticamente

---

## 🔄 Rollback (Se Necessário)

### Opção 1: Restaurar do Backup

```bash
# Parar a aplicação
sudo systemctl stop hsop

# Restaurar banco
psql -h localhost -U seu_usuario -d hsop < backup_antes_migracao_XXXXXX.sql

# Reiniciar aplicação
sudo systemctl start hsop
```

### Opção 2: Restaurar Apenas Alergias

```sql
-- Adicionar coluna de volta em atendimentos
ALTER TABLE atendimentos ADD COLUMN alergias TEXT;

-- Restaurar do backup (criado pelo migration_cleanup.sql)
UPDATE atendimentos a
SET alergias = b.alergias
FROM backup_atendimentos_alergias b
WHERE a.id = b.id;
```

---

## ✅ Checklist de Execução

- [ ] 1. Backup do banco de dados criado
- [ ] 2. Backup verificado (testado restore em ambiente dev)
- [ ] 3. Script `migration.sql` revisado
- [ ] 4. Migração executada em ambiente de desenvolvimento
- [ ] 5. Testes realizados em dev (todas as funcionalidades)
- [ ] 6. Migração executada em produção (horário de baixo tráfego)
- [ ] 7. Verificações pós-migração realizadas
- [ ] 8. Sistema testado em produção (mínimo 1 semana)
- [ ] 9. Confirmado que dados estão corretos
- [ ] 10. Script `migration_cleanup.sql` executado (se desejado)

---

## 📞 Suporte

### Logs para Verificar

```bash
# Logs da aplicação
tail -f logs/app.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-XX-main.log
```

### Problemas Comuns

**1. "column alergias already exists"**
- Solução: A coluna já foi adicionada. Pule para a etapa de verificação.

**2. Pacientes sem alergias após migração**
- Verificar: Se os atendimentos antigos tinham alergias registradas
- Solução: Executar manualmente a parte de consolidação do script

**3. Erro de permissão**
- Verificar: Usuário do banco tem permissão ALTER TABLE
- Solução: Conectar com usuário admin ou ajustar permissões

---

## 📈 Estatísticas Esperadas

Após a migração, você verá algo como:

```
┌─────────────────────────────────────┬───────┐
│ categoria                           │ total │
├─────────────────────────────────────┼───────┤
│ Total de pacientes                  │  1234 │
│ Pacientes com alergias registradas  │   456 │
│ Pacientes com prioridade            │   234 │
│ Idosos (60+)                        │   189 │
└─────────────────────────────────────┴───────┘
```

---

## 🎉 Próximos Passos

Após a migração bem-sucedida:

1. [ ] Implementar interface para editar prioridade no cadastro
2. [ ] Adicionar alertas visuais para pacientes com alergias
3. [ ] Implementar ordenação de fila por prioridade
4. [ ] Criar relatórios de atendimento prioritário
5. [ ] Adicionar validação de preenchimento de alergias na triagem

---

**Data de Criação:** 2025-01-17
**Versão:** 1.0
**Última Atualização:** 2025-01-17
