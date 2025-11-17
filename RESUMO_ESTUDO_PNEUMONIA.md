# ESTUDO DE PERFIL DE PACIENTES COM PNEUMONIA
## Hospital Senador Ozires Pontes (HSOP)

**Período Analisado:** 01/07/2025 a 30/11/2025
**Data do Relatório:** 10/11/2025
**Fonte de Dados:** Base de Produção (Render PostgreSQL)

---

## SUMÁRIO EXECUTIVO

### Números Gerais
- **Total de Internações no Banco:** 841
- **Total de Casos de Pneumonia:** 58 pacientes
- **Taxa de Pneumonia:** 6.9% das internações
- **Códigos CID-10 Analisados:** J18, J18.9, J189, J180, J18.1

---

## 1. PERFIL DEMOGRÁFICO

### 1.1 Distribuição por Gênero
| Gênero | Quantidade | Percentual |
|--------|-----------|------------|
| Masculino | 30 | 51.7% |
| Feminino | 28 | 48.3% |

**Análise:** Distribuição quase equilibrada entre os gêneros, com leve predominância masculina.

### 1.2 Distribuição Etária

**Estatísticas:**
- Idade Média: **51.8 anos**
- Idade Mínima: 0 anos (neonatos)
- Idade Máxima: 90 anos

**Por Faixa Etária:**
| Faixa Etária | Quantidade | Percentual |
|--------------|-----------|------------|
| 0-17 anos (Pediátrica) | 16 | 27.6% |
| 18-39 anos (Adulto Jovem) | 2 | 3.4% |
| 40-59 anos (Adulto) | 11 | 19.0% |
| 60+ anos (Idoso) | 29 | **50.0%** |

**Análise Crítica:**
- **50% dos casos ocorrem em idosos (60+ anos)** - grupo de maior risco
- **27.6% em crianças** - segunda maior concentração
- Baixa incidência em adultos jovens (18-39 anos)
- Padrão típico de pneumonia: extremos etários mais afetados

---

## 2. ANÁLISE CLÍNICA

### 2.1 Distribuição por CID-10
| CID-10 | Descrição | Casos | % |
|--------|-----------|-------|---|
| J18.9 | Pneumonia não especificada | 25* | 43.1% |
| J18 | Pneumonia por microrganismo NE | 13 | 22.4% |
| J189 | Pneumonia não especificada | 11 | 19.0% |
| J180 | Broncopneumonia NE | 7 | 12.1% |
| J18.1 | Pneumonia lobar NE | 1 | 1.7% |

*Incluindo variantes (J18.9, "J18.9 ", "J18,9")

**Observação:** Necessidade de padronização dos códigos CID (espaços extras, vírgulas).

### 2.2 Distribuição Geográfica
| Município | Casos | % |
|-----------|-------|---|
| Massapê* | 56 | 96.6% |
| Outros | 2 | 3.4% |

*Incluindo variações de grafia (MASSAPÊ, MASSAPE, etc.)

**Análise:** Predominância absoluta de pacientes do município de Massapê (96.6%).

---

## 3. ANÁLISE ASSISTENCIAL

### 3.1 Status de Internação
| Status | Quantidade | Percentual |
|--------|-----------|------------|
| Alta hospitalar | 56 | 96.6% |
| Ainda internado | 2 | 3.4% |

**Taxa de Alta:** 96.6% - excelente indicador de resolução dos casos.

### 3.2 Tempo de Internação (Pacientes com Alta)

**Estatísticas:**
- Tempo Médio: **5.1 dias**
- Tempo Mínimo: 0 dias (transferências)
- Tempo Máximo: 19 dias

**Distribuição:**
| Período | Casos | % |
|---------|-------|---|
| 1-3 dias | 25 | 44.6% |
| 4-7 dias | 19 | 33.9% |
| 8-14 dias | 9 | 16.1% |
| 15+ dias | 3 | 5.4% |

**Análise:**
- Maioria dos casos (78.5%) recebe alta em até 7 dias
- Apenas 5.4% ficam internados por mais de 15 dias
- Tempo médio de 5.1 dias está dentro dos padrões para pneumonia comunitária

### 3.3 Distribuição de Leitos
| Setor | Casos | % |
|-------|-------|---|
| Alojamento Feminino 1 | 17 | 29.3% |
| Alojamento Conjunto | 14 | 24.1% |
| Alojamento Masculino 1 | 12 | 20.7% |
| Pediatria | 9 | 15.5% |
| Observação | 6 | 10.4% |

