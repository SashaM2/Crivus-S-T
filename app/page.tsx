import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3, Shield, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Crivus Quiz Analytics ST</span>
          </div>
          <Link href="/login">
            <Button>Entrar na Conta</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Crivus Quiz Analytics ST
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A forma mais simples de medir a performance completa do seu quiz.
        </p>
        <Link href="/login">
          <Button size="lg" className="text-lg px-8">
            Entrar na Conta
          </Button>
        </Link>
      </section>

      {/* Como Funciona */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg border bg-white">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Instale o Snippet</h3>
            <p className="text-gray-600">
              Adicione uma única linha de código ao seu quiz e comece a coletar dados automaticamente.
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-white">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Visualize Métricas</h3>
            <p className="text-gray-600">
              Acompanhe em tempo real todos os eventos, taxas de conclusão e leads capturados.
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-white">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Otimize Resultados</h3>
            <p className="text-gray-600">
              Use os dados para melhorar seus quizzes e aumentar as conversões.
            </p>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">Recursos</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            'Tracking automático de eventos',
            'Dashboard completo de métricas',
            'Exportação de dados (CSV, TXT, PDF)',
            'Rastreamento de UTM parameters',
            'Captura de leads integrada',
            'Interface responsiva e moderna',
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Segurança */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Segurança</h2>
          <p className="text-gray-600 mb-8">
            Seus dados estão protegidos com criptografia de ponta a ponta e armazenados em servidores seguros.
            Utilizamos Row Level Security (RLS) para garantir que cada usuário acesse apenas seus próprios dados.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Crivus Quiz Analytics ST. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

