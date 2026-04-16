# Estrutura Padronizada de Documentação de Componentes (Svelte)

## Visão Geral

A documentação de componentes é composta de duas partes:

1. **ComponentDocs** — arquivo `.svelte` com a documentação visual e textual.
2. **Stories** — arquivos Storybook que expõem o componente para exploração.

Ambas seguem **14 seções** organizadas em 4 blocos, e **5 grupos de stories**.

**Referência**: `STORYBOOK-ARCHITECTURE.md`

---

## Parte 1 — ComponentDocs (arquivo Svelte)

### Arquivo e exportação

```
src/components/docs/NomeComponenteDocs.svelte
```

```svelte
<script lang="ts">
  import { applyStorybookSeo } from '$lib/use-seo';
  import DocsHeader from './shared/DocsHeader.svelte';
  import DocsSection from './shared/DocsSection.svelte';

  applyStorybookSeo({
    title: 'NomeComponente — Categoria · Design System',
    description: 'Documentação do NomeComponente: [N] variantes, estados interativos e exemplos.',
    locale: 'pt-BR',
    componentSlug: 'nome-componente',
  });
</script>

<div class="p-8 max-w-5xl mx-auto">
  <!-- Header Hero -->
  <header class="ds-docs mb-12 border-b pb-8 border-border/50">
    ...
  </header>

  <!-- Layout: sidebar + conteúdo -->
  <div class="flex gap-16 items-start">
    <ComponentDocsSidebar />
    <div class="ds-docs flex-1 space-y-12">
      <!-- Seções 2–14 aqui -->
    </div>
  </div>
</div>
```

### SEO — `applyStorybookSeo` obrigatório

Todo ComponentDocs **deve** chamar `applyStorybookSeo` de `$lib/use-seo.ts`. Ele detecta o iframe do Storybook e escreve metatags no documento pai.

> Ver `STORYBOOK-ARCHITECTURE.md` Seção 9 e `../../docs/shared/guidelines/06-seo-geo.md`.

### i18n

```svelte
<script lang="ts">
  import { useTranslation } from '$lib/i18n';
  import LanguageSwitcher from '$lib/components/product/LanguageSwitcher.svelte';

  const t = useTranslation('button'); // slug do componente
</script>

<LanguageSwitcher />
<h1>{t('title')}</h1>
```

Translations em: `src/components/docs/content/{slug}/translations.json`

---

## As 14 Seções

Idênticas ao padrão React (`11-documentacao-componentes.md` do React). Usar a mesma estrutura visual com `class` em vez de `className`:

```svelte
<!-- Seção 1 — Header -->
<header class="ds-docs mb-12 border-b pb-8 border-border/50">
  <div class="flex items-center gap-2 mb-4">
    <Badge variant="secondary" class="bg-primary/5 text-primary border-primary/10 font-medium px-2 py-0">
      Layout
    </Badge>
    <Badge variant="outline" class="text-muted-foreground font-normal px-2 py-0">
      Componente
    </Badge>
  </div>
  <div class="space-y-4">
    <h1 class="text-4xl font-bold tracking-tight text-foreground">NomeComponente</h1>
    <p class="text-muted-foreground max-w-3xl">Descrição do componente.</p>
  </div>
</header>

<!-- Seções 2-14 com <section id="..."> -->
<section id="demonstracao">
  <h2 class="text-xl font-semibold mb-4">Demonstração Padrão</h2>
  <ComponentDemo>
    <NomeComponente />
  </ComponentDemo>
</section>
```

---

## Parte 2 — Stories

### Estrutura de arquivos

```
src/lib/components/ui/
  ├── nome-componente/
  │   └── index.ts                            (componente)
  ├── nome-componente.stories.ts              (meta + Playground)
  ├── nome-componente-variantes.stories.ts     (variantes visuais)
  ├── nome-componente-tamanhos.stories.ts      (tamanhos)
  ├── nome-componente-composicoes.stories.ts   (composições)
  └── nome-componente-estados.stories.ts       (estados)
```

### Arquivo Principal

```ts
import type { Meta, StoryObj } from '@storybook/svelte';
import { fn, userEvent, within, expect } from '@storybook/test';
import NomeComponente from '$lib/components/ui/nome-componente/NomeComponente.svelte';
import NomeComponenteDocs from '../../components/docs/NomeComponenteDocs.svelte';
import { withAutoDocsTab } from '$lib/withAutoDocsTab';

const meta = {
  title: 'UI/NomeComponente',
  component: NomeComponente,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(NomeComponenteDocs) },
  },
  argTypes: {
    // Todos os controles com description em pt-BR
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
      description: 'Estilo visual do componente',
    },
  },
  args: {
    // Valores padrão
  },
} satisfies Meta<typeof NomeComponente>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');

    await step('Elemento está acessível', async () => {
      await expect(element).toBeInTheDocument();
      await expect(element).toBeEnabled();
    });

    await step('Recebe foco via teclado', async () => {
      element.focus();
      await expect(element).toHaveFocus();
    });
  },
};
```

### Arquivos de Variantes / Tamanhos / Estados

```ts
import type { Meta, StoryObj } from '@storybook/svelte';
import NomeComponente from '$lib/components/ui/nome-componente/NomeComponente.svelte';

const meta = {
  title: 'UI/NomeComponente/Variantes',
  component: NomeComponente,
} satisfies Meta<typeof NomeComponente>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: 'default' },
  parameters: { docs: { description: { story: 'Variante padrão para ações primárias.' } } },
};
```

---

## Checklist de implementação

- [ ] `translations.json` criado em `src/components/docs/content/{slug}/`
- [ ] `NomeComponenteDocs.svelte` com as 14 seções
- [ ] Header com badges, h1, descrição
- [ ] `LanguageSwitcher` importado e renderizado no header
- [ ] `applyStorybookSeo` chamado com `{ title, description, locale, componentSlug }`
- [ ] Sidebar de navegação com navGroups
- [ ] Wrapper `.ds-docs` no header e conteúdo
- [ ] 5 arquivos de stories (ou menos se não aplicável)
- [ ] Story principal com `parameters.docs.page: withAutoDocsTab(NomeComponenteDocs)`
- [ ] Playground com play function alinhada à Seção 15
- [ ] Todos os argTypes com description em pt-BR
- [ ] Stories de composição com `name` em pt-BR
