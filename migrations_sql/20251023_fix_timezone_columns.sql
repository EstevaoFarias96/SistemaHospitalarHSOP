-- Script para ajustar timezone das colunas de data/hora
-- Criado em: 23/10/2025
-- Objetivo: Garantir que todas as colunas datetime usem timezone de Brasília (UTC-3)

-- ============================================
-- TABELA: atendimentos
-- ============================================

-- Nota: Se os dados já estão em horário de Londres (UTC), 
-- precisamos subtrair 3 horas para converter para horário de Brasília
-- Se já estão em horário correto, não execute estas alterações

-- Adicionar timezone às colunas (se estiverem sem timezone)
-- ALTER TABLE atendimentos 
--   ALTER COLUMN horario_triagem TYPE timestamptz USING horario_triagem AT TIME ZONE 'America/Sao_Paulo',
--   ALTER COLUMN horario_consulta_medica TYPE timestamptz USING horario_consulta_medica AT TIME ZONE 'America/Sao_Paulo',
--   ALTER COLUMN horario_observacao TYPE timestamptz USING horario_observacao AT TIME ZONE 'America/Sao_Paulo',
--   ALTER COLUMN horario_internacao TYPE timestamptz USING horario_internacao AT TIME ZONE 'America/Sao_Paulo',
--   ALTER COLUMN horario_alta TYPE timestamptz USING horario_alta AT TIME ZONE 'America/Sao_Paulo',
--   ALTER COLUMN horario_medicacao TYPE timestamptz USING horario_medicacao AT TIME ZONE 'America/Sao_Paulo';

-- ============================================
-- TABELA: atendimentos_clinica (Internacao)
-- ============================================

-- Adicionar timezone às colunas (se estiverem sem timezone)
-- ALTER TABLE atendimentos_clinica
--   ALTER COLUMN data_da_solicitacao_exame TYPE timestamptz USING data_da_solicitacao_exame AT TIME ZONE 'America/Sao_Paulo';

-- As colunas data_internacao e data_alta já têm timezone

-- ============================================
-- OUTRAS TABELAS
-- ============================================

-- internacao_sae
-- ALTER TABLE internacao_sae
--   ALTER COLUMN data_registro TYPE timestamptz USING data_registro AT TIME ZONE 'America/Sao_Paulo';

-- evolucoes_atendimentos_clinica
-- ALTER TABLE evolucoes_atendimentos_clinica
--   ALTER COLUMN data_evolucao TYPE timestamptz USING data_evolucao AT TIME ZONE 'America/Sao_Paulo';

-- prescricoes_clinica
-- ALTER TABLE prescricoes_clinica
--   ALTER COLUMN horario_prescricao TYPE timestamptz USING horario_prescricao AT TIME ZONE 'America/Sao_Paulo';

-- evolucoes_enfermagem
-- ALTER TABLE evolucoes_enfermagem
--   ALTER COLUMN data_evolucao TYPE timestamptz USING data_evolucao AT TIME ZONE 'America/Sao_Paulo';

-- prescricoes_enfermagem
-- ALTER TABLE prescricoes_enfermagem
--   ALTER COLUMN data_prescricao TYPE timestamptz USING data_prescricao AT TIME ZONE 'America/Sao_Paulo';

-- receituarios_clinica
-- ALTER TABLE receituarios_clinica
--   ALTER COLUMN data_receita TYPE timestamptz USING data_receita AT TIME ZONE 'America/Sao_Paulo';

-- atestados_clinica
-- ALTER TABLE atestados_clinica
--   ALTER COLUMN data_atestado TYPE timestamptz USING data_atestado AT TIME ZONE 'America/Sao_Paulo';

-- admissoes_enfermagem
-- ALTER TABLE admissoes_enfermagem
--   ALTER COLUMN data_hora TYPE timestamptz USING data_hora AT TIME ZONE 'America/Sao_Paulo';

-- evolucao_fisioterapia
-- ALTER TABLE evolucao_fisioterapia
--   ALTER COLUMN data_evolucao TYPE timestamptz USING data_evolucao AT TIME ZONE 'America/Sao_Paulo';

-- evolucao_nutricao
-- ALTER TABLE evolucao_nutricao
--   ALTER COLUMN data_evolucao TYPE timestamptz USING data_evolucao AT TIME ZONE 'America/Sao_Paulo';

-- evolucao_assistentesocial
-- ALTER TABLE evolucao_assistentesocial
--   ALTER COLUMN data_evolucao TYPE timestamptz USING data_evolucao AT TIME ZONE 'America/Sao_Paulo';

-- aprazamentos
-- ALTER TABLE aprazamentos
--   ALTER COLUMN data_hora_aprazamento TYPE timestamptz USING data_hora_aprazamento AT TIME ZONE 'America/Sao_Paulo',
--   ALTER COLUMN data_realizacao TYPE timestamptz USING data_realizacao AT TIME ZONE 'America/Sao_Paulo';

-- ============================================
-- VERIFICAR TIPOS DE COLUNAS
-- ============================================

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('atendimentos', 'atendimentos_clinica', 'internacao_sae', 
                     'evolucoes_atendimentos_clinica', 'prescricoes_clinica',
                     'evolucoes_enfermagem', 'prescricoes_enfermagem',
                     'receituarios_clinica', 'atestados_clinica', 'admissoes_enfermagem',
                     'evolucao_fisioterapia', 'evolucao_nutricao', 'evolucao_assistentesocial',
                     'aprazamentos')
  AND (column_name LIKE '%data%' OR column_name LIKE '%horario%')
ORDER BY table_name, column_name;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. As alterações de timezone estão comentadas para segurança
-- 2. Execute a query SELECT primeiro para verificar os tipos atuais
-- 3. Se os dados já estão em horário de Brasília, NÃO execute os ALTER
-- 4. Se os dados estão em UTC/Londres, você precisará converter:
--    USING (horario_triagem AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
-- 5. Faça BACKUP antes de executar qualquer ALTER TABLE
-- 6. Teste primeiro em ambiente de desenvolvimento

