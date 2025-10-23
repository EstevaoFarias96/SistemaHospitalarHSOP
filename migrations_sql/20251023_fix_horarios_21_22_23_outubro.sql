-- ============================================
-- CORREÇÃO DE TIMEZONE - DIAS 21, 22 e 23 DE OUTUBRO DE 2025
-- ============================================
-- Data de criação: 23/10/2025
-- Objetivo: Corrigir horários cadastrados em UTC/Londres para horário de Brasília
-- Ação: Subtrair 3 horas de todos os horários desses dias
--
-- ⚠️  IMPORTANTE:
--     1. FAZER BACKUP antes de executar
--     2. Executar apenas UMA VEZ
--     3. Verificar os dados antes de executar (queries SELECT abaixo)
-- ============================================

-- --------------------------------------------
-- PARTE 1: VERIFICAÇÃO (Execute primeiro)
-- --------------------------------------------

-- Ver quantos registros serão afetados em ATENDIMENTOS
SELECT 
    data_atendimento,
    COUNT(*) as total_atendimentos,
    COUNT(horario_triagem) as com_triagem,
    COUNT(horario_consulta_medica) as com_consulta,
    COUNT(horario_observacao) as com_observacao,
    COUNT(horario_internacao) as com_internacao,
    COUNT(horario_alta) as com_alta
FROM atendimentos
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
GROUP BY data_atendimento
ORDER BY data_atendimento;

-- Ver alguns exemplos dos horários atuais (ATENDIMENTOS)
SELECT 
    id,
    data_atendimento,
    hora_atendimento,
    horario_triagem,
    horario_consulta_medica,
    status
FROM atendimentos
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND (horario_triagem IS NOT NULL OR horario_consulta_medica IS NOT NULL)
ORDER BY data_atendimento, hora_atendimento
LIMIT 10;

-- Ver quantos registros serão afetados em INTERNAÇÕES
SELECT 
    DATE(data_internacao) as dia,
    COUNT(*) as total_internacoes
FROM atendimentos_clinica
WHERE data_internacao >= '2025-10-21 00:00:00'
  AND data_internacao < '2025-10-24 00:00:00'
GROUP BY DATE(data_internacao)
ORDER BY dia;

-- Ver alguns exemplos dos horários atuais (INTERNAÇÕES)
SELECT 
    id,
    atendimento_id,
    data_internacao,
    data_alta,
    data_da_solicitacao_exame
FROM atendimentos_clinica
WHERE data_internacao >= '2025-10-21 00:00:00'
  AND data_internacao < '2025-10-24 00:00:00'
ORDER BY data_internacao
LIMIT 10;

-- ============================================
-- PARTE 2: CORREÇÃO (Execute após verificar)
-- ============================================

-- ⚠️  DESCOMENTE AS QUERIES ABAIXO APÓS FAZER BACKUP E VERIFICAR OS DADOS

-- --------------------------------------------
-- ATENDIMENTOS - Corrigir horario_triagem
-- --------------------------------------------
/*
UPDATE atendimentos
SET horario_triagem = horario_triagem - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_triagem IS NOT NULL;
*/

-- Verificar resultado
-- SELECT id, data_atendimento, horario_triagem 
-- FROM atendimentos 
-- WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
--   AND horario_triagem IS NOT NULL
-- ORDER BY data_atendimento, horario_triagem
-- LIMIT 5;

-- --------------------------------------------
-- ATENDIMENTOS - Corrigir horario_consulta_medica
-- --------------------------------------------
/*
UPDATE atendimentos
SET horario_consulta_medica = horario_consulta_medica - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_consulta_medica IS NOT NULL;
*/

-- --------------------------------------------
-- ATENDIMENTOS - Corrigir horario_observacao
-- --------------------------------------------
/*
UPDATE atendimentos
SET horario_observacao = horario_observacao - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_observacao IS NOT NULL;
*/

-- --------------------------------------------
-- ATENDIMENTOS - Corrigir horario_internacao
-- --------------------------------------------
/*
UPDATE atendimentos
SET horario_internacao = horario_internacao - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_internacao IS NOT NULL;
*/

