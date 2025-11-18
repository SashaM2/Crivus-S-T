export type UserRole = 'admin' | 'user'

export interface Profile {
  id: string
  email: string
  role: UserRole
  active: boolean
  created_at: string
}

export interface Quiz {
  id: string
  user_id: string
  titulo: string
  criado_em: string
}

export type EventType = 'start_quiz' | 'next_question' | 'finish_quiz' | 'lead_captured'

export interface Event {
  id: string
  user_id: string
  quiz_id: string | null
  event: EventType
  question: number | null
  timestamp: string
  utm_source: string | null
  utm_campaign: string | null
  lead_data: Record<string, any> | null
  page_id: string | null
  page_url: string | null
}

export interface AbandonoPorPagina {
  page_id: string
  page_url: string
  total_abandonos: number
}

export interface AbandonoPorQuiz {
  quiz_id: string
  quiz_titulo: string
  total_abandonos: number
}

export interface EtapaMaisAbandonada {
  page_id: string
  page_url: string
  total_abandonos: number
  percentual_sobre_iniciados: number
}

export interface Metrics {
  total_iniciados: number
  total_concluidos: number
  taxa_conclusao: number
  taxa_abandono_geral: number
  leads_capturados: number
  taxa_conversao_lead: number
  abandono_por_pagina: Array<AbandonoPorPagina>
  abandono_por_quiz: Array<AbandonoPorQuiz>
  etapa_mais_abandonada: EtapaMaisAbandonada | null
  top_3_abandono_etapas: Array<AbandonoPorPagina>
  // Métricas legadas (mantidas para compatibilidade)
  total_events?: number
  total_quizzes?: number
  total_starts?: number
  total_finishes?: number
  total_leads?: number
  completion_rate?: number
  average_questions?: number
  events_by_day?: Array<{ date: string; count: number }>
  events_by_type?: Array<{ type: string; count: number }>
  abandono_por_pergunta?: Array<{
    pergunta: number
    total_chegaram: number
    total_abandonaram: number
    total_continuaram: number
    taxa_abandono: number
    percentual_do_total: number
  }>
}

export interface EventFilters {
  quiz_id?: string
  start_date?: string
  end_date?: string
  utm_source?: string
  utm_campaign?: string
}