---

## 4. ANÁLISE TEMPORAL

### 4.1 Distribuição Mensal de Admissões
| Mês | Admissões | % |
|-----|-----------|---|
| Julho/2025 | 8 | 13.8% |
| Agosto/2025 | 8 | 13.8% |
| Setembro/2025 | 12 | 20.7% |
| **Outubro/2025** | **25** | **43.1%** |
| Novembro/2025 | 5 | 8.6% |

**Análise Crítica:**
- **Pico em outubro:** 43.1% dos casos concentrados em um único mês
- Possível surto sazonal ou epidemiológico
- Recomendação: investigar fatores ambientais/climáticos de outubro

---

## 5. EQUIPE MÉDICA

### Top 10 Médicos Assistentes
| Posição | Médico | Casos | % |
|---------|--------|-------|---|
| 1º | Francisco Anderson Vasconcelos de Sales | 9 | 15.5% |
| 1º | Lidia Maria da Cunha Machado | 9 | 15.5% |
| 1º | Cleiton | 9 | 15.5% |
| 4º | Isabely Azevedo Frota Mont Alverne | 8 | 13.8% |
| 5º | Tallys de Souza Furtado | 4 | 6.9% |
| 5º | Francisco Neuton Costa de Paulo | 4 | 6.9% |
| 5º | Diego Lopes e Silva | 4 | 6.9% |
| 8º | Caio César Carneiro | 3 | 5.2% |
| 8º | Yarla Santos de Figueiredo Lima Cavalcante | 3 | 5.2% |
| 10º | Tamizi Sampaio Teles | 2 | 3.4% |

**Análise:** Distribuição equilibrada entre os médicos, com 4 profissionais atendendo 58.6% dos casos.

---

## 6. CASOS ESPECIAIS IDENTIFICADOS

### 6.1 Óbitos
- **Cecilia Rodrigues Sobrinho** (86 anos, F)
  - Internação: 20/07/2025
  - Óbito: 22/07/2025
  - CID: J18.9

### 6.2 Transferências
- **davi luiz justino de jesus** (7 anos)
  - Transferido para HRN devido piora clínica
  - Data: 08/07/2025

### 6.3 Casos Graves/Prolongados
- Internações com duração >15 dias: 3 casos (5.4%)

---

## 7. RECOMENDAÇÕES

### 7.1 Assistenciais
1. **Foco em Grupos de Risco:**
   - Intensificar acompanhamento de idosos (50% dos casos)
   - Atenção especial à pediatria (27.6% dos casos)

2. **Prevenção Sazonal:**
   - Investigar causas do pico de outubro
   - Implementar campanhas preventivas antes de períodos críticos

3. **Padronização de Registros:**
   - Uniformizar códigos CID (eliminar variações como "J18.9 " vs "J18.9")
   - Padronizar grafia de municípios

### 7.2 Gestão de Leitos
- Tempo médio de 5.1 dias permite boa rotatividade
- Taxa de alta de 96.6% indica manejo adequado
- Considerar expansão de leitos em períodos de pico (outubro)

### 7.3 Qualidade dos Dados
1. Alguns campos sem preenchimento ("N/A" em diagnóstico)
2. Necessidade de treinamento para padronização de CIDs
3. Inconsistências em grafia de nomes próprios e municípios

---

## 8. CONCLUSÕES

1. **Epidemiologia:** Padrão clássico de pneumonia com predomínio em extremos etários (idosos e crianças)

2. **Sazonalidade:** Pico significativo em outubro (43% dos casos) requer atenção especial

3. **Eficiência Assistencial:**
   - Taxa de alta de 96.6%
   - Tempo médio de internação adequado (5.1 dias)
   - Baixa taxa de casos prolongados (5.4% >15 dias)

4. **Distribuição Geográfica:** Quase totalidade dos casos do município de Massapê

5. **Capacidade Instalada:** Distribuição adequada entre setores (alojamentos e pediatria)

---

## ARQUIVOS GERADOS

1. **pneumonia_patients_prod_YYYYMMDD_HHMMSS.csv** - Dados completos em planilha
2. **pneumonia_report_full.txt** - Relatório completo em texto
3. **RESUMO_ESTUDO_PNEUMONIA.md** - Este documento

---

**Elaborado por:** Sistema de Business Intelligence - HSOP
**Script:** pneumonia_scout_prod.py
**Banco de Dados:** PostgreSQL (Render - Produção)
**Data/Hora:** 10/11/2025
