-- ============================================
-- DIAGNÓSTICO COMPLETO: RLS na tabela events
-- Execute este script para identificar o problema
-- ============================================

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'events';

-- 2. Listar TODAS as políticas na tabela events
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Command",
    qual as "Using Expression",
    with_check as "With Check Expression"
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- 3. Verificar se há políticas conflitantes (múltiplas políticas para INSERT)
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'events' 
AND cmd = 'INSERT';

-- 4. Verificar estrutura da tabela events
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 5. Testar se a política permite inserção (simulação)
-- Esta query verifica se a política "public insert" está configurada corretamente
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_policies 
            WHERE tablename = 'events' 
            AND policyname = 'public insert'
            AND cmd = 'INSERT'
            AND with_check = 'true'
        ) THEN '✅ Política "public insert" encontrada e configurada'
        ELSE '❌ Política "public insert" NÃO encontrada ou mal configurada'
    END as "Status da Política";

-- 6. Verificar se há outras políticas que podem estar bloqueando
SELECT 
    '⚠️ ATENÇÃO: Múltiplas políticas de INSERT encontradas!' as warning,
    policyname,
    with_check
FROM pg_policies 
WHERE tablename = 'events' 
AND cmd = 'INSERT'
HAVING COUNT(*) > 1;

