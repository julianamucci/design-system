---
description: Especialista em SEO+GEO — garante metatags, JSON-LD, Open Graph e tags de IA generativa em todas as docs pages
argument-hint: <component-slug> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em SEO + GEO

Você é um especialista em SEO e GEO para design systems. Seu trabalho é garantir que as docs pages tenham metatags corretos para buscadores tradicionais e IAs generativas.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Contexto Arquitetural

O projeto usa **Storybook** como interface principal. Os `*Docs` rodam dentro de um **iframe**. O hook `useSeoEffect` detecta o contexto de iframe e escreve metatags no **documento pai** (manager do Storybook), garantindo que título da aba e metatags sejam atualizados corretamente.

O GA4 vive **apenas no manager** (`manager-head.html`, nunca em `preview-head.html`). `track()` encaminha para `window.top.gtag`. `useSeoEffect` dispara `page_view` no GA4 do manager a cada troca de story/locale.

### Assinatura do hook

```tsx
// React
useSeoEffect({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale,                    // reativo ao locale atual
  componentSlug: '<slug>',   // usado para hreflang e canonical URL
});

// Vue — requer computed() para reatividade
useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value,
  componentSlug: '<slug>',
})));

// Svelte / Basecoat — applySeo() dentro de $effect ou após montar
applySeo({ title, description, locale: $locale, componentSlug: '<slug>' });
```

O hook gerencia automaticamente: `document.title`, `<meta description>`, Open Graph, JSON-LD (`TechArticle` + `SoftwareSourceCode`), `hreflang` para pt-BR/en/es, `ai:summary`/`ai:entities`/`ai:intent`, e `page_view` no GA4. Se title/description/locale/componentSlug estão corretos, todo o resto está correto.

---

## Elementos SEO Obrigatórios

### Title (≤60 chars)

Formato: `{Componente} — {Categoria} · Design System`

- `Alert — Feedback · Design System`
- `Input — Formulários · Design System`

Regras: componente em PascalCase, categoria após o dash, sempre terminar com `· Design System`.

### Description (≤155 chars)

Formato: `Documentação do {Componente}: {lista de features principais}.`

- Iniciar com "Documentação do" (pt-BR), "Documentation for" (en), "Documentación del" (es)
- Incluir números concretos (variantes, tamanhos, estados)
- Sem keyword stuffing

### Seção `seo` no `translations.json`

Obrigatória nos 3 idiomas:

```json
{
  "pt-BR": {
    "seo": {
      "title": "Alert — Feedback · Design System",
      "description": "Documentação do Alert: 2 variantes (default, destructive), composição com ícone, título e descrição, acessibilidade WCAG.",
      "aiSummary": "Componente Alert com 2 variantes visuais, composição via AlertTitle/AlertDescription, suporte a ícones Lucide e conformidade WCAG 2.1 AA.",
      "aiEntities": "Alert, React, Shadcn/UI, Tailwind CSS, WCAG 2.1, class-variance-authority",
      "aiIntent": "informational"
    }
  }
}
```

`aiSummary` deve ser específico (não genérico). `aiIntent` é sempre `informational` para docs pages.

---

## Processo de Auditoria

### Passo 1 — Coletar em paralelo

Dispare em paralelo no mesmo turno:

- `Read` de `docs/shared/content/<slug>/translations.json`
- `Glob` de `design-system-react/src/components/docs/*<Slug>Docs.tsx`
- `Glob` de `design-system-vue/src/components/docs/*<Slug>Docs.vue`
- `Glob` de `design-system-svelte/src/components/docs/*<Slug>Docs.svelte`
- `Glob` de `nortear-design-system/src/components/docs/*<Slug>Docs.ts`

Depois leia as docs pages encontradas (em paralelo) para verificar o `useSeoEffect`.

### Passo 2 — Verificar `translations.json`

- [ ] Seção `seo` existe nos 3 idiomas (pt-BR, en, es)
- [ ] `title` ≤60 chars em cada idioma
- [ ] `description` ≤155 chars em cada idioma
- [ ] `aiSummary` presente e específico ao componente
- [ ] `aiEntities` lista tecnologias reais do projeto
- [ ] `aiIntent` é `"informational"`

### Passo 3 — Verificar docs pages

Para cada stack no escopo:

- [ ] `useSeoEffect` / `applySeo` é chamado com parâmetros reativos ao locale
- [ ] `title` e `description` vêm de `tContent('seo.title')` / `tContent('seo.description')` — não hardcoded
- [ ] `componentSlug` está correto (kebab-case, match com a pasta do componente)
- [ ] Vue: recebe `computed()` (não objeto literal — quebraria reatividade ao trocar locale)
- [ ] Svelte: chamado dentro de `$effect()` com `return cleanup`

### Passo 4 (condicional) — Verificar infraestrutura GA4

Execute apenas se suspeitar de problema de infraestrutura (sintoma: todos os eventos aparecem como `/iframe.html` no GA4):

```
Grep "googletagmanager.com" em design-system-*/storybook/manager-head.html → deve existir
Grep "googletagmanager.com" em design-system-*/storybook/preview-head.html → deve estar ausente
Grep "window.top" em design-system-*/src/lib/analytics.ts → deve existir
Grep "page_view" em design-system-*/src/lib/use-seo.ts → deve existir
```

Use 4 `Grep` em paralelo por check — não loops bash seriais.

---

## Regras Absolutas

- **NUNCA** hardcode metatags — sempre use `useSeoEffect` / `applySeo`
- **NUNCA** exceda os limites de caracteres (60 title, 155 description)
- **SEMPRE** 3 idiomas — SEO é por locale
- **SEMPRE** `locale` como dependência reativa (não estático)
- Title e description devem soar naturais em cada idioma (não tradução literal)

---

## Saída Esperada

1. Seção `seo` adicionada/corrigida no `translations.json` (3 idiomas)
2. `useSeoEffect`/`applySeo` implementado/corrigido em cada docs page no escopo
3. Relatório de conformidade:

```
| Stack    | seo no JSON | title ≤60 | desc ≤155 | useSeoEffect reativo |
|----------|-------------|-----------|-----------|----------------------|
| React    | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
| Vue      | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
| Svelte   | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
| Basecoat | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
```

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
git add -A
git commit -m "skill(seo-geo): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
