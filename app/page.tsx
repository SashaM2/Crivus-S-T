import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Typewriter } from "@/components/ui/typewriter"
import { ModeToggle } from "@/components/mode-toggle"
import {
    Users,
    MousePointerClick,
    CheckCircle2,
    TrendingUp,
    BarChart3,
    LayoutDashboard,
    ArrowUpRight,
    PieChart,
    ArrowRight
} from "lucide-react"

const features = [
    {
        name: 'Analytics em Tempo Real',
        description: 'Visualize dados instantaneamente. Acompanhe leads, conversões e comportamento do usuário no momento em que acontecem.',
        icon: BarChart3,
    },
    {
        name: 'Captura de Leads',
        description: 'Capture leads qualificados com nossos formulários integrados e exporte para suas ferramentas de marketing favoritas.',
        icon: Users,
    },
    {
        name: 'Tracking Avançado',
        description: 'Rastreie cada clique e interação. Entenda exatamente onde seus usuários estão abandonando o quiz.',
        icon: MousePointerClick,
    },
    {
        name: 'Fácil Integração',
        description: 'Copie e cole um único script. Funciona em qualquer site ou construtor de páginas.',
        icon: CheckCircle2,
    },
    {
        name: 'Funil de Conversão',
        description: 'Visualize o funil completo: Visitas, Inícios, Respostas e Conclusões. Identifique gargalos rapidamente.',
        icon: TrendingUp,
    },
    {
        name: 'Análise de Abandono',
        description: 'Descubra em qual pergunta os usuários mais desistem e otimize seu conteúdo para maior retenção.',
        icon: PieChart,
    },
]

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-background transition-colors duration-300">
            {/* Navbar - Solid Background */}
            <header className="sticky top-0 z-50 w-full bg-white dark:bg-background border-b border-slate-100 dark:border-border">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-[#2D3748] dark:text-foreground">
                        <LayoutDashboard className="h-6 w-6" />
                        <span>Crivus QuizIQ</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <ModeToggle />
                        <Button asChild className="bg-[#2D3748] text-white hover:bg-[#1A202C] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-all shadow-sm hover:shadow-md font-medium">
                            <Link href="/login">
                                Entrar
                            </Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="container flex flex-col items-center justify-center gap-8 pb-8 pt-12 md:pb-12 md:pt-20">
                    {/* Badge - Square with Gray Dot */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 inline-flex items-center border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1 text-xs font-medium text-[#4A5568] dark:text-muted-foreground shadow-sm rounded-sm">
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#A0AEC0] dark:bg-muted-foreground"></span>
                        Analytics em Tempo Real
                    </div>

                    <div className="flex max-w-[980px] flex-col items-center gap-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards">
                        <h1 className="text-4xl font-extrabold leading-tight tracking-tighter text-[#2D3748] dark:text-foreground md:text-6xl lg:leading-[1.1]">
                            Analise Seus Quizzes em <br className="hidden md:block" />
                            <span className="bg-gradient-to-r from-[#E2E8F0] via-[#F7FAFC] to-[#E2E8F0] dark:from-[#E2E8F0] dark:via-[#F7FAFC] dark:to-[#E2E8F0] bg-clip-text text-transparent">
                                <Typewriter text="Tempo Real" cursor={false} speed={150} className="" />
                            </span>
                        </h1>
                        <p className="max-w-[750px] text-lg text-[#4A5568] dark:text-muted-foreground sm:text-xl leading-relaxed">
                            Acompanhe desempenho, leads e conversões dos seus quizzes em um único painel simples e inteligente. Tome decisões baseadas em dados.
                        </p>
                    </div>

                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
                        <Button asChild size="lg" className="h-11 px-8 bg-[#2D3748] text-white hover:bg-[#1A202C] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-all hover:scale-105 rounded-md font-medium">
                            <Link href="/register">
                                Começar Agora
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-11 px-8 bg-white dark:bg-card border-slate-200 dark:border-border text-[#4A5568] dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted transition-all hover:scale-105 rounded-md font-medium">
                            <Link href="#features">
                                Saiba Mais
                            </Link>
                        </Button>
                    </div>

                    {/* Dashboard Mockup - Animated */}
                    <div className="mt-12 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-backwards">
                        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                            <div className="rounded-lg bg-slate-50 dark:bg-background p-4 md:p-8">
                                {/* Window Controls */}
                                <div className="mb-8 flex gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-muted"></div>
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-muted"></div>
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-muted"></div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border border-slate-100 dark:border-border bg-white dark:bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-float">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0] dark:text-muted-foreground">Total Leads</span>
                                            <Users className="h-4 w-4 text-[#CBD5E0] dark:text-muted-foreground" />
                                        </div>
                                        <div className="mt-4 flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-[#2D3748] dark:text-foreground">12,450</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50/50 dark:bg-green-900/20 w-fit px-2 py-0.5 rounded-full">
                                            <ArrowUpRight className="h-3 w-3" />
                                            <span>+12%</span>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 dark:border-border bg-white dark:bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-float" style={{ animationDelay: '1s' }}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0] dark:text-muted-foreground">Taxa de Conversão</span>
                                            <TrendingUp className="h-4 w-4 text-[#CBD5E0] dark:text-muted-foreground" />
                                        </div>
                                        <div className="mt-4 flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-[#2D3748] dark:text-foreground">4.8%</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50/50 dark:bg-green-900/20 w-fit px-2 py-0.5 rounded-full">
                                            <ArrowUpRight className="h-3 w-3" />
                                            <span>+2.1%</span>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 dark:border-border bg-white dark:bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-float" style={{ animationDelay: '2s' }}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0] dark:text-muted-foreground">Cliques no CTA</span>
                                            <MousePointerClick className="h-4 w-4 text-[#CBD5E0] dark:text-muted-foreground" />
                                        </div>
                                        <div className="mt-4 flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-[#2D3748] dark:text-foreground">8,932</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50/50 dark:bg-green-900/20 w-fit px-2 py-0.5 rounded-full">
                                            <ArrowUpRight className="h-3 w-3" />
                                            <span>+1.4%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Elegant Redesign */}
                <section id="features" className="container py-24 md:py-32">
                    <div className="mx-auto mb-16 flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#A0AEC0] dark:text-muted-foreground">
                            Funcionalidades
                        </h2>
                        <h3 className="font-bold text-3xl leading-[1.1] text-[#2D3748] dark:text-foreground sm:text-3xl md:text-4xl">
                            Tudo que você precisa
                        </h3>
                    </div>
                    <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.name}
                                className="group relative overflow-hidden border-0 bg-transparent shadow-none hover:bg-slate-50 dark:hover:bg-card transition-all duration-500 rounded-2xl"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <CardHeader className="pb-4 relative z-10">
                                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-card border border-slate-100 dark:border-border text-[#4A5568] dark:text-muted-foreground group-hover:bg-[#2D3748] group-hover:border-[#2D3748] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:scale-110">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-[#2D3748] dark:text-foreground tracking-tight group-hover:translate-x-1 transition-transform duration-300">{feature.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <CardDescription className="text-[#718096] dark:text-muted-foreground leading-relaxed text-base font-normal">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Bottom CTA Section - Improved */}
                <section className="container py-24">
                    <div className="relative overflow-hidden rounded-3xl bg-[#2D3748] dark:bg-card border border-transparent dark:border-border px-6 py-16 shadow-2xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
                        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-white dark:text-foreground sm:text-4xl">
                                Pronto para dominar seus dados?
                                <br />
                                Comece a usar hoje mesmo.
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-slate-300 dark:text-muted-foreground">
                                Junte-se a centenas de profissionais que já estão otimizando seus quizzes e aumentando suas conversões com o Crivus QuizIQ.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                                <Button asChild size="lg" className="h-12 px-8 bg-white text-[#2D3748] hover:bg-slate-100 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-all hover:scale-105 rounded-md font-bold">
                                    <Link href="/register">
                                        Começar Agora
                                    </Link>
                                </Button>
                                <Link href="#features" className="text-sm font-semibold leading-6 text-white dark:text-foreground flex items-center gap-1 hover:gap-2 transition-all">
                                    Saiba mais <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="relative mt-16 h-80 lg:mt-8">
                            <div className="absolute left-0 top-0 w-[57rem] max-w-none rounded-md bg-white/5 ring-1 ring-white/10">
                                {/* Abstract visual or simplified dashboard preview could go here */}
                                <div className="p-4 grid gap-4 opacity-50">
                                    <div className="h-32 rounded bg-white/10 w-full"></div>
                                    <div className="h-32 rounded bg-white/10 w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 dark:border-border bg-white dark:bg-background py-12">
                <div className="container flex flex-col items-center justify-between gap-8 md:flex-row">
                    <div className="flex items-center gap-2 font-bold text-lg text-[#2D3748] dark:text-foreground">
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Crivus QuizIQ</span>
                    </div>
                    <div className="flex gap-8 text-xs font-medium text-[#4A5568] dark:text-muted-foreground">
                        <Link href="#" className="hover:text-[#2D3748] dark:hover:text-foreground transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-[#2D3748] dark:hover:text-foreground transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-[#2D3748] dark:hover:text-foreground transition-colors">Contato</Link>
                    </div>
                    <p className="text-center text-xs text-[#A0AEC0] dark:text-muted-foreground md:text-right">
                        © 2025 Crivus.
                    </p>
                </div>
            </footer>
        </div>
    )
}
