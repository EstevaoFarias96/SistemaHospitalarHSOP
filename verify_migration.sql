-- ============================================================================
-- VERIFICAÇÃO RÁPIDA DA MIGRAÇÃO
-- Execute este script para verificar o estado atual da migração
-- ============================================================================

\echo '========================================='
\echo 'VERIFICAÇÃO DA MIGRAÇÃO - ALERGIAS E PRIORIDADE'
\echo '========================================='
\echo ''

-- 1. Verificar se as colunas existem
\echo '1. Estrutura das Colunas:'
\echo '-------------------------'
SELECT
    CASE
        WHEN column_name = 'alergias' THEN '✓ pacientes.alergias'
        WHEN column_name = 'prioridade' THEN '✓ pacientes.prioridade'
        WHEN column_name = 'desc_prioridade' THEN '✓ pacientes.desc_prioridade'
    END as coluna,
    data_type as tipo,
    CASE WHEN is_nullable = 'YES' THEN 'Sim' ELSE 'Não' END as nulo,
    column_default as padrao
FROM information_schema.columns
WHERE table_name = 'pacientes'
  AND column_name IN ('alergias', 'prioridade', 'desc_prioridade')
ORDER BY ordinal_position;

\echo ''
\echo '2. Estatísticas Gerais:'
\echo '-------------------------'
SELECT
    COUNT(*) as total_pacientes,
    COUNT(CASE WHEN alergias IS NOT NULL AND alergias != '' THEN 1 END) as com_alergias,
    COUNT(CASE WHEN prioridade = TRUE THEN 1 END) as com_prioridade,
    COUNT(CASE WHEN prioridade = TRUE AND desc_prioridade LIKE 'Idoso%' THEN 1 END) as idosos
FROM pacientes;

\echo ''
\echo '3. Verificar Coluna Antiga (atendimentos.alergias):'
\echo '-------------------------'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'atendimentos'
            AND column_name = 'alergias'
        ) THEN '⚠️  AINDA EXISTE - Aguardando limpeza'
        ELSE '✓ REMOVIDA - Migração completa'
    END as status_coluna_antiga;

\echo ''
\echo '4. Exemplos de Pacientes com Alergias:'
\echo '-------------------------'
SELECT
    id,
    LEFT(nome, 30) as nome,
    LEFT(alergias, 50) as alergias
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != ''
ORDER BY id
LIMIT 5;

\echo ''
\echo '5. Exemplos de Pacientes com Prioridade:'
\echo '-------------------------'
SELECT
    id,
    LEFT(nome, 30) as nome,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento))::int as idade,
    CASE WHEN prioridade THEN '✓' ELSE '✗' END as prio,
    LEFT(desc_prioridade, 40) as tipo
FROM pacientes
WHERE prioridade = TRUE
ORDER BY data_nascimento
LIMIT 5;

\echo ''
\echo '6. Comparação Atendimentos vs Pacientes (Alergias):'
\echo '-------------------------'
WITH atend_stats AS (
    SELECT COUNT(DISTINCT paciente_id) as total
    FROM atendimentos
    WHERE alergias IS NOT NULL AND alergias != ''
),
pac_stats AS (
    SELECT COUNT(*) as total
    FROM pacientes
    WHERE alergias IS NOT NULL AND alergias != ''
)
SELECT
    'Atendimentos com alergias (únicos)' as origem,
    a.total,
    CASE
        WHEN a.total <= p.total THEN '✓ OK'
        ELSE '⚠️  Verificar'
    END as status
FROM atend_stats a, pac_stats p
UNION ALL
SELECT
    'Pacientes com alergias',
    p.total,
    '✓'
FROM pac_stats p;

\echo ''
\echo '7. Distribuição por Tipo de Prioridade:'
\echo '-------------------------'
SELECT
    CASE
        WHEN desc_prioridade LIKE 'Idoso%' THEN 'Idoso (60+)'
        WHEN desc_prioridade LIKE 'Gestante%' THEN 'Gestante'
        WHEN desc_prioridade LIKE '%deficiência%' THEN 'PCD'
        WHEN desc_prioridade IS NOT NULL THEN 'Outros'
        ELSE 'Sem descrição'
    END as tipo_prioridade,
    COUNT(*) as quantidade
FROM pacientes
WHERE prioridade = TRUE
GROUP BY
    CASE
        WHEN desc_prioridade LIKE 'Idoso%' THEN 'Idoso (60+)'
        WHEN desc_prioridade LIKE 'Gestante%' THEN 'Gestante'
        WHEN desc_prioridade LIKE '%deficiência%' THEN 'PCD'
        WHEN desc_prioridade IS NOT NULL THEN 'Outros'
        ELSE 'Sem descrição'
    END
ORDER BY quantidade DESC;

\echo ''
\echo '8. Índices Criados:'
\echo '-------------------------'
SELECT
    indexname as indice,
    indexdef as definicao
FROM pg_indexes
WHERE tablename = 'pacientes'
  AND indexname LIKE '%prioridade%';

\echo ''
\echo '========================================='
\echo 'VERIFICAÇÃO CONCLUÍDA'
\echo '========================================='
\echo ''
\echo 'Status da Migração:'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'pacientes'
            AND column_name IN ('alergias', 'prioridade', 'desc_prioridade')
            GROUP BY table_name
            HAVING COUNT(*) = 3
        ) THEN '✓ COLUNAS CRIADAS'
        ELSE '✗ COLUNAS FALTANDO'
    END as colunas,
    CASE
        WHEN (SELECT COUNT(*) FROM pacientes WHERE alergias IS NOT NULL) > 0
        THEN '✓ DADOS MIGRADOS'
        ELSE '⚠️  SEM DADOS'
    END as dados,
    CASE
        WHEN (SELECT COUNT(*) FROM pacientes WHERE prioridade = TRUE) > 0
        THEN '✓ PRIORIDADES DETECTADAS'
        ELSE '⚠️  SEM PRIORIDADES'
    END as prioridades;

\echo ''
