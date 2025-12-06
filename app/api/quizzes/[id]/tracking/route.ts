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

    // Criar cliente Supabase usando cookies
    const supabase = createServerClient(
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

    const { data: { user } } = await (supabase.auth as any).getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o quiz pertence ao usuário
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, user_id')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
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

    // Atualizar o status de tracking
    const { data, error } = await supabase
      .from('quizzes')
      .update({ tracking_enabled })
      .eq('id', quizId)
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

