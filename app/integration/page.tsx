'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuizStore } from '@/lib/store'
import { supabase } from '@/lib/supabase/client'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function IntegrationPage() {
  const { quizzes, setQuizzes } = useQuizStore()
  const [selectedQuiz, setSelectedQuiz] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao carregar quizzes:', error)
        toast({
          title: 'Erro',
          description: 'Erro ao carregar quizzes',
          variant: 'destructive',
        })
      } else if (data) {
        setQuizzes(data)
        // Selecionar o primeiro quiz automaticamente se houver apenas um
        if (data.length === 1) {
          setSelectedQuiz(data[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSnippet = () => {
    if (!selectedQuiz) return ''
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `<!-- ============================================
  CRIVUS QUIZ ANALYTICS - SNIPPET DE INTEGRAÇÃO
  ============================================
  
  IMPORTANTE PARA SITES ESTÁTICOS/EXTERNOS:
  1. Substitua 'SEU-DOMINIO-AQUI' pela URL completa do seu servidor
     Exemplo: https://seudominio.com ou https://api.seudominio.com
  2. Configure data-page-id para cada página/etapa do quiz
  3. Verifique se o script analytics.js está acessível publicamente
  
  Opções para page_id:
  1. Atributo data-page-id no elemento (recomendado)
  2. Variável window.PAGE_ID (alternativa)
  
  Exemplos de page_id:
  - pergunta_1, pergunta_2, pergunta_3
  - tela_boas_vindas, tela_oferta, tela_resultado
  - etapa_inicial, etapa_intermediaria, etapa_final
  ============================================ -->

<!-- Configurar URL da API (OBRIGATÓRIO para sites externos) -->
<script>
  // IMPORTANTE: Substitua pela URL completa do seu servidor
  window.CRIVUS_API_URL = '${baseUrl}/api/events';
  // Para sites externos, use: 'https://seudominio.com/api/events'
</script>

<!-- Carregar script de analytics -->
<script src="${baseUrl}/analytics.js"></script>
<!-- Se o script estiver em outro domínio, use a URL completa:
<script src="https://seudominio.com/analytics.js"></script>
-->

<!-- Container do Quiz -->
<!-- IMPORTANTE: Atualize data-page-id para cada página/etapa do seu quiz -->
<div data-quiz-id="${selectedQuiz}" data-page-id="pergunta_1">
  
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
  }

  const handleCopy = () => {
    const snippet = getSnippet()
    if (!snippet) {
      toast({
        title: 'Erro',
        description: 'Selecione um quiz primeiro',
        variant: 'destructive',
      })
      return
    }

    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast({
      title: 'Snippet copiado!',
      description: 'Snippet completo copiado com exemplos de múltiplas páginas e page_id configurado!',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integração</h1>
        <p className="text-gray-600 mt-1">Configure o snippet de tracking para seus quizzes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Snippet Universal</CardTitle>
          <CardDescription>
            Adicione este código ao seu quiz para começar a coletar dados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione o Quiz</Label>
            {quizzes.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Você ainda não tem quizzes cadastrados. 
                  <a href="/quizzes" className="underline ml-1">Crie um quiz primeiro</a>.
                </p>
              </div>
            ) : (
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedQuiz && (
            <>
              <div className="space-y-2">
                <Label>Código do Snippet</Label>
                <div className="relative">
                  <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto text-sm">
                    <code>{getSnippet()}</code>
                  </pre>
                  <Button
                    className="absolute top-2 right-2"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-blue-50 rounded-md">
                <h3 className="font-semibold">Como usar:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Adicione o script antes do fechamento da tag &lt;/body&gt; em todas as páginas</li>
                  <li>Adicione o atributo <code className="bg-white px-1 rounded">data-quiz-id</code> ao elemento principal do seu quiz</li>
                  <li>Use <code className="bg-white px-1 rounded">data-track-next="N"</code> em botões de próxima questão (N = número da questão)</li>
                  <li>Use <code className="bg-white px-1 rounded">data-track-finish</code> em botões de finalizar</li>
                  <li>Use <code className="bg-white px-1 rounded">data-track-lead</code> em botões de captura de lead</li>
                  <li><strong>Múltiplas páginas:</strong> O script detecta automaticamente mudanças de página e funciona em SPAs (React, Vue, etc.)</li>
                  <li><strong>Múltiplos quizzes:</strong> Cada quiz deve ter seu próprio <code className="bg-white px-1 rounded">data-quiz-id</code> - o script detecta automaticamente qual usar</li>
                </ol>
              </div>

              <div className="space-y-4 p-4 bg-green-50 rounded-md">
                <h3 className="font-semibold">API JavaScript:</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Você também pode usar a API JavaScript diretamente:
                </p>
                <pre className="p-4 bg-white rounded-md overflow-x-auto text-sm">
                  <code>{`// Próxima questão
window.CrivusQuiz.trackNext(1);

// Finalizar quiz
window.CrivusQuiz.trackFinish();

// Capturar lead
window.CrivusQuiz.trackLead('email@exemplo.com', '11999999999');

// Evento customizado
window.CrivusQuiz.trackEvent('meu_evento', { dados: 'opcionais' });

// Obter informações
const quizId = window.CrivusQuiz.getQuizId();
const pageId = window.CrivusQuiz.getPageId();
const userId = window.CrivusQuiz.getUserId();

// Forçar re-detecção (útil após mudanças dinâmicas no DOM)
window.CrivusQuiz.refresh();`}</code>
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

