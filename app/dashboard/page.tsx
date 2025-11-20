'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import type { Metrics } from '@/lib/types'
import { Download, FileText, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { EventsChart } from '@/components/dashboard/EventsChart'
import { AbandonmentAnalysis } from '@/components/dashboard/AbandonmentAnalysis'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { ModeToggle } from '@/components/mode-toggle'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { quizzes, setQuizzes, selectedQuiz, setSelectedQuiz } = useQuizStore()
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    quiz_id: '',
    start_date: '',
    end_date: '',
    utm_source: '',
    utm_campaign: '',
  })
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)

  useEffect(() => {
    loadQuizzes()
  }, [])

  // Ler quiz_id da URL se presente
  useEffect(() => {
    if (!searchParams) return
    const quizIdFromUrl = searchParams.get('quiz_id')
    if (quizIdFromUrl && quizIdFromUrl !== filters.quiz_id) {
      setFilters(prev => ({ ...prev, quiz_id: quizIdFromUrl }))
      // Selecionar o quiz também
      const quiz = quizzes.find(q => q.id === quizIdFromUrl)
      if (quiz) {
        setSelectedQuiz(quiz)
      }
    }
  }, [searchParams, quizzes, filters.quiz_id, setSelectedQuiz])

  useEffect(() => {
    loadMetrics()
  }, [filters])

  const loadQuizzes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })

    if (data) {
      setQuizzes(data)
      if (data.length > 0 && !selectedQuiz) {
        setSelectedQuiz(data[0])
        setFilters(prev => ({ ...prev, quiz_id: data[0].id }))
      }
    }
  }

  const loadMetrics = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)

    if (isRefresh) {
      toast({
        title: 'Atualizando...',
        description: 'Buscando dados mais recentes.',
      })
    }

    try {
      // Obter o token de acesso do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('Erro ao obter sessão:', sessionError)
        if (!metrics) {
          setMetrics(null)
        }
        return
      }

      // Verificar se o token está expirado e tentar renovar
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('Token expirado, tentando renovar sessão...')
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !newSession) {
          console.error('Erro ao renovar sessão:', refreshError)
          window.location.href = '/login'
          return
        }
        // Usar a nova sessão
        await fetchMetrics(newSession.access_token)
        return
      }

      await fetchMetrics(session.access_token)

      if (isRefresh) {
        toast({
          title: 'Atualizado',
          description: 'Dados atualizados com sucesso.',
          className: 'bg-emerald-500 text-white border-none',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      if (!metrics) {
        setMetrics(null)
      }
      if (isRefresh) {
        toast({
          title: 'Erro ao atualizar',
          description: 'Não foi possível atualizar os dados.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async (token: string) => {
    const params = new URLSearchParams()
    if (filters.quiz_id) params.append('quiz_id', filters.quiz_id)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.utm_source) params.append('utm_source', filters.utm_source)
    if (filters.utm_campaign) params.append('utm_campaign', filters.utm_campaign)

    const response = await fetch(`/api/metrics?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    setMetrics(result.data)
  }

  const handleExport = async (format: string) => {
    try {
      setExportingFormat(format)

      // Obter sessão para o token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: 'Erro de autenticação',
          description: 'Você precisa estar logado para exportar.',
          variant: 'destructive',
        })
        return
      }

      const params = new URLSearchParams()
      params.append('format', format)
      if (filters.quiz_id) params.append('quiz_id', filters.quiz_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.utm_source) params.append('utm_source', filters.utm_source)
      if (filters.utm_campaign) params.append('utm_campaign', filters.utm_campaign)

      const response = await fetch(`/api/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao exportar' }))
        toast({
          title: 'Exportação falhou',
          description: errorData.error || 'Tente novamente em instantes.',
          variant: 'destructive',
        })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const extension = format === 'txt' ? 'txt' : format
      link.href = url
      link.download = `crivus-export-${Date.now()}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Exportação falhou',
        description: 'Não foi possível gerar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setExportingFormat(null)
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Visão geral</p>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Abandono, conclusão e leads em tempo real.</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!!exportingFormat} className="gap-2">
                  <Download className="h-4 w-4" />
                  {exportingFormat ? 'Exportando...' : 'Exportar'}
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
      </div>

      <DashboardFilters
        filters={filters}
        setFilters={setFilters}
        quizzes={quizzes}
        onRefresh={loadMetrics}
      />

      {metrics && (
        <>
          <MetricsCards metrics={metrics} />
          <EventsChart metrics={metrics} />
          <AbandonmentAnalysis
            metrics={metrics}
            quizzes={quizzes}
            setSelectedQuiz={setSelectedQuiz}
            setFilters={setFilters}
          />
        </>
      )}
    </div>
  )
}
