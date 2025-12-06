import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id
    const body = await request.json()
    const { tracking_enabled } = body

    if (typeof tracking_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'tracking_enabled deve ser um boolean' },
        { status: 400 }
      )
    }

    // Tentar obter o token do header Authorization primeiro
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 API Tracking - Quiz ID:', quizId, 'Tracking enabled:', tracking_enabled, 'Auth header:', authHeader ? 'Present' : 'Missing')
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
      
      const { data: { user: userData }, error: tokenError } = await (supabase.auth as any).getUser(token)
      
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
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string) {
              // Não podemos setar cookies em API routes
            },
            remove(name: string) {
              // Não podemos remover cookies em API routes
            },
          },
        }
      )
      
      const { data: { user: userData }, error: authError } = await (supabase.auth as any).getUser()
      
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

    // Verificar se o quiz pertence ao usuário
    // Usar o cliente autenticado para fazer a query
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, user_id, tracking_enabled')
      .eq('id', quizId)
      .single()

    if (quizError) {
      console.error('Erro ao buscar quiz:', quizError)
      return NextResponse.json(
        { error: 'Erro ao buscar quiz: ' + quizError.message },
        { status: 500 }
      )
    }

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz não encontrado' },
        { status: 404 }
      )
    }

    if (quiz.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Atualizar o status de tracking usando o cliente autenticado
    const { data, error } = await supabase
      .from('quizzes')
      .update({ tracking_enabled })
      .eq('id', quizId)
      .eq('user_id', user.id) // Garantir que só atualiza se for o dono
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tracking:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status de tracking' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        data,
        message: tracking_enabled 
          ? 'Tracking ativado com sucesso' 
          : 'Tracking desativado com sucesso'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro na API de atualização de tracking:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

