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

1. **`_dev-shared.md`** — padrões compartilhados das 5 stacks. **Esta skill complementa com o que é específico de Svelte 5.**
2. UI primitive: `nortear-design-system-svelte/src/components/ui/<slug>/index.ts` (ou `<slug>/<slug>.svelte`)
3. `docs/shared/content/<slug>/translations.json`
4. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **Svelte 5** + TypeScript (runes API: `$props`, `$state`, `$derived`, `$effect`)
- **Storybook 10** (`@storybook/svelte-vite`)
- **CSS standalone `.nds-*`** (compartilhado em `docs/shared/styles/nds/`) + **bits-ui** (primitivos a11y)
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

### API Reference: o docgen está desligado nesta stack

`.storybook/main.ts` traz `framework.options.docgen: false` — analisar os ~447
arquivos `.svelte` a cada build custava ~4,6 min. Duas consequências que só
aparecem nesta stack:

1. **A aba API Reference sai só do `argTypes`.** Não há extração automática:
   prop que você não declarar não aparece na tabela. Transcreva a `RootProps`
   da lib (`node_modules/bits-ui/dist/bits/<slug>/types.d.ts`) — ver as regras
   gerais em `_dev-shared.md`.

2. **O snippet "Show code" sai errado sem intervenção.** O gerador do
   `@storybook/svelte` monta a tag a partir de `component.__docgen.name`; sem
   docgen ele cai em `component.name`, que é o nome interno da função compilada.
   O resultado exibido é `<wrapper type="single" …/>` — uma tag que ninguém
   consegue importar, com os args da raiz serializados sobre o componente-wrapper
   da story. **Toda Playground precisa de `docs.source.transform`** devolvendo o
   uso real do componente, montado a partir de `storyContext.args`.

   **Armadilha do snippet com `<script>`**: dentro de arquivo `.svelte`, o
   `</script>` em string precisa do escape `<\/script>` — senão o compilador
   fecha o bloco real. As docs pages têm dezenas desses escapes LEGÍTIMOS, e é
   deles que se copia o padrão. Mas o transform vive em `*.stories.ts`, e em
   `.ts` o escape é desnecessário e vira **error** de eslint
   (`no-useless-escape`), que derruba o CI. Em `.ts`: `</script>` sem escape,
   sempre. Aconteceu 3 vezes antes desta nota existir.

---

## Bits UI Specifics

### Prop que não existe é aceita e ignorada em silêncio

Não há erro de tipo nem aviso: o componente monta e simplesmente não faz nada.
Foi assim que `defaultOpen` e `defaultValue` — que **não existem** no bits-ui
nem no vaul-svelte — deixaram overlays e menus fechados em 40+ testes.

A API é sempre o estado bindável: `open`, `value`. Para "começa aberto",
inicialize o bindable:

```svelte
let { defaultOpen = false, open = $bindable(defaultOpen) } = $props();
```

Antes de usar qualquer prop de uma lib, confirme em `node_modules/<lib>/**/types.d.ts`.

### A lib vence o consumidor nas props que ela mesma define

`{...restProps}` não sobrescreve o que o bits-ui define internamente — ele
merge depois. Foi assim que a paginação inteira ficou com
`aria-label="Page N"` **em inglês**, e o trigger do hover-card virou
`role="button"` sendo um `<a>` que navega.

Só o snippet `child` escreve depois do merge:

```svelte
<Primitive.X {...restProps}>
  {#snippet child({ props })}
    <button {...props} aria-label={oNosso}>…</button>
  {/snippet}
</Primitive.X>
```

### O bits-ui não emite `role` no conteúdo dos overlays

Faltavam `role="dialog"` (popover, hover-card), `role="tooltip"` e `role="menu"`.
Ao criar overlay nesta stack, **compare o DOM final com o do Vanilla** — ele é a
referência cross-stack e define os roles à mão. Role adicionado exige os
atributos companheiros (ver `01-acessibilidade.md` §Roles).

### Id entre irmãos portalados vem de contexto, nunca do DOM

`aria-controls`/`aria-labelledby` entre trigger e painel não podem ser
descobertos com `querySelector`: o painel é portalado e só existe enquanto
aberto. O id nasce na raiz e desce por contexto — ver `select-a11y.ts` e
`accordion-a11y.ts`. Um id por instância via `$props.id()`, que só é aceito
como inicializador de declaração no topo do componente.

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

### Estado do wrapper é `$state`, nunca `$derived`

`$derived` é somente leitura e se recalcula: `bind:` não segura a alteração e o
componente não muda de valor. Ressincronize comparando **conteúdo**, não
identidade — os args do Storybook chegam como literal novo a cada render, e
comparar por referência reverte a interação do usuário.

### Sintaxe que não compila

- Comentário `<!-- -->` **não** vai dentro da lista de atributos de um elemento.
- `let meta: Meta` + `type Story = StoryObj` quando o `render` devolve um
  wrapper. `Meta<typeof Componente>` fixa o renderer no primitivo e faz **toda**
  story do arquivo errar no svelte-check. Só use `Meta<typeof X>` quando o
  `render` devolve o próprio X.

---

## Imports da Docs Page

```svelte
<script lang="ts">
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import DOMPurify from 'dompurify';
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
<span>{@html DOMPurify.sanitize($tStore('anatomy.item1'))}</span>

<!-- Loops com #each -->
{#each [1, 2, 3] as i}
  <li>{@html DOMPurify.sanitize($tStore(`usage.guidelines.item${i}`))}</li>
{/each}

<!-- Links internos Storybook -->
onclick={() => (window.top ?? window).location.href = item.path}
```

### Bug comum no Do & Don't

`DocsDoDont` recebe pares via snippets. **Nunca** usar `{#each [1,2] as i}` em um único grid. Container monta dois grids separados.

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-svelte): $ARGUMENTS`.