-- --------------------------------------------
-- ATENDIMENTOS - Corrigir horario_alta
-- --------------------------------------------
/*
UPDATE atendimentos
SET horario_alta = horario_alta - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_alta IS NOT NULL;
*/

-- --------------------------------------------
-- ATENDIMENTOS - Corrigir horario_medicacao
-- --------------------------------------------
/*
UPDATE atendimentos
SET horario_medicacao = horario_medicacao - INTERVAL '3 hours'
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND horario_medicacao IS NOT NULL;
*/

-- --------------------------------------------
-- INTERNAÇÕES - Corrigir data_internacao
-- --------------------------------------------
/*
UPDATE atendimentos_clinica
SET data_internacao = data_internacao - INTERVAL '3 hours'
WHERE data_internacao >= '2025-10-21 00:00:00'
  AND data_internacao < '2025-10-24 00:00:00'
  AND data_internacao IS NOT NULL;
*/

-- --------------------------------------------
-- INTERNAÇÕES - Corrigir data_alta
-- --------------------------------------------
/*
UPDATE atendimentos_clinica
SET data_alta = data_alta - INTERVAL '3 hours'
WHERE data_alta >= '2025-10-21 00:00:00'
  AND data_alta < '2025-10-24 00:00:00'
  AND data_alta IS NOT NULL;
*/

-- --------------------------------------------
-- INTERNAÇÕES - Corrigir data_da_solicitacao_exame
-- --------------------------------------------
/*
UPDATE atendimentos_clinica
SET data_da_solicitacao_exame = data_da_solicitacao_exame - INTERVAL '3 hours'
WHERE data_da_solicitacao_exame >= '2025-10-21 00:00:00'
  AND data_da_solicitacao_exame < '2025-10-24 00:00:00'
  AND data_da_solicitacao_exame IS NOT NULL;
*/

-- ============================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================

-- Ver resultado final dos atendimentos
/*
SELECT 
    id,
    data_atendimento,
    hora_atendimento,
    horario_triagem,
    horario_consulta_medica,
    EXTRACT(HOUR FROM horario_triagem) as hora_triagem,
    EXTRACT(HOUR FROM horario_consulta_medica) as hora_consulta
FROM atendimentos
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')
  AND (horario_triagem IS NOT NULL OR horario_consulta_medica IS NOT NULL)
ORDER BY data_atendimento, hora_atendimento
LIMIT 20;
*/

-- Ver resultado final das internações
/*
SELECT 
    id,
    atendimento_id,
    data_internacao,
    data_alta,
    EXTRACT(HOUR FROM data_internacao) as hora_internacao,
    EXTRACT(HOUR FROM data_alta) as hora_alta
FROM atendimentos_clinica
WHERE data_internacao >= '2025-10-21 00:00:00'
  AND data_internacao < '2025-10-24 00:00:00'
ORDER BY data_internacao
LIMIT 20;
*/

-- ============================================
-- RESUMO DO QUE FOI FEITO
-- ============================================
/*
SELECT 
    'ATENDIMENTOS' as tabela,
    COUNT(*) as total_registros_afetados
FROM atendimentos
WHERE data_atendimento IN ('2025-10-21', '2025-10-22', '2025-10-23')

UNION ALL

SELECT 
    'INTERNAÇÕES' as tabela,
    COUNT(*) as total_registros_afetados
FROM atendimentos_clinica
WHERE data_internacao >= '2025-10-21 00:00:00'
  AND data_internacao < '2025-10-24 00:00:00';
*/

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 
-- 1. Execute primeiro as queries de VERIFICAÇÃO (PARTE 1)
-- 2. Faça BACKUP do banco de dados
-- 3. Descomente as queries de CORREÇÃO (PARTE 2)
-- 4. Execute query por query, verificando o resultado
-- 5. Execute as queries de VERIFICAÇÃO FINAL (PARTE 3)
-- 6. Se algo der errado, restaure o backup
--
-- ⚠️  EXECUTE APENAS UMA VEZ!
-- ============================================

