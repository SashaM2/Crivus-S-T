import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { RefreshCw } from 'lucide-react'
import type { Quiz } from '@/lib/types'

interface DashboardFiltersProps {
    filters: {
        quiz_id: string
        start_date: string
        end_date: string
        utm_source: string
        utm_campaign: string
    }
    setFilters: React.Dispatch<React.SetStateAction<{
        quiz_id: string
        start_date: string
        end_date: string
        utm_source: string
        utm_campaign: string
    }>>
    quizzes: Quiz[]
    onRefresh: (isRefresh?: boolean) => void
}

export function DashboardFilters({ filters, setFilters, quizzes, onRefresh }: DashboardFiltersProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">Filtros</h2>
                    <Button variant="ghost" size="icon" onClick={() => onRefresh(true)} title="Atualizar dados" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quiz</Label>
                    <Select
                        value={filters.quiz_id || "all"}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, quiz_id: value === "all" ? "" : value }))}
                    >
                        <SelectTrigger className="h-9 bg-background/50">
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

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                    <DatePicker
                        value={filters.start_date}
                        onChange={(value) => setFilters((prev) => ({ ...prev, start_date: value }))}
                        placeholder="Início"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data Final</Label>
                    <DatePicker
                        value={filters.end_date}
                        onChange={(value) => setFilters((prev) => ({ ...prev, end_date: value }))}
                        placeholder="Fim"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Origem (UTM)</Label>
                    <Input
                        value={filters.utm_source}
                        onChange={(e) => setFilters((prev) => ({ ...prev, utm_source: e.target.value }))}
                        placeholder="Ex: google"
                        className="h-9 bg-background/50"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Campanha (UTM)</Label>
                    <Input
                        value={filters.utm_campaign}
                        onChange={(e) => setFilters((prev) => ({ ...prev, utm_campaign: e.target.value }))}
                        placeholder="Ex: natal_2023"
                        className="h-9 bg-background/50"
                    />
                </div>
            </div>
        </div>
    )
}
