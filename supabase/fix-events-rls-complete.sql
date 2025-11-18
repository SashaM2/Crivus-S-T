-- ============================================
-- FIX COMPLETO: RLS para tabela events
-- Este script remove TODAS as políticas e recria apenas a necessária
-- ============================================

-- PASSO 1: Desabilitar RLS temporariamente (para limpeza)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todas as políticas de INSERT
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'events' AND cmd = 'INSERT'
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', r.policyname);
        RAISE NOTICE 'Removida política de INSERT: %', r.policyname;
    END LOOP;
    
    -- Remover todas as políticas de SELECT (opcional, mas vamos manter as existentes)
    -- FOR r IN (
    --     SELECT policyname 
    --     FROM pg_policies 
    --     WHERE tablename = 'events' AND cmd = 'SELECT'
    -- ) 
    -- LOOP
    --     EXECUTE format('DROP POLICY IF EXISTS %I ON events', r.policyname);
    --     RAISE NOTICE 'Removida política de SELECT: %', r.policyname;
    -- END LOOP;
END $$;

-- PASSO 3: Reabilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar política pública para INSERT (PERMISSIVA)
-- IMPORTANTE: PERMISSIVE significa que permite a operação se QUALQUER política permitir
-- TO public garante que funciona para usuários não autenticados (anon key)
CREATE POLICY "public insert" ON events
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Alternativa se a sintaxe acima não funcionar (algumas versões do Postgres):
-- CREATE POLICY "public insert" ON events
-- FOR INSERT
-- WITH CHECK (true);

-- PASSO 5: Verificar se foi criada corretamente
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check,
    CASE 
        WHEN with_check = 'true' THEN '✅ Configurada corretamente'
        ELSE '❌ Problema na configuração'
    END as status
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'INSERT';

-- PASSO 6: Verificar status do RLS
SELECT 
    tablename,
    rowsecurity as "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ RLS está habilitado'
        ELSE '❌ RLS está DESABILITADO'
    END as status
FROM pg_tables 
WHERE tablename = 'events';

