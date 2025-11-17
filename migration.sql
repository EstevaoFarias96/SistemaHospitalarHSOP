-- ============================================================================
-- MIGRAÇÃO: Adicionar colunas de alergias e prioridade em Paciente
-- Data: 2025-01-17
--
-- IMPORTANTE: Este script adiciona novas colunas SEM remover as antigas
-- Isso permite testar o novo mecanismo antes de remover definitivamente
-- ============================================================================

-- Verificar banco de dados atual
SELECT current_database();

-- ============================================================================
-- 1. ADICIONAR COLUNA ALERGIAS NA TABELA PACIENTES
-- ============================================================================

-- Adicionar coluna alergias (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pacientes'
        AND column_name = 'alergias'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN alergias TEXT;
        RAISE NOTICE 'Coluna alergias adicionada com sucesso em pacientes';
    ELSE
        RAISE NOTICE 'Coluna alergias já existe em pacientes';
    END IF;
END $$;

-- ============================================================================
-- 2. MIGRAR DADOS DE ALERGIAS DE ATENDIMENTOS PARA PACIENTES
-- ============================================================================

-- Criar tabela temporária para armazenar alergias por paciente
CREATE TEMP TABLE temp_alergias AS
SELECT
    a.paciente_id,
    STRING_AGG(DISTINCT a.alergias, '; ' ORDER BY a.alergias) as alergias_consolidadas
FROM atendimentos a
WHERE a.alergias IS NOT NULL
  AND a.alergias != ''
GROUP BY a.paciente_id;

-- Verificar quantos registros serão atualizados
SELECT COUNT(*) as total_pacientes_com_alergias
FROM temp_alergias;

-- Atualizar pacientes com as alergias consolidadas
UPDATE pacientes p
SET alergias = t.alergias_consolidadas
FROM temp_alergias t
WHERE p.id = t.paciente_id;

-- Mostrar resultado
SELECT COUNT(*) as pacientes_atualizados
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != '';

-- ============================================================================
-- 3. ADICIONAR COLUNAS DE PRIORIDADE NA TABELA PACIENTES
-- ============================================================================

-- Adicionar coluna prioridade (Boolean)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pacientes'
        AND column_name = 'prioridade'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN prioridade BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Coluna prioridade adicionada com sucesso em pacientes';
    ELSE
        RAISE NOTICE 'Coluna prioridade já existe em pacientes';
    END IF;
END $$;

-- Adicionar coluna desc_prioridade (Text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pacientes'
        AND column_name = 'desc_prioridade'
    ) THEN
        ALTER TABLE pacientes ADD COLUMN desc_prioridade TEXT;
        RAISE NOTICE 'Coluna desc_prioridade adicionada com sucesso em pacientes';
    ELSE
        RAISE NOTICE 'Coluna desc_prioridade já existe em pacientes';
    END IF;
END $$;

-- ============================================================================
-- 4. DETECTAR AUTOMATICAMENTE IDOSOS E MARCAR COMO PRIORIDADE
-- ============================================================================

-- Atualizar pacientes com 60+ anos como prioridade
UPDATE pacientes
SET
    prioridade = TRUE,
    desc_prioridade = 'Idoso - ' || EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) || ' anos'
WHERE data_nascimento IS NOT NULL
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) >= 60
  AND (prioridade = FALSE OR prioridade IS NULL);

-- Mostrar resultado
SELECT COUNT(*) as idosos_marcados_como_prioridade
FROM pacientes
WHERE prioridade = TRUE
  AND desc_prioridade LIKE 'Idoso%';

-- ============================================================================
-- 5. VERIFICAÇÕES E ESTATÍSTICAS
-- ============================================================================

-- Verificar estrutura da tabela pacientes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pacientes'
  AND column_name IN ('alergias', 'prioridade', 'desc_prioridade')
ORDER BY ordinal_position;

-- Estatísticas de alergias
SELECT
    'Total de pacientes' as categoria,
    COUNT(*) as total
FROM pacientes
UNION ALL
SELECT
    'Pacientes com alergias registradas',
    COUNT(*)
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != ''
UNION ALL
SELECT
    'Pacientes com prioridade',
    COUNT(*)
FROM pacientes
WHERE prioridade = TRUE;

-- Ver exemplos de pacientes com alergias
SELECT
    id,
    nome,
    LEFT(alergias, 50) as alergias_preview
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != ''
ORDER BY id
LIMIT 10;

-- Ver exemplos de pacientes com prioridade
SELECT
    id,
    nome,
    data_nascimento,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) as idade,
    prioridade,
    desc_prioridade
FROM pacientes
WHERE prioridade = TRUE
ORDER BY data_nascimento
LIMIT 10;

-- ============================================================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE (OPCIONAL)
-- ============================================================================

-- Índice para buscas por prioridade
CREATE INDEX IF NOT EXISTS idx_pacientes_prioridade
ON pacientes(prioridade)
WHERE prioridade = TRUE;

-- ============================================================================
-- 7. COMENTÁRIOS NAS COLUNAS (DOCUMENTAÇÃO)
-- ============================================================================

COMMENT ON COLUMN pacientes.alergias IS
'Alergias conhecidas do paciente. Migrado de atendimentos.alergias';

COMMENT ON COLUMN pacientes.prioridade IS
'Indica se o paciente tem prioridade administrativa no atendimento (idosos, gestantes, PCD, etc.)';

COMMENT ON COLUMN pacientes.desc_prioridade IS
'Descrição do tipo de prioridade administrativa (ex: Idoso - 75 anos, Gestante, PCD)';

-- ============================================================================
-- MIGRAÇÃO CONCLUÍDA
-- ============================================================================

SELECT
    '✓ Migração concluída com sucesso!' as status,
    CURRENT_TIMESTAMP as data_hora;

-- Resumo final
SELECT
    'RESUMO DA MIGRAÇÃO' as titulo,
    '' as separador
UNION ALL
SELECT
    'Pacientes no sistema:',
    COUNT(*)::text
FROM pacientes
UNION ALL
SELECT
    'Pacientes com alergias:',
    COUNT(*)::text
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != ''
UNION ALL
SELECT
    'Pacientes com prioridade:',
    COUNT(*)::text
FROM pacientes
WHERE prioridade = TRUE
UNION ALL
SELECT
    'Idosos detectados:',
    COUNT(*)::text
FROM pacientes
WHERE prioridade = TRUE AND desc_prioridade LIKE 'Idoso%';
