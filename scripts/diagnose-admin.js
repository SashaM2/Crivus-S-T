/**
 * Script de diagnóstico para verificar o usuário admin
 * 
 * Execute: node scripts/diagnose-admin.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Ler .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    return {}
  }
  
  const envFile = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local')
  console.log('\n📝 Para obter a Service Role Key:')
  console.log('   1. Acesse https://supabase.com/dashboard')
  console.log('   2. Selecione seu projeto')
  console.log('   3. Vá em Settings > API')
  console.log('   4. Copie a "service_role" key (NÃO a anon key!)')
  process.exit(1)
}

// Criar cliente com service role (bypass RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Criar cliente com anon key para testar login
const supabaseAnon = anonKey ? createClient(supabaseUrl, anonKey) : null

async function diagnose() {
  const email = 'admin@crivus.com'
  const password = 'Admin123!'

  console.log('🔍 Diagnóstico do Usuário Admin\n')
  console.log('=' .repeat(50))

  // 1. Verificar se usuário existe no Auth
  console.log('\n1️⃣ Verificando usuário no Supabase Auth...')
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('❌ Erro ao listar usuários:', usersError.message)
    return
  }

  const user = usersData.users.find(u => u.email === email)
  
  if (!user) {
    console.log('❌ Usuário NÃO encontrado no Auth')
    console.log('\n💡 Solução: Execute o script de criação do admin:')
    console.log('   node scripts/create-admin.js')
    return
  }

  console.log('✅ Usuário encontrado no Auth')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`)
  console.log(`   Criado em: ${user.created_at}`)

  // 2. Verificar se perfil existe
  console.log('\n2️⃣ Verificando perfil na tabela profiles...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('❌ Erro ao buscar perfil:', profileError.message)
    console.log('\n💡 Solução: Execute o script de criação do admin:')
    console.log('   node scripts/create-admin.js')
    return
  }

  if (!profile) {
    console.log('❌ Perfil NÃO encontrado na tabela profiles')
    console.log('\n💡 Solução: Execute o script de criação do admin:')
    console.log('   node scripts/create-admin.js')
    return
  }

  console.log('✅ Perfil encontrado')
  console.log(`   ID: ${profile.id}`)
  console.log(`   Email: ${profile.email}`)
  console.log(`   Role: ${profile.role}`)
  console.log(`   Active: ${profile.active}`)
  console.log(`   Criado em: ${profile.created_at}`)

  // 3. Verificar políticas RLS
  console.log('\n3️⃣ Testando acesso com anon key (simulando login)...')
  if (!supabaseAnon) {
    console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado, pulando teste de login')
  } else {
    // Tentar fazer login
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.log('❌ Erro ao fazer login:', authError.message)
      console.log('\n💡 Possíveis causas:')
      console.log('   - Senha incorreta')
      console.log('   - Email não confirmado')
      console.log('   - Problema com as credenciais do Supabase')
    } else {
      console.log('✅ Login bem-sucedido!')
      console.log(`   User ID: ${authData.user.id}`)

      // Tentar buscar perfil com o usuário autenticado
      const { data: profileAfterAuth, error: profileErrorAfterAuth } = await supabaseAnon
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileErrorAfterAuth) {
        console.log('❌ Erro ao buscar perfil após login:', profileErrorAfterAuth.message)
        console.log('\n💡 Isso indica um problema com as políticas RLS!')
        console.log('   Execute o script de correção:')
        console.log('   - Abra supabase/fix-profiles-policies.sql')
        console.log('   - Execute no SQL Editor do Supabase')
      } else {
        console.log('✅ Perfil acessível após login')
        console.log(`   Role: ${profileAfterAuth.role}`)
        console.log(`   Active: ${profileAfterAuth.active}`)
      }

      // Fazer logout
      await supabaseAnon.auth.signOut()
    }
  }

  // 4. Verificar políticas
  console.log('\n4️⃣ Verificando políticas RLS...')
  const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE tablename = 'profiles'
    `
  }).catch(() => ({ data: null, error: { message: 'Não foi possível verificar políticas automaticamente' } }))

  if (policiesError) {
    console.log('⚠️  Não foi possível verificar políticas automaticamente')
    console.log('   Verifique manualmente no Supabase Dashboard > Database > Policies')
  } else if (policies && policies.length > 0) {
    console.log(`✅ ${policies.length} política(s) encontrada(s)`)
    policies.forEach(p => {
      console.log(`   - ${p.policyname}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n📋 Resumo:')
  console.log(`   ✅ Usuário Auth: ${user ? 'Existe' : 'Não existe'}`)
  console.log(`   ✅ Perfil: ${profile ? 'Existe' : 'Não existe'}`)
  console.log(`   ✅ Role: ${profile?.role || 'N/A'}`)
  console.log(`   ✅ Active: ${profile?.active ? 'Sim' : 'Não'}`)
  
  if (!profile || profile.role !== 'admin') {
    console.log('\n⚠️  ATENÇÃO: O perfil não está configurado como admin!')
    console.log('   Execute: node scripts/create-admin.js')
  }

  if (profile && !profile.active) {
    console.log('\n⚠️  ATENÇÃO: O perfil está desativado!')
    console.log('   Ative o perfil no Supabase ou execute o script de criação novamente')
  }
}

diagnose().catch(error => {
  console.error('❌ Erro inesperado:', error.message)
  process.exit(1)
})

