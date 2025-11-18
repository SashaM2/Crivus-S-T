# 🔧 Troubleshooting - Problema de Login

## 🚀 Solução Rápida (Recomendado)

Se você está com "Email ou senha incorretos", execute este script que recria tudo do zero:

```bash
node scripts/reset-admin.js
```

Este script:
- ✅ Deleta o usuário admin existente (se houver)
- ✅ Recria o usuário do zero
- ✅ Cria o perfil corretamente
- ✅ Testa o login automaticamente

## Passo 1: Execute o Script de Diagnóstico

Execute o script de diagnóstico para identificar o problema:

```bash
node scripts/diagnose-admin.js
```

Este script vai verificar:
- ✅ Se o usuário existe no Supabase Auth
- ✅ Se o perfil existe na tabela profiles
- ✅ Se as políticas RLS estão corretas
- ✅ Se o login funciona

## Passo 2: Verificar Mensagens de Erro Específicas

Agora o sistema mostra mensagens de erro mais específicas:

### "Email ou senha incorretos"
- **Causa:** Credenciais incorretas ou usuário não existe
- **Solução:** 
  1. Verifique se executou `node scripts/create-admin.js`
  2. Confirme as credenciais: `admin@crivus.com` / `Admin123!`

### "Perfil não encontrado"
- **Causa:** O usuário existe no Auth mas não tem perfil na tabela `profiles`
- **Solução:** Execute `node scripts/create-admin.js` novamente

### "Erro de permissão. As políticas RLS podem estar incorretas"
- **Causa:** As políticas RLS estão bloqueando o acesso ao perfil
- **Solução:** 
  1. Abra `supabase/fix-profiles-policies.sql`
  2. Execute no SQL Editor do Supabase

### "Conta desativada"
- **Causa:** O perfil existe mas está com `active = false`
- **Solução:** Ative o perfil no Supabase ou execute o script de criação novamente

## Passo 3: Verificações Manuais

### Verificar se o usuário existe no Supabase Auth

1. Acesse https://supabase.com/dashboard
2. Vá em **Authentication > Users**
3. Procure por `admin@crivus.com`
4. Se não existir, execute: `node scripts/create-admin.js`

### Verificar se o perfil existe

No SQL Editor do Supabase, execute:

```sql
SELECT * FROM profiles WHERE email = 'admin@crivus.com';
```

Se não retornar nada:
- Execute: `node scripts/create-admin.js`

### Verificar políticas RLS

No SQL Editor do Supabase, execute:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';
```

Você deve ver pelo menos:
- `users select own` - Permite usuários verem seus próprios perfis
- `admin select all` - Permite admins verem todos os perfis

Se não ver essas políticas:
- Execute o conteúdo de `supabase/fix-profiles-policies.sql`

## Passo 4: Recriar o Usuário Admin

Se nada funcionar, recrie o usuário admin:

1. **Deletar usuário antigo (opcional):**
   - No Supabase Dashboard > Authentication > Users
   - Encontre `admin@crivus.com`
   - Delete o usuário

2. **Executar script de criação:**
   ```bash
   node scripts/create-admin.js
   ```

3. **Verificar criação:**
   ```bash
   node scripts/diagnose-admin.js
   ```

## Passo 5: Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` existe e contém:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Importante:** 
- A `SUPABASE_SERVICE_ROLE_KEY` é necessária apenas para criar usuários
- A `NEXT_PUBLIC_SUPABASE_ANON_KEY` é necessária para o login funcionar

## Passo 6: Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Tente fazer login
4. Veja se há erros no console

Erros comuns:
- `Missing Supabase environment variables` → Verifique `.env.local`
- `Failed to fetch` → Verifique a URL do Supabase
- Erros de CORS → Verifique as configurações do Supabase

## 📞 Ainda com Problemas?

Se após seguir todos os passos o problema persistir:

1. Execute o diagnóstico: `node scripts/diagnose-admin.js`
2. Copie a saída completa do script
3. Verifique o console do navegador para erros
4. Verifique as mensagens de erro específicas na interface

## ✅ Checklist Rápido

- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Schema SQL executado no Supabase
- [ ] Políticas RLS corrigidas (`fix-profiles-policies.sql`)
- [ ] Usuário admin criado (`create-admin.js`)
- [ ] Diagnóstico executado sem erros (`diagnose-admin.js`)
- [ ] Credenciais corretas: `admin@crivus.com` / `Admin123!`

