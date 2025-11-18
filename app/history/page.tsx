'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { formatDate } from '@/lib/utils'

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
          <p className="mt-4 text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Eventos</h1>
        <p className="text-gray-600 mt-1">Visualize todos os eventos registrados</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data/Hora</th>
                  <th className="text-left p-2">Evento</th>
                  <th className="text-left p-2">Questão</th>
                  <th className="text-left p-2">UTM Source</th>
                  <th className="text-left p-2">UTM Campaign</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b">
                    <td className="p-2">{formatDate(event.timestamp)}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {event.event}
                      </span>
                    </td>
                    <td className="p-2">{event.question || '-'}</td>
                    <td className="p-2">{event.utm_source || '-'}</td>
                    <td className="p-2">{event.utm_campaign || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                Nenhum evento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

