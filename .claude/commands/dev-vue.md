---
description: Dev Vue — cria stories, docs pages e exemplos para componentes Vue 3 seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Vue — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Vue 3 para design systems. Crie stories, docs pages e exemplos para componentes Vue.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente

---

## Leituras obrigatórias (antes de começar)

1. **`_dev-shared.md`** — padrões compartilhados das 4 stacks. **Esta skill complementa com o que é específico de Vue 3.**
2. UI primitive: `design-system-vue/src/components/ui/<slug>/index.ts` (ou `<slug>.vue`)
3. `docs/shared/content/<slug>/translations.json`
4. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **Vue 3** + TypeScript (Composition API)
- **Storybook 10** (`@storybook/vue3-vite`)
- **Tailwind CSS 4** + **Reka UI** (primitivos a11y)
- **class-variance-authority** + **lucide-vue-next**
- **i18n via `useTranslation`** — **NUNCA** `useLocaleStore` ou Pinia para locale

> `locale` vem sempre de `useTranslation()`. Pinia existe no projeto mas não gerencia idioma.

---

## Padrões Críticos — Vue no Storybook 10

### Render Function

Sempre usar formato component options com `components`, `setup` e `template`:

```ts
render: (args) => ({
  components: { Button },
  setup() { return { args }; },
  template: '<Button v-bind="args">Botão</Button>',
}),
```

### Cuidado com `argTypes.onClick`

`argTypes: { onClick: { action: 'clicked' } }` injeta um handler nos args que causa `[object Object]` no canvas quando passado via `v-bind="args"`. Usar **só** em stories que testam clique E combinar com `args: { onClick: fn() }`.

```ts
// ✅ stories de variantes (sem teste de clique) — sem argTypes.onClick
args: { variant: 'default', disabled: false }

// ✅ stories com play function que testam clique
args: { variant: 'default', onClick: fn() },
argTypes: { onClick: { action: 'clicked' } }
```

### withAutoDocsTab — bridge React

Docs pages Vue são `.vue` mas `parameters.docs.page` espera React. O `withAutoDocsTab.tsx` faz o bridge com pragma `@jsxImportSource react` obrigatória:

```ts
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import AlertDocs from '@/components/docs/AlertDocs.vue';
parameters: { docs: { page: withAutoDocsTab(AlertDocs) } },
```

### Props de montagem precisam de `:key`

```ts
// ✅ re-renderiza quando control muda
template: `<Collapsible :key="String(args.defaultOpen)" v-bind="args">...</Collapsible>`,
```

### `disabled` propagado ao filho interativo

```ts
// ✅ Trigger e Button ambos
template: `<CollapsibleTrigger :disabled="args.disabled">
  <Button :disabled="args.disabled">...</Button>
</CollapsibleTrigger>`,
```

---

## Imports da Docs Page

```vue
<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/<slug>/translations.json';

// Section containers (15) — todos de @/components/docs/shared/sections/
import DocsHeader from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
// ... + 12 demais (DocsAnatomy, DocsWhenToUse, DocsDoDont, DocsImport, DocsVariants,
//      DocsStates, DocsProps, DocsTokens, DocsAccessibility, DocsRelated, DocsNotes,
//      DocsAnalytics, DocsTestes)

// IMPORTANTE: locale vem de useTranslation, NUNCA de useLocaleStore ou Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations);

// SEO reativo via computed
useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: '<slug>',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/<categoria>' },
    { name: tContent('title') },
  ],
})));

// Page view reativo ao locale
watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: '<slug>',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// Active section + IntersectionObserver — espelhar AlertDocs.vue
const activeSection = ref('demonstracao');
const navGroups = computed(() => /* 4 grupos com IDs das 14 seções, ver AlertDocs.vue */);
</script>
```

> **NUNCA** fazer `useTranslation({ ...uiTranslations, ...componentTranslations })` (spread) — gera bug de chaves duplicadas. Usar **apenas** `componentTranslations`.

---

## Padrões Vue para conteúdo HTML

```vue
<!-- Texto com HTML (anatomy, guidelines) -->
<span v-html="sanitizeHtml(tContent('anatomy.item1'))" />

<!-- Loops -->
<li v-for="i in [1, 2, 3]" :key="i" v-html="sanitizeHtml(tContent(`usage.guidelines.item${i}`))" />

<!-- Links internos Storybook -->
@click="(window.top ?? window).location.href = item.path"
```

### Bug comum no Do & Don't

`DocsDoDont` recebe pares via slots. **Nunca** usar `v-for="i in 2"` em um único grid — produz DO|DO em cima e DON'T|DON'T em baixo. Container monta dois grids separados corretamente.

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-vue): $ARGUMENTS`.
