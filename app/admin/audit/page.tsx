'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Download } from 'lucide-react'
import type { Event } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function AdminAuditPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    quiz_id: '',
    start_date: '',
    end_date: '',
    utm_source: '',
    utm_campaign: '',
  })
  const { toast } = useToast()

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
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Faça login novamente.',
          variant: 'destructive',
        })
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
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar eventos'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: string) => {
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters.quiz_id) params.append('quiz_id', filters.quiz_id)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.utm_source) params.append('utm_source', filters.utm_source)
    if (filters.utm_campaign) params.append('utm_campaign', filters.utm_campaign)

    window.open(`/api/export?${params.toString()}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoria</h1>
          <p className="text-gray-600 mt-1">Visualize todos os eventos do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('txt')}>
            <Download className="h-4 w-4 mr-2" />
            TXT
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quiz ID</Label>
              <Input
                value={filters.quiz_id}
                onChange={(e) => setFilters(prev => ({ ...prev, quiz_id: e.target.value }))}
                placeholder="Filtrar por Quiz ID"
              />
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
                  <th className="text-left p-2">User ID</th>
                  <th className="text-left p-2">Quiz ID</th>
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
                    <td className="p-2 text-sm font-mono">{event.user_id}</td>
                    <td className="p-2 text-sm font-mono">{event.quiz_id || '-'}</td>
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

