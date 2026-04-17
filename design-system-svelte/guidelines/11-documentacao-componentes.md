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

### Componentes Provider + API imperativa (Sonner)

Componentes como Sonner expõem duas superfícies: um **provider** (`<Toaster />`) e uma **função imperativa** (`toast()`). As docs pages seguem o mesmo template de 14 seções mas com adaptações:

1. **"Variantes" → "Tipos de Toast"** — `variants.items` lista tipos de API (`default`, `success`, `error`, `warning`, `info`, `loading`) em vez de variantes `cva()`.
2. **Subseção "Posições"** — `variants.positions` com 6 opções de posicionamento.
3. **"Propriedades"** — duas tabelas: props do `<Toaster />` provider + opções do `toast()`.
4. **"Importação"** — duas seções: import do provider + import da função `toast`.
5. **"Demonstração"** — botões interativos que disparam toasts. Evento `toast_demo_triggered`.
6. **"Anatomia"** — 7 items (provider, container, ícone, título, descrição, botão de ação, botão de fechar).

**Estrutura de stories** (usa `SonnerStory.svelte` como wrapper):

```
src/components/ui/
  ├── Sonner.svelte                             (componente wrapper)
  ├── SonnerStory.svelte                        (wrapper para stories)
  ├── sonner.stories.ts                         (meta + Playground)
  ├── sonner-tipos.stories.ts                   (6 tipos)
  ├── sonner-posicoes.stories.ts                (6 posições)
  ├── sonner-composicoes.stories.ts             (com ação, descrição, promise, rich colors)
  └── sonner-estados.stories.ts                 (expandido, dismiss, close button, duração)
```

---

### Componentes Presentacionais Compostos (padrão Table)

Componentes como **Table** expõem múltiplos sub-componentes independentes (8 no Svelte: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`), instalados via `npx shadcn-svelte@latest add table`. Cada sub-componente envolve um elemento HTML semântico via `<script lang="ts">` + `$props()` com classes estáticas (sem `cva()`). Seguem o mesmo template de 15 seções, com as seguintes adaptações:

1. **Anatomia** — uma entrada por sub-componente (`anatomy.item1` a `anatomy.item8`). `structureCode` mostra a árvore aninhada com `&lt;Table&gt;` na raiz usando sintaxe Svelte (`{#each}`, `{@html}` quando aplicável via `sanitizeHtml`).

2. **Variantes → Composições** — sem `cva()`. `variants.items` lista composições recorrentes (`basic`, `withCaption`, `withFooter`, `empty`). Título da seção: `"Composições e Tamanhos"` (`variants.title`). Cards seguem §11.1 do guideline 08, mas a área de preview renderiza a composição montada (`<Table.Root><Table.Header>…<Table.Body>…` ou usando imports diretos) em vez de passar uma prop `variant`.

3. **Tamanhos → Padrões de Densidade** — `variants.sizes` descreve convenções de altura aplicadas via `class` no `TableHead`/`TableCell` (`h-8` compact, `h-10` default, `h-12` comfortable) — **não** são props do componente. Cards seguem o mesmo layout de 3 linhas de §11.2 do guideline 08.

4. **Estados** — apenas estados estruturais: `hover` (automático via `hover:bg-muted/50`), `selected` (via `data-state="selected"`), `empty` (renderização condicional com `colspan`), `scroll` (automático via `overflow-x-auto`). **Omitir** `disabled`/`loading` — tabelas não são interativas.

5. **Propriedades** — cada sub-componente aceita atributos HTML nativos via `$props()` spread `{...restProps}`. Documentar chaves `props.table.*`: `class`, `children` (snippet), `colspan`, `rowspan`, `scope` (em `TableHead`), `data-state` (em `TableRow`). Interface TypeScript exibe `HTMLAttributes<HTMLTableElement>` (e variantes para section/row/cell/caption). **Sem** props customizadas (`variant`, `size`).

6. **Analytics** — componente estrutural; dispara apenas eventos da docs page (`docs_page_view`, `docs_section_viewed`, `language_switched`). Eventos de domínio (`table_sorted`, `row_selected`) pertencem a wrappers (ex: futuro `DataTable`), não à Table pura. A chave `analytics.description` deve explicitar: "Table é estrutural — não dispara eventos próprios".

7. **Estrutura de stories**:
   ```
   src/components/ui/table/
     ├── index.ts                                  (barrel export)
     ├── table.svelte                              (wrapper div + <table>)
     ├── table-header.svelte, table-body.svelte, table-footer.svelte
     ├── table-row.svelte, table-head.svelte, table-cell.svelte
     └── table-caption.svelte

   src/components/ui/
     ├── TableStory.svelte                         (wrapper para stories — monta composição)
     ├── table.stories.ts                          (meta + Playground com invoice demo)
     ├── table-composicoes.stories.ts              (basic, withCaption, withFooter, withSelection)
     ├── table-estados.stories.ts                  (hover, selected, empty, scroll)
     └── table-densidades.stories.ts               (compact, default, comfortable via class)
   ```
   **Omitir** `table-variantes` e `table-tamanhos` — não existem props `variant`/`size`. Stories passam um prop `composition: 'basic' | 'withCaption' | ...` ao `TableStory.svelte`, que renderiza a árvore correspondente.

8. **Play functions** — focam em estrutura semântica (não em interações):
   - `<caption>` presente e visível (caption-bottom)
   - Headers usam `<th>` com atributo `scope`
   - `data-state="selected"` aplica `bg-muted` persistente
   - `colspan` em footer cobre colunas corretas
   - Overflow horizontal aparece em viewport estreito
   - Estado vazio renderiza linha única com colspan total

---

### Componentes Compostos Interativos com Disclosure (padrão Accordion)

Componentes como **Accordion** expõem múltiplos sub-componentes (via Bits UI) que implementam o padrão ARIA Disclosure. Não possuem variantes visuais via `cva()` — diferem por modo de operação. Seguem o template de 15 seções com as seguintes adaptações:

1. **Seção "Variantes" → "Modos de Operação"** — `variants.items` lista modos (`single`, `multiple`, `controlled`). **Omitir** seção "Tamanhos".

2. **Bits UI** — usar `Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Content` de `bits-ui`. Props kebab-case no template Svelte: `type`, `value`, `onValueChange`, `disabled`.

3. **Estrutura de stories**:
   ```
   src/components/ui/
     ├── accordion/
     │   ├── accordion.svelte + accordion-item.svelte + ...
     ├── accordion.stories.ts
     ├── accordion-modos.stories.ts
     ├── accordion-estados.stories.ts
     └── accordion-composicoes.stories.ts
   ```
   **Omitir** `accordion-variantes` e `accordion-tamanhos`.

4. **Props table** — em Svelte, **não** usar chaves aninhadas como `props.table.type.name` (conflita com a chave de cabeçalho `props.table.type = "Tipo"`). Hardcode `name`, `type` e `default` no array de dados do script; buscar apenas a **descrição** via chave flat: `$tStore('props.table.{propDescKey}')`. Para props com nome igual a coluna (ex: `type`), usar sufixo `_prop` no JSON: `props.table.type_prop`.

5. **`doDont.pair${n}.dontExample`** — texto de exemplo visual na caixa "don't". Adicionar ao `translations.json` junto com `do`/`dont`.

6. **`notes.tip${i}Title`** — título flat separado de `notes.tip${i}` (descrição). Não usar `notes.tip${i}.title` — cria conflito de caminho com a string de descrição.

7. **Play functions** — verificar `aria-expanded` no trigger após interação. `{@html sanitizeHtml(...)}` no conteúdo de items com HTML.

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
