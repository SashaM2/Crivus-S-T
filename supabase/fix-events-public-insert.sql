-- ============================================
-- Script para corrigir a política RLS da tabela events
-- Isso permite inserções públicas (necessário para tracking externo)
-- ============================================

-- PASSO 1: Verificar políticas atuais (para diagnóstico)
-- Execute isso primeiro para ver o que existe:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'events';

-- PASSO 2: Remover TODAS as políticas de insert existentes para evitar conflitos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events' AND cmd = 'INSERT') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', r.policyname);
        RAISE NOTICE 'Removida política: %', r.policyname;
    END LOOP;
END $$;

-- PASSO 3: Criar política pública para inserção de eventos
-- Isso permite que a API de eventos insira eventos usando a anon key (sem autenticação)
-- É seguro porque eventos são dados de tracking públicos
CREATE POLICY "public insert" ON events
FOR INSERT
WITH CHECK (true);

-- PASSO 4: Verificar se a política foi criada corretamente
SELECT 
    policyname, 
    cmd, 
    permissive, 
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'INSERT';

-- Se você ver a política "public insert" listada acima, está tudo certo!
-- Se não aparecer, verifique se há erros acima.

