# Mudanças Realizadas: Melhorias no Model Paciente

## Mudanças Implementadas

### 1. Migração de Alergias
Mover a coluna `alergias` da tabela `Atendimento` para a tabela `Paciente`, pois alergias são características do paciente e não de um atendimento específico.

### 2. Adição de Prioridade Administrativa
Adicionar campos para identificar e descrever pacientes com prioridade administrativa no atendimento (idosos, gestantes, pessoas com deficiência, etc.).

## Alterações Realizadas

### 1. Model (app/models.py)

#### Alergias:
- ✅ Adicionada coluna `alergias = db.Column(db.Text)` na classe `Paciente` (linha 71)
- ✅ Removida coluna `alergias` da classe `Atendimento`

#### Prioridade:
- ✅ Adicionada coluna `prioridade = db.Column(db.Boolean, nullable=False, default=False)` na classe `Paciente` (linha 72)
- ✅ Adicionada coluna `desc_prioridade = db.Column(db.Text)` na classe `Paciente` (linha 73)

### 2. Scripts de Migração

#### migrate_alergias.py
- ✅ Criado script para migrar dados existentes de alergias
- Execução: `python migrate_alergias.py`

#### migrate_prioridade.py
- ✅ Criado script para adicionar colunas de prioridade
- Execução: `python migrate_prioridade.py`

### 3. Código da Aplicação (app/routes.py)

#### Alterações Necessárias:

**Linha ~351:** Cadastro de paciente em observação
```python
# ANTES:
alergias=dados.get('alergias', '')

# DEPOIS:
# Atualizar paciente.alergias em vez de atendimento.alergias
```

**Linha ~1553-1596:** Endpoint `/api/atendimento/<atendimento_id>/alergias`
```python
# ANTES:
@bp.route('/api/atendimento/<string:atendimento_id>/alergias', methods=['PUT'])
def api_atualizar_alergias(atendimento_id):
    atendimento.alergias = novas_alergias

# DEPOIS:
@bp.route('/api/paciente/<int:paciente_id>/alergias', methods=['PUT'])
def api_atualizar_alergias(paciente_id):
    paciente.alergias = novas_alergias
```

**Linhas ~578, ~1170, ~1469:** Retorno de dados de atendimento
```python
# ANTES:
'alergias': atendimento.alergias

# DEPOIS:
'alergias': atendimento.paciente.alergias if atendimento.paciente else ''
```

**Linhas ~5490, ~5520, ~6765, ~6822:** SAE (Sistema de Assistência de Enfermagem)
- InternacaoSae já tem sua própria coluna `alergias` (linha 152 do models.py)
- Não precisa alterar

### 4. Templates HTML

Os seguintes templates podem referenciar alergias e precisam ser verificados:
- app/templates/ficha_paciente_triagem.html
- app/templates/medico_ficha_atendimento.html
- app/templates/emergencia_atendimento_medico.html
- app/templates/clinica_evolucao_paciente_*.html

### 5. JavaScript

Arquivos que podem precisar atualização:
- app/static/js/enfermagem_completo.js
- app/static/js/clinica_medico.js
- app/static/js/clinica_enfermeiro/sae.js

## Instruções de Execução

1. **Backup do Banco de Dados**
   ```bash
   # Fazer backup antes de qualquer migração
   pg_dump -h localhost -U usuario -d database > backup_antes_migracao.sql
   ```

2. **Executar Migração**
   ```bash
   python migrate_alergias.py
   ```

3. **Atualizar Código**
   - Modificar routes.py conforme descrito acima
   - Verificar templates e JavaScript

4. **Testar**
   - Testar cadastro de paciente
   - Testar triagem
   - Testar visualização de fichas
   - Testar atualização de alergias

5. **Remover Coluna Antiga**
   - Após confirmar que tudo funciona, remover `alergias` do model `Atendimento`

## Benefícios

1. **Consistência**: Alergias ficam centralizadas no paciente
2. **Reutilização**: Não precisa replicar alergias em cada atendimento
3. **Manutenção**: Mais fácil atualizar alergias do paciente
4. **Performance**: Menos dados redundantes no banco
