# Correção de Timezone - Horários de Brasília

**Data:** 23 de Outubro de 2025  
**Objetivo:** Garantir que todos os horários sejam salvos no timezone de Brasília (UTC-3), independente da localização do servidor.

---

## 📋 Problema Identificado

Os horários estavam sendo cadastrados no horário de Londres (UTC/GMT) porque o servidor está alocado lá. Isso causava inconsistências nos registros de:
- Horários de triagem, consulta, observação, internação e alta
- Datas de internação e alta
- Registros de evolução e prescrições

---

## ✅ Alterações Realizadas

### 1. **Arquivo: `app/models.py`**

#### Tabela `atendimentos`:
- ✅ Todos os campos de horário agora usam `db.DateTime(timezone=True)`
  - `horario_triagem`
  - `horario_consulta_medica`
  - `horario_observacao`
  - `horario_internacao`
  - `horario_alta`
  - `horario_medicacao`

#### Tabela `atendimentos_clinica` (Internacao):
- ✅ `data_da_solicitacao_exame` agora usa `now_brasilia` como default
- ✅ `data_internacao` e `data_alta` já tinham `timezone=True`

#### Outras Tabelas:
- ✅ `internacao_sae.data_registro` → `now_brasilia`
- ✅ `evolucoes_atendimentos_clinica.data_evolucao` → `now_brasilia`
- ✅ `prescricoes_clinica.horario_prescricao` → `now_brasilia`
- ✅ `evolucoes_enfermagem.data_evolucao` → `now_brasilia`
- ✅ `prescricoes_enfermagem.data_prescricao` → `now_brasilia`
- ✅ `receituarios_clinica.data_receita` → `now_brasilia`
- ✅ `atestados_clinica.data_atestado` → `now_brasilia`
- ✅ `admissoes_enfermagem.data_hora` → `now_brasilia`

---

### 2. **Arquivo: `app/routes.py`**

#### Substituições Globais:
- ✅ `datetime.now()` → `datetime.now(ZoneInfo("America/Sao_Paulo"))`
- ✅ `timezone(timedelta(hours=-3))` → `ZoneInfo("America/Sao_Paulo")`

#### Locais Específicos Corrigidos:
1. **Horário de triagem** (linhas ~13391, ~13466)
2. **Horário de consulta médica** (linha ~1053)
3. **Horário de alta** (linha ~2236)
4. **Data de internação** (linhas ~3558, ~13078)
5. **Data de alta** (linha ~4914)
6. **Todos os outros usos de `datetime.now()` para timestamps**

---

## 🔧 Função Helper Utilizada

```python
# Já existia no models.py:
from datetime import datetime
from zoneinfo import ZoneInfo

def now_brasilia():
    return datetime.now(ZoneInfo("America/Sao_Paulo"))
```

Esta função garante que sempre seja usado o horário de Brasília (UTC-3), independente de onde o servidor esteja hospedado.

---

## 🗄️ Migração de Dados Existentes

Foi criado um script SQL em: `migrations_sql/20251023_fix_timezone_columns.sql`

### ⚠️ IMPORTANTE - Antes de Executar:

1. **Faça BACKUP completo do banco de dados**
2. Execute primeiro a query SELECT para verificar os tipos atuais:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('atendimentos', 'atendimentos_clinica', ...)
  AND (column_name LIKE '%data%' OR column_name LIKE '%horario%');
```

3. **Verifique se os dados existentes estão em:**
   - **Horário de Brasília** → Apenas adicione timezone
   - **Horário UTC/Londres** → Precisa converter subtraindo 3 horas

4. Os comandos ALTER TABLE estão **comentados** por segurança
5. Teste primeiro em ambiente de desenvolvimento

---

## 🚀 Novos Registros

**A partir de agora**, todos os novos registros serão automaticamente salvos com:
- ✅ Timezone de Brasília (America/Sao_Paulo)
- ✅ Horário correto independente da localização do servidor
- ✅ Conversões automáticas para exibição

---

## 🧪 Como Testar

1. Crie um novo atendimento
2. Registre horários de triagem e consulta
3. Verifique no banco de dados:
```sql
SELECT 
    id,
    horario_triagem,
    horario_consulta_medica,
    pg_typeof(horario_triagem) as tipo
FROM atendimentos
WHERE id = 'SEU_ID'
LIMIT 1;
```

4. O tipo deve ser `timestamp with time zone` (timestamptz)
5. O horário deve corresponder ao horário de Brasília no momento do registro

---

## 📝 Checklist de Verificação

- [x] Modelo `Atendimento` atualizado
- [x] Modelo `Internacao` atualizado
- [x] Todos os outros modelos atualizados
- [x] Arquivo `routes.py` atualizado
- [x] Script SQL de migração criado
- [x] Documentação criada
- [ ] Backup do banco realizado
- [ ] Script SQL testado em desenvolvimento
- [ ] Script SQL executado em produção
- [ ] Verificação dos dados migrados

---

## 🔍 Tabelas Afetadas

1. `atendimentos` (6 colunas)
2. `atendimentos_clinica` (3 colunas)
3. `internacao_sae` (1 coluna)
4. `evolucoes_atendimentos_clinica` (1 coluna)
5. `prescricoes_clinica` (1 coluna)
6. `evolucoes_enfermagem` (1 coluna)
7. `prescricoes_enfermagem` (1 coluna)
8. `receituarios_clinica` (1 coluna)
9. `atestados_clinica` (1 coluna)
10. `admissoes_enfermagem` (1 coluna)
11. `evolucao_fisioterapia` (1 coluna)
12. `evolucao_nutricao` (1 coluna)
13. `evolucao_assistentesocial` (1 coluna)
14. `aprazamentos` (2 colunas)

**Total:** 14 tabelas, ~23 colunas afetadas

---

## 💡 Benefícios

1. ✅ **Consistência**: Todos os horários em Brasília
2. ✅ **Portabilidade**: Funciona em qualquer servidor (Londres, EUA, Brasil)
3. ✅ **Precisão**: Timezone correto armazenado no banco
4. ✅ **Manutenibilidade**: Código mais limpo e padronizado
5. ✅ **Conformidade**: Respeita o fuso horário local do hospital

---

## 🆘 Troubleshooting

### Problema: Horários ainda aparecem errados
- Verifique se o banco já foi migrado
- Confirme que o PostgreSQL está configurado para timezone correto
- Rode a query de verificação do script SQL

### Problema: Erros ao inserir novos registros
- Verifique se a função `now_brasilia()` está disponível
- Confirme que `ZoneInfo` está importado
- Verifique logs de erro para detalhes

---

## 📧 Suporte

Em caso de dúvidas ou problemas, consulte:
- Este documento: `TIMEZONE_FIX.md`
- Script SQL: `migrations_sql/20251023_fix_timezone_columns.sql`
- Logs da aplicação: `logs/app.log`

