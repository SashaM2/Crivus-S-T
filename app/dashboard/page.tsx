'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import type { Metrics, Quiz } from '@/lib/types'
import { BarChart3, TrendingUp, Users, CheckCircle2, Download, FileText, AlertTriangle, Target, FileQuestion, ListOrdered } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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

  const loadMetrics = async () => {
    setLoading(true)
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
          // Se não conseguir renovar, redirecionar para login
          window.location.href = '/login'
          return
        }
        // Usar a nova sessão
        const params = new URLSearchParams()
        if (filters.quiz_id) params.append('quiz_id', filters.quiz_id)
        if (filters.start_date) params.append('start_date', filters.start_date)
        if (filters.end_date) params.append('end_date', filters.end_date)
        if (filters.utm_source) params.append('utm_source', filters.utm_source)
        if (filters.utm_campaign) params.append('utm_campaign', filters.utm_campaign)

        const response = await fetch(`/api/metrics?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${newSession.access_token}`,
          },
          credentials: 'include',
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
          if (response.status === 401) {
            // Token inválido mesmo após renovar, redirecionar para login
            window.location.href = '/login'
            return
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        setMetrics(result.data)
        return
      }

      const params = new URLSearchParams()
      if (filters.quiz_id) params.append('quiz_id', filters.quiz_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.utm_source) params.append('utm_source', filters.utm_source)
      if (filters.utm_campaign) params.append('utm_campaign', filters.utm_campaign)

      const response = await fetch(`/api/metrics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        if (response.status === 401) {
          // Token inválido, tentar renovar ou redirecionar
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !newSession) {
            window.location.href = '/login'
            return
          }
          // Tentar novamente com o token renovado
          const retryResponse = await fetch(`/api/metrics?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${newSession.access_token}`,
            },
            credentials: 'include',
          })
          if (!retryResponse.ok) {
            window.location.href = '/login'
            return
          }
          const retryResult = await retryResponse.json()
          setMetrics(retryResult.data)
          return
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📊 Métricas recebidas:', {
        total_iniciados: result.data?.total_iniciados,
        total_concluidos: result.data?.total_concluidos,
        etapa_mais_abandonada: result.data?.etapa_mais_abandonada,
        abandono_por_quiz: result.data?.abandono_por_quiz?.length || 0,
        top_3_abandono_etapas: result.data?.top_3_abandono_etapas?.length || 0,
        abandono_por_pagina: result.data?.abandono_por_pagina?.length || 0,
      })
      setMetrics(result.data)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      // Manter métricas anteriores em caso de erro
      if (!metrics) {
        setMetrics(null)
      }
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

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visualize as métricas dos seus quizzes</p>
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

      {/* Métricas */}
      {metrics && (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Iniciados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_iniciados || metrics.total_starts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pessoas que começaram o quiz
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.total_concluidos || metrics.total_finishes || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa de conclusão: {(metrics.taxa_conclusao || metrics.completion_rate || 0).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Abandono</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.taxa_abandono_geral.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(metrics.total_iniciados || metrics.total_starts || 0) - (metrics.total_concluidos || metrics.total_finishes || 0)} de {metrics.total_iniciados || metrics.total_starts || 0} abandonaram
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads Capturados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.leads_capturados || metrics.total_leads || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa de conversão: {metrics.taxa_conversao_lead.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Secundárias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_events}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os eventos registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Ativos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_quizzes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Quizzes com eventos registrados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de Abandono */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Resumo de Abandono
              </CardTitle>
              <CardDescription>
                Análise detalhada dos pontos de abandono no quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.total_iniciados === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhum quiz iniciado ainda</p>
                  <p className="text-sm">Quando usuários começarem a interagir com seus quizzes, os dados de abandono aparecerão aqui.</p>
                </div>
              ) : metrics.total_iniciados === metrics.total_concluidos ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Excelente! 100% de conclusão</p>
                  <p className="text-sm text-muted-foreground">Todos os usuários que iniciaram o quiz também o finalizaram. Não há abandonos para exibir.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* COLUNA 1 - Etapa mais abandonada */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Etapa mais abandonada
                    </div>
                    {metrics.etapa_mais_abandonada ? (
                      <>
                        <div className="text-2xl font-bold">
                          {metrics.etapa_mais_abandonada.page_id}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{metrics.etapa_mais_abandonada.total_abandonos} abandonos</p>
                          <p>{metrics.etapa_mais_abandonada.percentual_sobre_iniciados.toFixed(1)}% dos usuários abandonam aqui</p>
                        </div>
                        {metrics.etapa_mais_abandonada.page_url && metrics.etapa_mais_abandonada.page_url !== 'N/A' ? (
                          <a 
                            href={metrics.etapa_mais_abandonada.page_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline inline-block"
                          >
                            Ver detalhes →
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            URL não disponível
                          </span>
                        )}
                      </>
                    ) : (
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>Nenhuma etapa identificada</p>
                          <p className="text-xs italic">
                            Configure <code className="bg-gray-100 px-1 rounded">data-page-id</code> nos seus quizzes para rastrear onde os usuários abandonam.
                          </p>
                        </div>
                      )}
                  </div>

                {/* COLUNA 2 - Quiz mais abandonado */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileQuestion className="h-4 w-4" />
                    Quiz mais abandonado
                  </div>
                  {metrics.abandono_por_quiz && metrics.abandono_por_quiz.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold line-clamp-2">
                        {metrics.abandono_por_quiz[0].quiz_titulo}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{metrics.abandono_por_quiz[0].total_abandonos} abandonos</p>
                        {metrics.total_iniciados > 0 && (
                          <p>
                            {((metrics.abandono_por_quiz[0].total_abandonos / metrics.total_iniciados) * 100).toFixed(1)}% de abandono
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const quizId = metrics.abandono_por_quiz[0].quiz_id
                          const quiz = quizzes.find(q => q.id === quizId)
                          
                          if (!quiz) {
                            toast({
                              title: 'Erro',
                              description: 'Quiz não encontrado',
                              variant: 'destructive',
                            })
                            return
                          }

                          // Selecionar o quiz no store
                          setSelectedQuiz(quiz)
                          
                          // Atualizar filtros
                          setFilters(prev => ({ ...prev, quiz_id: quizId }))
                          
                          // Atualizar URL para manter o filtro
                          const url = new URL(window.location.href)
                          url.searchParams.set('quiz_id', quizId)
                          window.history.pushState({}, '', url.toString())
                          
                          // Feedback visual
                          toast({
                            title: 'Filtro aplicado',
                            description: `Visualizando métricas do quiz: ${quiz.titulo}`,
                          })
                          
                          // Scroll suave para o topo para ver as métricas atualizadas
                          setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }, 100)
                        }}
                        className="text-xs text-blue-600 hover:underline cursor-pointer transition-colors hover:text-blue-800"
                        type="button"
                      >
                        Ver desempenho →
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Nenhum quiz com abandono</p>
                      <p className="text-xs italic">
                        {metrics.total_quizzes === 1 
                          ? 'Este quiz não tem abandonos registrados.' 
                          : 'Nenhum dos seus quizzes tem abandonos registrados.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* COLUNA 3 - Top 3 etapas mais abandonadas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ListOrdered className="h-4 w-4" />
                    Top 3 etapas mais abandonadas
                  </div>
                  {metrics.top_3_abandono_etapas && metrics.top_3_abandono_etapas.length > 0 ? (
                    <div className="space-y-2">
                      {metrics.top_3_abandono_etapas
                        .filter(etapa => etapa.page_id !== 'sem_pagina') // Filtrar se houver outras
                        .slice(0, 3)
                        .map((etapa, index) => (
                          <div key={etapa.page_id || index} className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {index + 1}. {etapa.page_id === 'sem_pagina' ? 'Página não identificada' : etapa.page_id}
                            </span>
                            <span className="text-muted-foreground">
                              {etapa.total_abandonos} abandonos
                            </span>
                          </div>
                        ))}
                      {metrics.top_3_abandono_etapas.filter(e => e.page_id !== 'sem_pagina').length === 0 && (
                        <div className="text-xs text-muted-foreground italic space-y-1">
                          <p>Nenhuma etapa identificada</p>
                          <p>Configure <code className="bg-gray-100 px-1 rounded">data-page-id</code> nos seus quizzes.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Nenhuma etapa com abandono</p>
                      <p className="text-xs italic">
                        Configure <code className="bg-gray-100 px-1 rounded">data-page-id</code> para rastrear onde os usuários abandonam.
                      </p>
                    </div>
                  )}
                </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.events_by_day}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.events_by_type}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Abandono por Pergunta */}
          {metrics.abandono_por_pergunta && metrics.abandono_por_pergunta.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Abandono por Pergunta</CardTitle>
                <CardDescription>
                  Visualize em qual etapa as pessoas mais abandonam o quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Gráfico de Barras */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.abandono_por_pergunta}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="pergunta" 
                          label={{ value: 'Pergunta', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Taxa de Abandono (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Abandono']}
                          labelFormatter={(label) => `Pergunta ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="taxa_abandono" 
                          fill="#ef4444" 
                          name="Taxa de Abandono (%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela Detalhada */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Detalhes por Pergunta</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Pergunta</th>
                            <th className="text-right p-2 font-semibold">Chegaram</th>
                            <th className="text-right p-2 font-semibold">Abandonaram</th>
                            <th className="text-right p-2 font-semibold">Continuaram</th>
                            <th className="text-right p-2 font-semibold">Taxa Abandono</th>
                            <th className="text-right p-2 font-semibold">% do Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.abandono_por_pergunta.map((item, index) => (
                            <tr 
                              key={item.pergunta} 
                              className={`border-b hover:bg-gray-50 ${
                                item.taxa_abandono > 50 ? 'bg-red-50' : 
                                item.taxa_abandono > 30 ? 'bg-yellow-50' : ''
                              }`}
                            >
                              <td className="p-2 font-medium">Pergunta {item.pergunta}</td>
                              <td className="p-2 text-right">{item.total_chegaram}</td>
                              <td className="p-2 text-right text-red-600 font-semibold">
                                {item.total_abandonaram}
                              </td>
                              <td className="p-2 text-right text-green-600">
                                {item.total_continuaram}
                              </td>
                              <td className="p-2 text-right">
                                <span className={`font-semibold ${
                                  item.taxa_abandono > 50 ? 'text-red-600' : 
                                  item.taxa_abandono > 30 ? 'text-yellow-600' : 
                                  'text-gray-600'
                                }`}>
                                  {item.taxa_abandono.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-2 text-right text-gray-600">
                                {item.percentual_do_total.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Resumo */}
                  {metrics.abandono_por_pergunta.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">📊 Resumo</h4>
                      <p className="text-sm text-blue-800">
                        A pergunta com maior taxa de abandono é a <strong>Pergunta {
                          metrics.abandono_por_pergunta.reduce((max, item) => 
                            item.taxa_abandono > max.taxa_abandono ? item : max
                          ).pergunta
                        }</strong> com {
                          metrics.abandono_por_pergunta.reduce((max, item) => 
                            item.taxa_abandono > max.taxa_abandono ? item : max
                          ).taxa_abandono.toFixed(1)
                        }% de abandono.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

