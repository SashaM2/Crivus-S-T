# 📊 Guia Completo: Como Usar Parâmetros UTM

## 🎯 O que são Parâmetros UTM?

UTM (Urchin Tracking Module) são parâmetros que você adiciona na URL para rastrear de onde vêm seus visitantes. O sistema **captura automaticamente** esses parâmetros quando o usuário acessa seu quiz.

## ✅ Parâmetros Suportados

O sistema rastreia automaticamente:
- `utm_source` - Origem do tráfego (ex: google, facebook, email)
- `utm_campaign` - Nome da campanha (ex: black-friday-2024)

## 🔗 Como Adicionar UTM nos Links

### Formato Básico

```
URL_DO_SEU_QUIZ?quiz_id=SEU_QUIZ_ID&utm_source=ORIGEM&utm_campaign=NOME_DA_CAMPANHA
```

### Exemplos Práticos

#### 1. Link para Google Ads
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=google&utm_campaign=ads-promocao-verao
```

#### 2. Link para Facebook/Instagram
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=facebook&utm_campaign=post-instagram-janeiro
```

#### 3. Link para Email Marketing
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=email&utm_campaign=newsletter-semanal-01
```

#### 4. Link para WhatsApp
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=whatsapp&utm_campaign=grupo-vip
```

#### 5. Link para YouTube
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=youtube&utm_campaign=video-tutorial
```

## 📝 Convenções de Nomenclatura

### utm_source (Origem)
Use nomes descritivos e consistentes:

**✅ BOM:**
- `google` - Tráfego do Google
- `facebook` - Tráfego do Facebook
- `instagram` - Tráfego do Instagram
- `email` - Tráfego de email
- `whatsapp` - Tráfego do WhatsApp
- `youtube` - Tráfego do YouTube
- `linkedin` - Tráfego do LinkedIn
- `twitter` - Tráfego do Twitter
- `site-proprio` - Tráfego do seu próprio site
- `parceiro-xyz` - Tráfego de parceiros

**❌ EVITE:**
- `teste` - Muito genérico
- `123` - Não descritivo
- `abc` - Sem significado

### utm_campaign (Campanha)
Use nomes que identifiquem a campanha específica:

**✅ BOM:**
- `black-friday-2024` - Campanha Black Friday
- `lancamento-produto-x` - Lançamento de produto
- `promocao-janeiro` - Promoção de janeiro
- `newsletter-semanal-01` - Newsletter semanal
- `video-tutorial-01` - Vídeo tutorial
- `parceria-empresa-xyz` - Parceria com empresa

**❌ EVITE:**
- `campanha1` - Não descritivo
- `test` - Muito genérico
- `abc123` - Sem significado

## 🛠️ Como Criar Links com UTM

### Método 1: Manualmente

1. Pegue a URL base do seu quiz:
   ```
   https://seusite.com/quiz?quiz_id=abc123
   ```

2. Adicione os parâmetros UTM:
   ```
   https://seusite.com/quiz?quiz_id=abc123&utm_source=google&utm_campaign=promocao-verao
   ```

### Método 2: Gerador de Links UTM

Use ferramentas online como:
- [Google Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/)
- [UTM.io](https://utm.io/)

### Método 3: Template de Link

Crie um template e substitua os valores:

```
https://seusite.com/quiz?quiz_id=SEU_QUIZ_ID&utm_source={ORIGEM}&utm_campaign={CAMPANHA}
```

## 📊 Como Visualizar os Dados no Dashboard

1. **Acesse o Dashboard**
   - Vá para `/dashboard`

2. **Use os Filtros UTM**
   - **UTM Source**: Filtre por origem (ex: "google", "facebook")
   - **UTM Campaign**: Filtre por campanha (ex: "black-friday-2024")

3. **Visualize as Métricas**
   - Total de iniciados por origem/campanha
   - Taxa de conversão por campanha
   - Leads capturados por origem
   - Comparação entre campanhas

## 🎯 Casos de Uso Práticos

### Caso 1: Campanha no Google Ads

**Link:**
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=google&utm_campaign=ads-promocao-verao
```

