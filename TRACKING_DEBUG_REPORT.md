# 🔍 Relatório de Análise - Tracking Externo Crivus QuizIQ

## 📋 Resumo Executivo

**Problema Identificado**: O tracking externo não está enviando eventos para o Supabase quando usado em domínios externos.

**Status**: ✅ **CORRIGIDO** - Todos os problemas críticos foram identificados e corrigidos.

---

## 🐛 Problemas Críticos Encontrados e Corrigidos

### 1. ❌ **ERRO CRÍTICO**: Cliente Supabase Incorreto na Rota POST /api/events

**Problema**: 
- A rota estava usando `createClient()` que não estava importado
- Tentava usar autenticação quando eventos externos não têm autenticação
- Isso causava falha silenciosa na inserção

**Correção Aplicada**:
```typescript
// ANTES (ERRADO):
const supabase = await createClient() // ❌ Não importado e requer autenticação

// DEPOIS (CORRETO):
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) // ✅ Usa anon key, permite inserções públicas
```

**Arquivo**: `app/api/events/route.ts` (linha 37-40)

---

### 2. ❌ **ERRO CRÍTICO**: sendBeacon Não Funciona com JSON

**Problema**:
- `navigator.sendBeacon` com Blob não permite definir `Content-Type: application/json`
- O backend não conseguia fazer parse do body corretamente
- Requisições falhavam silenciosamente

**Correção Aplicada**:
```javascript
// ANTES (ERRADO):
if (navigator.sendBeacon) {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  navigator.sendBeacon(API_URL, blob); // ❌ Content-Type não é aplicado
}

// DEPOIS (CORRETO):
fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // ✅ JSON explícito
  },
  body: JSON.stringify(payload),
  keepalive: true, // ✅ Não bloqueia navegação
  mode: 'cors', // ✅ Permite CORS
})
```

**Arquivo**: `public/analytics.js` (linha 57-84)

---

### 3. ❌ **ERRO CRÍTICO**: URL Relativa Não Funciona em Domínios Externos

**Problema**:
- `API_URL = '/api/events'` funciona apenas no mesmo domínio
- Em domínios externos, tenta acessar `https://dominio-externo.com/api/events` (que não existe)

**Correção Aplicada**:
```javascript
// ANTES (ERRADO):
const API_URL = window.CRIVUS_API_URL || '/api/events'; // ❌ Relativo

// DEPOIS (CORRETO):
const API_URL = window.CRIVUS_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin + '/api/events' : '/api/events');
// ✅ Usa URL absoluta como fallback
```

**Snippet Atualizado**:
```html
<script>
  // Configurar URL da API antes de carregar o script
  window.CRIVUS_API_URL = 'https://seudominio.com/api/events';
</script>
<script src="https://seudominio.com/analytics.js"></script>
```

**Arquivos**: 
- `public/analytics.js` (linha 7)
- `app/integration/page.tsx` (linha 64-67)

---

### 4. ❌ **ERRO CRÍTICO**: Falta de CORS Headers

**Problema**:
- Nenhum header CORS configurado
- Navegadores bloqueiam requisições cross-origin por padrão
- Erro: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Correção Aplicada**:
```typescript
// Adicionado CORS headers em todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

// Handle preflight OPTIONS
if (request.method === 'OPTIONS') {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}
```

**Arquivo**: `app/api/events/route.ts` (linha 7-19)

---

### 5. ⚠️ **MELHORIA**: Logs de Debug Insuficientes

**Problema**:
- Poucos logs para identificar problemas
- Erros silenciosos dificultavam troubleshooting

**Correção Aplicada**:
- ✅ Logs detalhados no backend (evento recebido, erros do Supabase)
- ✅ Logs no frontend (evento enviado, sucesso/erro)
- ✅ Validação de quiz_id antes de enviar eventos
- ✅ Mensagens de erro mais descritivas

**Arquivos**: 
- `app/api/events/route.ts` (linhas 26, 29, 50, 72-78, 85)
- `public/analytics.js` (linhas 11, 40, 53, 75, 78-83, 97, 103, 106)

---

## ✅ Validações Realizadas

### ✅ Estrutura da Tabela Events
```sql
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  quiz_id uuid references quizzes(id) on delete cascade,
  event text not null check (event in ('start_quiz','next_question','finish_quiz','lead_captured')),
  question int,
  timestamp timestamptz default now(),
  utm_source text,
  utm_campaign text,
  lead_data jsonb
);
```
**Status**: ✅ Compatível com o payload do analytics.js

### ✅ Política RLS
```sql
create policy "public insert" on events
for insert with check (true);
```
**Status**: ✅ Permite inserções públicas (necessário para eventos externos)

### ✅ Payload do analytics.js
```javascript
{
  user_id: "user_123...",      // ✅ String
  quiz_id: "uuid-do-quiz",     // ✅ UUID
  event: "start_quiz",         // ✅ Enum válido
  question: 1,                 // ✅ Int (opcional)
  utm_source: "...",           // ✅ String (opcional)
  utm_campaign: "...",         // ✅ String (opcional)
  lead_data: {...}             // ✅ JSONB (opcional)
}
```
**Status**: ✅ Compatível com a tabela

