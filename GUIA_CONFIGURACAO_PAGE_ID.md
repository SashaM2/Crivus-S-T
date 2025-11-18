# 📋 Guia de Configuração do Page ID

Este guia explica como configurar o `page_id` nos sites externos para rastrear abandono por página/etapa.

## 🎯 O que é Page ID?

O `page_id` é um identificador único para cada página/etapa do seu quiz. Ele permite identificar **exatamente onde** o usuário estava quando abandonou o quiz.

## 📝 Como Configurar

### Opção 1: Atributo `data-page-id` no Script Tag (Recomendado)

Adicione o atributo `data-page-id` no elemento que contém o script ou em qualquer elemento HTML:

```html
<!-- Exemplo 1: No script tag -->
<script 
  src="https://seudominio.com/analytics.js" 
  data-quiz-id="c53498ca-2635-4c5c-bcc8-76b6c48e67af"
  data-page-id="pergunta_1">
</script>

<!-- Exemplo 2: Em um elemento container -->
<div data-quiz-id="c53498ca-2635-4c5c-bcc8-76b6c48e67af" data-page-id="pergunta_1">
  <!-- Conteúdo do quiz -->
</div>

<!-- Exemplo 3: No body -->
<body data-quiz-id="c53498ca-2635-4c5c-bcc8-76b6c48e67af" data-page-id="pergunta_1">
  <!-- Conteúdo -->
</body>
```

### Opção 2: Variável Global `window.PAGE_ID`

Defina a variável `window.PAGE_ID` antes de carregar o script:

```html
<script>
  window.PAGE_ID = 'pergunta_1';
</script>
<script src="https://seudominio.com/analytics.js"></script>
```

### Opção 3: Atualizar Dinamicamente

Você pode atualizar o `page_id` dinamicamente quando o usuário navegar entre páginas:

```javascript
// Quando o usuário vai para a próxima pergunta
function irParaPergunta(numero) {
  // Atualizar o atributo
  document.querySelector('[data-quiz-id]').setAttribute('data-page-id', `pergunta_${numero}`);
  
  // OU atualizar a variável global
  window.PAGE_ID = `pergunta_${numero}`;
  
  // Rastrear o evento
  window.CrivusQuiz.trackNext(numero);
}
```

## 🏷️ Convenções de Nomenclatura

Use nomes descritivos e consistentes:

### Exemplos de Page IDs:

- **Perguntas**: `pergunta_1`, `pergunta_2`, `pergunta_3`
- **Etapas**: `etapa_inicial`, `etapa_intermediaria`, `etapa_final`
- **Telas**: `tela_boas_vindas`, `tela_resultado`, `tela_oferta`
- **Formulários**: `formulario_contato`, `formulario_lead`
- **Páginas especiais**: `checkout`, `pagamento`, `obrigado`

### Boas Práticas:

✅ **Use**: `pergunta_1`, `tela_oferta`, `checkout`  
❌ **Evite**: `p1`, `tela1`, `pg1` (menos descritivo)

## 🔄 Exemplo Completo: Quiz Multi-Página

```html
<!DOCTYPE html>
<html>
<head>
  <title>Meu Quiz</title>
</head>
<body data-quiz-id="c53498ca-2635-4c5c-bcc8-76b6c48e67af">
  
  <!-- Página 1: Boas-vindas -->
  <div id="pagina-1" data-page-id="boas_vindas">
    <h1>Bem-vindo ao Quiz!</h1>
    <button onclick="proximaPagina(2)">Começar</button>
  </div>

  <!-- Página 2: Pergunta 1 -->
  <div id="pagina-2" data-page-id="pergunta_1" style="display:none;">
    <h2>Pergunta 1</h2>
    <button onclick="proximaPagina(3)">Próxima</button>
  </div>

  <!-- Página 3: Pergunta 2 -->
  <div id="pagina-3" data-page-id="pergunta_2" style="display:none;">
    <h2>Pergunta 2</h2>
    <button onclick="proximaPagina(4)">Próxima</button>
  </div>

  <!-- Página 4: Oferta -->
  <div id="pagina-4" data-page-id="tela_oferta" style="display:none;">
    <h2>Oferta Especial!</h2>
    <button onclick="capturarLead()">Quero!</button>
  </div>

  <script>
    function proximaPagina(numero) {
      // Esconder página atual
      document.getElementById(`pagina-${numero - 1}`).style.display = 'none';
      
      // Mostrar próxima página
      const proximaPagina = document.getElementById(`pagina-${numero}`);
      proximaPagina.style.display = 'block';
      
      // Atualizar page_id no body
      const pageId = proximaPagina.getAttribute('data-page-id');
      document.body.setAttribute('data-page-id', pageId);
      
      // Rastrear evento
      if (numero > 1) {
        window.CrivusQuiz?.trackNext(numero - 1);
      }
    }

    function capturarLead() {
      window.CrivusQuiz?.trackLead('email@exemplo.com', '11999999999');
    }
  </script>

  <!-- Carregar script de analytics -->
  <script src="https://seudominio.com/analytics.js"></script>
</body>
</html>
```

## 🧪 Testando

Use o arquivo `test-tracking.html` para testar:

1. Abra `test-tracking.html` no navegador
2. Configure o Quiz ID
3. Configure o Page ID (ex: `pergunta_1`)
4. Clique nos botões de teste
5. Verifique no console se os eventos estão sendo enviados com `page_id`

## 📊 Visualizando no Dashboard

Após configurar o `page_id`, você verá no dashboard:

- **Etapa mais abandonada**: Qual `page_id` tem mais abandonos
- **Top 3 etapas mais abandonadas**: As 3 páginas com mais abandonos
- **Abandono por página**: Lista completa de todas as páginas e seus abandonos

## ⚠️ Importante

- Se o `page_id` não for configurado, ele será `null` e o rastreamento de abandono por página não funcionará
- O `page_url` é capturado automaticamente (`window.location.href`)
- Certifique-se de usar o mesmo `page_id` para a mesma página em todas as sessões

## 🆘 Problemas Comuns

### Page ID não está sendo enviado

1. Verifique se o atributo `data-page-id` está presente no HTML
2. Verifique se `window.PAGE_ID` está definido (se usar essa opção)
3. Abra o console do navegador e verifique os logs do analytics.js
4. Verifique se o script analytics.js está carregado corretamente

### Page ID está como `null` no banco

- Certifique-se de que o `page_id` está configurado **antes** de carregar o script analytics.js
- Ou atualize o `page_id` dinamicamente quando necessário

