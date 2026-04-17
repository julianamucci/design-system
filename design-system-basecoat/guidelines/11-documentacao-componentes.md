# Estrutura Padronizada de Documentação de Componentes (Basecoat)

## Visão Geral

A documentação é composta de duas partes:

1. **ComponentDocs** — função TypeScript que retorna `HTMLElement` com a documentação visual.
2. **Stories** — arquivos `@storybook/html` que expõem o componente.

**Referência**: `STORYBOOK-ARCHITECTURE.md`

---

## Parte 1 — ComponentDocs (arquivo TypeScript)

### Arquivo e exportação

```
src/components/docs/NomeComponenteDocs.ts
```

```ts
import { applyStorybookSeo } from '@/lib/use-seo';

export function createNomeComponenteDocs(): HTMLElement {
  applyStorybookSeo({
    title: 'NomeComponente — Categoria · Design System',
    description: 'Documentação do NomeComponente: [N] variantes, estados interativos e exemplos.',
    locale: 'pt-BR',
    componentSlug: 'nome-componente',
  });

  const root = document.createElement('div');
  root.className = 'p-8 max-w-5xl mx-auto';

  root.appendChild(createHeader());
  root.appendChild(createContent());

  return root;
}

function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'ds-docs mb-12 border-b pb-8 border-border/50';

  // Badges
  const badges = document.createElement('div');
  badges.className = 'flex items-center gap-2 mb-4';
  // ... adicionar badge de categoria e tipo

  // Título
  const h1 = document.createElement('h1');
  h1.className = 'text-4xl font-bold tracking-tight text-foreground';
  h1.textContent = 'NomeComponente';

  // Descrição
  const desc = document.createElement('p');
  desc.className = 'text-muted-foreground max-w-3xl';
  desc.textContent = 'Descrição do componente.';

  header.append(badges, h1, desc);
  return header;
}
```

### SEO — `applyStorybookSeo` obrigatório

Todo ComponentDocs **deve** chamar `applyStorybookSeo` de `@/lib/use-seo.ts`. Ele detecta o iframe do Storybook e escreve metatags no documento pai automaticamente.

> Ver `../../docs/shared/guidelines/06-seo-geo.md`.

---

## As 14 Seções

Cada seção é uma função que retorna `HTMLElement`:

```ts
function createSection(id: string, title: string, content: HTMLElement): HTMLElement {
  const section = document.createElement('section');
  section.id = id;

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = title;

  section.append(h2, content);
  return section;
}

// Seção 2 — Demonstração
function createDemoSection(): HTMLElement {
  const demo = document.createElement('div');
  demo.className = 'rounded-md border border-border p-6';
  demo.appendChild(createButton({ label: 'Exemplo', variant: 'default' }));
  return createSection('demonstracao', 'Demonstração Padrão', demo);
}
```

**Seções obrigatórias** (mesmas 14 do padrão React):
1. Header (Hero)
2. Demonstração Padrão
3. Anatomia
4. Quando e Como Usar (tabela de cenários + UX Writing)
5. Do & Don't
6. Importação
7. Exemplos de Código
8. Variantes e Tamanhos
9. Estados
10. Propriedades / Opções
11. Design Tokens
12. Acessibilidade
13. Componentes Relacionados
14. Notas e Dicas
(15. Critérios de Teste)

---

## Parte 2 — Stories (`@storybook/html`)

### Estrutura de arquivos

```
src/components/ui/
  ├── nome-componente.ts                      (função createNomeComponente)
  ├── nome-componente.stories.ts              (meta + Playground)
  ├── nome-componente-variantes.stories.ts
  ├── nome-componente-tamanhos.stories.ts
  ├── nome-componente-composicoes.stories.ts
  └── nome-componente-estados.stories.ts
```

### Arquivo Principal

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from '@storybook/test';
import { createNomeComponente, type NomeComponenteOptions } from './nome-componente';
import { createNomeComponenteDocs } from '../../components/docs/NomeComponenteDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type Args = NomeComponenteOptions;

const meta: Meta<Args> = {
  title: 'UI/NomeComponente',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createNomeComponenteDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
      description: 'Estilo visual do componente',
    },
    label: {
      control: 'text',
      description: 'Texto exibido no componente',
    },
  },
  args: {
    label: 'Botão',
    variant: 'default',
  },
  render: (args) => {
    return createNomeComponente(args);
  },
};

export default meta;
type Story = StoryObj<Args>;

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

### Variantes

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createNomeComponente, type NomeComponenteOptions } from './nome-componente';

