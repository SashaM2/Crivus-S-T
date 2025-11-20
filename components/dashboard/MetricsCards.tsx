import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metrics } from '@/lib/types'
import { getCompletionLabel, getCompletionTone, getDropoffLabel, getDropoffTone, getLeadTone } from './utils'

interface MetricsCardsProps {
    metrics: Metrics
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
    const completionRate = metrics.taxa_conclusao || metrics.completion_rate || 0
    const dropoffRate = metrics.taxa_abandono_geral || 0
    const leadRate = metrics.taxa_conversao_lead || 0

    // Helper para cores de texto sutis mas legíveis
    const getTrendColor = (value: number, type: 'positive' | 'negative' | 'neutral') => {
        if (type === 'positive') return 'text-emerald-600 dark:text-emerald-400'
        if (type === 'negative') return 'text-rose-600 dark:text-rose-400'
        return 'text-muted-foreground'
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Iniciados</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground/50" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{metrics.total_iniciados || metrics.total_starts || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Sessões iniciadas</p>
                </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
                    <span className={cn("text-xs font-medium", getTrendColor(completionRate, completionRate >= 50 ? 'positive' : 'neutral'))}>
                        {completionRate.toFixed(0)}%
                    </span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {metrics.total_concluidos || metrics.total_finishes || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Taxa de conclusão
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Abandono</CardTitle>
                    <span className={cn("text-xs font-medium", getTrendColor(dropoffRate, dropoffRate > 50 ? 'negative' : 'neutral'))}>
                        {dropoffRate.toFixed(1)}%
                    </span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {metrics.taxa_abandono_geral.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {(metrics.total_iniciados || metrics.total_starts || 0) - (metrics.total_concluidos || metrics.total_finishes || 0)} usuários saíram
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Leads Capturados</CardTitle>
                    <span className={cn("text-xs font-medium", getTrendColor(leadRate, leadRate > 10 ? 'positive' : 'neutral'))}>
                        {leadRate.toFixed(1)}%
                    </span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {metrics.leads_capturados || metrics.total_leads || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Taxa de conversão
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
