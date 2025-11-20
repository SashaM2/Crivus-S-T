'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import type { Metrics } from '@/lib/types'
import { ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'

export default function AbandonmentPage() {
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
            if (data.length > 0 && !selectedQuiz && !filters.quiz_id) {
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
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
                if (!metrics) setMetrics(null)
                return
            }

            // Renovar sessão se necessário
            const now = Math.floor(Date.now() / 1000)
            if (session.expires_at && session.expires_at < now) {
                const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
                if (refreshError || !newSession) {
                    window.location.href = '/login'
                    return
                }
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
            if (!metrics) setMetrics(null)
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
        })

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login'
                return
            }
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        setMetrics(result.data)
    }

    return (
        <div className="space-y-8 p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-semibold">Detalhamento de Abandono</h1>
                    <p className="text-sm text-muted-foreground">
                        Análise completa de todas as etapas onde os usuários desistem.
                    </p>
                </div>
            </div>

            <DashboardFilters
                filters={filters}
                setFilters={setFilters}
                quizzes={quizzes}
                onRefresh={loadMetrics}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Todas as Etapas Abandonadas
                    </CardTitle>
                    <CardDescription>
                        Lista completa ordenada por volume de abandono
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : metrics?.abandono_por_pagina && metrics.abandono_por_pagina.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Etapa (Page ID)</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">URL</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Abandonos</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">% de Perda</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Visualização</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {metrics.abandono_por_pagina.map((etapa, index) => {
                                        const percentual = metrics.total_iniciados > 0
                                            ? (etapa.total_abandonos / metrics.total_iniciados) * 100
                                            : 0
                                        const isUnidentified = etapa.page_id === 'sem_pagina'

                                        return (
                                            <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">
                                                    {isUnidentified ? (
                                                        <span className="text-muted-foreground italic flex items-center gap-2">
                                                            Página não identificada
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" title="Adicione o atributo data-page-id no seu elemento HTML">
                                                                ?
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        etapa.page_id
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {etapa.page_url && etapa.page_url !== 'N/A' ? (
                                                        <a
                                                            href={etapa.page_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-primary hover:underline max-w-[300px] truncate"
                                                        >
                                                            {etapa.page_url}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    {etapa.total_abandonos}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    {percentual.toFixed(1)}%
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2 w-full max-w-[200px]">
                                                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="absolute top-0 left-0 h-full bg-red-500"
                                                                style={{ width: `${Math.min(percentual, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                            <p className="text-lg font-medium mb-2">Nenhum abandono registrado</p>
                            <p className="text-sm">Não encontramos dados de abandono para o período selecionado.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
