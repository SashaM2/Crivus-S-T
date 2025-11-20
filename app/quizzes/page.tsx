'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Edit, Copy, Check, BarChart3, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { AbandonoPorQuiz } from '@/lib/types'

interface QuizMetrics {
  quiz_id: string
  total_abandonos: number
  total_iniciados: number
  total_concluidos: number
  taxa_abandono: number
}

export default function QuizzesPage() {
  const { quizzes, setQuizzes } = useQuizStore()
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null)
  const [quizMetrics, setQuizMetrics] = useState<Record<string, QuizMetrics>>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadQuizzes()
  }, [])

  useEffect(() => {
    if (quizzes.length > 0) {
      loadQuizMetrics()
    }
  }, [quizzes])

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
    }
    setLoading(false)
  }

  const loadQuizMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Buscar métricas gerais (sem filtro de quiz) para obter abandono_por_quiz
      const response = await fetch('/api/metrics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        const metrics = result.data

        if (metrics?.abandono_por_quiz) {
          // Criar um mapa de métricas por quiz
          const metricsMap: Record<string, QuizMetrics> = {}

          // Processar abandono_por_quiz
          metrics.abandono_por_quiz.forEach((item: AbandonoPorQuiz) => {
            metricsMap[item.quiz_id] = {
              quiz_id: item.quiz_id,
              total_abandonos: item.total_abandonos,
              total_iniciados: 0, // Será calculado abaixo
              total_concluidos: 0,
              taxa_abandono: 0,
            }
          })

          // Buscar métricas individuais de cada quiz para obter iniciados e concluídos
          await Promise.all(
            quizzes.map(async (quiz) => {
              try {
                const quizResponse = await fetch(`/api/metrics?quiz_id=${quiz.id}`, {
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                  credentials: 'include',
                })

                if (quizResponse.ok) {
                  const quizResult = await quizResponse.json()
                  const quizData = quizResult.data

                  if (metricsMap[quiz.id]) {
                    metricsMap[quiz.id].total_iniciados = quizData.total_iniciados || 0
                    metricsMap[quiz.id].total_concluidos = quizData.total_concluidos || 0
                    metricsMap[quiz.id].taxa_abandono = quizData.total_iniciados > 0
                      ? ((quizData.total_iniciados - quizData.total_concluidos) / quizData.total_iniciados) * 100
                      : 0
                  } else {
                    // Se não tem abandono, ainda assim mostrar métricas básicas
                    metricsMap[quiz.id] = {
                      quiz_id: quiz.id,
                      total_abandonos: 0,
                      total_iniciados: quizData.total_iniciados || 0,
                      total_concluidos: quizData.total_concluidos || 0,
                      taxa_abandono: 0,
                    }
                  }
                }
              } catch (error) {
                console.error(`Erro ao carregar métricas do quiz ${quiz.id}:`, error)
              }
            })
          )

          setQuizMetrics(metricsMap)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar métricas dos quizzes:', error)
    }
  }

  const handleCreate = async () => {
    if (!titulo.trim()) {
      toast({
        title: 'Erro',
        description: 'O título é obrigatório',
        variant: 'destructive',
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('quizzes')
      .insert({ titulo: titulo.trim(), user_id: user.id })

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar quiz',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Quiz criado com sucesso',
      })
      setTitulo('')
      setOpen(false)
      loadQuizzes()
    }
  }

  const handleUpdate = async (id: string) => {
    if (!titulo.trim()) {
      toast({
        title: 'Erro',
        description: 'O título é obrigatório',
        variant: 'destructive',
      })
      return
    }

    const { error } = await supabase
      .from('quizzes')
      .update({ titulo: titulo.trim() })
      .eq('id', id)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar quiz',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Quiz atualizado com sucesso',
      })
      setTitulo('')
      setEditingQuiz(null)
      loadQuizzes()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este quiz?')) return

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir quiz',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Quiz excluído com sucesso',
      })
      loadQuizzes()
    }
  }

  const handleCopySnippet = (quizId: string) => {
    const baseUrl = window.location.origin
    const snippet = `<!-- ============================================
  CRIVUS QUIZ ANALYTICS - SNIPPET DE INTEGRAÇÃO
  ============================================
  
  IMPORTANTE: Configure data-page-id para cada página/etapa
  Isso permite rastrear onde os usuários abandonam o quiz.
  
  Opções para page_id:
  1. Atributo data-page-id no elemento (recomendado)
  2. Variável window.PAGE_ID (alternativa)
  
  Exemplos de page_id:
  - pergunta_1, pergunta_2, pergunta_3
  - tela_boas_vindas, tela_oferta, tela_resultado
  - etapa_inicial, etapa_intermediaria, etapa_final
  ============================================ -->

<!-- Configurar URL da API (opcional, necessário apenas para sites externos) -->
<script>
  window.CRIVUS_API_URL = '${baseUrl}/api/events';
</script>

<!-- Carregar script de analytics -->
<script src="${baseUrl}/analytics.js"></script>

<!-- Container do Quiz -->
<!-- IMPORTANTE: Atualize data-page-id para cada página/etapa do seu quiz -->
<div data-quiz-id="${quizId}" data-page-id="pergunta_1">
  
  <!-- Exemplo: Página 1 - Boas-vindas -->
  <div id="pagina-1">
    <h1>Bem-vindo ao Quiz!</h1>
    <button onclick="irParaPergunta(1)">Começar</button>
  </div>

  <!-- Exemplo: Página 2 - Pergunta 1 -->
  <div id="pagina-2" style="display:none;" data-page-id="pergunta_1">
    <h2>Pergunta 1</h2>
    <button data-track-next="1" onclick="irParaPergunta(2)">Próxima</button>
  </div>

  <!-- Exemplo: Página 3 - Pergunta 2 -->
  <div id="pagina-3" style="display:none;" data-page-id="pergunta_2">
    <h2>Pergunta 2</h2>
    <button data-track-next="2" onclick="irParaPergunta(3)">Próxima</button>
  </div>

  <!-- Exemplo: Página 4 - Oferta/Lead -->
  <div id="pagina-4" style="display:none;" data-page-id="tela_oferta">
    <h2>Oferta Especial!</h2>
    <button data-track-finish data-track-lead data-email="email@exemplo.com" data-whatsapp="11999999999">
      Quero!
    </button>
  </div>

</div>

<!-- JavaScript para navegação entre páginas -->
<script>
  function irParaPergunta(numero) {
    // Esconder página atual
    const paginaAtual = document.querySelector('[style*="display:block"]') || document.getElementById('pagina-1');
    if (paginaAtual) paginaAtual.style.display = 'none';
    
    // Mostrar próxima página
    const proximaPagina = document.getElementById('pagina-' + numero);
    if (proximaPagina) {
      proximaPagina.style.display = 'block';
      
      // Atualizar page_id no container principal
      const pageId = proximaPagina.getAttribute('data-page-id');
      if (pageId) {
        document.querySelector('[data-quiz-id]').setAttribute('data-page-id', pageId);
        // OU usar window.PAGE_ID como alternativa:
        // window.PAGE_ID = pageId;
      }
    }
  }
</script>

<!-- ============================================
  ALTERNATIVA: Usar window.PAGE_ID
  ============================================
  
  Se preferir, você pode definir window.PAGE_ID antes de cada evento:
  
  <script>
    window.PAGE_ID = 'pergunta_1';
    window.CrivusQuiz.trackNext(1);
  </script>
  
  ============================================ -->`
    
    navigator.clipboard.writeText(snippet)
    toast({
      title: 'Snippet copiado!',
      description: 'Snippet completo copiado com exemplos de múltiplas páginas e page_id configurado!',
    })
  }

  const handleViewDashboard = (quizId: string) => {
    router.push(`/dashboard?quiz_id=${quizId}`)
  }

  const openEditDialog = (quiz: any) => {
    setEditingQuiz(quiz.id)
    setTitulo(quiz.titulo)
    setOpen(true)
  }

  const closeDialog = () => {
    setOpen(false)
    setEditingQuiz(null)
    setTitulo('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Coleção</p>
            <h1 className="text-3xl font-semibold text-foreground">Meus Quizzes</h1>
            <p className="mt-2 text-sm text-muted-foreground">Organize, monitore e atualize cada experiência com poucos cliques</p>
          </div>
          <Dialog open={open} onOpenChange={closeDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Quiz
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingQuiz ? 'Editar Quiz' : 'Novo Quiz'}
              </DialogTitle>
              <DialogDescription>
                {editingQuiz ? 'Atualize as informações do quiz' : 'Crie um novo quiz para rastrear'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nome do quiz"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={() => editingQuiz ? handleUpdate(editingQuiz) : handleCreate()}>
                {editingQuiz ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => {
          const metrics = quizMetrics[quiz.id]
          return (
            <Card key={quiz.id} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-xl">{quiz.titulo}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Criado em {formatDate(quiz.criado_em)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                {metrics && (
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Iniciados
                      </div>
                      <p className="text-xl font-semibold text-foreground">{metrics.total_iniciados || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Concluídos
                      </div>
                      <p className="text-xl font-semibold text-emerald-600">{metrics.total_concluidos || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Abandonos
                      </div>
                      <p className="text-xl font-semibold text-rose-500">{metrics.total_abandonos || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Taxa
                      </div>
                      <p className="text-xl font-semibold text-amber-600">
                        {metrics.taxa_abandono ? metrics.taxa_abandono.toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-auto">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => handleViewDashboard(quiz.id)}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver Dashboard
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopySnippet(quiz.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Snippet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(quiz)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(quiz.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">Nenhum quiz criado ainda</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

