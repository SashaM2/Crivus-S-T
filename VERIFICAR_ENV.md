# 🔍 Como Verificar e Corrigir Variáveis de Ambiente

## ❌ Erro: "Invalid API key"

Este erro significa que a `SUPABASE_SERVICE_ROLE_KEY` está incorreta ou não foi configurada.

## ✅ Solução Passo a Passo

### 1. Verificar se o arquivo `.env.local` existe

O arquivo deve estar na **raiz do projeto** (mesmo nível que `package.json`).

```
S:\Nova pasta\
├── .env.local          ← Deve estar aqui
├── package.json
├── app/
└── ...
```

### 2. Verificar o conteúdo do `.env.local`

O arquivo deve conter **3 variáveis**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**⚠️ IMPORTANTE:**
- A `SUPABASE_SERVICE_ROLE_KEY` é **DIFERENTE** da `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- A Service Role Key começa com `eyJ` e é muito longa
- **NÃO** use a "anon" key no lugar da "service_role" key

### 3. Como obter as chaves corretas

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** (⚙️) no menu lateral
4. Clique em **API**
5. Você verá várias chaves:

   ```
   Project URL
   https://seu-projeto.supabase.co
   ↑ Use isso para NEXT_PUBLIC_SUPABASE_URL
   
   anon public
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↑ Use isso para NEXT_PUBLIC_SUPABASE_ANON_KEY
   
   service_role (secret)
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↑ Use isso para SUPABASE_SERVICE_ROLE_KEY
   ```

6. Clique no ícone de **copiar** ao lado de cada chave
7. Cole no arquivo `.env.local`

### 4. Verificar o formato das chaves

**URL:**
- ✅ Correto: `https://abc123.supabase.co`
- ❌ Incorreto: `abc123.supabase.co` (falta https://)

**Chaves (JWT tokens):**
- ✅ Correto: Uma chave JWT longa (centenas de caracteres) que começa com `eyJ` e contém 3 partes separadas por pontos
- ❌ Incorreto: Chave muito curta ou incompleta (deve ter 3 partes separadas por pontos)

**As chaves JWT são muito longas** (centenas de caracteres). Certifique-se de copiar a chave completa!

### 5. Verificar se não há espaços extras

```env
# ❌ ERRADO (tem espaços)
NEXT_PUBLIC_SUPABASE_URL = https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key_aqui

# ✅ CORRETO (sem espaços ao redor do =)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 6. Verificar se não há aspas

```env
# ❌ ERRADO (com aspas)
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"

# ✅ CORRETO (sem aspas)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 7. Após corrigir, execute novamente

```bash
node scripts/reset-admin.js
```

## 🔍 Verificação Rápida

Execute este comando para verificar se as variáveis estão sendo lidas:

```bash
node -e "require('dotenv').config({path: '.env.local'}); console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO'); console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'FALTANDO'); console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO');"
```

Ou simplesmente execute o script novamente - ele agora mostra mensagens mais claras sobre o que está errado.

## 📝 Exemplo de `.env.local` correto

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_completa_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_completa_aqui
```

**Nota:** Substitua os valores acima pelas suas chaves reais obtidas no dashboard do Supabase.

## ⚠️ Segurança

- **NUNCA** commite o arquivo `.env.local` no Git
- A `SUPABASE_SERVICE_ROLE_KEY` é **SECRETA** - não compartilhe
- Use apenas localmente ou em variáveis de ambiente do servidor