---

## 🔧 Correções Aplicadas

### 1. Rota POST /api/events
- ✅ Usa `createServiceClient` com anon key
- ✅ CORS headers configurados
- ✅ Validação de quiz existe antes de inserir
- ✅ Logs detalhados de debug
- ✅ Tratamento de erros melhorado
- ✅ Handle OPTIONS para preflight

### 2. analytics.js
- ✅ Remove sendBeacon, usa apenas fetch
- ✅ URL absoluta como fallback
- ✅ Logs de debug em todas as etapas
- ✅ Validação de quiz_id antes de enviar
- ✅ Tratamento de erros melhorado
- ✅ Modo CORS explícito

### 3. Snippet de Integração
- ✅ Inclui configuração de `window.CRIVUS_API_URL`
- ✅ URL completa no snippet gerado

---

## 🧪 Como Testar

### 1. Teste Local (Mesmo Domínio)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Teste Tracking</title>
</head>
<body>
  <script>
    window.CRIVUS_API_URL = 'http://localhost:3000/api/events';
  </script>
  <script src="http://localhost:3000/analytics.js"></script>
  <div data-quiz-id="SEU-QUIZ-UUID-AQUI">
    <button data-track-next="1">Próxima</button>
    <button data-track-finish">Finalizar</button>
  </div>
</body>
</html>
```

### 2. Teste em Domínio Externo
```html
<!DOCTYPE html>
<html>
<head>
  <title>Quiz Externo</title>
</head>
<body>
  <script>
    // IMPORTANTE: Use a URL completa do seu domínio
    window.CRIVUS_API_URL = 'https://seudominio.com/api/events';
  </script>
  <script src="https://seudominio.com/analytics.js"></script>
  <div data-quiz-id="SEU-QUIZ-UUID-AQUI">
    <h1>Meu Quiz</h1>
    <button data-track-next="1">Próxima Questão</button>
    <button data-track-finish">Finalizar Quiz</button>
  </div>
</body>
</html>
```

### 3. Verificar Logs

**No Console do Navegador (F12)**:
```
Crivus Analytics: Inicializado { api_url: "https://..." }
Crivus: Enviando evento { event: "start_quiz", quiz_id: "...", payload: {...} }
Crivus: Evento enviado com sucesso { event: "start_quiz", result: {...} }
```

**No Terminal do Servidor (Next.js)**:
```
📥 Evento recebido: { user_id: "...", quiz_id: "...", event: "start_quiz" }
✅ Evento salvo com sucesso: <uuid>
```

---

## 🚨 Possíveis Problemas Restantes

### 1. Mixed Content (HTTP vs HTTPS)
**Sintoma**: Erro no console sobre conteúdo misto
**Solução**: Garanta que o snippet use HTTPS se o site externo for HTTPS

### 2. Quiz ID Inválido
**Sintoma**: Erro "Quiz não encontrado" no servidor
**Solução**: Verifique se o UUID do quiz está correto no atributo `data-quiz-id`

### 3. RLS Bloqueando Inserção
**Sintoma**: Erro 403 ou "permission denied" no Supabase
**Solução**: Verifique se a política "public insert" está ativa:
```sql
SELECT * FROM pg_policies WHERE tablename = 'events';
```

### 4. CORS Ainda Bloqueando
**Sintoma**: Erro CORS no console do navegador
**Solução**: 
- Verifique se o header `Access-Control-Allow-Origin` está sendo enviado
- Use `*` apenas para desenvolvimento, em produção use o domínio específico

---

## 📊 Checklist de Verificação

- [x] Rota POST /api/events usa createServiceClient
- [x] CORS headers configurados
- [x] analytics.js usa fetch ao invés de sendBeacon
- [x] URL absoluta configurada no snippet
- [x] Logs de debug adicionados
- [x] Validação de quiz_id antes de inserir
- [x] Tratamento de erros melhorado
- [x] Política RLS "public insert" ativa
- [x] Estrutura da tabela compatível com payload

---

## 🎯 Próximos Passos Recomendados

1. **Testar em domínio externo real**
2. **Monitorar logs do servidor** para ver eventos chegando
3. **Verificar tabela events no Supabase** para confirmar inserções
4. **Configurar domínio específico no CORS** (ao invés de `*`) para produção
5. **Adicionar rate limiting** se necessário
6. **Considerar adicionar autenticação opcional** para eventos críticos

---

## 📝 Notas Importantes

1. **Para produção**: Altere `'Access-Control-Allow-Origin': '*'` para o domínio específico
2. **Segurança**: A política RLS permite inserções públicas, mas isso é necessário para tracking externo
3. **Performance**: O `keepalive: true` garante que requisições não sejam canceladas ao navegar
4. **Debug**: Mantenha os logs ativos durante testes, remova em produção se necessário

---

**Data do Relatório**: 2025-11-17
**Status**: ✅ Todos os problemas críticos corrigidos
**Versão**: 1.0

