'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Download, FileText, ChevronDown } from 'lucide-react'
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">auditoria completa</p>
            <h1 className="text-3xl font-semibold text-foreground">Auditoria</h1>
            <p className="mt-2 text-sm text-muted-foreground">Visualize cada evento registrado em todo o sistema</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-[0.3em] text-muted-foreground">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <DatePicker
                value={filters.start_date}
                onChange={(value) => setFilters(prev => ({ ...prev, start_date: value }))}
                placeholder="Selecione a data inicial"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <DatePicker
                value={filters.end_date}
                onChange={(value) => setFilters(prev => ({ ...prev, end_date: value }))}
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
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Quiz ID</th>
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
                    <td className="px-4 py-3 font-mono text-xs">{event.user_id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{event.quiz_id || '-'}</td>
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

