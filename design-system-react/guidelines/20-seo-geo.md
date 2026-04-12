# SEO e GEO — Search Engine Optimization & Generative Engine Optimization

Este arquivo define as regras para tornar as páginas do projeto encontráveis por mecanismos de busca tradicionais (Google, Bing) e por IAs generativas (ChatGPT, Gemini, Claude, Perplexity). Os dois objetivos se complementam mas têm exigências distintas — este arquivo cobre ambos.

> **Relação com outros arquivos**: title e description são textos voltados ao usuário. Siga as regras de linguagem do arquivo `19-tom-de-voz.md` ao escrevê-los.

---

## Consideração Arquitetural Importante

O projeto é uma **SPA com roteamento baseado em estado** (sem React Router, sem múltiplas páginas HTML). Isso afeta diretamente como o SEO é implementado:

- Cada "página" renderizada em `renderCurrentPage()` é um componente React, não uma URL distinta
- Crawlers de busca têm dificuldade em indexar SPAs que não fazem SSR ou SSG
- A solução prática para este projeto é atualizar `document.title` e as metatags dinamicamente a cada mudança de página

**Implementação dinâmica obrigatória para SPAs:**

```tsx
// Em cada componente de página (ex: ButtonDocs.tsx)
// Adicionar no início do componente, antes do return
useEffect(() => {
  // Atualiza o título da aba
  document.title = "Button — Design System Personalizado";

  // Atualiza a description dinamicamente
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute(
      "content",
      "Documentação completa do componente Button: variantes, estados, acessibilidade e exemplos de código com Shadcn/UI e Tailwind."
    );
  }

  // Restaurar ao desmontar (boa prática)
  return () => {
    document.title = "Design System Personalizado";
  };
}, []);
```

> **Limitação conhecida**: metatags dinâmicas via JavaScript não são indexadas por todos os crawlers. Para indexação completa no futuro, considerar migração para Next.js com SSG por componente — ver `17-system-design.md` para detalhes de escalabilidade.

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
| Componente Button | "Página do Button" | "Button — Componente Shadcn/UI do Design System Personalizado" |
| Componente Dialog | "Dialog - Documentação" | "Dialog — Overlays com Radix UI e Tailwind" |
| HomePage | "Bem-vindo ao Design System" | "Design System Personalizado — Componentes Shadcn/UI" |
| Showcase Form | "Form Components Showcase" | "Componentes de Formulário — Showcase do Design System Personalizado" |

---

### 2. Meta Description (máx. 155 caracteres)

Aparece abaixo do title nos resultados de busca. É o principal argumento para o clique — e uma das primeiras coisas que IAs leem para resumir uma página.

**Regras:**
- Resumir o que o usuário encontra nesta página
- Não iniciar com o mesmo texto do title
- Incluir o que está documentado: variantes, estados, exemplos, acessibilidade
- Tom descritivo, não comercial (diferente de uma landing page de produto)
- Para páginas de componente: descrever o que está documentado, não vender o componente

**Exemplos:**

| Contexto | ❌ Errado | ✅ Correto |
|----------|----------|-----------|
| Button | "O melhor componente de botão para suas interfaces." | "Documentação do Button: 6 variantes, 4 tamanhos, estados interativos, acessibilidade WCAG e exemplos com React Hook Form." |
| Dialog | "Veja como usar o Dialog." | "Como implementar Dialog com Shadcn/UI: composição de subcomponentes, foco gerenciado, variantes de confirmação e exemplos controlados." |
| HomePage | "Conheça nosso design system." | "Design system baseado em Shadcn/UI com Tailwind CSS. Documentação de 50+ componentes com variantes, tokens, acessibilidade e exemplos de código." |

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
| ButtonDocs | "button shadcn tailwind" |
| DialogDocs | "dialog radix ui react" |
| InputDocs | "input formulário react hook form" |
| HomePage | "design system shadcn ui" |
| FormShowcase | "componentes formulário shadcn" |

---

### 4. Palavras-chave Secundárias (até 5)

Variações semânticas e subtópicos da palavra-chave principal. Baseadas nos temas secundários identificados no conteúdo.

**Regras:**
- Não repetir a palavra-chave principal literalmente
- Cobrir: variantes, casos de uso, tecnologias relacionadas, contextos de aplicação
- Para componentes: incluir termos de acessibilidade e integração

**Exemplo para ButtonDocs:**

Palavra-chave principal: `"button shadcn tailwind"`

Secundárias:
- `"botão react acessível"`
- `"button variant outline ghost"`
- `"componente interativo WCAG"`
- `"button com ícone lucide"`
- `"submit button react hook form"`

