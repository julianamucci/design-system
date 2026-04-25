---
description: Dev Svelte — cria stories, docs pages e exemplos para componentes Svelte 5 seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Svelte — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Svelte 5 para design systems. Seu trabalho é criar stories, docs pages e exemplos para componentes Svelte, seguindo rigorosamente os padrões do projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)

---

## Leituras obrigatórias — leia em paralelo antes de criar qualquer arquivo

Dispare estas 2 leituras no mesmo turno:

1. `design-system-svelte/src/components/ui/<slug>/index.ts` — exports disponíveis do componente
2. `docs/shared/content/<slug>/translations.json` — todo o conteúdo vem daqui

Se precisar de referência de padrão específico (estrutura de docs page, play function, seção específica), consulte `design-system-svelte/src/components/docs/AlertDocs.svelte` pontualmente — não leia upfront.

---

## Regra Central — Sempre use componentes reais

**Stories e docs pages NUNCA recriam variantes com HTML inline ou classes Tailwind manuais.** Importe e use o componente de `@/components/ui/<slug>`:

```svelte
<!-- ✅ CORRETO -->
<script lang="ts">
  import * as Alert from '@/components/ui/alert';
</script>
<Alert.Root variant="destructive">
  <Alert.Title>Erro ao salvar</Alert.Title>
  <Alert.Description>Verifique sua conexão.</Alert.Description>
</Alert.Root>

<!-- ❌ ERRADO -->
<div class="bg-destructive/10 text-destructive border rounded-md px-4 py-2">Erro ao salvar</div>
```

---

## Stack Técnica

- **Svelte 5** + TypeScript (`$props()`, `$state`, `$derived`, `$effect`)
- **Storybook 10** (`@storybook/svelte-vite`)
- **Tailwind CSS 4** + **shadcn-svelte** (Bits UI)
- **lucide-svelte** (ícones)

---

## Regras Anti-Boilerplate

- Apenas `<slug>.stories.ts` (story principal) carrega `tags: ['autodocs']`. Sub-stories nunca.
- Docs page injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` apenas no arquivo principal.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`.
- Categorias de sub-story dependem da categoria do componente — overlays de confirmação não têm `-variantes` nem `-tamanhos`.

---

## Tokenização de Dimensões

**Proibido usar classes hardcoded** de altura/size em componentes UI, stories e docs pages:

- ❌ `h-8`, `h-9`, `h-10`, `size-6`, `size-8`
- ✅ `h-(--height-default)`, `h-(--height-sm)`, `h-(--height-lg)`, `size-(--size-default)`

Exceções aceitas: `px-*`/`gap-*`/`py-*` (spacing interno), `[&_svg]:size-4` (ícones decorativos), `min-h-16` (Textarea). Tabela completa em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## PADRÃO CRÍTICO — Wrapper de Story

Storybook 10 para Svelte 5 **não** suporta `slot` na render function — `SvelteStoryResult` aceita apenas `Component`, `props` e `decorator`. Para componentes que precisam de children, crie um wrapper:

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
  render: (args) => ({
    Component: ComponentStory,
    props: { ...args, label: 'Component' },
  }),
};

// Sub-stories — wrapper direto no meta
const variantsMeta = {
  title: 'UI/Component/Variantes',
  component: ComponentStory,
  args: { label: 'Botão', variant: 'default' },
} satisfies Meta<typeof ComponentStory>;
```

---

## Paridade Stories ↔ Docs Page

**O componente renderizado em cada preview da docs page deve usar os mesmos props da story correspondente.** Use `translations.json` como fonte única:

```ts
// story e docs page consomem a mesma chave
$tStore('demonstration.examples.destructive.title')
$tStore('demonstration.examples.destructive.description')
```

Se houver divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story.

A docs page pode reutilizar `ComponentStory.svelte` diretamente como preview quando os props são estáveis e pequenos.

---

## Play Functions

```ts
import { fn, userEvent, within, expect } from 'storybook/test';

export const Disabled: Story = {
  args: { disabled: true, label: 'Desabilitado' },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByRole('button');
    await step('botão está desabilitado', async () => {
      await expect(el).toBeDisabled();
      await userEvent.click(el, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};
```

- Step descriptions em português
- `fn()` nos args para callbacks testáveis
- `userEvent` para interações (não `fireEvent`)
- `pointerEventsCheck: 0` ao clicar em elemento disabled

---

## Artefatos a Criar

| Arquivo | Conteúdo |
|---------|----------|
| `<ComponentName>Story.svelte` | Wrapper com `$props()` + `{@html label}` |
| `<slug>.stories.ts` | Playground + `tags: ['autodocs']` + `withAutoDocsTab` + play functions |
| `<slug>-variantes.stories.ts` | Uma story por variante |
| `<slug>-tamanhos.stories.ts` | Uma story por tamanho (se aplicável) |
| `<slug>-estados.stories.ts` | Disabled, Loading, Error — com play functions |
| `<slug>-composicoes.stories.ts` | Com ícone, asChild, em formulário etc. |
| `<Slug>Docs.svelte` | Docs page completa com todas as 15 seções |

Todos os arquivos ficam em `src/components/ui/<slug>/` exceto a docs page (`src/components/docs/`).

---

## Imports e Hooks Obrigatórios na Docs Page

```svelte
<script lang="ts">
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';

  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/<slug>/translations.json';

  // Section containers (todos os 15)
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
  import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.svelte';
  import DocsStates        from '@/components/docs/shared/sections/DocsStates.svelte';
  import DocsProps         from '@/components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.svelte';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale: l,
      componentSlug: '<slug>',
    });
    track('docs_page_view', { component_name: '<slug>', locale: l, page_title: `${t('title')} · Design System` });
    return cleanup;
  });

  let activeSection = $state('demonstracao');
  function handleSectionChange(id: string) {
    activeSection = id;
    track('docs_section_viewed', { component_name: '<slug>', section_id: id, locale: $locale });
  }

  // NAV_GROUPS é $derived.by(() => { ... }) — reativo ao locale via $tNavStore.
  // Copie a estrutura de AlertDocs.svelte: 4 grupos (overview, techRef, context, quality)
  // com os IDs das 14 seções mapeados para as chaves nav.* de uiTranslations.
  const NAV_GROUPS = $derived.by(() => { /* ver AlertDocs.svelte */ });
