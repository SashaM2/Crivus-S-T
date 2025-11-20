"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, FileQuestion, ListOrdered } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Metrics, Quiz } from '@/lib/types'

interface AbandonmentAnalysisProps {
    metrics: Metrics
    quizzes: Quiz[]
    setSelectedQuiz: (quiz: Quiz) => void
    setFilters: (filters: any) => void
}

export function AbandonmentAnalysis({ metrics, quizzes, setSelectedQuiz, setFilters }: AbandonmentAnalysisProps) {
    const { toast } = useToast()

    return (
        <Card className="w-full shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
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
                        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
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
                        <div className="space-y-3 p-4 rounded-lg border border-red-100 bg-red-50/50 dark:border-red-900/20 dark:bg-red-900/10">
                            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                Etapa mais abandonada
                            </div>
                            {metrics.etapa_mais_abandonada ? (
                                <>
                                    <div className="text-2xl font-bold text-foreground">
                                        {metrics.etapa_mais_abandonada.page_id}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>{metrics.etapa_mais_abandonada.total_abandonos} {metrics.etapa_mais_abandonada.total_abandonos === 1 ? 'abandono' : 'abandonos'}</p>
                                        <p>{metrics.etapa_mais_abandonada.percentual_sobre_iniciados.toFixed(1)}% dos usuários abandonam aqui</p>
                                    </div>
                                    {metrics.etapa_mais_abandonada.page_url && metrics.etapa_mais_abandonada.page_url !== 'N/A' ? (
                                        <a
                                            href={metrics.etapa_mais_abandonada.page_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-2"
                                        >
                                            Ver página <span aria-hidden="true">→</span>
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground mt-2 block">
                                            URL não disponível
                                        </span>
                                    )}
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground space-y-2">
                                    <p>Nenhuma etapa identificada</p>
                                    <p className="text-xs italic">
                                        Configure <code className="rounded bg-muted/50 px-1">data-page-id</code> nos seus quizzes para rastrear onde os usuários abandonam.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* COLUNA 2 - Quiz mais abandonado */}
                        <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FileQuestion className="h-4 w-4" />
                                Quiz mais abandonado
                            </div>
                            {metrics.abandono_por_quiz && metrics.abandono_por_quiz.length > 0 ? (
                                <>
                                    <div className="text-2xl font-bold line-clamp-2" title={metrics.abandono_por_quiz[0].quiz_titulo}>
                                        {metrics.abandono_por_quiz[0].quiz_titulo}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>{metrics.abandono_por_quiz[0].total_abandonos} {metrics.abandono_por_quiz[0].total_abandonos === 1 ? 'abandono' : 'abandonos'}</p>
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

                                            setSelectedQuiz(quiz)
                                            setFilters((prev: any) => ({ ...prev, quiz_id: quizId }))

                                            const url = new URL(window.location.href)
                                            url.searchParams.set('quiz_id', quizId)
                                            window.history.pushState({}, '', url.toString())

                                            toast({
                                                title: 'Filtro aplicado',
                                                description: `Visualizando métricas do quiz: ${quiz.titulo}`,
                                            })

                                            setTimeout(() => {
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }, 100)
                                        }}
                                        className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-2"
                                        type="button"
                                    >
                                        Ver desempenho <span aria-hidden="true">→</span>
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

                        {/* COLUNA 3 - Todas as etapas abandonadas (Funil Visual) */}
                        <div className="space-y-3 flex flex-col h-full">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <ListOrdered className="h-4 w-4" />
                                Todas as etapas abandonadas
                            </div>
                            {metrics.abandono_por_pagina && metrics.abandono_por_pagina.length > 0 ? (
                                <div className="space-y-3 flex-1">
                                    {metrics.abandono_por_pagina
                                        .map((etapa, index) => {
                                            // Mostrar apenas os top 5 no widget para não poluir
                                            if (index >= 5) return null

                                            const percentual = metrics.total_iniciados > 0
                                                ? (etapa.total_abandonos / metrics.total_iniciados) * 100
                                                : 0
                                            const isUnidentified = etapa.page_id === 'sem_pagina'
                                            return (
                                                <div key={etapa.page_id || index} className="group space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span
                                                            className={`font-medium truncate max-w-[180px] ${isUnidentified ? 'text-muted-foreground italic' : ''}`}
                                                            title={isUnidentified ? 'Configure data-page-id para identificar' : etapa.page_id}
                                                        >
                                                            {isUnidentified ? 'Página não identificada' : etapa.page_id}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {etapa.total_abandonos} {etapa.total_abandonos === 1 ? 'abandono' : 'abandonos'}
                                                        </span>
                                                    </div>
                                                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out group-hover:bg-primary/80"
                                                            style={{ width: `${Math.min(percentual, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-right text-muted-foreground">
                                                        {percentual.toFixed(1)}% de perda
                                                    </div>
                                                </div>
                                            )
                                        })}

                                    <div className="pt-2 mt-auto">
                                        <a
                                            href="/dashboard/abandonment"
                                            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            Ver todas as etapas <span aria-hidden="true">→</span>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground space-y-2">
                                    <p>Nenhuma etapa com abandono</p>
                                    <p className="text-xs italic">
                                        Configure <code className="rounded bg-muted/50 px-1">data-page-id</code> para rastrear onde os usuários abandonam.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