---

### 5. URL Slug

Identificador da página na URL. Para este projeto SPA, o slug é usado como `path` no estado de roteamento e como referência canônica.

**Regras:**
- Apenas minúsculas
- Palavras separadas por hífen
- Sem artigos, preposições ou conjunções desnecessárias
- Curto e descritivo — reflete a palavra-chave principal
- Para componentes: nome do componente em português ou inglês conforme o padrão do projeto

**Exemplos:**

| Página | ❌ Errado | ✅ Correto |
|--------|----------|-----------|
| Button | `/pagina-do-componente-button` | `/button` |
| Dialog | `/Dialog-Overlay` | `/dialog` |
| Form Showcase | `/showcase-de-formularios` | `/form-showcase` |
| HomePage | `/pagina-inicial` | `/` |

---

## Structured Data — Schema.org (JSON-LD)

O Schema.org é o formato mais confiável para comunicar estrutura de conteúdo para buscadores e IAs. É mais eficaz que as metatags `keywords` para GEO porque usa um vocabulário semântico padronizado e reconhecido por todos os motores de busca.

**Obrigatório para:** HomePage e páginas de componente.

### Para a HomePage

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Design System Personalizado",
  "description": "Design system baseado em Shadcn/UI com Tailwind CSS. Documentação de componentes com variantes, tokens, acessibilidade e exemplos de código.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "programmingLanguage": ["TypeScript", "React", "Tailwind CSS"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "BRL"
  }
}
</script>
```

### Para páginas de componente (ComponentDocs)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "name": "Button — Documentação do Componente",
  "description": "Documentação completa do componente Button com variantes, estados, propriedades e exemplos de código.",
  "keywords": "button, shadcn, tailwind, react, acessibilidade",
  "inLanguage": "pt-BR",
  "isPartOf": {
    "@type": "TechArticle",
    "name": "Design System Personalizado"
  },
  "about": {
    "@type": "SoftwareSourceCode",
    "name": "Button",
    "programmingLanguage": "TypeScript"
  }
}
</script>
```

> **Como inserir em SPA**: injete o JSON-LD dinamicamente via `useEffect` criando um elemento `<script>` no `<head>`, assim como as metatags. Remova o elemento ao desmontar o componente.

---

## Metatags Open Graph e Twitter Cards

Controlam como a página aparece quando compartilhada em redes sociais e mensageiros. Também são lidas por algumas IAs ao acessar links.

```html
<!-- Open Graph (Facebook, LinkedIn, WhatsApp, Discord) -->
<meta property="og:title" content="[Mesmo title ou variação de até 60 chars]" />
<meta property="og:description" content="[Mesma description ou variação de até 155 chars]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="[URL canônica completa]" />
<meta property="og:image" content="[URL da imagem de compartilhamento — 1200x630px]" />
<meta property="og:image:alt" content="[Descrição da imagem para acessibilidade]" />
<meta property="og:site_name" content="Design System Personalizado" />
<meta property="og:locale" content="pt_BR" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Mesmo og:title]" />
<meta name="twitter:description" content="[Mesma og:description]" />
<meta name="twitter:image" content="[Mesma og:image]" />
<meta name="twitter:image:alt" content="[Mesmo og:image:alt]" />
```

**Regras para `og:image`:**
- Dimensões: 1200×630px (proporção 1.91:1)
- Peso máximo: 8MB (recomendado: abaixo de 1MB)
- Formato: JPG ou PNG
- Para este projeto: imagem do componente em destaque ou logo do design system

---

## Metatags GEO — Generative Engine Optimization

Metatags específicas para consumo por IAs generativas. São um padrão emergente — não estão consolidadas como o Schema.org — mas já são lidas por Perplexity, ChatGPT (ao navegar) e outros agentes.

> **Nota**: as metatags `ai:*` abaixo são uma convenção em adoção crescente, não um padrão W3C oficial. Inclua-as como camada adicional, nunca como substituto do Schema.org e das metatags convencionais.

### ai:summary

Resumo descritivo em 1–2 frases. Foco em **o que é** e **para quem serve**. Estilo enciclopédico — como uma IA descreveria a página para outro usuário.

**Regras:**
- Máximo 200 caracteres
- Sem adjetivos de marketing: "melhor", "inovador", "completo"
- Baseado no conteúdo real, não na proposta de valor comercial

