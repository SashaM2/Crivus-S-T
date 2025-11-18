import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Event } from '@/lib/types'

// Função helper para CORS headers
function getCorsHeaders(origin: string | null) {
  // Para sites externos, aceitar qualquer origem
  // Como não usamos credentials, '*' é seguro
  const allowOrigin = origin || '*'
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, { 
    status: 200, 
    headers: getCorsHeaders(origin) 
  })
}

export async function POST(request: NextRequest) {
  // Configurar CORS headers para permitir requisições de domínios externos
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    let body;
    try {
      body = await request.json()
    } catch (jsonError: any) {
      console.error('❌ Erro ao parsear JSON:', jsonError)
      return NextResponse.json(
        { error: 'JSON inválido: ' + (jsonError.message || 'Erro ao processar requisição') },
        { status: 400, headers: corsHeaders }
      )
    }

    const { user_id, quiz_id, event, question, utm_source, utm_campaign, lead_data, page_id, page_url } = body

    // Normalizar page_id e page_url (aceitar null, undefined, ou string vazia)
    const normalizedPageId = page_id && page_id.trim() ? page_id.trim() : null
    const normalizedPageUrl = page_url && page_url.trim() ? page_url.trim() : null

    // Log para debug
    console.log('📥 Evento recebido:', { user_id, quiz_id, event, question, utm_source, utm_campaign, page_id: normalizedPageId, page_url: normalizedPageUrl })

    if (!user_id || !quiz_id || !event) {
      console.error('❌ Campos obrigatórios faltando:', { user_id: !!user_id, quiz_id: !!quiz_id, event: !!event })
      return NextResponse.json(
        { error: 'user_id, quiz_id e event são obrigatórios' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Variáveis de ambiente faltando:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500, headers: corsHeaders }
      )
    }

    // SOLUÇÃO: Usar Service Role Key para inserções de eventos
    // Isso bypassa RLS e é seguro porque eventos são dados públicos de tracking
    // A Service Role Key só é usada no servidor (nunca exposta ao cliente)
    const keyToUse = serviceRoleKey || supabaseAnonKey
    
    console.log('🔗 Conectando ao Supabase:', {
      url: supabaseUrl.substring(0, 30) + '...',
      usingServiceRole: !!serviceRoleKey,
      keyType: serviceRoleKey ? 'Service Role' : 'Anon Key'
    })

    // Usar service role key se disponível (bypassa RLS), senão usar anon key
    const supabase = createServiceClient(supabaseUrl, keyToUse)

    // Verificar se o quiz existe
    console.log('🔍 Verificando se quiz existe:', quiz_id)
    const { data: quizExists, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quiz_id)
      .single()

    if (quizError) {
      console.error('❌ Erro ao buscar quiz:', {
        error: quizError.message,
        code: quizError.code,
        details: quizError.details,
        hint: quizError.hint
      })
    }

    if (quizError || !quizExists) {
      console.error('❌ Quiz não encontrado:', quiz_id, quizError)
      return NextResponse.json(
        { error: 'Quiz não encontrado' },
        { status: 404, headers: corsHeaders }
      )
    }

    console.log('✅ Quiz encontrado, tentando inserir evento...')
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: String(user_id),
        quiz_id,
        event,
        question: question || null,
        utm_source: utm_source || null,
        utm_campaign: utm_campaign || null,
        lead_data: lead_data || null,
        page_id: normalizedPageId,
        page_url: normalizedPageUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao inserir evento no Supabase:', error)
      console.error('❌ Detalhes completos do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        // Informações adicionais para debug
        isRLSError: error.message?.includes('row-level security'),
        isPolicyError: error.message?.includes('policy')
      })
      
      // Log adicional para diagnóstico de RLS
      if (error.message?.includes('row-level security')) {
        console.error('🔒 PROBLEMA DE RLS DETECTADO!')
        console.error('   A política RLS está bloqueando a inserção.')
        console.error('   Verifique se a política "public insert" existe e está configurada corretamente.')
      }
      return NextResponse.json(
        { error: 'Erro ao salvar evento: ' + error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ Evento salvo com sucesso:', data.id)
    return NextResponse.json(
      { success: true, data },
      { status: 201, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('❌ Erro na API de eventos:', error)
    console.error('❌ Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error.message || 'Erro desconhecido') },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function GET(request: NextRequest) {
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
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options?: any) {
              // Não podemos setar cookies em API routes
            },
            remove(name: string, options?: any) {
              // Não podemos remover cookies em API routes
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

    const isAdmin = profile?.role === 'admin'

    const { searchParams } = new URL(request.url)
    const quiz_id = searchParams.get('quiz_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const utm_source = searchParams.get('utm_source')
    const utm_campaign = searchParams.get('utm_campaign')

    let query = supabase
      .from('events')
      .select('*, quizzes(user_id, titulo)')
      .order('timestamp', { ascending: false })

    // Se não for admin, filtrar apenas eventos dos próprios quizzes
    if (!isAdmin) {
      query = query.eq('quizzes.user_id', user.id)
    }

    if (quiz_id) {
      query = query.eq('quiz_id', quiz_id)
    }

    if (start_date) {
      query = query.gte('timestamp', start_date)
    }

    if (end_date) {
      query = query.lte('timestamp', end_date)
    }

    if (utm_source) {
      query = query.eq('utm_source', utm_source)
    }

    if (utm_campaign) {
      query = query.eq('utm_campaign', utm_campaign)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Erro na API de eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

