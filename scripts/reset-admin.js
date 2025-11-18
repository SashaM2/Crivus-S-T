/**
 * Script para RESETAR e recriar o usuário admin do zero
 * 
 * Execute: node scripts/reset-admin.js
 * 
 * Este script:
 * 1. Deleta o usuário admin existente (se houver)
 * 2. Recria o usuário do zero
 * 3. Cria o perfil
 * 4. Testa o login
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

console.log('🔍 Verificando variáveis de ambiente...\n')

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local')
  console.log('\n📝 Adicione no .env.local:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local')
  console.log('\n📝 Para obter a Service Role Key:')
  console.log('   1. Acesse https://supabase.com/dashboard')
  console.log('   2. Selecione seu projeto')
  console.log('   3. Vá em Settings > API')
  console.log('   4. Copie a "service_role" key (NÃO a anon key!)')
  console.log('   5. Adicione no .env.local:')
  console.log('      SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  process.exit(1)
}

// Validar formato das chaves
if (!supabaseUrl.startsWith('http')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL parece estar incorreto')
  console.log(`   Valor encontrado: ${supabaseUrl.substring(0, 50)}...`)
  console.log('   Deve começar com https://')
  process.exit(1)
}

if (!serviceRoleKey.startsWith('eyJ')) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY parece estar incorreto')
  console.log(`   Valor encontrado: ${serviceRoleKey.substring(0, 20)}...`)
  console.log('   Deve começar com "eyJ" (JWT token)')
  console.log('\n💡 Certifique-se de copiar a "service_role" key, NÃO a "anon" key!')
  process.exit(1)
}

console.log('✅ Variáveis de ambiente encontradas')
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`)
console.log(`   Service Role Key: ${serviceRoleKey.substring(0, 20)}...`)
console.log('')

// Criar cliente com service role (bypass RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Criar cliente com anon key para testar login
const supabaseAnon = anonKey ? createClient(supabaseUrl, anonKey) : null

async function resetAdmin() {
  const email = 'admin@crivus.com'
  const password = 'Admin123!'

  console.log('🔄 Resetando usuário admin...\n')
  console.log('='.repeat(60))

  try {
    // 0. Testar conexão com a API
    console.log('0️⃣ Testando conexão com Supabase...')
    const { data: testData, error: testError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    if (testError) {
      console.error('   ❌ Erro ao conectar com Supabase:', testError.message)
      if (testError.message.includes('Invalid API key')) {
        console.log('\n💡 A Service Role Key está incorreta!')
        console.log('   Verifique se você copiou a chave correta:')
        console.log('   1. Vá em Settings > API no Supabase')
        console.log('   2. Procure por "service_role" key (não "anon" key)')
        console.log('   3. A chave deve começar com "eyJ"')
        console.log('   4. Copie a chave completa e cole no .env.local')
      }
      process.exit(1)
    }
    console.log('   ✅ Conexão com Supabase estabelecida')

    // 1. Verificar e deletar usuário existente
    console.log('\n1️⃣ Verificando usuário existente...')
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const existingUser = usersData.users.find(u => u.email === email)
    
    if (existingUser) {
      console.log(`   ⚠️  Usuário encontrado: ${existingUser.id}`)
      console.log('   🗑️  Deletando usuário existente...')
      
      // Deletar perfil primeiro (se existir)
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', existingUser.id)
      
      if (deleteProfileError && !deleteProfileError.message.includes('No rows')) {
        console.log(`   ⚠️  Aviso ao deletar perfil: ${deleteProfileError.message}`)
      }
      
      // Deletar usuário do Auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
      
      if (deleteError) {
        console.error('   ❌ Erro ao deletar usuário:', deleteError.message)
        console.log('   ⚠️  Continuando mesmo assim...')
      } else {
        console.log('   ✅ Usuário deletado com sucesso')
      }
      
      // Aguardar um pouco para garantir que foi deletado
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
      console.log('   ✅ Nenhum usuário existente encontrado')
    }

    // 2. Criar novo usuário
    console.log('\n2️⃣ Criando novo usuário admin...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        role: 'admin'
      }
    })

    if (authError) {
      console.error('   ❌ Erro ao criar usuário:', authError.message)
      process.exit(1)
    }

    if (!authData.user) {
      console.error('   ❌ Usuário não foi criado')
      process.exit(1)
    }

    console.log(`   ✅ Usuário criado: ${authData.user.id}`)
    console.log(`   ✅ Email confirmado: ${authData.user.email_confirmed_at ? 'Sim' : 'Não'}`)

    // 3. Criar perfil
    console.log('\n3️⃣ Criando perfil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        role: 'admin',
        active: true,
      })

    if (profileError) {
      console.error('   ❌ Erro ao criar perfil:', profileError.message)
      
      // Se já existe (não deveria), atualizar
      if (profileError.code === '23505') {
        console.log('   ⚠️  Perfil já existe, atualizando...')
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', active: true, email })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('   ❌ Erro ao atualizar perfil:', updateError.message)
          process.exit(1)
        }
        console.log('   ✅ Perfil atualizado')
      } else {
        process.exit(1)
      }
    } else {
      console.log('   ✅ Perfil criado com sucesso')
    }

    // 4. Verificar perfil
    console.log('\n4️⃣ Verificando perfil...')
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileCheckError || !profile) {
      console.error('   ❌ Erro ao verificar perfil:', profileCheckError?.message)
      process.exit(1)
    }

    console.log('   ✅ Perfil verificado:')
    console.log(`      - ID: ${profile.id}`)
    console.log(`      - Email: ${profile.email}`)
    console.log(`      - Role: ${profile.role}`)
    console.log(`      - Active: ${profile.active}`)

    // 5. Testar login (se anon key disponível)
    if (supabaseAnon) {
      console.log('\n5️⃣ Testando login...')
      const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('   ❌ Erro ao testar login:', loginError.message)
        console.log('\n   ⚠️  ATENÇÃO: O usuário foi criado mas o login falhou!')
        console.log('   Possíveis causas:')
        console.log('   - Senha não foi definida corretamente')
        console.log('   - Email não foi confirmado')
        console.log('   - Problema com as credenciais do Supabase')
      } else if (loginData.user) {
        console.log('   ✅ Login testado com sucesso!')
        console.log(`   ✅ User ID: ${loginData.user.id}`)
        
        // Tentar buscar perfil após login
        const { data: profileAfterLogin, error: profileAfterLoginError } = await supabaseAnon
          .from('profiles')
          .select('*')
          .eq('id', loginData.user.id)
          .single()

        if (profileAfterLoginError) {
          console.log('   ⚠️  Aviso: Não foi possível buscar perfil após login')
          console.log(`      Erro: ${profileAfterLoginError.message}`)
          console.log('      Isso pode indicar um problema com as políticas RLS')
        } else {
          console.log('   ✅ Perfil acessível após login')
        }

        // Fazer logout
        await supabaseAnon.auth.signOut()
      }
    } else {
      console.log('\n5️⃣ Pulando teste de login (NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado)')
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n🎉 Usuário admin resetado e criado com sucesso!')
    console.log('\n📋 Credenciais:')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log('\n🌐 Acesse: http://localhost:3000/login')
    console.log('\n💡 Se ainda não funcionar:')
    console.log('   1. Verifique se executou supabase/fix-profiles-policies.sql')
    console.log('   2. Verifique as variáveis de ambiente no .env.local')
    console.log('   3. Execute: node scripts/diagnose-admin.js')

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

resetAdmin()