</script>
```

Use `DocsPageLayout` para o layout de duas colunas com sidebar sticky — não monte `flex gap-16` manualmente.
`DocsPageLayout` recebe `navGroups`, `activeSection` e `componentSlug` como props; não reimplemente o `<nav>` internamente.

Previews visuais (DoDont, Variants, Demonstration) são passados como **Snippets Svelte 5** via `{#snippet}` + `{@render}`.

---

## Section Containers — Use Sempre

**Nunca escreva template inline replicando layout de seção.** A docs page é composta exclusivamente por section containers + componentes reais de `@/components/ui/`.

Verifique os containers disponíveis com `Glob` em `design-system-svelte/src/components/docs/shared/sections/`. Se não existirem, rode `/docs-sections --stack svelte` primeiro.

### Do & Don't — bug comum

`DocsDoDont` recebe pares de previews como snippets. **Nunca** use `{#each [1,2] as i}` em um único grid — produz DO|DO em cima e DON'T|DON'T em baixo. O container já monta dois grids separados corretamente.

---

## Docs Page — Seções Obrigatórias (15)

Toda docs page deve renderizar TODAS estas seções com conteúdo real de `translations.json`. **Nunca** use placeholders como "Exemplo aqui." ou "Documentação completa disponível na stack React":

1. Header — badges (category, type), `<LanguageSwitcher />`, h1, description
2. Demonstração (`id="demonstracao"`) — demos interativos com componente real
3. Anatomia (`id="anatomia"`) — lista numerada + bloco de estrutura
4. Quando Usar (`id="quando-usar"`) — 4 blocos: guidelines, cenários, UX Writing, Do/Don't cards
5. Do & Don't (`id="do-dont"`) — via `DocsDoDont` com previews reais
6. Importação (`id="importacao"`) — blocos de código
7. Variantes (`id="variantes"`) — cards com preview + toggle de código
8. Estados (`id="estados"`) — tabela de estados
9. Propriedades (`id="propriedades"`) — tabelas de props completas
10. Tokens (`id="tokens"`) — tabela de tokens CSS + customização
11. Acessibilidade (`id="acessibilidade"`) — lista + cards de teclado
12. Relacionados (`id="relacionados"`) — grid de cards com links
13. Notas (`id="notas"`) — callouts
14. Analytics (`id="analytics"`) — tabela de eventos GA4
15. Testes (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

---

## Regras Críticas de Renderização

### Blocos de código — nunca `<pre>`

```svelte
<!-- ✅ CORRETO -->
<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code class="whitespace-pre">{`import * as Alert from '@/components/ui/alert';`}</code>
</div>

<!-- ❌ ERRADO -->
<pre class="..."><code>...</code></pre>
```

Exceção: diagramas ASCII (`anatomy.structureCode`) podem usar `<pre>` dentro de `<div class="... overflow-x-auto">`.

### Tabelas — wrapper obrigatório

```svelte
<!-- ✅ card com p-4 e overflow-x-auto -->
<div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
  <table class="w-full text-sm">...</table>
</div>
```

Primeira coluna da tabela de estados: `font-medium` simples, nunca badge/pill.

### Padrões Svelte para conteúdo HTML

```svelte
<!-- Texto com HTML (anatomy, guidelines) -->
{@html sanitizeHtml($tStore('anatomy.item1'))}

<!-- Loops -->
{#each [1, 2, 3] as i}
  <li>{@html sanitizeHtml($tStore(`usage.guidelines.item${i}`))}</li>
{/each}

<!-- Links internos Storybook -->
<div role="link" tabindex="0"
  onclick={() => { (window.top ?? window).location.href = path; }}
  onkeydown={(e) => { if (e.key === 'Enter') (window.top ?? window).location.href = path; }}>
```

---

## Checklist Final

Itens Svelte-específicos fáceis de esquecer:

- [ ] `ComponentStory.svelte` criado com `$props()` + `{@html label}`
- [ ] Story principal usa `component: Component` (real); sub-stories usam `component: ComponentStory`
- [ ] `min-w-0` no container de conteúdo — sem ele tabelas e code blocks transbordam
- [ ] `sanitizeHtml()` em todo `{@html}` com conteúdo de translations
- [ ] `$effect()` para SEO e analytics (não `onMount` + `$:`)
- [ ] `$derived.by()` para `NAV_GROUPS` reativo ao locale
- [ ] `applySeo` retorna cleanup — `return cleanup` dentro do `$effect`
- [ ] `{@html label}` no wrapper (não `{label}`) — suporta SVG
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>`
- [ ] `<LanguageSwitcher />` presente no header da docs page
- [ ] Todas as 15 seções com conteúdo real (sem placeholders)
- [ ] Nenhum `console.log` ou `TODO` nos arquivos entregues

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-svelte): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
