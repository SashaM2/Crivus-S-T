# 📘 Guia: Como Usar o Script de Tracking em Sites Externos

## ✅ Correções Implementadas

O script `analytics.js` foi melhorado para funcionar em sites HTML externos. As principais melhorias foram:

1. **Detecção melhorada do quiz_id**: Agora procura em múltiplos lugares (URL, elementos, body, html)
2. **Aguarda o DOM carregar**: Funciona mesmo se o script carregar antes do HTML
3. **Múltiplas formas de configurar a URL da API**: Suporta JavaScript, meta tag ou fallback
4. **Event listeners sempre anexados**: Funciona mesmo se o quiz_id não for encontrado imediatamente

## 🚀 Como Usar em um Site HTML Externo

### Opção 1: Configuração via JavaScript (Recomendado)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Meu Site</title>
  
  <!-- IMPORTANTE: Configure a URL da API ANTES de carregar o script -->
  <script>
    window.CRIVUS_API_URL = 'https://seudominio.com/api/events';
  </script>
</head>
<body data-quiz-id="SEU-UUID-DO-QUIZ-AQUI">
  <!-- Seu conteúdo aqui -->
  
  <!-- Carregar o script do Crivus -->
  <script src="https://seudominio.com/analytics.js"></script>
</body>
</html>
```

### Opção 2: Configuração via Meta Tag

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="crivus-api-url" content="https://seudominio.com/api/events">
  <title>Meu Site</title>
</head>
<body data-quiz-id="SEU-UUID-DO-QUIZ-AQUI">
  <!-- Seu conteúdo aqui -->
  
  <!-- Carregar o script do Crivus -->
  <script src="https://seudominio.com/analytics.js"></script>
</body>
</html>
```

### Opção 3: Quiz ID na URL

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Meu Site</title>
  
  <script>
    window.CRIVUS_API_URL = 'https://seudominio.com/api/events';
  </script>
</head>
<body>
  <!-- Seu conteúdo aqui -->
  
  <!-- Carregar o script do Crivus -->
  <script src="https://seudominio.com/analytics.js"></script>
</body>
</html>
```

E na URL do site:
```
https://meusite.com/?quiz_id=SEU-UUID-DO-QUIZ-AQUI
```

## 📍 Onde Colocar o data-quiz-id

O script procura o `quiz_id` nesta ordem de prioridade:

1. **URL**: `?quiz_id=SEU-UUID` (mais confiável)
2. **Qualquer elemento**: `<div data-quiz-id="SEU-UUID">`
3. **Body**: `<body data-quiz-id="SEU-UUID">`
4. **HTML**: `<html data-quiz-id="SEU-UUID">`

## 🎯 Exemplo Completo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Quiz</title>
  
  <!-- Configurar URL da API -->
  <script>
    window.CRIVUS_API_URL = 'https://seudominio.com/api/events';
  </script>
</head>
<body data-quiz-id="c53498ca-2635-4c5c-bcc8-76b6c48e67af">
  <h1>Meu Quiz</h1>
  
  <button data-track-next="1">Próxima Questão 1</button>
  <button data-track-next="2">Próxima Questão 2</button>
  <button data-track-finish>Finalizar Quiz</button>
  
  <form>
    <input type="email" placeholder="Email">
    <input type="tel" placeholder="WhatsApp">
    <button data-track-lead>Enviar</button>
  </form>
  
  <!-- Carregar script do Crivus (sempre no final do body) -->
  <script src="https://seudominio.com/analytics.js"></script>
</body>
</html>
```

## 🔧 API JavaScript

Você também pode usar a API JavaScript diretamente:

```javascript
// Rastrear próxima questão
window.CrivusQuiz.trackNext(1);

// Rastrear finalização
window.CrivusQuiz.trackFinish();

// Rastrear lead
window.CrivusQuiz.trackLead('email@exemplo.com', '11999999999');

// Rastrear evento customizado
window.CrivusQuiz.trackEvent('meu_evento', { 
  custom_data: 'valor' 
});

// Obter User ID
const userId = window.CrivusQuiz.getUserId();
```

## ⚠️ Pontos Importantes

1. **URL da API**: Sempre use a URL completa do seu servidor Next.js
2. **CORS**: Certifique-se de que o servidor permite requisições do seu domínio
3. **Quiz ID**: Deve ser um UUID válido de um quiz existente no banco de dados
4. **Ordem**: Configure `window.CRIVUS_API_URL` ANTES de carregar o script
5. **Posição do script**: Coloque o script no final do `<body>` para melhor performance

## 🐛 Debug

Abra o Console do Navegador (F12) para ver os logs:

- ✅ `Crivus Analytics: Inicializado` - Script carregado
- ✅ `Crivus: quiz_id encontrado: ...` - Quiz ID detectado
- ✅ `Crivus: Evento enviado com sucesso` - Evento salvo
- ⚠️ `Crivus: quiz_id não encontrado` - Verifique o data-quiz-id
- ❌ `Crivus: Erro ao enviar evento` - Verifique a URL da API e CORS

## 📝 Checklist

Antes de usar em produção, verifique:

- [ ] URL da API configurada corretamente
- [ ] Quiz ID válido (UUID de um quiz existente)
- [ ] Script carregando do servidor correto
- [ ] CORS configurado no servidor Next.js
- [ ] Testado no console do navegador (sem erros)

