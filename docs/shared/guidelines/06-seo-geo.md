# SEO e GEO — Search Engine Optimization & Generative Engine Optimization

Este arquivo define as regras para tornar as páginas do projeto encontráveis por mecanismos de busca tradicionais (Google, Bing) e por IAs generativas (ChatGPT, Gemini, Claude, Perplexity). Os dois objetivos se complementam mas têm exigências distintas — este arquivo cobre ambos.

> **Relação com outros arquivos**: title e description são textos voltados ao usuário. Siga as regras de linguagem do arquivo `19-tom-de-voz.md` ao escrevê-los.

---

## Contexto Arquitetural — Storybook como Interface Principal

O projeto usa **Storybook** como interface principal de documentação. Os `ComponentDocs` são componentes que rodam dentro de um **iframe** no Storybook. Isso afeta diretamente como o SEO é implementado:

- Cada página de documentação (`*Docs.tsx`) roda dentro de um iframe no Storybook Docs tab
- Para que o título da aba e as metatags sejam atualizados, é necessário escrever no **documento pai** (manager do Storybook), não no documento do iframe
- O hook `useSeoEffect` (`@/lib/use-seo.ts`) detecta automaticamente o contexto de iframe e gerencia tudo isso

**Implementação obrigatória para ComponentDocs:**

```tsx
// Em cada ComponentDocs (ex: AlertDocs.tsx)
// Usar o hook useSeoEffect de @/lib/use-seo.ts
import { useSeoEffect } from '@/lib/use-seo';

export function AlertDocs() {
  useSeoEffect({
    title: "Alert — Feedback · Design System",
    description: "Documentação do Alert: variantes default e destructive, composição com AlertTitle e AlertDescription, acessibilidade WCAG via role='alert'.",
    locale: "pt-BR",
    componentSlug: "alert",
  });

  return ( /* ... */ );
}
```

O hook `useSeoEffect` gerencia internamente:
- `document.title` no documento pai
- `<meta name="description">` e `<meta property="og:*">` no documento pai
- `<meta name="ai:summary">`, `<meta name="ai:entities">`, `<meta name="ai:intent">`
- JSON-LD (TechArticle + SoftwareSourceCode)
- `lang="pt-BR"` no `<html>` do documento pai
- **GA4 `page_view`** — dispara `track('page_view', { page_location, page_title, component_name, locale })` a cada troca de story/locale
- Cleanup ao desmontar o componente

> Ver `STORYBOOK-ARCHITECTURE.md` Seção 9 para detalhes de implementação do hook.

### GA4 no manager, não no iframe

O Google Analytics 4 é carregado **exclusivamente no `.storybook/manager-head.html`** de cada stack, com `send_page_view: false`. O `preview-head.html` (iframe) **não deve carregar gtag.js**.

Motivo: a URL que o navegador mostra é a do manager (`/?path=/docs/ui-accordion--docs`); a URL do iframe é sempre `/iframe.html?...`. Se o GA4 rodasse no iframe, todo `page_view` registraria `iframe.html` como página — foi exatamente o bug encontrado em produção, com 99% dos dados agregados em uma única URL.

**Fluxo correto:**
1. Manager carrega `gtag.js` com `send_page_view: false`
2. `analytics.ts` expõe `track()` que resolve `window.top.gtag` e encaminha o evento para o manager
3. `useSeoEffect` dispara `track('page_view', { page_location: window.top.location.href, page_title, component_name, locale })` após atualizar as metatags
4. Cada story aparece como página distinta no relatório "Páginas e telas" do GA4

**Regras de manutenção:**
- Ao criar uma nova stack do design system, criar `manager-head.html` com o script GA4 antes de criar `preview-head.html`
- Nunca copiar o script GA4 para `preview-head.html`
- Nunca chamar `window.gtag` diretamente nas docs pages — sempre via `track()`

> **Contexto App.tsx**: se a docs page também for usada no sandbox `App.tsx` (fora do Storybook), o `useSeoEffect` detecta a ausência de iframe e escreve no documento corrente normalmente.

---

## Processo Obrigatório Antes de Gerar SEO

Execute esta sequência ao documentar uma nova página:

1. **Ler todo o conteúdo da página** — títulos, descrições, exemplos, CTAs
2. **Identificar a intenção do usuário** — o que a pessoa que chega nesta página quer resolver?
3. **Identificar tema central e temas secundários** — o componente principal e seus contextos de uso
4. **Gerar os elementos SEO** seguindo as regras abaixo
5. **Validar** com o checklist ao final deste arquivo

---

## Regras Fundamentais

❌ **Proibido:**
- Inventar informações que não estejam no conteúdo real da página
- Usar termos vagos ou superlativos: "melhor", "incrível", "perfeito", "revolucionário"
- Keyword stuffing — repetir palavras-chave de forma artificial
- Repetir o H1 literalmente no title
- Iniciar a description com o mesmo texto do title
- Usar emojis, aspas tipográficas (`" "`) ou caracteres especiais
- Incluir datas, exceto quando explicitamente presentes no conteúdo

