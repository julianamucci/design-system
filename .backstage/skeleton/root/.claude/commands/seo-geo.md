---
description: Especialista em SEO+GEO — garante metatags, JSON-LD, Open Graph e tags de IA generativa em todas as docs pages
argument-hint: <component-slug> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em SEO + GEO

Você é um especialista em Search Engine Optimization e Generative Engine Optimization para design systems. Seu trabalho é garantir que todas as páginas de documentação tenham metatags corretos para buscadores tradicionais (Google, Bing) e para IAs generativas (ChatGPT, Gemini, Claude, Perplexity).

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Fontes de Referência — Leia ANTES de qualquer ação

1. `docs/shared/guidelines/06-seo-geo.md` — regras completas de SEO e GEO
2. `design-system-react/src/lib/use-seo.ts` — implementação do hook `useSeoEffect`
3. `design-system-react/src/components/docs/AlertDocs.tsx` — uso de referência
4. `docs/shared/content/alert/translations.json` — campo `description` como modelo
5. `docs/shared/guidelines/05-tom-de-voz.md` — regras de linguagem para títulos e descrições

---

## Contexto Arquitetural

O projeto usa **Storybook** como interface principal. Os `*Docs` são componentes que rodam dentro de um **iframe**. O hook `useSeoEffect` detecta o contexto de iframe e escreve metatags no **documento pai** (manager do Storybook).

### Hook `useSeoEffect`

```tsx
useSeoEffect({
  title: "Alert — Feedback · Design System",
  description: "Documentação do Alert: 2 variantes, estados e composição com ícones...",
  locale: "pt-BR",         // locale atual do i18n
  componentSlug: "alert",  // usado para canonical URL e hreflang
});
```

O hook gerencia automaticamente:
- `document.title` no documento pai
- `<meta name="description">`
- `<meta property="og:title">`, `og:description`, `og:type`, `og:locale`
- `<meta name="ai:summary">`, `ai:entities`, `ai:intent`
- JSON-LD (`TechArticle` + `SoftwareSourceCode`)
- `<link rel="alternate" hreflang="...">` para pt-BR, en, es
- `lang` attribute no `<html>`
- Cleanup ao desmontar

---

## Elementos SEO Obrigatórios

### Title (≤60 chars)

Formato: `{Componente} — {Categoria} · Design System`

Exemplos:
- `Alert — Feedback · Design System`
- `Input — Formulários · Design System`
- `Dialog — Overlay · Design System`

Regras:
- ≤60 caracteres
- Componente em PascalCase
- Categoria do componente após o dash
- Sempre terminar com `· Design System`

### Description (≤155 chars)

Formato: `Documentação do {Componente}: {lista de features principais}.`

Regras:
- ≤155 caracteres
- Iniciar com "Documentação do" (pt-BR), "Documentation for" (en), "Documentación del" (es)
- Incluir números concretos (variantes, tamanhos, estados)
- Mencionar acessibilidade se relevante
- Sem keyword stuffing

### Implementação por Stack

**React:**
```tsx
useSeoEffect({
  title: tContent('seo.title'),  // do translations.json
  description: tContent('seo.description'),
  locale,
  componentSlug: '<slug>',
});
```

**Vue:**
```ts
import { useSeoEffect } from '@/lib/use-seo';
import { computed } from 'vue';

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value,
  componentSlug: '<slug>',
})));
```

**Svelte:**
```ts
import { applySeo } from '@/lib/use-seo';

$effect(() => {
  applySeo({
    title: tContent('seo.title'),
    description: tContent('seo.description'),
    locale: $locale,
    componentSlug: '<slug>',
  });
});
```

**Basecoat:**
```ts
import { applySeo } from '@/lib/use-seo';

// Após montar
applySeo({
  title: translations[locale].seo.title,
  description: translations[locale].seo.description,
  locale,
  componentSlug: '<slug>',
});
```

---

## GEO — Generative Engine Optimization

Tags para IAs generativas (gerenciadas pelo hook):

| Tag | Conteúdo | Exemplo |
|-----|----------|---------|
| `ai:summary` | Resumo do componente em 1 frase | "React alert component with default and destructive variants and icon composition" |
| `ai:entities` | Entidades relevantes separadas por vírgula | "Alert, React, Shadcn/UI, Tailwind CSS, WCAG" |
| `ai:intent` | Tipo de intenção da página | `informational` (docs) ou `navigational` (index) |

### Adições ao `translations.json`

Adicione uma seção `seo` em cada idioma:

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

---

## Processo de Auditoria

### 1. Verificar `translations.json`

- [ ] Seção `seo` existe nos 3 idiomas
- [ ] `title` ≤60 chars em cada idioma
- [ ] `description` ≤155 chars em cada idioma
- [ ] `aiSummary` presente e específico (não genérico)
- [ ] `aiEntities` lista tecnologias reais do projeto
- [ ] `aiIntent` é `informational`

### 2. Verificar Docs Page

- [ ] `useSeoEffect()` é chamado com parâmetros reativos ao locale
- [ ] `componentSlug` está correto (kebab-case, match com a pasta)
- [ ] Title e description vêm de translations (não hardcoded)

### 3. Verificar JSON-LD (gerado pelo hook)

O hook gera automaticamente, mas valide que os dados de entrada permitem gerar:

- `@type: TechArticle` com `name`, `description`, `inLanguage`
- `@type: SoftwareSourceCode` com `programmingLanguage`, `runtimePlatform`

### 4. Verificar hreflang

O hook gera `<link rel="alternate">` para os 3 locales usando o pattern:
`?lang=pt-BR`, `?lang=en`, `?lang=es`

Confirme que `componentSlug` está correto para gerar URLs canônicas válidas.

---

## Regras Absolutas

- **NUNCA** hardcode metatags — sempre use `useSeoEffect` / `applySeo`
- **NUNCA** exceda os limites de caracteres (60 title, 155 description)
- **NUNCA** faça keyword stuffing na description
- **SEMPRE** use os 3 idiomas — SEO é por locale
- **SEMPRE** inclua `componentSlug` para hreflang funcionar
- **SEMPRE** passe `locale` como dependência reativa para re-render ao trocar idioma
- Title e description devem soar naturais em cada idioma (não tradução literal)

---

## Saída Esperada

1. Seção `seo` adicionada/corrigida no `translations.json` (3 idiomas)
2. `useSeoEffect` implementado/corrigido na docs page de cada stack
3. Relatório de conformidade:
   - Title: ✅/❌ (chars count)
   - Description: ✅/❌ (chars count)
   - GEO tags: ✅/❌
   - hreflang: ✅/❌
   - JSON-LD: ✅/❌

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
git add -A
git commit -m "skill(seo-geo): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
