---
description: Dev Svelte — cria stories, docs pages e exemplos para componentes Svelte 5 seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Svelte — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Svelte 5 para design systems. Crie stories, docs pages e exemplos para componentes Svelte.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente

---

## Leituras obrigatórias (antes de começar)

1. **`_dev-shared.md`** — padrões compartilhados das 4 stacks. **Esta skill complementa com o que é específico de Svelte 5.**
2. UI primitive: `design-system-svelte/src/components/ui/<slug>/index.ts` (ou `<slug>/<slug>.svelte`)
3. `docs/shared/content/<slug>/translations.json`
4. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **Svelte 5** + TypeScript (runes API: `$props`, `$state`, `$derived`, `$effect`)
- **Storybook 10** (`@storybook/svelte-vite`)
- **Tailwind CSS 4** + **bits-ui** (primitivos a11y)
- **class-variance-authority** + **lucide-svelte**

---

## Padrão obrigatório — Wrapper `<ComponentName>Story.svelte`

Storybook 10 para Svelte 5 **não** suporta `slot` na render function — `SvelteStoryResult` aceita só `Component`, `props` e `decorator`. Para componentes que precisam de children, criar um wrapper:

```svelte
<!-- ComponentStory.svelte -->
<script lang="ts">
  import { Component, type ComponentVariant } from '@/components/ui/<slug>';
  let { label = 'Label', variant = 'default' as ComponentVariant, disabled = false, ...rest } = $props();
</script>

<Component {variant} {disabled} {...rest}>
  {@html label}
</Component>
```

`{@html label}` (não `{label}`) é obrigatório para suportar SVG inline no label.

### Uso nas Stories

```ts
import { Component } from '@/components/ui/<slug>';
import ComponentStory from './ComponentStory.svelte';

// Story principal — component real para argTypes, wrapper para render
const meta = {
  title: 'UI/Component',
  component: Component,
  args: { variant: 'default', disabled: false, onClick: fn() },
} satisfies Meta<typeof Component>;

export const Playground: Story = {
  render: (args) => ({ Component: ComponentStory, props: { ...args, label: 'Component' } }),
};

// Sub-stories — wrapper direto no meta
const variantsMeta = {
  title: 'UI/Component/Variantes',
  component: ComponentStory,
  args: { label: 'Botão', variant: 'default' },
} satisfies Meta<typeof ComponentStory>;
```

---

## Bits UI Specifics

### `open` é bindável (não `defaultOpen`)

```svelte
<!-- ✅ Bits UI bind -->
<Collapsible bind:open>
  <CollapsibleTrigger {disabled}>...</CollapsibleTrigger>
</Collapsible>
```

### Props de montagem precisam de `{#key}`

```svelte
<!-- ✅ re-monta quando control muda -->
{#key open}
  <Collapsible {open} {disabled}>
    <CollapsibleTrigger {disabled}>...</CollapsibleTrigger>
  </Collapsible>
{/key}
```

### `disabled` propagado ao filho

```svelte
<!-- ✅ Trigger e Button ambos -->
<CollapsibleTrigger {disabled}>
  <Button {disabled}>...</Button>
</CollapsibleTrigger>
```

---

## Imports da Docs Page

```svelte
<script lang="ts">
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/<slug>/translations.json';

  // Section containers (15) — todos de @/components/docs/shared/sections/
  import DocsHeader from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  // ... + 12 demais (DocsAnatomy, DocsWhenToUse, DocsDoDont, DocsImport, DocsVariants,
  //      DocsStates, DocsProps, DocsTokens, DocsAccessibility, DocsRelated, DocsNotes,
  //      DocsAnalytics, DocsTestes)

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),  // ⚠️ NUNCA `${t('title')} — ${t('category')}` — usar t('seo.title') direto
      description: t('seo.description'),
      locale: l,
      componentSlug: '<slug>',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/<categoria>' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: '<slug>',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  let activeSection = $state('demonstracao');
  function handleSectionChange(id: string) {
    activeSection = id;
    track('docs_section_viewed', { component_name: '<slug>', section_id: id, locale: $locale });
  }
</script>
```

> **CRÍTICO**: usar `t('seo.title')` direto, **NUNCA** template literal `\`${t('title')} — ${t('category')}\``. Bug recorrente do dev-svelte detectado em separator/skeleton/sonner — corrigido manualmente após o fato.

---

## Padrões Svelte para conteúdo HTML

```svelte
<!-- Texto com HTML (anatomy, guidelines) -->
<span>{@html sanitizeHtml($tStore('anatomy.item1'))}</span>

<!-- Loops com #each -->
{#each [1, 2, 3] as i}
  <li>{@html sanitizeHtml($tStore(`usage.guidelines.item${i}`))}</li>
{/each}

<!-- Links internos Storybook -->
onclick={() => (window.top ?? window).location.href = item.path}
```

### Bug comum no Do & Don't

`DocsDoDont` recebe pares via snippets. **Nunca** usar `{#each [1,2] as i}` em um único grid. Container monta dois grids separados.

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-svelte): $ARGUMENTS`.