**No Dashboard:**
- Filtre por `utm_source=google` para ver todos os resultados do Google
- Filtre por `utm_campaign=ads-promocao-verao` para ver resultados específicos dessa campanha

### Caso 2: Post no Instagram

**Link:**
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=instagram&utm_campaign=post-promocao-janeiro
```

**No Dashboard:**
- Veja quantos usuários vieram do Instagram
- Compare com outras origens

### Caso 3: Email Marketing

**Link:**
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=email&utm_campaign=newsletter-semanal-01
```

**No Dashboard:**
- Meça a eficácia do email marketing
- Compare diferentes newsletters

## ⚠️ Dicas Importantes

### 1. Use Sempre UTM
Sempre adicione parâmetros UTM nos links que você compartilha:
- ✅ Links em redes sociais
- ✅ Links em emails
- ✅ Links em anúncios pagos
- ✅ Links compartilhados no WhatsApp
- ✅ Links em vídeos do YouTube

### 2. Seja Consistente
Use os mesmos nomes para as mesmas origens:
- ✅ `facebook` (sempre minúsculo)
- ❌ `Facebook`, `FACEBOOK`, `fb` (inconsistente)

### 3. Use Hífens
Use hífens em vez de espaços ou underscores:
- ✅ `black-friday-2024`
- ❌ `black_friday_2024` ou `black friday 2024`

### 4. URLs Curtas
Se usar encurtadores de URL (bit.ly, tinyurl), adicione UTM antes de encurtar:
```
1. Crie: https://seusite.com/quiz?quiz_id=abc&utm_source=google&utm_campaign=promo
2. Depois encurte: bit.ly/xyz123
```

## 🔍 Verificando se Funcionou

1. **Acesse seu quiz com UTM:**
   ```
   https://seusite.com/quiz?quiz_id=abc123&utm_source=teste&utm_campaign=teste-campanha
   ```

2. **Abra o Console do Navegador (F12)**
   - Procure por logs do Crivus Analytics
   - Você verá os parâmetros UTM sendo enviados

3. **Verifique no Dashboard:**
   - Acesse o Dashboard
   - Use os filtros UTM
   - Veja se os eventos aparecem com os parâmetros corretos

## 📱 Exemplos para Diferentes Plataformas

### Google Ads
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=google&utm_campaign=ads-campanha-01
```

### Facebook Ads
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=facebook&utm_campaign=ads-promocao-verao
```

### Instagram Stories
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=instagram&utm_campaign=stories-promocao
```

### Email (Mailchimp, RD Station, etc)
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=email&utm_campaign=newsletter-janeiro
```

### WhatsApp
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=whatsapp&utm_campaign=grupo-vip
```

### YouTube (Descrição do Vídeo)
```
https://seusite.com/quiz?quiz_id=abc123&utm_source=youtube&utm_campaign=video-tutorial-01
```

## 🎓 Resumo Rápido

1. **Adicione UTM em todos os links** que você compartilha
2. **Use nomes descritivos** e consistentes
3. **Filtre no Dashboard** para ver resultados por origem/campanha
4. **Compare campanhas** para otimizar seus resultados

## ❓ Dúvidas Frequentes

**P: Preciso adicionar UTM em todos os links?**
R: Sim! Quanto mais links com UTM, melhor você consegue rastrear a origem do tráfego.

**P: O que acontece se não usar UTM?**
R: Os eventos ainda serão registrados, mas você não saberá de onde vieram os usuários.

**P: Posso usar mais de 2 parâmetros UTM?**
R: O sistema atualmente rastreia apenas `utm_source` e `utm_campaign`, mas você pode adicionar outros (como `utm_medium`, `utm_term`) na URL - eles não serão salvos, mas não causam problemas.

**P: Os parâmetros UTM aparecem na URL?**
R: Sim, eles aparecem na barra de endereço do navegador. Isso é normal e esperado.

**P: Como saber qual campanha está funcionando melhor?**
R: Use os filtros no Dashboard para comparar diferentes campanhas e ver qual tem melhor taxa de conversão.

