/**
 * Script para criar o primeiro usuário admin
 * 
 * Execute: node scripts/create-admin.js
 * 
 * Certifique-se de ter a SERVICE_ROLE_KEY no .env.local
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
  console.log('   5. Adicione no .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key')
  process.exit(1)
}

// Criar cliente com service role (bypass RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  const email = 'admin@crivus.com'
  const password = 'Admin123!'

  console.log('🚀 Criando usuário admin...')
  console.log(`   Email: ${email}`)

  try {
    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    })

    if (authError) {
      // Se o usuário já existe, tentar obter o ID
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe no Auth, obtendo ID...')
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const user = existingUser.users.find(u => u.email === email)
        
        if (user) {
          console.log(`✅ Usuário encontrado: ${user.id}`)
          
          // Verificar se o perfil já existe
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (existingProfile) {
            // Atualizar para admin
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin', active: true, email })
              .eq('id', user.id)

            if (updateError) {
              console.error('❌ Erro ao atualizar perfil:', updateError.message)
              process.exit(1)
            }
            console.log('✅ Perfil atualizado para admin!')
            console.log('\n🎉 Pronto! Você pode fazer login com:')
            console.log(`   Email: ${email}`)
            console.log(`   Senha: ${password}`)
            return
          } else {
            // Criar perfil
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email,
                role: 'admin',
                active: true,
              })

            if (profileError) {
              console.error('❌ Erro ao criar perfil:', profileError.message)
              process.exit(1)
            }
            console.log('✅ Perfil admin criado!')
            console.log('\n🎉 Pronto! Você pode fazer login com:')
            console.log(`   Email: ${email}`)
            console.log(`   Senha: ${password}`)
            return
          }
        } else {
          console.error('❌ Usuário não encontrado')
          process.exit(1)
        }
      } else {
        console.error('❌ Erro ao criar usuário:', authError.message)
        process.exit(1)
      }
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado')
      process.exit(1)
    }

    console.log(`✅ Usuário criado no Auth: ${authData.user.id}`)

    // 2. Criar perfil na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        role: 'admin',
        active: true,
      })

    if (profileError) {
      // Se já existe, atualizar
      if (profileError.code === '23505') {
        console.log('⚠️  Perfil já existe, atualizando...')
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', active: true, email })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('❌ Erro ao atualizar perfil:', updateError.message)
          process.exit(1)
        }
        console.log('✅ Perfil atualizado para admin!')
      } else {
        console.error('❌ Erro ao criar perfil:', profileError.message)
        process.exit(1)
      }
    } else {
      console.log('✅ Perfil admin criado!')
    }

    console.log('\n🎉 Usuário admin criado com sucesso!')
    console.log('\n📋 Credenciais:')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log('\n🌐 Acesse: http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message)
    process.exit(1)
  }
}

createAdmin()