const meta: Meta<NomeComponenteOptions> = {
  title: 'UI/NomeComponente/Variantes',
  render: (args) => createNomeComponente(args),
  args: { label: 'Exemplo' },
};

export default meta;
type Story = StoryObj<NomeComponenteOptions>;

export const Default: Story = {
  args: { variant: 'default' },
  parameters: { docs: { description: { story: 'Variante padrão para ações primárias.' } } },
};
```

---

### Componentes Provider + API imperativa (Sonner)

Componentes como Sonner expõem duas superfícies: um **provider** e uma **função imperativa** (`toast()`). No Basecoat, como o pacote `sonner` não existe para vanilla TS, a stack usa uma **implementação própria** em `toast-utils.ts`.

**Diferenças da implementação vanilla:**

1. `toast-utils.ts` — utilitário DOM puro que replica a API do Sonner: `toast()`, `toast.success()`, `toast.error()`, `toast.promise()`, `toast.dismiss()`.
2. Toasts são criados via `document.createElement` com classes Tailwind equivalentes às do Sonner original.
3. Container usa `role="region"` + `aria-label="Notifications"`. Cada toast usa `role="status"` + `aria-live="polite"`.
4. `injectToastStyles()` adiciona a animação CSS do spinner de loading.

**Adaptações nas docs pages e stories** (mesmas que React):

1. **"Variantes" → "Tipos de Toast"** — 6 tipos via API, não via `cva()`.
2. **"Propriedades"** — duas tabelas: Toaster provider + toast() options.
3. **"Importação"** — duas seções (provider + função).
4. **"Demonstração"** — botões interativos. Evento `toast_demo_triggered`.
5. **"Anatomia"** — 7 items.

**Estrutura de stories:**

```
src/components/ui/
  ├── toast-utils.ts                            (implementação vanilla)
  ├── sonner.stories.ts                         (meta + Playground)
  ├── sonner-tipos.stories.ts                   (6 tipos)
  ├── sonner-posicoes.stories.ts                (6 posições)
  ├── sonner-composicoes.stories.ts             (com ação, descrição, promise, rich colors)
  └── sonner-estados.stories.ts                 (expandido, dismiss, close button, duração)
