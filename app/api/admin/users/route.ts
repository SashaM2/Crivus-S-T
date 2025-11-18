import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Tentar obter o token do header Authorization primeiro
    const authHeader = request.headers.get('Authorization')
    let user = null
    let supabase = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Usar o token do header Authorization
      const token = authHeader.replace('Bearer ', '')
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )
      
      const { data: { user: userData }, error: tokenError } = await supabase.auth.getUser(token)
      
      if (tokenError) {
        console.error('Erro ao validar token:', tokenError)
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        )
      }
      
      user = userData
    } else {
      // Fallback: tentar usar cookies
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              // Não podemos setar cookies em API routes
            },
          },
        }
      )
      
      const { data: { user: userData }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Erro ao obter usuário dos cookies:', authError)
        return NextResponse.json(
          { error: 'Erro de autenticação: ' + authError.message },
          { status: 401 }
        )
      }
      
      user = userData
    }

    if (!user || !supabase) {
      return NextResponse.json(
        { error: 'Não autenticado. Faça login novamente.' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem criar usuários.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar service role key para criar usuário sem confirmação de email
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key não configurada. Configure SUPABASE_SERVICE_ROLE_KEY no .env.local' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar usuário no Auth com email confirmado
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        role: role || 'user',
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError)
      return NextResponse.json(
        { error: authError.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
        { status: 500 }
      )
    }

    // Criar perfil usando o cliente admin (bypass RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        role: role || 'user',
        active: true,
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      
      // Se já existe, atualizar
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          email,
          role: role || 'user',
          active: true,
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError)
        return NextResponse.json(
          { error: 'Erro ao criar/atualizar perfil do usuário: ' + updateError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        user: { 
          id: authData.user.id, 
          email, 
          role: role || 'user' 
        } 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro na API de criação de usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Criar cliente Supabase usando cookies do request diretamente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Não podemos setar cookies em API routes, mas isso é ok
            // O middleware já atualiza os cookies
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Deletar perfil (cascade deleta o usuário do auth)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Erro na API de deleção de usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

