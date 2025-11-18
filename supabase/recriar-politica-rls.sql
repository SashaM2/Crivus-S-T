-- ============================================
-- RECRIAR POLÍTICA RLS - FORÇA RECRIAÇÃO COMPLETA
-- Execute este SQL para forçar a recriação da política
-- ============================================

-- PASSO 1: Remover a política atual
DROP POLICY IF EXISTS "public insert" ON events;

-- PASSO 2: Aguardar um momento (opcional, mas ajuda com cache)
-- Não há comando WAIT no SQL, mas podemos forçar com um SELECT
SELECT pg_sleep(0.1);

-- PASSO 3: Recriar a política de forma EXPLÍCITA
-- Usando sintaxe completa para garantir que funcione
CREATE POLICY "public insert" ON events
AS PERMISSIVE  -- Explícito: PERMISSIVE
FOR INSERT
TO public      -- Explícito: para role 'public'
WITH CHECK (true);

-- PASSO 4: Verificar imediatamente
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check,
    '✅ Política recriada' as status
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'INSERT';

-- PASSO 5: Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS DESABILITADO - HABILITE AGORA!'
    END as status
FROM pg_tables 
WHERE tablename = 'events';

