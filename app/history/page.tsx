'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import { subDays } from 'date-fns'

export default function HistoryPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { quizzes } = useQuizStore()
  const [filters, setFilters] = useState({
    quiz_id: '',
    start_date: '',
    end_date: '',
    utm_source: '',
    utm_campaign: '',
  })
  const [rangePreset, setRangePreset] = useState<'all' | '7' | '30' | '90'>('all')
  const presetRanges: { label: string; value: '7' | '30' | '90' }[] = [
    { label: '7 dias', value: '7' },
    { label: '30 dias', value: '30' },
    { label: '90 dias', value: '90' },
  ]

  const applyRangePreset = (value: 'all' | '7' | '30' | '90') => {
    if (value === 'all') {
      setRangePreset('all')
      setFilters(prev => ({ ...prev, start_date: '', end_date: '' }))
      return
    }
    const days = Number(value)
    const end = new Date()
    const start = subDays(end, days)
    setRangePreset(value)
    setFilters(prev => ({
      ...prev,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    }))
  }

  useEffect(() => {
    loadEvents()
  }, [filters])

  const loadEvents = async () => {
    setLoading(true)
    try {
      // Obter o token de acesso do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Erro ao obter sessão:', sessionError)
        if (events.length === 0) {
          setEvents([])
        }
        return
      }

      const params = new URLSearchParams()
      if (filters.quiz_id) params.append('quiz_id', filters.quiz_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.utm_source) params.append('utm_source', filters.utm_source)
      if (filters.utm_campaign) params.append('utm_campaign', filters.utm_campaign)

      const response = await fetch(`/api/events?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setEvents(result.data || [])
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      // Manter eventos anteriores em caso de erro
      if (events.length === 0) {
        setEvents([])
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Linha do tempo</p>
        <h1 className="text-3xl font-semibold text-foreground">Histórico de Eventos</h1>
        <p className="mt-2 text-sm text-muted-foreground">Filtre e navegue por todas as interações enviadas pelos seus quizzes</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-[0.3em] text-muted-foreground">Filtros inteligentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {presetRanges.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => applyRangePreset(preset.value)}
                className={cn(
                  "rounded-md border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                  rangePreset === preset.value ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyRangePreset('all')}
              className={cn(
                "rounded-md border border-dashed border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                rangePreset === 'all' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Limpar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Quiz</Label>
              <Select
                value={filters.quiz_id || "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, quiz_id: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os quizzes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os quizzes</SelectItem>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <DatePicker
                value={filters.start_date}
                onChange={(value) => {
                  setRangePreset('all')
                  setFilters(prev => ({ ...prev, start_date: value }))
                }}
                placeholder="Selecione a data inicial"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <DatePicker
                value={filters.end_date}
                onChange={(value) => {
                  setRangePreset('all')
                  setFilters(prev => ({ ...prev, end_date: value }))
                }}
                placeholder="Selecione a data final"
              />
            </div>
            <div className="space-y-2">
              <Label>UTM Source</Label>
              <Input
                value={filters.utm_source}
                onChange={(e) => setFilters(prev => ({ ...prev, utm_source: e.target.value }))}
                placeholder="Filtrar por UTM Source"
              />
            </div>
            <div className="space-y-2">
              <Label>UTM Campaign</Label>
              <Input
                value={filters.utm_campaign}
                onChange={(e) => setFilters(prev => ({ ...prev, utm_campaign: e.target.value }))}
                placeholder="Filtrar por UTM Campaign"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Questão</th>
                  <th className="px-4 py-3">UTM Source</th>
                  <th className="px-4 py-3">UTM Campaign</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-border/70 bg-card text-foreground transition hover:bg-muted/30">
                    <td className="px-4 py-3">{formatDate(event.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {event.event}
                      </span>
                    </td>
                    <td className="px-4 py-3">{event.question || '-'}</td>
                    <td className="px-4 py-3">{event.utm_source || '-'}</td>
                    <td className="px-4 py-3">{event.utm_campaign || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum evento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

