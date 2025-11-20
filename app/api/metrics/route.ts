import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Metrics } from '@/lib/types'

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
        console.error('Erro ao validar token do header, tentando cookies:', tokenError.message)
        // Se o token do header falhar, tentar usar cookies como fallback
        // Não retornar erro ainda, deixar o código continuar para tentar cookies
      } else if (userData) {
        user = userData
      }
    }
    
    // Se não conseguiu autenticar com o token do header, tentar cookies
    if (!user) {
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
              // Não podemos setar cookies em API routes, mas isso é ok
              // O middleware já atualiza os cookies
            },
            remove(name: string) {
              // Não podemos remover cookies em API routes, mas isso é ok
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

    // Construir query base
    let eventsQuery = supabase
      .from('events')
      .select('*, quizzes!inner(user_id)')

    if (!isAdmin) {
      eventsQuery = eventsQuery.eq('quizzes.user_id', user.id)
    }

    if (quiz_id) {
      eventsQuery = eventsQuery.eq('quiz_id', quiz_id)
    }

    if (start_date) {
      eventsQuery = eventsQuery.gte('timestamp', start_date)
    }

    if (end_date) {
      // Ajuste para incluir o dia inteiro quando apenas a data é fornecida (YYYY-MM-DD)
      let finalEndDate = end_date
      // Verifica se é formato de data simples YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        finalEndDate = `${end_date} 23:59:59.999`
      }
      eventsQuery = eventsQuery.lte('timestamp', finalEndDate)
    }

    if (utm_source) {
      eventsQuery = eventsQuery.eq('utm_source', utm_source)
    }

    if (utm_campaign) {
      eventsQuery = eventsQuery.eq('utm_campaign', utm_campaign)
    }

    const { data: events, error: eventsError } = await eventsQuery

    if (eventsError) {
      console.error('Erro ao buscar eventos:', eventsError)
      return NextResponse.json(
        { error: 'Erro ao buscar métricas' },
        { status: 500 }
      )
    }

    // ============================================
    // CÁLCULO DE MÉTRICAS CONFORME ESPECIFICAÇÃO
    // ============================================

    // Métricas básicas
    const total_iniciados = events?.filter(e => e.event === 'start_quiz').length || 0
    const total_concluidos = events?.filter(e => e.event === 'finish_quiz').length || 0
    const leads_capturados = events?.filter(e => e.event === 'lead_captured').length || 0

    // Taxas
    const taxa_conclusao = total_iniciados > 0
      ? (total_concluidos / total_iniciados) * 100
      : 0

    const taxa_abandono_geral = total_iniciados > 0
      ? ((total_iniciados - total_concluidos) / total_iniciados) * 100
      : 0

    const taxa_conversao_lead = total_concluidos > 0
      ? (leads_capturados / total_concluidos) * 100
      : 0

    // ============================================
    // ABANDONO POR PÁGINA (dentro de um quiz)
    // ============================================
    const abandono_por_pagina: Array<{
      page_id: string
      page_url: string
      total_abandonos: number
    }> = []

    if (events && events.length > 0) {
      // Filtrar eventos do quiz atual (se filtrado)
      const eventosFiltrados = quiz_id 
        ? events.filter(e => e.quiz_id === quiz_id)
        : events

      // Encontrar último evento de cada usuário por quiz
      // Usar chave composta user_id + quiz_id para rastrear por quiz
      const ultimoEventoPorUsuario: Record<string, {
        user_id: string
        quiz_id: string
        page_id: string | null
        page_url: string | null
        event: string
        timestamp: string
      }> = {}

      eventosFiltrados.forEach(event => {
        // Chave única por usuário e quiz
        const key = `${event.user_id}_${event.quiz_id}`
        const eventoExistente = ultimoEventoPorUsuario[key]
        
        if (!eventoExistente || new Date(event.timestamp) > new Date(eventoExistente.timestamp)) {
          ultimoEventoPorUsuario[key] = {
            user_id: event.user_id,
            quiz_id: event.quiz_id,
            page_id: event.page_id || null,
            page_url: event.page_url || null,
            event: event.event,
            timestamp: event.timestamp
          }
        }
      })

      // Contar abandonos por página (último evento não é finish_quiz)
      const abandonosPorPagina: Record<string, {
        page_id: string
        page_url: string
        total_abandonos: number
      }> = {}

      Object.values(ultimoEventoPorUsuario).forEach(ultimoEvento => {
        // Contar abandonos mesmo sem page_id (usar 'sem_pagina' como fallback)
        if (ultimoEvento.event !== 'finish_quiz') {
          const pageId = ultimoEvento.page_id || 'sem_pagina'
          const key = pageId
          if (!abandonosPorPagina[key]) {
            abandonosPorPagina[key] = {
              page_id: pageId,
              page_url: ultimoEvento.page_url || 'N/A',
              total_abandonos: 0
            }
          }
          abandonosPorPagina[key].total_abandonos++
        }
      })

      // Converter para array e ordenar
      abandono_por_pagina.push(...Object.values(abandonosPorPagina))
      abandono_por_pagina.sort((a, b) => b.total_abandonos - a.total_abandonos)
    }

    // ============================================
    // ABANDONO POR QUIZ (comparação entre quizzes)
    // ============================================
    const abandono_por_quiz: Array<{
      quiz_id: string
      quiz_titulo: string
      total_abandonos: number
    }> = []

    if (events && events.length > 0) {
      // Buscar títulos dos quizzes
      const quizIds = new Set(events.map(e => e.quiz_id).filter(Boolean))
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, titulo')
        .in('id', Array.from(quizIds))

      const quizTitulos: Record<string, string> = {}
      quizzesData?.forEach(q => {
        quizTitulos[q.id] = q.titulo
      })

      // Encontrar último evento de cada usuário por quiz (todos os quizzes)
      const ultimoEventoPorUsuarioQuiz: Record<string, {
        user_id: string
        quiz_id: string
        event: string
        timestamp: string
      }> = {}

      events.forEach(event => {
        const key = `${event.user_id}_${event.quiz_id}`
        const eventoExistente = ultimoEventoPorUsuarioQuiz[key]
        
        if (!eventoExistente || new Date(event.timestamp) > new Date(eventoExistente.timestamp)) {
          ultimoEventoPorUsuarioQuiz[key] = {
            user_id: event.user_id,
            quiz_id: event.quiz_id,
            event: event.event,
            timestamp: event.timestamp
          }
        }
      })

      // Contar abandonos por quiz
      const abandonosPorQuiz: Record<string, number> = {}

      Object.values(ultimoEventoPorUsuarioQuiz).forEach(ultimoEvento => {
        if (ultimoEvento.event !== 'finish_quiz') {
          abandonosPorQuiz[ultimoEvento.quiz_id] = (abandonosPorQuiz[ultimoEvento.quiz_id] || 0) + 1
        }
      })

      // Converter para array com títulos
      Object.entries(abandonosPorQuiz).forEach(([quizId, total]) => {
        abandono_por_quiz.push({
          quiz_id: quizId,
          quiz_titulo: quizTitulos[quizId] || 'Quiz sem título',
          total_abandonos: total
        })
      })

      // Ordenar por total de abandonos
      abandono_por_quiz.sort((a, b) => b.total_abandonos - a.total_abandonos)
      
      console.log('📊 Abandono por quiz calculado:', {
        total_quizzes: abandono_por_quiz.length,
        quizzes: abandono_por_quiz.slice(0, 3) // Primeiros 3 para debug
      })
    } else {
      console.log('⚠️ Não foi possível calcular abandono por quiz:', {
        events_length: events?.length || 0
      })
    }

    // ============================================
    // ETAPA MAIS ABANDONADA
    // ============================================
    let etapa_mais_abandonada: {
      page_id: string
      page_url: string
      total_abandonos: number
      percentual_sobre_iniciados: number
    } | null = null

    console.log('🔍 Calculando etapa mais abandonada:', {
      abandono_por_pagina_length: abandono_por_pagina.length,
      total_iniciados,
      abandono_por_pagina: abandono_por_pagina.slice(0, 3) // Primeiros 3 para debug
    })

    if (abandono_por_pagina.length > 0 && total_iniciados > 0) {
      // Filtrar 'sem_pagina' se houver outras páginas com page_id
      const etapasComPageId = abandono_por_pagina.filter(e => e.page_id !== 'sem_pagina')
      const etapaParaUsar = etapasComPageId.length > 0 ? etapasComPageId[0] : abandono_por_pagina[0]
      
      etapa_mais_abandonada = {
        page_id: etapaParaUsar.page_id === 'sem_pagina' ? 'Página não identificada' : etapaParaUsar.page_id,
        page_url: etapaParaUsar.page_url,
        total_abandonos: etapaParaUsar.total_abandonos,
        percentual_sobre_iniciados: (etapaParaUsar.total_abandonos / total_iniciados) * 100
      }
      
      console.log('✅ Etapa mais abandonada calculada:', etapa_mais_abandonada)
    } else {
      console.log('⚠️ Não foi possível calcular etapa mais abandonada:', {
        abandono_por_pagina_length: abandono_por_pagina.length,
        total_iniciados
      })
    }

    // ============================================
    // TOP 3 ETAPAS MAIS ABANDONADAS
    // ============================================
    // Filtrar 'sem_pagina' se houver outras páginas com page_id, senão incluir
    const etapasComPageId = abandono_por_pagina.filter(e => e.page_id !== 'sem_pagina')
    const top_3_abandono_etapas = etapasComPageId.length > 0 
      ? etapasComPageId.slice(0, 3)
      : abandono_por_pagina.slice(0, 3)
    
    console.log('📊 Top 3 etapas mais abandonadas:', {
      total_etapas: abandono_por_pagina.length,
      etapas_com_page_id: etapasComPageId.length,
      top_3: top_3_abandono_etapas
    })

    // ============================================
    // MÉTRICAS LEGADAS (para compatibilidade)
    // ============================================
    const total_events = events?.length || 0
    const uniqueQuizIds = new Set(events?.map(e => e.quiz_id).filter(Boolean) || [])
    const total_quizzes = uniqueQuizIds.size
    const total_starts = total_iniciados
    const total_finishes = total_concluidos
    const total_leads = leads_capturados
    const completion_rate = taxa_conclusao

    // Eventos por dia
    const eventsByDay: Record<string, number> = {}
    events?.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      eventsByDay[date] = (eventsByDay[date] || 0) + 1
    })

    const events_by_day = Object.entries(eventsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Eventos por tipo
    const eventsByType: Record<string, number> = {}
    events?.forEach(event => {
      eventsByType[event.event] = (eventsByType[event.event] || 0) + 1
    })

    const events_by_type = Object.entries(eventsByType)
      .map(([type, count]) => ({ type, count }))

    // ============================================
    // ESTRUTURA FINAL CONFORME ESPECIFICAÇÃO
    // ============================================
    const metrics: Metrics = {
      // Campos obrigatórios conforme especificação
      total_iniciados,
      total_concluidos,
      taxa_conclusao: Math.round(taxa_conclusao * 100) / 100,
      taxa_abandono_geral: Math.round(taxa_abandono_geral * 100) / 100,
      leads_capturados,
      taxa_conversao_lead: Math.round(taxa_conversao_lead * 100) / 100,
      abandono_por_pagina,
      abandono_por_quiz,
      etapa_mais_abandonada: etapa_mais_abandonada ? {
        ...etapa_mais_abandonada,
        percentual_sobre_iniciados: Math.round(etapa_mais_abandonada.percentual_sobre_iniciados * 100) / 100
      } : null,
      top_3_abandono_etapas,
      // Métricas legadas (opcionais para compatibilidade)
      total_events,
      total_quizzes,
      total_starts,
      total_finishes,
      total_leads,
      completion_rate: Math.round(completion_rate * 100) / 100,
      events_by_day,
      events_by_type,
    }

    return NextResponse.json({ data: metrics }, { status: 200 })
  } catch (error) {
    console.error('Erro na API de métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

