-- Tabela profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','user')),
  active boolean default true,
  created_at timestamptz default now()
);

-- Políticas profiles
alter table profiles enable row level security;

-- Remover políticas antigas se existirem
drop policy if exists "admin select" on profiles;
drop policy if exists "admin insert" on profiles;
drop policy if exists "admin update" on profiles;
drop policy if exists "admin delete" on profiles;
drop policy if exists "users select own" on profiles;
drop policy if exists "admin select all" on profiles;

-- Criar função helper que bypassa RLS para verificar se usuário é admin
-- Esta função usa SECURITY DEFINER para executar com privilégios elevados
create or replace function check_is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin' 
    and active = true
  );
end;
$$ language plpgsql security definer;

-- Usuários podem ver seus próprios perfis (CRÍTICO para login funcionar)
create policy "users select own" on profiles 
for select using (auth.uid() = id);

-- Admins podem ver todos os perfis
create policy "admin select all" on profiles 
for select using (check_is_admin());

-- Admins podem inserir perfis
create policy "admin insert" on profiles
for insert with check (check_is_admin());

-- Admins podem atualizar perfis
create policy "admin update" on profiles
for update using (check_is_admin());

-- Admins podem deletar perfis
create policy "admin delete" on profiles
for delete using (check_is_admin());

-- Tabela quizzes
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  criado_em timestamptz default now()
);

-- Políticas quizzes
alter table quizzes enable row level security;

-- Remover políticas antigas se existirem
drop policy if exists "users select own" on quizzes;
drop policy if exists "users insert own" on quizzes;
drop policy if exists "users update own" on quizzes;
drop policy if exists "users delete own" on quizzes;
drop policy if exists "public select quizzes" on quizzes;

create policy "users select own" on quizzes 
for select using (auth.uid() = user_id);

-- Política pública para permitir verificação de existência de quiz (necessário para tracking externo)
-- Isso permite que a API de eventos verifique se um quiz existe usando a anon key
-- É seguro porque quiz IDs são públicos por natureza (usados em URLs e tracking)
create policy "public select quizzes" on quizzes
for select using (true);

create policy "users insert own" on quizzes 
for insert with check (auth.uid() = user_id);

create policy "users update own" on quizzes
for update using (auth.uid() = user_id);

create policy "users delete own" on quizzes
for delete using (auth.uid() = user_id);

-- Tabela events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  quiz_id uuid references quizzes(id) on delete cascade,
  event text not null check (event in ('start_quiz','next_question','finish_quiz','lead_captured')),
  question int,
  timestamp timestamptz default now(),
  utm_source text,
  utm_campaign text,
  lead_data jsonb,
  page_id text,
  page_url text
);

-- Políticas events
alter table events enable row level security;

-- Remover políticas antigas se existirem
drop policy if exists "public insert" on events;
drop policy if exists "users select their events" on events;

create policy "public insert" on events
for insert with check (true);

create policy "users select their events" on events
for select using (auth.uid() = (select user_id from quizzes where quizzes.id = quiz_id));

-- Índices para performance
create index if not exists idx_events_quiz_id on events(quiz_id);
create index if not exists idx_events_timestamp on events(timestamp);
create index if not exists idx_events_user_id on events(user_id);
create index if not exists idx_quizzes_user_id on quizzes(user_id);
create index if not exists idx_profiles_role on profiles(role);

