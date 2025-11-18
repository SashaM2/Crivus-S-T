(function() {
  'use strict';

  // Configuração
  // IMPORTANTE: Para funcionar em domínios externos, window.CRIVUS_API_URL deve ser definido
  // com a URL completa (ex: https://seudominio.com/api/events)
  function getApiUrl() {
    // 1. Verificar se foi definido explicitamente (prioridade máxima)
    if (window.CRIVUS_API_URL) {
      return window.CRIVUS_API_URL;
    }
    
    // 2. Tentar encontrar em meta tag (para sites externos)
    if (typeof document !== 'undefined') {
      const metaTag = document.querySelector('meta[name="crivus-api-url"]');
      if (metaTag && metaTag.getAttribute('content')) {
        return metaTag.getAttribute('content');
      }
    }
    
    // 3. Fallback: usar origin do site atual (pode não funcionar em sites externos)
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin + '/api/events';
    }
    
    // 4. Último fallback
    return '/api/events';
  }
  
  const API_URL = getApiUrl();
  const STORAGE_KEY = 'crivus_user_id';
  
  // Log de inicialização para debug
  console.log('Crivus Analytics: Inicializado', { 
    api_url: API_URL,
    has_explicit_url: !!window.CRIVUS_API_URL,
    origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
    is_external_site: API_URL.includes(window.location.origin) === false && !!window.CRIVUS_API_URL
  });
  
  // Aviso se API_URL não está configurada corretamente para sites externos
  if (API_URL === '/api/events' || (!API_URL.includes('http://') && !API_URL.includes('https://'))) {
    console.warn('Crivus: ⚠️ API_URL pode não funcionar em sites externos!');
    console.warn('Crivus: Para sites estáticos/externos, defina window.CRIVUS_API_URL com a URL completa.');
    console.warn('Crivus: Exemplo: window.CRIVUS_API_URL = "https://seudominio.com/api/events";');
  }

  // Gerar ou recuperar user_id
  function getUserId() {
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(STORAGE_KEY, userId);
    }
    return userId;
  }

  // Obter quiz_id da URL ou atributo data-quiz-id
  // Melhorado para funcionar mesmo quando o DOM ainda não está pronto
  // Suporta múltiplos quizzes na mesma página usando o elemento mais próximo
  function getQuizId(contextElement = null) {
    // 1. Tentar da URL primeiro (mais confiável)
    const urlParams = new URLSearchParams(window.location.search);
    const quizIdFromUrl = urlParams.get('quiz_id');
    if (quizIdFromUrl) {
      return quizIdFromUrl;
    }
    
    // 2. Se temos um elemento de contexto (ex: botão clicado), procurar o quiz_id mais próximo
    if (contextElement && document && document.querySelector) {
      // Procurar o elemento com data-quiz-id mais próximo ao elemento clicado
      let current = contextElement;
      while (current && current !== document.body) {
        if (current.hasAttribute && current.hasAttribute('data-quiz-id')) {
          const quizId = current.getAttribute('data-quiz-id');
          if (quizId && quizId !== 'SUBSTITUA-PELO-UUID-DO-QUIZ') {
            return quizId;
          }
        }
        current = current.parentElement;
      }
    }
    
    // 3. Tentar encontrar em qualquer elemento com data-quiz-id
    // Usar querySelectorAll para pegar o primeiro que encontrar
    if (document && document.querySelector) {
      const element = document.querySelector('[data-quiz-id]');
      if (element) {
        const quizId = element.getAttribute('data-quiz-id');
        if (quizId && quizId !== 'SUBSTITUA-PELO-UUID-DO-QUIZ') {
          return quizId;
        }
      }
    }
    
    // 4. Tentar no body
    if (document && document.body) {
      const bodyQuizId = document.body.getAttribute('data-quiz-id');
      if (bodyQuizId && bodyQuizId !== 'SUBSTITUA-PELO-UUID-DO-QUIZ') {
        return bodyQuizId;
      }
    }
    
    // 5. Tentar no html
    if (document && document.documentElement) {
      const htmlQuizId = document.documentElement.getAttribute('data-quiz-id');
      if (htmlQuizId && htmlQuizId !== 'SUBSTITUA-PELO-UUID-DO-QUIZ') {
        return htmlQuizId;
      }
    }
    
    return null;
  }

  // Obter parâmetros UTM
  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source') || null,
      utm_campaign: urlParams.get('utm_campaign') || null
    };
  }

  // Obter page_id seguindo a ordem de prioridade especificada
  // Ordem: 1) data-page-id do script, 2) window.PAGE_ID, 3) qualquer elemento com data-page-id, 4) null
  // Suporta múltiplas páginas usando o elemento mais próximo
  function getPageId(contextElement = null) {
    // 1. Tentar do atributo data-page-id do script (prioridade máxima)
    if (typeof document !== 'undefined') {
      const scriptTag = document.querySelector('script[data-page-id]');
      if (scriptTag) {
        const pageId = scriptTag.getAttribute('data-page-id');
        if (pageId) {
          return pageId;
        }
      }
    }
    
    // 2. Tentar de window.PAGE_ID
    if (typeof window !== 'undefined' && window.PAGE_ID) {
      return window.PAGE_ID;
    }
    
    // 3. Se temos um elemento de contexto, procurar o page_id mais próximo
    if (contextElement && document && document.querySelector) {
      let current = contextElement;
      while (current && current !== document.body) {
        if (current.hasAttribute && current.hasAttribute('data-page-id')) {
          const pageId = current.getAttribute('data-page-id');
          if (pageId) {
            return pageId;
          }
        }
        current = current.parentElement;
      }
    }
    
    // 4. Tentar encontrar em qualquer elemento com data-page-id (fallback)
    if (typeof document !== 'undefined' && document.querySelector) {
      const element = document.querySelector('[data-page-id]');
      if (element) {
        const pageId = element.getAttribute('data-page-id');
        if (pageId) {
          return pageId;
        }
      }
    }
    
    // 5. Tentar no body
    if (typeof document !== 'undefined' && document.body) {
      const bodyPageId = document.body.getAttribute('data-page-id');
      if (bodyPageId) {
        return bodyPageId;
      }
    }
    
    // 6. Tentar no html
    if (typeof document !== 'undefined' && document.documentElement) {
      const htmlPageId = document.documentElement.getAttribute('data-page-id');
      if (htmlPageId) {
        return htmlPageId;
      }
    }
    
    // 7. Retornar null se não existir
    return null;
  }

  // Obter page_url (sempre window.location.href)
  function getPageUrl() {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href;
    }
    return null;
  }

  // Enviar evento
  function trackEvent(event, data = {}, contextElement = null) {
    const quizId = getQuizId(contextElement);
    if (!quizId) {
      console.warn('Crivus: quiz_id não encontrado. Verifique se o atributo data-quiz-id está presente.');
      console.warn('Crivus: Dicas de debug:', {
        url_has_quiz_id: window.location.search.includes('quiz_id'),
        has_data_quiz_id: !!document.querySelector('[data-quiz-id]'),
        quiz_id_value: document.querySelector('[data-quiz-id]')?.getAttribute('data-quiz-id'),
        current_url: window.location.href
      });
      return;
    }

    // Validar API_URL antes de enviar (apenas avisar, não bloquear)
    if (!API_URL || (API_URL === '/api/events' && !window.location.origin)) {
      console.error('Crivus: ⚠️ API_URL pode não estar configurada corretamente!');
      console.error('Crivus: Para sites externos, defina window.CRIVUS_API_URL antes de carregar o script.');
      console.error('Crivus: Exemplo: window.CRIVUS_API_URL = "https://seudominio.com/api/events";');
      // Não retornar aqui - tentar enviar mesmo assim para sites no mesmo domínio
    }

    const payload = {
      user_id: getUserId(),
      quiz_id: quizId,
      event: event,
      page_id: getPageId(contextElement),
      page_url: getPageUrl(),
      ...getUTMParams(),
      ...data
    };

    // Log para debug
    console.log('Crivus: Enviando evento', { event, quiz_id: quizId, api_url: API_URL, payload });

    // IMPORTANTE: sendBeacon não permite definir Content-Type como application/json
    // e o backend precisa receber JSON. Sempre usar fetch com keepalive.
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'cors', // Permitir CORS
      credentials: 'omit', // Não enviar cookies (importante para CORS)
    })
    .then(async response => {
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          errorMessage = err.error || errorMessage;
        } catch (e) {
          // Se não conseguir parsear JSON, usar o status
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then(result => {
      console.log('Crivus: ✅ Evento enviado com sucesso', { event, result });
    })
    .catch(err => {
      // Log detalhado do erro
      const errorMessage = err?.message || err?.toString() || 'Erro desconhecido';
      const errorDetails = {
        event,
        quiz_id: quizId,
        error: errorMessage,
        api_url: API_URL,
        ...(err?.name && { error_type: err.name }),
        ...(err?.stack && { stack: err.stack })
      };
      
      console.error('Crivus: ❌ Erro ao enviar evento', errorDetails);
      
      // Log adicional para debug
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('Crivus: Erro de rede - verifique:');
        console.error('  1. Se a API está acessível:', API_URL);
        console.error('  2. Se CORS está configurado corretamente no servidor');
        console.error('  3. Se window.CRIVUS_API_URL está definido corretamente');
        console.error('  4. Abra o DevTools > Network para ver detalhes da requisição');
      }
    });
  }

  // Rastrear pergunta atual para detectar abandono
  let perguntaAtual = null;

  // Função para anexar event listeners (sempre executar, mesmo sem quiz_id)
  // Melhorado para funcionar com múltiplas páginas e elementos dinâmicos
  function attachEventListeners() {
    // Detectar cliques em elementos com data-track-next
    // Usar event delegation para funcionar com elementos adicionados dinamicamente
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-track-next]');
      if (target) {
        const questionNum = parseInt(target.getAttribute('data-track-next')) || 1;
        perguntaAtual = questionNum; // Atualizar pergunta atual
        // Passar o elemento clicado como contexto para encontrar o quiz_id correto
        trackEvent('next_question', { question: questionNum }, target);
      }

      const finishTarget = e.target.closest('[data-track-finish]');
      if (finishTarget) {
        perguntaAtual = null; // Resetar ao finalizar
        // Passar o elemento clicado como contexto
        trackEvent('finish_quiz', {}, finishTarget);
      }

      const leadTarget = e.target.closest('[data-track-lead]');
      if (leadTarget) {
        const email = leadTarget.getAttribute('data-email') || 
                     leadTarget.closest('form')?.querySelector('input[type="email"]')?.value ||
                     '';
        const whatsapp = leadTarget.getAttribute('data-whatsapp') || 
                        leadTarget.closest('form')?.querySelector('input[type="tel"]')?.value ||
                        '';
        
        if (email || whatsapp) {
          // Passar o elemento clicado como contexto
          trackEvent('lead_captured', {
            lead_data: {
              email: email,
              whatsapp: whatsapp,
              timestamp: new Date().toISOString()
            }
          }, leadTarget);
        }
      }
    });
  }

  // Cache para evitar enviar start_quiz múltiplas vezes na mesma página
  let startQuizSent = false;
  let lastPageUrl = null;

  // Função para tentar enviar start_quiz quando quiz_id estiver disponível
  // Melhorado para detectar mudanças de página (SPA ou navegação normal)
  function trySendStartQuiz() {
    const currentUrl = window.location.href;
    const quizId = getQuizId();
    
    // Se a URL mudou, resetar o flag (nova página)
    if (currentUrl !== lastPageUrl) {
      startQuizSent = false;
      lastPageUrl = currentUrl;
    }
    
    if (quizId && !startQuizSent) {
      console.log('Crivus: quiz_id encontrado:', quizId, 'na página:', currentUrl);
      perguntaAtual = 0; // Iniciar na pergunta 0 (antes da primeira)
      trackEvent('start_quiz', {}, null);
      startQuizSent = true;
      return true;
    }
    return false;
  }

  // Detectar quando o usuário está saindo da página (abandono)
  // Nota: Isso ajuda a identificar abandono, mas o cálculo principal é feito na API
  if (typeof window !== 'undefined') {
    // Detectar saída da página
    window.addEventListener('beforeunload', function() {
      // Tentar enviar evento de abandono (pode não funcionar sempre devido a limitações do navegador)
      // O cálculo principal de abandono é feito na API baseado em quem iniciou mas não finalizou
      if (perguntaAtual !== null && perguntaAtual > 0) {
        // Usar sendBeacon para garantir que seja enviado mesmo ao fechar a página
        const quizId = getQuizId();
        if (quizId) {
          const payload = {
            user_id: getUserId(),
            quiz_id: quizId,
            event: 'next_question', // Usar next_question para rastrear última pergunta
            question: perguntaAtual,
            page_id: getPageId(),
            page_url: getPageUrl(),
            ...getUTMParams()
          };
          
          // sendBeacon é mais confiável para eventos de saída
          // Nota: sendBeacon não aceita JSON diretamente, precisa usar Blob
          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(API_URL, blob);
          }
        }
      }
    });

    // Também detectar quando a página fica oculta (mudança de aba, minimizar, etc)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && perguntaAtual !== null && perguntaAtual > 0) {
        // Página foi ocultada - pode indicar abandono
        // Mas não vamos enviar evento aqui para evitar spam
        // O cálculo de abandono será feito na API
      }
    });
  }

  // Inicializar tracking automático
  // Melhorado para funcionar mesmo quando o script carrega antes do DOM
  // Suporta SPAs e múltiplas páginas
  function init() {
    // Sempre anexar event listeners (não depende de quiz_id)
    attachEventListeners();
    
    // Função auxiliar para tentar inicializar quando o DOM estiver pronto
    function attemptInit() {
      if (trySendStartQuiz()) {
        return true;
      }
      
      // Se não encontrou, aguardar um pouco e tentar novamente
      // Isso ajuda quando o DOM está carregando dinamicamente
      setTimeout(() => {
        if (!trySendStartQuiz()) {
          console.warn('Crivus: ⚠️ quiz_id não encontrado após 500ms.');
          console.warn('Crivus: Verifique se o atributo data-quiz-id está presente no HTML.');
          console.warn('Crivus: Exemplo: <div data-quiz-id="SEU-UUID-AQUI">');
          console.warn('Crivus: Alternativa: defina na URL: ?quiz_id=SEU-UUID-AQUI');
          console.warn('Crivus: Debug info:', {
            url: window.location.href,
            has_data_quiz_id: !!document.querySelector('[data-quiz-id]'),
            quiz_id_value: document.querySelector('[data-quiz-id]')?.getAttribute('data-quiz-id')
          });
        }
      }, 500);
      
      // Tentar novamente após mais tempo (para conteúdo carregado dinamicamente)
      setTimeout(() => {
        if (!trySendStartQuiz()) {
          console.warn('Crivus: ⚠️ quiz_id ainda não encontrado após 1.5s.');
        }
      }, 1500);
      
      return false;
    }
    
    // Verificar estado do documento
    if (document.readyState === 'loading') {
      // DOM ainda está carregando, aguardar
      document.addEventListener('DOMContentLoaded', () => {
        attemptInit();
      });
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
      // DOM já está pronto ou quase pronto
      // Tentar imediatamente
      attemptInit();
      
      // Também aguardar um pouco caso elementos sejam adicionados dinamicamente
      setTimeout(attemptInit, 100);
    } else {
      // Fallback: tentar de qualquer forma
      attemptInit();
    }

    // Detectar mudanças de URL para SPAs (Single Page Applications)
    // Isso permite que o script funcione em aplicações React, Vue, etc.
    let lastUrl = window.location.href;
    
    // Observar mudanças no DOM (para SPAs que mudam o conteúdo)
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        // Verificar se a URL mudou
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          startQuizSent = false; // Resetar para permitir novo start_quiz
          lastPageUrl = lastUrl;
          console.log('Crivus: URL mudou, tentando detectar quiz_id novamente:', lastUrl);
          setTimeout(attemptInit, 100);
        }
      });
      
      // Observar mudanças no body
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
    
    // Também detectar mudanças de URL via popstate (navegação do navegador)
    window.addEventListener('popstate', function() {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        startQuizSent = false;
        lastPageUrl = lastUrl;
        console.log('Crivus: Navegação detectada, tentando detectar quiz_id:', lastUrl);
        setTimeout(attemptInit, 100);
      }
    });
    
    // Para SPAs que usam pushState/replaceState, interceptar essas funções
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        startQuizSent = false;
        lastPageUrl = lastUrl;
        console.log('Crivus: pushState detectado, tentando detectar quiz_id:', lastUrl);
        setTimeout(attemptInit, 100);
      }
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        startQuizSent = false;
        lastPageUrl = lastUrl;
        console.log('Crivus: replaceState detectado, tentando detectar quiz_id:', lastUrl);
        setTimeout(attemptInit, 100);
      }
    };
  }

  // API global
  window.CrivusQuiz = {
    trackNext: function(questionNum, contextElement) {
      trackEvent('next_question', { question: questionNum || 1 }, contextElement || null);
    },
    trackFinish: function(contextElement) {
      trackEvent('finish_quiz', {}, contextElement || null);
    },
    trackLead: function(email, whatsapp, contextElement) {
      trackEvent('lead_captured', {
        lead_data: {
          email: email || '',
          whatsapp: whatsapp || '',
          timestamp: new Date().toISOString()
        }
      }, contextElement || null);
    },
    trackEvent: function(event, data, contextElement) {
      trackEvent(event, data || {}, contextElement || null);
    },
    getUserId: getUserId,
    getQuizId: function(contextElement) {
      return getQuizId(contextElement || null);
    },
    getPageId: function(contextElement) {
      return getPageId(contextElement || null);
    },
    // Função para forçar re-detecção de quiz_id (útil após mudanças dinâmicas no DOM)
    refresh: function() {
      startQuizSent = false;
      lastPageUrl = window.location.href;
      trySendStartQuiz();
    }
  };

  // Inicializar
  init();
})();

