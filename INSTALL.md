# Guia de Instalação - Crivus Quiz Analytics ST

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Git (opcional)

## 🚀 Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key_aqui
```

**Onde encontrar essas chaves:**
1. Acesse seu projeto no Supabase
2. Vá em Settings > API
3. Copie a `URL` e a `anon public` key

### 3. Configurar o Banco de Dados

1. Acesse o SQL Editor no Supabase
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`
3. Cole no SQL Editor e execute

Isso criará:
- Tabela `profiles` com políticas RLS
- Tabela `quizzes` com políticas RLS
- Tabela `events` com políticas RLS
- Índices para performance

### 4. Criar o Primeiro Usuário Admin

**OPÇÃO A - Script Automático (Recomendado):**

1. Obtenha a Service Role Key do Supabase:
   - Acesse https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em Settings > API
   - Copie a **"service_role"** key (⚠️ NÃO use a anon key!)
   - Adicione no `.env.local`:
     ```
     SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
     ```

2. Execute o script:
   ```bash
   node scripts/create-admin.js
   ```

   Isso criará automaticamente o usuário admin com:
   - Email: `admin@crivus.com`
   - Senha: `Admin123!`

**OPÇÃO B - Manual (Alternativa):**

1. Acesse Authentication > Users no Supabase
2. Clique em "Add user" > "Create new user"
3. Preencha email e senha
4. Anote o `User UID` gerado
5. No SQL Editor, execute:

```sql
INSERT INTO profiles (id, email, role, active)
VALUES ('user_uid_aqui', 'seu@email.com', 'admin', true);
```

Substitua `user_uid_aqui` pelo UID do usuário criado e `seu@email.com` pelo email.

### 5. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

### 6. Fazer Login

1. Acesse `http://localhost:3000/login`
2. Use as credenciais do usuário admin criado
3. Você será redirecionado para `/admin/users`

## 📝 Próximos Passos

1. **Criar mais usuários:** Acesse `/admin/users` e crie usuários normais
2. **Criar quizzes:** Usuários podem criar quizzes em `/quizzes`
3. **Integrar snippet:** Use a página `/integration` para obter o código de tracking
4. **Visualizar métricas:** Acesse `/dashboard` para ver as métricas

## 🔧 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe e está na raiz do projeto
- Confirme que as variáveis estão corretas

### Erro: "Row Level Security policy violation"
- Certifique-se de que executou o SQL do `supabase/schema.sql`
- Verifique se o usuário tem o perfil criado na tabela `profiles`

### Erro ao criar usuário via interface
- O primeiro usuário admin deve ser criado manualmente no Supabase
- Usuários subsequentes podem ser criados pela interface admin

### Snippet não está funcionando
- Verifique se o `quiz_id` está correto no atributo `data-quiz-id`
- Confirme que o script `analytics.js` está sendo carregado
- Verifique o console do navegador para erros

## 📚 Documentação Adicional

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