```html
<!-- Exemplo para ButtonDocs -->
<meta name="ai:summary" content="Documentação do componente Button do Design System Personalizado, baseado em Shadcn/UI. Cobre variantes, estados, propriedades TypeScript e integração com formulários React." />
```

### ai:entities

Entidades principais mencionadas no conteúdo. Ajuda IAs a entenderem o contexto sem ler o conteúdo completo.

**Regras:**
- Lista separada por vírgulas
- Máximo 10 entidades
- Apenas entidades presentes no conteúdo (componentes, tecnologias, conceitos)
- Sem artigos ou preposições

```html
<!-- Exemplo para ButtonDocs -->
<meta name="ai:entities" content="Button, Shadcn/UI, Tailwind CSS, React, TypeScript, Radix UI, WCAG, React Hook Form, Lucide React, variantes de botão" />
```

### ai:intent

Intenção de busca que a página atende. Orienta IAs sobre o propósito do conteúdo.

**Valores possíveis:**

| Valor | Quando usar |
|-------|-------------|
| `informational` | Conteúdo educativo — o usuário quer aprender |
| `commercial` | O usuário pesquisa soluções antes de adotar |
| `transactional` | O usuário está pronto para agir/instalar/usar |
| `navigational` | O usuário busca uma página ou recurso específico |

**Para este projeto:**
- HomePage, ComponentDocs, Showcase → `informational` (documentação técnica)
- Páginas de onboarding ou instalação → `transactional`

```html
<meta name="ai:intent" content="informational" />
```

---

## Indexação e Robots

Controla quais páginas devem ser indexadas por crawlers.

```html
<!-- Páginas que devem ser indexadas (padrão) -->
<meta name="robots" content="index, follow" />

<!-- Páginas que NÃO devem ser indexadas -->
<meta name="robots" content="noindex, nofollow" />
```

**Para este projeto — regras de indexação:**

| Tipo de página | Indexar? | Justificativa |
|----------------|----------|---------------|
| HomePage | Sim | Entrada principal do projeto |
| ComponentDocs (componentes públicos) | Sim | Conteúdo de referência técnica |
| Showcase de categorias | Sim | Visão geral útil para busca |
| Páginas de tema (ThemingDocs) | Sim | Conteúdo específico e pesquisável |
| Estados intermediários / demos isolados | Não | Sem valor independente de busca |

---

## Template Completo de Implementação

```html
<head>
  <!-- Idioma -->
  <meta http-equiv="content-language" content="pt-BR" />
  <meta name="language" content="Portuguese" />

  <!-- SEO Tradicional -->
  <title>[Title — máx 60 chars]</title>
  <meta name="description" content="[Description — máx 155 chars]" />
  <meta name="keywords" content="[palavra-chave principal], [secundária 1], [secundária 2], [secundária 3], [secundária 4]" />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph -->
  <meta property="og:title" content="[Title ou variação]" />
  <meta property="og:description" content="[Description ou variação]" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="[URL canônica]" />
  <meta property="og:image" content="[URL da imagem 1200x630]" />
  <meta property="og:image:alt" content="[Descrição da imagem]" />
  <meta property="og:site_name" content="Design System Personalizado" />
  <meta property="og:locale" content="pt_BR" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="[Mesmo og:title]" />
  <meta name="twitter:description" content="[Mesma og:description]" />
  <meta name="twitter:image" content="[Mesma og:image]" />
  <meta name="twitter:image:alt" content="[Mesmo og:image:alt]" />

  <!-- GEO — Generative Engine Optimization -->
  <meta name="ai:summary" content="[Resumo descritivo — máx 200 chars]" />
  <meta name="ai:entities" content="[entidade1, entidade2, entidade3, ...]" />
  <meta name="ai:intent" content="[informational | commercial | transactional | navigational]" />

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "name": "[Nome da página]",
    "description": "[Mesma description]",
    "inLanguage": "pt-BR"
  }
  </script>

  <!-- Canonical URL -->
  <link rel="canonical" href="[URL completa da página]" />
</head>
```

---

## Aplicação por Tipo de Página do Projeto

### HomePage

```
Title:       Design System Personalizado — Componentes Shadcn/UI com Tailwind
Description: Documentação de 50+ componentes baseados em Shadcn/UI e Tailwind CSS. Variantes, tokens de design, acessibilidade WCAG e exemplos de código prontos para uso.
Keyword:     design system shadcn tailwind
Secundárias: componentes react typescript, shadcn ui documentação, tailwind design system, componentes acessíveis wcag, radix ui componentes
Slug:        /
ai:intent:   informational
Schema:      SoftwareApplication
```

### ComponentDocs (página de componente individual)

