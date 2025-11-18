# Crivus Quiz Analytics ST

Sistema completo de Analytics de Quizzes com Supabase + Next.js 15 + TypeScript

## 🚀 Início Rápido

Para instruções detalhadas de instalação, consulte o arquivo [INSTALL.md](./INSTALL.md)

### Passos Básicos:

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
Crie `.env.local` com suas chaves do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=sua_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
```

3. **Executar SQL no Supabase:**
Execute o conteúdo de `supabase/schema.sql` no SQL Editor do Supabase.

4. **Criar primeiro usuário admin:**
Siga as instruções em [INSTALL.md](./INSTALL.md#4-criar-o-primeiro-usuário-admin)

5. **Iniciar o projeto:**
```bash
npm run dev
```

## 📁 Estrutura do Projeto

- `/app` - Páginas e rotas (App Router)
- `/components` - Componentes reutilizáveis (shadcn/ui)
- `/lib` - Utilitários, tipos e configurações
- `/public` - Arquivos estáticos (incluindo `analytics.js`)
- `/supabase` - Scripts SQL para configuração

## 🔐 Papéis de Usuário

- **Admin**: Gerencia usuários e tem acesso a todos os dados do sistema
- **User**: Cria quizzes e visualiza suas próprias métricas

## 📊 Funcionalidades

- ✅ Dashboard completo de métricas com gráficos interativos
- ✅ Snippet universal de tracking (funciona em qualquer site)
- ✅ Exportação de dados (CSV, TXT, PDF)
- ✅ Autenticação segura via Supabase
- ✅ Interface responsiva e moderna
- ✅ Row Level Security (RLS) configurado
- ✅ Tracking de UTM parameters
- ✅ Captura de leads integrada

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React, TypeScript, TailwindCSS
- **UI:** shadcn/ui, Radix UI, Lucide Icons
- **Gráficos:** Recharts
- **Estado:** Zustand
- **Validação:** React Hook Form + Zod
- **Backend:** Next.js API Routes
- **Banco:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa o linter

## 🔗 Links Úteis

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

