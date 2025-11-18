-- Script para corrigir as políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase
-- 
-- IMPORTANTE: Execute este script APÓS criar o usuário admin
-- Se você ainda não criou o admin, execute primeiro: node scripts/create-admin.js

-- Remover políticas antigas (se existirem)
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

-- Criar políticas corretas

-- 1. Usuários podem ver seus próprios perfis (CRÍTICO para login funcionar)
-- Esta política permite que qualquer usuário autenticado veja seu próprio perfil
create policy "users select own" on profiles 
for select using (auth.uid() = id);

-- 2. Admins podem ver todos os perfis
create policy "admin select all" on profiles 
for select using (check_is_admin());

-- 3. Admins podem inserir perfis
create policy "admin insert" on profiles
for insert with check (check_is_admin());

-- 4. Admins podem atualizar perfis
create policy "admin update" on profiles
for update using (check_is_admin());

-- 5. Admins podem deletar perfis
create policy "admin delete" on profiles
for delete using (check_is_admin());