```
Title:       [NomeComponente] — [categoria] · Design System Personalizado
Description: Documentação do [NomeComponente]: [N] variantes, estados interativos, propriedades TypeScript e exemplos de código com Shadcn/UI e Tailwind.
Keyword:     [nome componente] shadcn tailwind
Secundárias: [variantes do componente], [casos de uso], [integração relevante], [termo de acessibilidade], [tecnologia relacionada]
Slug:        /[nome-componente]
ai:intent:   informational
Schema:      TechArticle
```

**Exemplo preenchido — ButtonDocs:**
```
Title:       Button — Formulários · Design System Personalizado
Description: Documentação do Button: 6 variantes, 4 tamanhos, estados disabled e loading, acessibilidade com focus-visible e integração com React Hook Form.
Keyword:     button shadcn tailwind react
Secundárias: botão react acessível, button variant outline, componente submit formulário, button com ícone lucide, WCAG button
Slug:        /button
ai:intent:   informational
```

### Showcase de Categoria

```
Title:       [Categoria] Components — Showcase · Design System Personalizado
Description: Visualização completa de todos os componentes de [Categoria]: variantes, estados e exemplos combinados em uma única referência visual.
Keyword:     [categoria] components shadcn
Secundárias: [componentes da categoria], variantes visuais, design system showcase
Slug:        /[categoria]-showcase
ai:intent:   informational
Schema:      TechArticle
```

---

## Hierarquia de Peso para Buscadores e IAs

Quando há conflito ou limitação de leitura, os elementos são processados nesta ordem de importância:

**Para buscadores (Google, Bing):**
1. `<title>` — peso máximo para ranqueamento
2. Conteúdo da página (H1, H2, texto) — indexado diretamente
3. `<meta name="description">` — influencia o CTR, não o ranking diretamente
4. JSON-LD Schema.org — enriquece os rich snippets
5. `<meta name="keywords">` — peso baixo, ignorado pelo Google desde 2009

**Para IAs generativas:**
1. JSON-LD Schema.org — formato estruturado e semântico preferido
2. `<meta name="ai:summary">` — leitura direta para resumo
3. `<meta name="ai:entities">` — mapeamento de conceitos
4. `<meta property="og:description">` — fallback quando não há ai:summary
5. `<meta name="ai:intent">` — classifica o propósito do conteúdo

> **Conclusão prática**: invista mais tempo no Schema.org e no conteúdo HTML do que nas metatags keywords. Para IAs, o ai:summary bem escrito tem mais impacto do que uma lista longa de keywords.

---

## Checklist de Validação

Antes de considerar o SEO de uma página completo:

**Formato:**
- [ ] Title ≤ 60 caracteres e ≠ H1 literal
- [ ] Description ≤ 155 caracteres e não inicia com o title
- [ ] Sem emojis, aspas tipográficas ou caracteres especiais em nenhum campo
- [ ] Sem datas (exceto se presentes no conteúdo)
- [ ] Slug em minúsculas, sem caracteres especiais, separado por hífen

**Conteúdo:**
- [ ] Informações extraídas do conteúdo real — nada inventado
- [ ] Sem adjetivos vagos ou superlativos
- [ ] Tom segue as regras do arquivo `19-tom-de-voz.md`
- [ ] Palavra-chave principal aparece naturalmente no title e/ou description

**Cobertura:**
- [ ] Metatags SEO tradicionais presentes (title, description, keywords, robots)
- [ ] Open Graph completo (title, description, type, url, image, image:alt, site_name, locale)
- [ ] Twitter Cards presentes
- [ ] Metatags GEO presentes (ai:summary, ai:entities, ai:intent)
- [ ] JSON-LD Schema.org inserido corretamente
- [ ] URL canônica definida

**SPA:**
- [ ] `document.title` atualizado dinamicamente via `useEffect`
- [ ] Metatags `description` e `og:*` atualizadas via `useEffect`
- [ ] JSON-LD injetado e removido corretamente ao montar/desmontar

---

## Ferramentas de Validação

| Ferramenta | O que valida | URL |
|------------|-------------|-----|
| Google Rich Results Test | Schema.org JSON-LD | search.google.com/test/rich-results |
| Open Graph Debugger | Metatags og:* | developers.facebook.com/tools/debug |
| Twitter Card Validator | Twitter Cards | cards-dev.twitter.com/validator |
| SERP Simulator | Title e description como aparecem no Google | nitropack.io/tools/serp-preview |
| Schema Markup Validator | JSON-LD (padrão W3C) | validator.schema.org |