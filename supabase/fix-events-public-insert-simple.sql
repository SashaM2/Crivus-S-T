-- ============================================
-- Script SIMPLES para corrigir a política RLS da tabela events
-- Use este se o script principal não funcionar
-- ============================================

-- Remover política existente (se houver)
DROP POLICY IF EXISTS "public insert" ON events;

-- Criar política pública para inserção de eventos
CREATE POLICY "public insert" ON events
FOR INSERT
WITH CHECK (true);

-- Verificar se funcionou
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'events' AND cmd = 'INSERT';

