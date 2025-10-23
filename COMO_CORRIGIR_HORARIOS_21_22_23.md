# 🔧 Guia de Correção de Horários - Dias 21, 22 e 23 de Outubro

**Problema:** Horários cadastrados em UTC/Londres (com 3 horas a mais)  
**Solução:** Subtrair 3 horas de todos os horários desses dias  
**Data:** 23/10/2025

---

## ⚠️ IMPORTANTE - Leia Antes de Executar

1. ✅ **FAÇA BACKUP DO BANCO DE DADOS**
2. ✅ Execute em horário de baixo movimento
3. ✅ Execute apenas **UMA VEZ**
4. ✅ Teste em desenvolvimento primeiro (se possível)

---

## 🎯 Escolha um Método

Você tem **duas opções** para corrigir os horários:

### **Opção 1: Script Python** (Recomendado)
- ✅ Mais seguro (pede confirmação)
- ✅ Mostra o que está sendo alterado
- ✅ Logs detalhados
- ❌ Precisa parar a aplicação

### **Opção 2: Script SQL**
- ✅ Mais rápido
- ✅ Pode executar sem parar a aplicação
- ❌ Menos feedback visual
- ❌ Requer conhecimento de SQL

---

## 📝 OPÇÃO 1: Script Python

### 1. Parar a Aplicação
```bash
# Se estiver usando systemd/supervisor
sudo systemctl stop hsop

# Ou Ctrl+C se estiver rodando manualmente
```

### 2. Fazer Backup
```bash
# PostgreSQL
pg_dump -U seu_usuario -d hsop > backup_antes_correcao_$(date +%Y%m%d_%H%M%S).sql

# Ou se estiver no servidor
sudo -u postgres pg_dump hsop > backup_antes_correcao_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Ativar o Ambiente Virtual
```bash
cd /home/estevaofilho/HSOP/HSOP
source HSOP/bin/activate
```

### 4. Executar o Script
```bash
python3 fix_timezone_21_22_23_outubro.py
```

### 5. Confirmar Execução
O script vai perguntar:
```
❓ Deseja continuar? (digite 'SIM' para confirmar):
```

Digite: **SIM** (em maiúsculas)

### 6. Aguardar Conclusão
O script vai mostrar:
- ⏰ Cada horário sendo corrigido
- ✅ Confirmação de cada atendimento/internação
- 💾 Status dos commits
- 📊 Resumo final

### 7. Reiniciar a Aplicação
```bash
sudo systemctl start hsop

# Ou
python3 run.py
```

---

## 📝 OPÇÃO 2: Script SQL

### 1. Fazer Backup
```bash
pg_dump -U seu_usuario -d hsop > backup_antes_correcao_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Conectar ao Banco
```bash
psql -U seu_usuario -d hsop

# Ou
sudo -u postgres psql hsop
```

### 3. Executar Verificação Primeiro
```sql
-- Copie e execute as queries da PARTE 1 do arquivo:
-- migrations_sql/20251023_fix_horarios_21_22_23_outubro.sql

-- Isso vai mostrar quantos registros serão afetados
```

### 4. Executar Correção
```sql
-- Descomente e execute as queries da PARTE 2 do arquivo SQL
-- Execute query por query, verificando o resultado de cada uma

-- Exemplo:
UPDATE atendimentos
SET horario_triagem = horario_triagem - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_triagem IS NOT NULL;

-- Verifique:
SELECT COUNT(*) FROM atendimentos WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23');
```

### 5. Verificar Resultados
```sql
-- Execute as queries da PARTE 3 para verificar se ficou correto
```

---

## ✅ Verificação Pós-Correção

### 1. Verifique alguns registros manualmente:

**No PostgreSQL:**
```sql
SELECT 
    id,
    data_atendimento,
    hora_atendimento,
    horario_triagem,
    horario_consulta_medica,
    EXTRACT(HOUR FROM horario_triagem) as hora_triagem_extraida
FROM atendimentos
WHERE data_atendimento = '2025-10-23'
  AND horario_triagem IS NOT NULL
LIMIT 5;
```

