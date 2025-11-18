# 🔧 Guia Completo: Corrigir RLS na Tabela Events

## Problema
Erro: `new row violates row-level security policy for table "events"`

## Solução Passo a Passo

### PASSO 1: Diagnóstico
Execute primeiro o script de diagnóstico para entender o problema:

```sql
-- Execute: supabase/diagnose-events-rls.sql
```

Isso mostrará:
- Se RLS está habilitado
- Todas as políticas existentes
- Se há políticas conflitantes
- Status da política "public insert"

### PASSO 2: Fix Completo
Execute o script de fix completo:

```sql
-- Execute: supabase/fix-events-rls-complete.sql
```

Este script:
1. Desabilita RLS temporariamente
2. Remove TODAS as políticas de INSERT
3. Reabilita RLS
4. Cria a política "public insert" corretamente
5. Verifica se foi criada

### PASSO 3: Verificar
Após executar o fix, verifique:

```sql
SELECT policyname, cmd, permissive, roles, with_check
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'INSERT';
```

Você deve ver:
- `policyname`: "public insert"
- `cmd`: "INSERT"
- `permissive`: "PERMISSIVE"
- `roles`: "{public}"
- `with_check`: "true"

### PASSO 4: Testar
Tente enviar um evento novamente. Se ainda não funcionar, veja a alternativa abaixo.

## Alternativa Temporária (NÃO RECOMENDADO PARA PRODUÇÃO)

Se a política RLS não funcionar, você pode temporariamente usar a Service Role Key na API. 
⚠️ **ATENÇÃO**: Isso bypassa RLS completamente e deve ser usado apenas para debug.

### Como fazer:
1. Adicione a Service Role Key no `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

2. Modifique temporariamente `app/api/events/route.ts` para usar service role:

```typescript
// TEMPORÁRIO: Usar service role key para bypass RLS
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = serviceRoleKey 
  ? createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey  // ⚠️ Service role bypassa RLS
    )
  : createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
```

⚠️ **IMPORTANTE**: Remova isso depois de corrigir a política RLS!

## Por que isso acontece?

1. **Múltiplas políticas conflitantes**: Se houver mais de uma política de INSERT, elas podem conflitar
2. **Política mal configurada**: A política pode não estar explicitamente marcada como PERMISSIVE
3. **Cache de políticas**: O Supabase pode estar usando cache de políticas antigas
4. **Role não especificado**: A política pode não estar explicitamente para o role 'public'

## Solução Definitiva

O script `fix-events-rls-complete.sql` resolve todos esses problemas ao:
- Remover todas as políticas antigas
- Criar uma política limpa e explícita
- Especificar PERMISSIVE e role 'public'

