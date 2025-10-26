-- ========================================
-- VERIFICAÇÕES DE TABELAS NO SCHEMA CEPAS
-- ========================================

-- 1. Verificar todas as tabelas do usuário atual
SELECT table_name FROM user_tables ORDER BY table_name;

-- 2. Verificar especificamente as tabelas de autenticação
SELECT table_name FROM user_tables 
WHERE table_name IN ('USUARIO', 'REFRESHTOKEN', 'LOGSISTEMA') 
ORDER BY table_name;

-- 3. Verificar se existe a tabela Usuario
SELECT COUNT(*) as existe_usuario FROM user_tables WHERE table_name = 'USUARIO';

-- 4. Verificar as colunas da tabela Usuario (se existir)
SELECT column_name, data_type, nullable FROM user_tab_columns 
WHERE table_name = 'USUARIO' ORDER BY column_id;

-- 5. Verificar sequences relacionadas
SELECT sequence_name FROM user_sequences 
WHERE sequence_name IN ('SEQ_USUARIO', 'SEQ_REFRESHTOKEN', 'SEQ_LOGSISTEMA');

-- 6. Verificar triggers
SELECT trigger_name, table_name FROM user_triggers 
WHERE trigger_name IN ('TRG_USUARIO_ID', 'TRG_REFRESHTOKEN_ID', 'TRG_LOGSISTEMA_ID');

-- 7. Verificar se existem dados na tabela Usuario (se existir)
-- Execute apenas se a tabela existir
-- SELECT username, tipo_usuario FROM usuario;

-- 8. Verificar constraints de chave estrangeira
SELECT constraint_name, table_name, constraint_type FROM user_constraints 
WHERE constraint_name LIKE '%USUARIO%' OR constraint_name LIKE '%REFRESH%';

-- 9. Verificar índices criados
SELECT index_name, table_name FROM user_indexes 
WHERE index_name IN ('IDX_REFRESH_USUARIO', 'IDX_REFRESH_TOKEN', 'IDX_LOG_USUARIO', 'IDX_LOG_ACAO', 'IDX_LOG_DATA');

-- 10. Verificar se a coluna id_usuario foi adicionada à tabela Monitor
SELECT column_name FROM user_tab_columns 
WHERE table_name = 'MONITOR' AND column_name = 'ID_USUARIO';