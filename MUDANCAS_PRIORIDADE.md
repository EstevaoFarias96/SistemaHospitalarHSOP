# Mudanças Realizadas: Adição de Prioridade Administrativa

## Objetivo
Adicionar campos para identificar e descrever pacientes com prioridade administrativa no atendimento.

## Alterações Realizadas

### 1. Model ([app/models.py](app/models.py))

Adicionadas duas novas colunas na classe `Paciente`:

- **Linha 72:** `prioridade = db.Column(db.Boolean, nullable=False, default=False)`
  - Indica se o paciente tem prioridade administrativa
  - Default: `False` (não tem prioridade)
  - Não pode ser NULL

- **Linha 73:** `desc_prioridade = db.Column(db.Text)`
  - Descrição do tipo de prioridade
  - Permite texto livre para especificar o motivo
  - Pode ser NULL (quando prioridade = False)

## Tipos de Prioridade Administrativa

Conforme legislação brasileira, têm prioridade no atendimento:

1. **Idosos** (60 anos ou mais)
   - Lei nº 10.741/2003 - Estatuto do Idoso

2. **Gestantes**
   - Lei nº 10.048/2000

3. **Lactantes**
   - Lei nº 10.048/2000

4. **Pessoas com crianças de colo**
   - Lei nº 10.048/2000

5. **Pessoas com deficiência**
   - Lei nº 10.048/2000

6. **Pessoas com mobilidade reduzida**
   - Lei nº 10.048/2000

7. **Pessoas com doenças graves** (quando aplicável)
   - Câncer, HIV, cardiopatias graves, etc.

## Exemplos de Uso

### Exemplo 1: Idoso
```python
paciente.prioridade = True
paciente.desc_prioridade = "Idoso - 75 anos"
```

### Exemplo 2: Gestante
```python
paciente.prioridade = True
paciente.desc_prioridade = "Gestante"
```

### Exemplo 3: Pessoa com Deficiência
```python
paciente.prioridade = True
paciente.desc_prioridade = "Pessoa com deficiência física - cadeirante"
```

### Exemplo 4: Múltiplas Prioridades
```python
paciente.prioridade = True
paciente.desc_prioridade = "Idosa (68 anos) e pessoa com deficiência visual"
```

## Script de Migração

### Arquivo: [migrate_prioridade.py](migrate_prioridade.py)

**Execução:**
```bash
python migrate_prioridade.py
```

O script:
1. Adiciona a coluna `prioridade` (Boolean, default False)
2. Adiciona a coluna `desc_prioridade` (Text, nullable)
3. Verifica se as colunas já existem antes de criar

## Implementações Futuras Sugeridas

### 1. Detecção Automática de Prioridade

No cadastro/atualização de paciente, o sistema pode automaticamente:

```python
# Exemplo: Detectar se é idoso pela data de nascimento
from datetime import date

def verificar_prioridade_automatica(paciente):
    if paciente.data_nascimento:
        idade = (date.today() - paciente.data_nascimento).days // 365
        if idade >= 60:
            paciente.prioridade = True
            if not paciente.desc_prioridade:
                paciente.desc_prioridade = f"Idoso - {idade} anos"
```

### 2. Interface de Cadastro

Adicionar campos no formulário de cadastro/edição:

```html
<div class="form-check">
  <input type="checkbox" class="form-check-input" id="prioridade" name="prioridade">
  <label class="form-check-label" for="prioridade">
    Paciente com Prioridade Administrativa
  </label>
</div>

<div id="desc-prioridade-container" style="display:none;">
  <label for="desc_prioridade">Tipo de Prioridade:</label>
  <select class="form-control" id="desc_prioridade" name="desc_prioridade">
    <option value="">Selecione...</option>
    <option value="Idoso">Idoso (60+ anos)</option>
    <option value="Gestante">Gestante</option>
    <option value="Lactante">Lactante</option>
    <option value="Pessoa com criança de colo">Pessoa com criança de colo</option>
    <option value="Pessoa com deficiência">Pessoa com deficiência</option>
    <option value="Pessoa com mobilidade reduzida">Pessoa com mobilidade reduzida</option>
    <option value="Outro">Outro (especificar abaixo)</option>
  </select>
  <input type="text" class="form-control mt-2" placeholder="Especifique (opcional)">
</div>
```

### 3. Indicador Visual

Nas listas de pacientes/triagem, mostrar indicador visual:

```html
<span class="badge badge-warning" v-if="paciente.prioridade">
  <i class="fas fa-star"></i> Prioridade: {{ paciente.desc_prioridade }}
</span>
```

### 4. Ordenação por Prioridade

Nas filas de atendimento, ordenar considerando prioridade:

```python
# Exemplo: Buscar pacientes aguardando triagem
pacientes = Atendimento.query.filter_by(
    status='Aguardando Triagem'
).join(Paciente).order_by(
    Paciente.prioridade.desc(),  # Prioridade primeiro
    Atendimento.criado_em.asc()  # Depois por ordem de chegada
).all()
```

## Benefícios

1. **Conformidade Legal:** Atende às leis de prioridade no atendimento
2. **Organização:** Facilita identificação de pacientes prioritários
3. **Rastreabilidade:** Registra o motivo da prioridade
4. **Transparência:** Documentação clara do atendimento prioritário
5. **Flexibilidade:** Campo de texto permite especificar qualquer tipo de prioridade

## Próximos Passos

1. ✅ Adicionar colunas no model
2. ✅ Criar script de migração
3. ⏳ Executar migração no banco
4. ⏳ Atualizar formulário de cadastro de paciente
5. ⏳ Adicionar lógica de detecção automática (idosos)
6. ⏳ Adicionar indicadores visuais nas listas
7. ⏳ Implementar ordenação por prioridade nas filas