✅ **Obrigatório:**
- Escrever para humanos — o texto deve fazer sentido fora do contexto técnico
- Refletir exatamente o conteúdo real da página
- Usar linguagem natural, clara e descritiva (ver `19-tom-de-voz.md`)
- Priorizar a intenção de busca sobre o encaixe de palavras-chave

---

## Elementos SEO Obrigatórios

### 1. Title (máx. 60 caracteres)

O title aparece na aba do navegador, nos resultados de busca e quando a página é compartilhada. Deve comunicar o valor da página em uma linha.

**Regras:**
- Incluir a palavra-chave principal de forma natural — não forçada
- Nunca repetir o H1 literalmente (pode ser semelhante, não idêntico)
- Evitar palavras genéricas: "Página", "Site", "Bem-vindo"
- Para páginas de componente: `[Nome do Componente] — [contexto do design system]`
- Para a HomePage: `[Proposta de valor] — [nome do produto]`

**Exemplos:**

| Contexto | ❌ Errado | ✅ Correto |
|----------|----------|-----------|
| Componente Button | "Página do Button" | "Button — Componente Shadcn/UI do Design System" |
| Componente Dialog | "Dialog - Documentação" | "Dialog — Overlays com Radix UI e Tailwind" |
| Foundations/Theming | "Temas do Design System" | "Temas — Sistema de Design com CSS Variables" |
| Showcase Form | "Form Components Showcase" | "Componentes de Formulário — Showcase do Design System" |

---

### 2. Meta Description (máx. 155 caracteres)

Aparece abaixo do title nos resultados de busca. É o principal argumento para o clique — e uma das primeiras coisas que IAs leem para resumir uma página.

**Regras:**
- Resumir o que o usuário encontra nesta página
- Não iniciar com o mesmo texto do title
- Incluir o que está documentado: variantes, estados, exemplos, acessibilidade
- Tom descritivo, não comercial
- Para páginas de componente: descrever o que está documentado, não vender o componente

**Exemplos:**

| Contexto | ❌ Errado | ✅ Correto |
|----------|----------|-----------|
| Button | "O melhor componente de botão." | "Documentação do Button: 6 variantes, 4 tamanhos, estados interativos, acessibilidade WCAG e exemplos com React Hook Form." |
| Dialog | "Veja como usar o Dialog." | "Como implementar Dialog com Shadcn/UI: composição de subcomponentes, foco gerenciado, variantes de confirmação e exemplos controlados." |

---

### 3. Palavra-chave Principal

Representa a intenção de busca mais direta que a página atende. Extraída do conteúdo — nunca inventada.

**Regras:**
- 2 a 4 palavras
- Deve aparecer naturalmente no title e/ou na description
- Para componentes: nome do componente + contexto tecnológico

**Exemplos por tipo de página:**

| Página | Palavra-chave principal |
|--------|------------------------|
| AlertDocs | "alert shadcn tailwind" |
| DialogDocs | "dialog radix ui react" |
| ThemingDocs | "temas css variables design system" |

---

### 4. Palavras-chave Secundárias (até 5)

Variações semânticas e subtópicos da palavra-chave principal. Baseadas nos temas secundários identificados no conteúdo.

**Regras:**
- Não repetir a palavra-chave principal literalmente
- Cobrir: variantes, casos de uso, tecnologias relacionadas, contextos de aplicação
- Para componentes: incluir termos de acessibilidade e integração

---

### 5. URL Slug

Para este projeto, o slug é usado como referência canônica e como identificador de componente no Storybook (`componentSlug` no `useSeoEffect`).

**Regras:**
- Apenas minúsculas
- Palavras separadas por hífen
- Sem artigos, preposições ou conjunções desnecessárias
- Curto e descritivo — reflete a palavra-chave principal

**Exemplos:**

| Página | ❌ Errado | ✅ Correto |
|--------|----------|-----------|
| Button | `pagina-do-componente-button` | `button` |
| Dialog | `Dialog-Overlay` | `dialog` |
| Form Showcase | `showcase-de-formularios` | `form-showcase` |
| Theming | `temas-do-design-system` | `theming` |

---

## Structured Data — Schema.org (JSON-LD)

O Schema.org é o formato mais confiável para comunicar estrutura de conteúdo para buscadores e IAs. Mais eficaz que metatags `keywords` porque usa um vocabulário semântico padronizado.

