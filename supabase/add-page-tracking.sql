-- Adicionar campos de rastreamento de página para abandono
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE events
ADD COLUMN IF NOT EXISTS page_id TEXT,
ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN events.page_id IS 'Identificador da página/etapa onde o evento ocorreu';
COMMENT ON COLUMN events.page_url IS 'URL completa da página onde o evento ocorreu';

