-- Verificar se há múltiplas políticas ou conflitos
-- Execute este SQL para diagnosticar o problema

-- 1. Ver TODAS as políticas na tabela events (não só INSERT)
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check,
    qual
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- 2. Verificar se RLS está realmente habilitado
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE tablename = 'events';

-- 3. Verificar se há políticas RESTRICTIVE que podem estar bloqueando
SELECT 
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN permissive = 'RESTRICTIVE' THEN '⚠️ RESTRICTIVE - Pode estar bloqueando!'
        ELSE '✅ PERMISSIVE'
    END as warning
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'INSERT';