**Esperado:** 
- Se um paciente chegou às 14:00, o `horario_triagem` deve estar entre 14:00 e 17:00 (horário de Brasília)
- **NÃO** deve estar entre 17:00 e 20:00 (que seria UTC)

### 2. Teste a aplicação:
```bash
# Acesse o painel do administrador
# Verifique se os horários estão corretos
# Teste criar um novo atendimento
```

---

## 📊 Dados Afetados

### Tabela `atendimentos`:
- ✅ `horario_triagem`
- ✅ `horario_consulta_medica`
- ✅ `horario_observacao`
- ✅ `horario_internacao`
- ✅ `horario_alta`
- ✅ `horario_medicacao`

### Tabela `atendimentos_clinica` (Internações):
- ✅ `data_internacao`
- ✅ `data_alta`
- ✅ `data_da_solicitacao_exame`

---

## 🆘 Troubleshooting

### Problema: "ERRO ao fazer commit"
**Solução:**
1. Verifique as mensagens de erro
2. Pode ser problema de permissão ou constraint
3. Restaure o backup se necessário

### Problema: "Atendimentos já foram corrigidos"
**Solução:**
- **NÃO execute o script novamente**
- Os atendimentos já estão corretos
- Verifique manualmente alguns registros

### Problema: Horários ainda estão errados
**Solução:**
1. Verifique se o script foi executado completamente
2. Execute as queries de verificação do SQL
3. Pode ser que alguns registros não estivessem no período

### Problema: Preciso desfazer a correção
**Solução:**
1. Restaure o backup:
```bash
psql -U seu_usuario -d hsop < backup_antes_correcao_XXXXX.sql
```
2. **NÃO** execute o script novamente depois de restaurar

---

## 📋 Checklist de Execução

Antes de executar:
- [ ] Backup do banco de dados realizado
- [ ] Aplicação parada (se usar script Python)
- [ ] Ambiente virtual ativado (se usar script Python)
- [ ] Leu este guia completamente
- [ ] Escolheu qual método usar

Durante a execução:
- [ ] Verificou quantos registros serão afetados
- [ ] Confirmou a execução (script Python)
- [ ] Acompanhou os logs/outputs
- [ ] Aguardou conclusão completa

Após execução:
- [ ] Verificou alguns registros manualmente
- [ ] Testou a aplicação
- [ ] Verificou painel do administrador
- [ ] Guardou o backup em local seguro
- [ ] **NÃO vai executar novamente**

---

## 💾 Exemplo de Backup

```bash
# Fazer backup
pg_dump -U postgres hsop > /backup/hsop_antes_fix_$(date +%Y%m%d_%H%M%S).sql

# Verificar tamanho do backup
ls -lh /backup/hsop_antes_fix_*

# Testar restauração (NÃO execute agora!)
# psql -U postgres hsop < /backup/hsop_antes_fix_XXXXX.sql
```

---

## 📞 Suporte

Em caso de dúvidas:
1. Leia este guia novamente
2. Verifique os logs em `logs/app.log`
3. Execute as queries de verificação do SQL
4. Mantenha o backup seguro por pelo menos 1 semana

---

## ⚡ Resumo Rápido

Para quem já sabe o que está fazendo:

```bash
# Backup
pg_dump hsop > backup.sql

# Python (recomendado)
source HSOP/bin/activate
python3 fix_timezone_21_22_23_outubro.py
# Digite: SIM

# Ou SQL
psql hsop < migrations_sql/20251023_fix_horarios_21_22_23_outubro.sql

# Verificar
psql hsop -c "SELECT id, horario_triagem FROM atendimentos WHERE data_atendimento='2025-10-23' LIMIT 5;"
```

---

**Boa sorte! 🍀**