```

---

### Componentes Presentacionais Compostos (padrão Table)

Componentes como **Table** expõem múltiplas **fábricas vanilla** que constroem elementos DOM semânticos com as mesmas classes Tailwind das demais stacks. O arquivo `src/components/ui/table.ts` exporta 8 fábricas: `createTable` (retorna `{ wrapper, table }`), `createTableHeader`, `createTableBody`, `createTableFooter`, `createTableRow`, `createTableHead`, `createTableCell`, `createTableCaption` — mais a constante `TABLE_TOKENS` com as classes para uso externo. **Sem** `cva()` — apenas `mergeClass(base, extra?)`. Seguem o mesmo template de 15 seções, com as seguintes adaptações:

1. **Anatomia** — uma entrada por fábrica (`anatomy.item1` a `anatomy.item8`). `structureCode` mostra a estrutura HTML resultante (`<div><table><thead>…`) — não código TS da fábrica.

2. **Variantes → Composições** — sem `cva()`. `variants.items` lista composições recorrentes (`basic`, `withCaption`, `withFooter`, `empty`). Título da seção: `"Composições e Tamanhos"` (`variants.title`). Cards seguem §11.1 do guideline 08. A área de preview monta a composição chamando as fábricas (`const { wrapper, table } = createTable(); const thead = createTableHeader(); …`) e faz `.appendChild` na ordem correta.

3. **Tamanhos → Padrões de Densidade** — `variants.sizes` descreve convenções de altura aplicadas via parâmetro `extraClass` de `createTableHead`/`createTableCell` (`h-8` compact, `h-10` default, `h-12` comfortable) — **não** são argumentos dedicados. Cards seguem o mesmo layout de 3 linhas de §11.2 do guideline 08.

4. **Estados** — apenas estados estruturais: `hover` (automático via `hover:bg-muted/50`), `selected` (atribuído via `tr.setAttribute('data-state', 'selected')`), `empty` (renderização condicional com `colspan`), `scroll` (automático via `overflow-x-auto` no wrapper). **Omitir** `disabled`/`loading` — tabelas não são interativas.

5. **Propriedades → Argumentos de fábrica** — cada fábrica aceita apenas `extraClass?: string` (append às classes base). Para atributos HTML, manipular o elemento retornado (`th.setAttribute('scope', 'col')`, `td.colSpan = 2`, `tr.dataset.state = 'selected'`). Documentar chaves `props.table.*`: `extraClass`, `colspan`, `rowspan`, `scope`, `dataState`. **Não** há interface TypeScript de props — exibir assinatura da função: `createTable(extraClass?: string): { wrapper, table }`.

6. **Analytics** — componente estrutural; dispara apenas eventos da docs page (`docs_page_view`, `docs_section_viewed`, `language_switched`). Eventos de domínio (`table_sorted`, `row_selected`) pertencem a wrappers (ex: futuro `createDataTable`), não às fábricas puras. A chave `analytics.description` deve explicitar: "Table é estrutural — não dispara eventos próprios".

7. **Estrutura de stories**:
   ```
   src/components/ui/
     ├── table.ts                                  (8 fábricas + TABLE_TOKENS)
     ├── table.stories.ts                          (meta + Playground com invoice demo)
     ├── table-composicoes.stories.ts              (basic, withCaption, withFooter, withSelection)
     ├── table-estados.stories.ts                  (hover, selected, empty, scroll)
     └── table-densidades.stories.ts               (compact, default, comfortable via extraClass)
   ```
   **Omitir** `table-variantes` e `table-tamanhos` — não existem argumentos `variant`/`size`. O `render` de cada story retorna o `wrapper` de `createTable()` após montar a composição:
   ```ts
   render: (args) => {
     const { wrapper, table } = createTable();
     const thead = createTableHeader();
     // ... monta a árvore e appendChild
     return wrapper;
   }
   ```

8. **Play functions** — focam em estrutura semântica (não em interações):
   - `<caption>` presente e visível (caption-bottom)
   - Headers usam `<th>` com atributo `scope`
   - `data-state="selected"` aplica `bg-muted` persistente
   - `colspan` em footer cobre colunas corretas
   - Overflow horizontal aparece em viewport estreito
   - Estado vazio renderiza linha única com colspan total

### Componentes Compostos Interativos com Disclosure (padrão Accordion)

Componentes como **Accordion** são implementados em Vanilla TS como funções que constroem elementos DOM. Não possuem variantes visuais — diferem por modo de operação. Seguem o template de 15 seções com as seguintes adaptações:

1. **Seção "Variantes" → "Modos de Operação"** — `variants.items` lista modos (`single`, `multiple`, `controlled`). **Omitir** seção "Tamanhos".

2. **Implementação Vanilla** — criar `createAccordion(options)` e `createAccordionItem(options)` que retornam `HTMLElement`. Gerenciar estado `open`/`closed` via dataset (`el.dataset.state`). Emit events via `CustomEvent` para `onValueChange`.

3. **ARIA obrigatório** — setar manualmente: `button.setAttribute('aria-expanded', 'false')`, `button.setAttribute('aria-controls', contentId)`, `content.setAttribute('id', contentId)`, `content.setAttribute('role', 'region')`.

4. **Estrutura de stories**:
   ```
   src/components/ui/
     ├── accordion.ts
     ├── accordion.stories.ts
     ├── accordion-modos.stories.ts
     ├── accordion-estados.stories.ts
     └── accordion-composicoes.stories.ts
   ```
   **Omitir** `accordion-variantes` e `accordion-tamanhos`.

5. **Props table** — em Basecoat, **não** usar chaves aninhadas como `props.table.type.name` (conflita com a chave de cabeçalho `props.table.type = "Tipo"`). Hardcode `name`, `type` e `default` no array de dados; buscar apenas a **descrição** via chave flat: `t('props.table.{propDescKey}')`. Para props com nome igual a coluna (ex: `type`), usar sufixo `_prop` no JSON: `props.table.type_prop`.

6. **`doDont.pair${n}.dontExample`** — texto de exemplo visual na caixa "don't". Adicionar ao `translations.json` junto com `do`/`dont`.

7. **`notes.tip${i}Title`** — título flat separado de `notes.tip${i}` (descrição). Não usar `notes.tip${i}.title` — cria conflito de caminho com a string de descrição.

8. **Play functions** — verificar `getAttribute('aria-expanded')` após interação. Animar via `dataset.state` + CSS transitions em vez de animações JS.

---

## Checklist de implementação

- [ ] `translations.json` criado em `src/components/docs/content/{slug}/`
- [ ] `createNomeComponenteDocs()` com as 14 seções
- [ ] `applyStorybookSeo` chamado com `{ title, description, locale, componentSlug }`
- [ ] 5 arquivos de stories (ou menos se não aplicável)
- [ ] Story principal com `parameters.docs.page: withAutoDocsTab(createNomeComponenteDocs)`
- [ ] Playground com play function
- [ ] Todos os argTypes com description em pt-BR
- [ ] `render` retorna `HTMLElement` criado pela função de componente
