"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import type { Metrics } from '@/lib/types'

interface EventsChartProps {
    metrics: Metrics
}

export function EventsChart({ metrics }: EventsChartProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-foreground">Eventos por Dia</CardTitle>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.events_by_day} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                    }}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border border-border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Data
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {new Date(label).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Eventos
                                                            </span>
                                                            <span className="font-bold text-foreground">
                                                                {payload[0].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-foreground">Eventos por Tipo</CardTitle>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.events_by_type} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="type"
                                    type="category"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                    tickFormatter={(value) => {
                                        const map: Record<string, string> = {
                                            'start_quiz': 'Início',
                                            'next_question': 'Avanço',
                                            'finish_quiz': 'Conclusão',
                                            'lead_captured': 'Lead'
                                        }
                                        return map[value] || value
                                    }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border border-border bg-background p-2 shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            {label}
                                                        </span>
                                                        <span className="font-bold text-foreground">
                                                            {payload[0].value}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="hsl(var(--primary))"
                                    radius={[0, 4, 4, 0]}
                                    barSize={32}
                                    fillOpacity={0.8}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
