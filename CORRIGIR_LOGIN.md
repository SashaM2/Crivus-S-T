# 🔧 Como Corrigir o Problema de Login

## Problema Identificado

As políticas RLS (Row Level Security) da tabela `profiles` estavam incorretas, impedindo que usuários fizessem login. As políticas antigas verificavam `auth.jwt()->>'role'`, mas o JWT do Supabase Auth não contém esse campo por padrão.

## ✅ Solução

Execute o script de correção no Supabase:

### Passo 1: Acesse o SQL Editor do Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)

### Passo 2: Execute o Script de Correção

1. Abra o arquivo `supabase/fix-profiles-policies.sql` neste projeto
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar se o Usuário Admin Existe

Se você ainda não criou o usuário admin, execute:

```bash
node scripts/create-admin.js
```

**Importante:** Certifique-se de ter a `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local` antes de executar o script.

### Passo 4: Testar o Login

1. Acesse `http://localhost:3000/login`
2. Use as credenciais:
   - **Email:** `admin@crivus.com`
   - **Senha:** `Admin123!`

## 📋 O que foi corrigido?

1. ✅ Política que permite usuários verem seus próprios perfis (necessário para login)
2. ✅ Função `check_is_admin()` que bypassa RLS para verificar se usuário é admin
3. ✅ Políticas corretas para admins gerenciarem outros usuários

## 🔍 Se ainda não funcionar

1. **Verifique se o usuário admin existe:**
   - No Supabase, vá em Authentication > Users
   - Procure por `admin@crivus.com`
   - Se não existir, execute `node scripts/create-admin.js`

2. **Verifique se o perfil existe:**
   - No SQL Editor, execute:
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@crivus.com';
   ```
   - Se não retornar nada, o perfil não foi criado. Execute o script de criação do admin.

3. **Verifique as variáveis de ambiente:**
   - Confirme que `.env.local` existe e tem:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (para criar admin)

4. **Verifique se o schema foi executado:**
   - Certifique-se de que executou o conteúdo de `supabase/schema.sql` no Supabase

## 📝 Notas

- O arquivo `supabase/schema.sql` foi atualizado com as correções
- Para novas instalações, o schema já está correto
- Para instalações existentes, use o script `fix-profiles-policies.sql`