O `useSeoEffect` injeta automaticamente o JSON-LD correto conforme o tipo de página. Para pages de componente, o tipo é `TechArticle + SoftwareSourceCode`:

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "name": "Button — Documentação do Componente",
  "description": "Documentação completa do Button com variantes, estados e exemplos.",
  "keywords": "button, shadcn, tailwind, react, acessibilidade",
  "inLanguage": "pt-BR",
  "about": {
    "@type": "SoftwareSourceCode",
    "name": "Button",
    "programmingLanguage": "TypeScript"
  }
}
```

---

## Metatags Open Graph e Twitter Cards

Controlam como a página aparece quando compartilhada em redes sociais e mensageiros. Gerenciadas pelo `useSeoEffect`.

```html
<meta property="og:title" content="[title ou variação]" />
<meta property="og:description" content="[description ou variação]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="[URL canônica]" />
<meta property="og:site_name" content="Design System" />
<meta property="og:locale" content="pt_BR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[mesmo og:title]" />
<meta name="twitter:description" content="[mesma og:description]" />
```

---

## Metatags GEO — Generative Engine Optimization

Metatags específicas para consumo por IAs generativas. Gerenciadas pelo `useSeoEffect`.

> **Nota**: as metatags `ai:*` são uma convenção em adoção crescente, não um padrão W3C oficial. Inclua-as como camada adicional, nunca como substituto do Schema.org.

### ai:summary

Resumo descritivo em 1–2 frases. Máximo 200 caracteres. Estilo enciclopédico.

```html
<meta name="ai:summary" content="Documentação do Button do Design System, baseado em Shadcn/UI. Cobre variantes, estados, propriedades TypeScript e integração com formulários React." />
```

### ai:entities

Entidades principais. Lista separada por vírgulas, máximo 10.

```html
<meta name="ai:entities" content="Button, Shadcn/UI, Tailwind CSS, React, TypeScript, Radix UI, WCAG, React Hook Form, Lucide React, variantes de botão" />
```

### ai:intent

Intenção de busca da página.

| Valor | Quando usar |
|-------|-------------|
| `informational` | Documentação técnica — o usuário quer aprender |
| `transactional` | O usuário está pronto para agir/instalar/usar |
| `navigational` | O usuário busca uma página específica |

Para este projeto: ComponentDocs, Showcase, Foundations → `informational`.

---

## Indexação e Robots

| Tipo de página | Indexar? |
|----------------|----------|
| ComponentDocs (componentes públicos) | Sim |
| Showcase de categorias | Sim |
| Foundations (ThemingDocs, etc.) | Sim |
| Canvas stories individuais | Não |

---

## Aplicação por Tipo de Página do Projeto

### ComponentDocs

```
Title:       [NomeComponente] — [categoria] · Design System
Description: Documentação do [NomeComponente]: [N] variantes, estados interativos, propriedades TypeScript e exemplos de código.
Keyword:     [nome componente] shadcn tailwind
Slug:        [nome-componente]
ai:intent:   informational
Schema:      TechArticle
```

**Exemplo — AlertDocs:**
```
Title:       Alert — Feedback · Design System
Description: Documentação do Alert: variantes default e destructive, composição com AlertTitle e AlertDescription, acessibilidade WCAG via role='alert'.
Keyword:     alert shadcn tailwind react
Slug:        alert
ai:intent:   informational
```

### Foundations Page (ThemingDocs, ThemeColorsDocs, etc.)

```
Title:       [Tema da Página] — Foundations · Design System
Description: [Descrição do que está documentado].
Keyword:     [tema] design system
Slug:        [tema]
ai:intent:   informational
Schema:      TechArticle
```

### Showcase de Categoria

```
Title:       [Categoria] Components — Showcase · Design System
Description: Visualização completa de todos os componentes de [Categoria]: variantes, estados e exemplos combinados.
Keyword:     [categoria] components shadcn
Slug:        [categoria]-showcase
ai:intent:   informational
```

---

## Hierarquia de Peso para Buscadores e IAs

**Para buscadores (Google, Bing):**
1. `<title>` — peso máximo para ranqueamento
2. Conteúdo da página (H1, H2, texto)
3. `<meta name="description">` — influencia o CTR
4. JSON-LD Schema.org — enriquece os rich snippets
5. `<meta name="keywords">` — ignorado pelo Google

**Para IAs generativas:**
1. JSON-LD Schema.org — formato estruturado preferido
2. `<meta name="ai:summary">` — leitura direta para resumo
3. `<meta name="ai:entities">` — mapeamento de conceitos
4. `<meta property="og:description">` — fallback
5. `<meta name="ai:intent">` — classifica o propósito

---

## Checklist de Validação

**Conteúdo:**
- [ ] Title ≤ 60 caracteres e ≠ H1 literal
- [ ] Description ≤ 155 caracteres e não inicia com o title
- [ ] Sem emojis, aspas tipográficas ou caracteres especiais
- [ ] Sem datas (exceto se no conteúdo)
- [ ] Slug em minúsculas, separado por hífen
- [ ] Informações extraídas do conteúdo real — nada inventado
- [ ] Sem adjetivos vagos ou superlativos
- [ ] Palavra-chave principal aparece naturalmente no title e/ou description

**Implementação:**
- [ ] `useSeoEffect` chamado no topo do ComponentDocs com `{ title, description, locale, componentSlug }`
- [ ] `componentSlug` corresponde ao slug definido (ex: `"button"`)
- [ ] `locale` definido corretamente (ex: `"pt-BR"`)

---

## Ferramentas de Validação

| Ferramenta | O que valida |
|------------|-------------|
| Google Rich Results Test | Schema.org JSON-LD |
| Open Graph Debugger | Metatags og:* |
| Twitter Card Validator | Twitter Cards |
| Schema Markup Validator | JSON-LD (padrão W3C) |
