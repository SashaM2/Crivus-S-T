-- Migration: Adicionar campo tracking_enabled na tabela quizzes
-- Este campo permite ativar/desativar o tracking de eventos para cada quiz individualmente

-- Adicionar coluna tracking_enabled (default true para manter compatibilidade com quizzes existentes)
alter table quizzes 
add column if not exists tracking_enabled boolean default true not null;

-- Comentário explicativo
comment on column quizzes.tracking_enabled is 'Controla se o tracking de eventos está habilitado para este quiz. Quando false, nenhum evento será salvo para este quiz.';

