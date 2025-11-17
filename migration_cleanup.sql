-- ============================================================================
-- LIMPEZA: Remover coluna alergias ANTIGA da tabela atendimentos
-- Data: 2025-01-17
--
-- ⚠️  ATENÇÃO: Execute este script APENAS após confirmar que:
--    1. A migração funcionou corretamente
--    2. O sistema está usando pacientes.alergias
--    3. Todos os testes foram realizados com sucesso
--
-- IMPORTANTE: Faça backup do banco antes de executar!
-- ============================================================================

-- Verificar banco de dados atual
SELECT current_database();

-- ============================================================================
-- VERIFICAÇÕES DE SEGURANÇA
-- ============================================================================

-- 1. Verificar se a coluna alergias existe em pacientes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pacientes'
        AND column_name = 'alergias'
    ) THEN
        RAISE EXCEPTION 'ERRO: Coluna alergias não existe em pacientes. Execute primeiro migration.sql';
    END IF;
END $$;

-- 2. Verificar quantos pacientes têm alergias registradas
SELECT
    COUNT(*) as pacientes_com_alergias,
    COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM pacientes), 0) as percentual
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != '';

-- 3. Comparar dados entre atendimentos e pacientes
SELECT
    'Atendimentos com alergias' as origem,
    COUNT(DISTINCT paciente_id) as total_pacientes
FROM atendimentos
WHERE alergias IS NOT NULL AND alergias != ''
UNION ALL
SELECT
    'Pacientes com alergias',
    COUNT(*)
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != '';

-- ============================================================================
-- BACKUP DE SEGURANÇA (OPCIONAL)
-- ============================================================================

-- Criar tabela de backup com os dados da coluna antiga
CREATE TABLE IF NOT EXISTS backup_atendimentos_alergias AS
SELECT
    id,
    paciente_id,
    alergias,
    data_atendimento,
    CURRENT_TIMESTAMP as backup_em
FROM atendimentos
WHERE alergias IS NOT NULL AND alergias != '';

SELECT
    'Backup criado com ' || COUNT(*) || ' registros' as status
FROM backup_atendimentos_alergias;

-- ============================================================================
-- CONFIRMAÇÃO INTERATIVA
-- ============================================================================

-- Mostrar o que será removido
SELECT
    '⚠️  ATENÇÃO: A coluna alergias será removida da tabela atendimentos' as aviso,
    '' as separador
UNION ALL
SELECT
    'Registros com alergias em atendimentos:',
    COUNT(*)::text
FROM atendimentos
WHERE alergias IS NOT NULL AND alergias != ''
UNION ALL
SELECT
    'Pacientes com alergias migradas:',
    COUNT(*)::text
FROM pacientes
WHERE alergias IS NOT NULL AND alergias != '';

-- ============================================================================
-- REMOÇÃO DA COLUNA ANTIGA
-- ============================================================================

-- DESCOMENTE A LINHA ABAIXO PARA EXECUTAR A REMOÇÃO
-- ⚠️  CERTIFIQUE-SE DE QUE ESTÁ TUDO CORRETO ANTES!

-- ALTER TABLE atendimentos DROP COLUMN IF EXISTS alergias;

-- Após descomentar e executar, verifique:
/*
SELECT
    '✓ Coluna removida com sucesso!' as status,
    CURRENT_TIMESTAMP as data_hora;

-- Verificar que a coluna não existe mais
SELECT
    column_name
FROM information_schema.columns
WHERE table_name = 'atendimentos'
  AND column_name = 'alergias';
-- Não deve retornar nenhum resultado
*/

-- ============================================================================
-- INSTRUÇÕES PARA EXECUÇÃO
-- ============================================================================

/*
PASSO A PASSO:

1. Execute migration.sql primeiro
2. Teste o sistema por alguns dias/semanas
3. Verifique que não há erros relacionados a alergias
4. Confirme que todos os dados foram migrados corretamente
5. FAÇA BACKUP DO BANCO DE DADOS:
   pg_dump -h localhost -U seu_usuario -d seu_banco > backup_antes_cleanup.sql

6. Descomente a linha:
   ALTER TABLE atendimentos DROP COLUMN IF EXISTS alergias;

7. Execute este script
8. Verifique se tudo está funcionando
9. Mantenha o backup por pelo menos 30 dias

ROLLBACK (caso necessário):
Se algo der errado, você pode restaurar os dados do backup:

-- Adicionar coluna de volta
ALTER TABLE atendimentos ADD COLUMN alergias TEXT;

-- Restaurar dados do backup
UPDATE atendimentos a
SET alergias = b.alergias
FROM backup_atendimentos_alergias b
WHERE a.id = b.id;
*/

SELECT
    'LEITURA COMPLETA!' as status,
    'Siga as instruções acima antes de executar a remoção' as aviso;
