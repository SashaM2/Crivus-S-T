import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  console.error('❌ Variáveis de ambiente do Supabase faltando:', missing.join(', '))
  console.error('📝 Configure essas variáveis no arquivo .env.local')
  
  // Em desenvolvimento, criar um cliente vazio para evitar crash
  // Mas vai dar erro ao tentar usar
  if (typeof window !== 'undefined') {
    console.error('⚠️ Supabase não configurado. Verifique o arquivo .env.local')
  }
  
  throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`)
}

// Validar formato básico das chaves
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL parece estar incorreto. Deve começar com http:// ou https://')
}

if (supabaseAnonKey && supabaseAnonKey.length < 100) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY parece estar muito curta. Verifique se está correta.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

