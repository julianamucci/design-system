# Estrutura Padronizada de Documentação de Componentes — Regras Obrigatórias

## Visão Geral

Este arquivo define a estrutura obrigatória para documentar componentes no Design System React. Ela se divide em duas partes:

1. **ComponentDocs** — o arquivo TSX com a documentação visual e textual do componente, composto a partir dos **section containers** genéricos.
2. **Stories** — os arquivos Storybook que expõem o componente para exploração, testes e catálogo visual.

Ambas as partes seguem uma organização padronizada de **15 seções** (agrupadas em 4 blocos) e **5 grupos de stories**.

**Referência de implementação:** `AlertDocs.tsx` e `alert*.stories.tsx`.

---

## Princípio Fundamental: Use os Section Containers

Existem 16 componentes genéricos em `src/components/docs/shared/sections/` — um por seção. A docs page **deve** importar e compor esses containers em vez de reimplementar JSX. Eles encapsulam layout, classes CSS, acessibilidade, sanitização e hierarquia HTML. Nenhuma docs page nova deve repetir esse HTML.

```tsx
import {
  DocsHeader,
  DocsDemonstration,
  DocsAnatomy,
  DocsWhenToUse,
  DocsDoDont,
  DocsImport,
  DocsVariants,
  DocsStates,
  DocsProps,
  DocsTokens,
  DocsAccessibility,
  DocsRelated,
  DocsNotes,
  DocsAnalytics,
  DocsTestes,
} from '@/components/docs/shared/sections';
```

Se você precisa de um layout que nenhum container cobre, abra uma PR no container correspondente — não reimplemente inline. É **proibido** copiar o HTML interno de um container para a docs page.

---

## Parte 1 — ComponentDocs (arquivo de documentação)

### Arquitetura e Layout

O ComponentDocs é um componente React que renderiza a documentação completa. Ele é referenciado no Storybook via `parameters.docs.page: withAutoDocsTab(NomeComponenteDocs)` no arquivo principal de stories.

#### Layout obrigatório: Header + Sidebar + Conteúdo

```tsx
export function NomeComponenteDocs() {
  // i18n, SEO, analytics, navGroups, activeSection, data computadas...

  return (
    <div className="p-8 max-w-5xl mx-auto">

      <DocsHeader
        title={t('title')}
        description={t('description')}
        category={t('category')}
        type={t('type')}
        installNote="npx shadcn@latest add nome-componente"
      />

      <div className="flex gap-16 items-start">
        <nav
          aria-label="Navegação das seções do componente"
          className="sticky top-8 w-52 shrink-0 self-start space-y-5"
        >
          <DocsNav groups={navGroups} activeSection={activeSection} />
        </nav>

        <div className="ds-docs flex-1 min-w-0 space-y-12">
          {/* Seções 2–16 compostas via DocsXxx containers */}
        </div>
      </div>

    </div>
  );
}
```

**Regras de layout:**
- Container raiz: `p-8 max-w-5xl mx-auto`
- `DocsHeader` cuida do bloco superior (badges, h1, LanguageSwitcher, description, install note) — não escreva header manualmente
- Layout de duas colunas: `<nav>` sticky à esquerda + conteúdo `flex-1` à direita
- Gap entre colunas: `gap-16`
- Wrapper do conteúdo: `ds-docs flex-1 min-w-0 space-y-12` (obrigatório para neutralizar CSS do Storybook)
- Sidebar: `sticky top-8 w-52 shrink-0 self-start space-y-5`

---

### Classe `.ds-docs` — Blindagem contra Storybook

O Storybook injeta CSS-in-JS unlayered com especificidade `(0,1,0)` que reseta margens, fontes e listas. A classe `.ds-docs` no `globals.css` restaura os utilitários do Tailwind com especificidade `(0,2,N)`.

**Regras:**
- O wrapper `.ds-docs` deve envolver o container de conteúdo `flex-1`
- `DocsHeader` já aplica `ds-docs` internamente
- As regras CSS estão no bloco unlayered no final do `globals.css`

---

### SEO e GEO — `useSeoEffect` obrigatório

Todo ComponentDocs **deve** chamar o hook `useSeoEffect` de `@/lib/use-seo.ts`. Ele detecta automaticamente o contexto de iframe do Storybook e escreve todas as metatags no documento pai.

```tsx
import { useSeoEffect } from '@/lib/use-seo';

useSeoEffect({
  title: t('seo.title'),
  description: t('seo.description'),
  locale,
  componentSlug: 'nome-componente',
});
```

O hook gerencia internamente: `document.title`, `<meta name="description">`, `<meta property="og:*">`, `<meta name="ai:summary">`, `<meta name="ai:entities">`, `<meta name="ai:intent">`, JSON-LD (TechArticle + SoftwareSourceCode), `lang` no `<html>`, `hreflang` para pt-BR/en/es, e cleanup ao desmontar.

> Ver `STORYBOOK-ARCHITECTURE.md` Seção 9 e `docs/shared/guidelines/06-seo-geo.md`.

---

### i18n — `useTranslation` obrigatório

```tsx
import { useTranslation } from '@/lib/i18n';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/nome-componente/translations.json';

const { t: tNav } = useTranslation(uiTranslations);
const { t, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });
```

`LanguageSwitcher` é renderizado automaticamente pelo `DocsHeader`.

---

### Analytics — `docs_page_view` + `docs_section_viewed`

```tsx
useEffect(() => {
  track('docs_page_view', {
    component_name: 'nome-componente',
    locale,
    page_title: `${t('title')} · Design System`,
  });
}, [locale, t]);

const handleSectionChange = useCallback((id: string) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'nome-componente',
    locale,
  });
}, [locale]);

const activeSection = useActiveSection(allSectionIds, handleSectionChange);
```

---

### Navegação Interna (Sidebar)

A navegação é um `<nav>` sticky que usa `IntersectionObserver` para destacar a seção visível (scroll-spy). O componente `DocsNav` cuida do HTML; a docs page fornece os grupos:

```tsx
const navGroups = useMemo(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')       },
      { id: 'quando-usar',  label: tNav('nav.usage')         },
      { id: 'do-dont',      label: tNav('nav.doDont')        },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')    },
      { id: 'variantes',    label: tNav('nav.variants')  },
      { id: 'estados',      label: tNav('nav.states')    },
      { id: 'propriedades', label: tNav('nav.props')     },
      { id: 'tokens',       label: tNav('nav.tokens')    },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
], [tNav]);
```

**Regras:**
- Os `id` de cada seção **devem** bater exatamente com os `id` que os containers emitem (`demonstracao`, `anatomia`, `quando-usar`, `do-dont`, `importacao`, `variantes`, `estados`, `propriedades`, `tokens`, `acessibilidade`, `relacionados`, `notas`, `analytics`, `testes`)
- **Exceção por tipo de componente:** componentes sem variantes `cva()` usam `id: 'variantes'` com label e conteúdo redefinidos. Ex: Accordion usa `id: 'modos'` (Modos de Operação), Table usa `id: 'variantes'` com título "Composições e Tamanhos". O `id` em `navGroups` deve bater com o `id` que `DocsVariants` emite — a docs page controla o `id` via prop `id` do container
- **Seções opcionais:** remover do array `navGroups` e **não renderizar** o container correspondente no conteúdo
- `aria-label` no `<nav>` raiz é obrigatório

---

### Template das 15 Seções

As seções estão organizadas em 4 blocos:

- **Bloco 1 — Visão Geral** (2–5): para quem está avaliando o componente
- **Bloco 2 — Referência Técnica** (6–11): para quem vai implementar
- **Bloco 3 — Contexto** (12–14): acessibilidade, relacionados, notas
- **Bloco 4 — Qualidade** (15–16): analytics e testes

---

#### Seção 1 — Header

Renderizado pelo `DocsHeader` já antes do layout de duas colunas (ver bloco de Layout acima). Não possui `id`.

```tsx
<DocsHeader
  title={t('title')}
  description={t('description')}
  category={t('category')}
  type={t('type')}
  installNote="npx shadcn@latest add nome-componente"
/>
```

**Regras:**
- `category` — Layout | Navigation | Form | Feedback | Display | Overlay
- `type` — sempre "Componente" (ou "Provider", "Hook")
- `installNote` — opcional; se omitido, a linha do comando shadcn não é renderizada
- `LanguageSwitcher` é incluso automaticamente

---

#### Seção 2 — Demonstração Padrão

```tsx
<DocsDemonstration title={t('demonstration.title')}>
  <Componente />
  <Componente variant="outline" />
  {/* ... componente REAL importado de @/components/ui/<slug> */}
</DocsDemonstration>
```

**Regras:**
- `children` deve renderizar o **componente real** importado de `@/components/ui/<slug>` — nunca HTML inline com classes manuais
- O container aplica `ComponentDemo` wrapper (card com padding e shadow)

---

#### Seção 3 — Anatomia

```tsx
<DocsAnatomy
  title={t('anatomy.title')}
  items={[1, 2, 3, 4].map(i => t(`anatomy.item${i}`))}
  structureCode={t('anatomy.structureCode')}
  structureLabel={t('anatomy.structureLabel')}
/>
```

**Regras:**
- `items` é um array de strings com HTML inline (`<strong>`, `<code>`). O container sanitiza e renderiza como lista numerada
- `structureCode` é renderizado em `<pre>` (diagrama ASCII); o container adiciona `overflow-x-auto`
- Uma entrada por sub-componente / parte anatômica

---

#### Seção 4 — Quando e Como Usar

```tsx
<DocsWhenToUse
  title={t('usage.title')}
  guidelines={{
    title: t('usage.guidelines.title'),
    items: [1, 2, 3, 4].map(i => t(`usage.guidelines.item${i}`)),
  }}
  scenarios={{
    cols: {
      scenario:    t('usage.scenarios.cols.scenario'),
      use:         t('usage.scenarios.cols.use'),
      alternative: t('usage.scenarios.cols.alternative'),
    },
    items: [1, 2, 3].map(i => ({
      s: t(`usage.scenarios.item${i}.s`),
      u: t(`usage.scenarios.item${i}.u`),
      a: t(`usage.scenarios.item${i}.a`),
    })),
  }}
  uxWriting={{
    title: t('uxWriting.title'),
    cols: {
      element: t('uxWriting.table.element'),
      do:      t('uxWriting.table.correct'),
      dont:    t('uxWriting.table.avoid'),
      rules:   t('uxWriting.table.rules'),
    },
    items: [/* linhas por elemento textual */],
  }}
  do={{ title: t('usage.do.title'),   items: [1, 2, 3].map(i => t(`usage.do.item${i}`))   }}
  dont={{ title: t('usage.dont.title'), items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)) }}
/>
```

**Regras do UX Writing:**
- Uma linha por elemento textual do componente (label, título, descrição, botão action)
- Para componentes sem texto visível (ex: Separator, AspectRatio): omitir o bloco `uxWriting`
- `cols.rules` é opcional — se não passar, o container oculta a coluna

---

#### Seção 5 — Do & Don't (visual)

```tsx
<DocsDoDont
  title={t('doDont.title')}
  pairs={[
    {
      doLabel:   tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doPreview:   <Componente /* uso correto */ />,
      dontPreview: <Componente /* uso incorreto */ />,
      doCaption:   t('doDont.pair1.do'),
      dontCaption: t('doDont.pair1.dont'),
    },
    {
      doLabel:   tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doPreview:   <Componente /* ... */ />,
      dontPreview: <Componente /* ... */ />,
      doCaption:   t('doDont.pair2.do'),
      dontCaption: t('doDont.pair2.dont'),
    },
  ]}
/>
```

**Regras críticas:**
- O container gera **um grid por par** (DO à esquerda, DON'T à direita). **Nunca** tente empilhar DO/DON'T verticalmente ou colocar múltiplos pares no mesmo grid — isso é prevenido pelo componente
- `doPreview` / `dontPreview` devem usar o **componente real** de `@/components/ui/<slug>` ou conteúdo semântico, nunca caixas vazias

---

#### Seção 6 — Importação

```tsx
<DocsImport
  title={t('import.title')}
  description={t('import.description')}
  code={`import { Componente } from '@/components/ui/componente';`}
/>
```

Se houver provider + API (ex: Sonner), passe `secondaryCode` + `secondaryDescription`.

---

#### Seção 7 — Variantes

```tsx
<DocsVariants
  title={t('variants.title')}
  items={[
    {
      name:        'default',
      description: t('variants.items.default'),
      code:        codeDefault,
      preview:     <Componente variant="default" />,
    },
    {
      name:        'destructive',
      description: t('variants.items.destructive'),
      code:        codeDestructive,
      preview:     <Componente variant="destructive" />,
    },
    /* uma entrada por variante visual */
  ]}
/>
```

**Regras:**
- Layout vertical (`space-y-4`) — uma variante por linha em card dedicado
- Cada card: preview do componente real + nome + descrição + toggle "Ver código" (opcional)
- `code` é opcional — se presente, exibe botão de toggle que mostra o snippet colapsável
- Uma entrada por valor de `cva()` — jamais gerar variantes com `<div>` estilizadas
- Componentes sem `cva()` (ex: Table, Accordion, AlertDialog): usar `DocsVariants` para "Composições" / "Modos de Operação" — mesma API, o que muda é o conteúdo dos previews
- **DocsExamples foi removido:** exemplos de código agora ficam embutidos em cada item de `DocsVariants` via o campo `code`

---

#### Seção 8 — Estados

```tsx
<DocsStates
  title={t('states.title')}
  cols={{
    state:    t('states.cols.state'),
    trigger:  t('states.cols.trigger'),
    behavior: t('states.cols.behavior'),
  }}
  items={['default', 'disabled', 'loading', 'focus'].map(key => ({
    label:    t(`states.${key}.label`),
    trigger:  t(`states.${key}.trigger`),
    behavior: t(`states.${key}.behavior`),
  }))}
/>
```

**Regras:**
- A primeira coluna (`label`) é renderizada em `font-medium` simples — o container **não** aplica badge/pill
- Componentes não interativos (ex: Alert, Badge): omitir `disabled`/`loading`
- Componentes puramente estruturais (ex: Separator): omitir a seção inteira

---

#### Seção 9 — Propriedades

```tsx
<DocsProps
  title={t('props.title')}
  tables={[
    {
      cols: {
        prop:        t('props.table.prop'),
        type:        t('props.table.type'),
        default:     t('props.table.default'),
        required:    t('props.table.required'),
        description: t('props.table.description'),
      },
      items: [
        { name: 'variant',  type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não', description: t('props.table.variant')  },
        { name: 'disabled', type: 'boolean',                    defaultValue: 'false',     required: 'Não', description: t('props.table.disabled') },
        /* ... demais props */
      ],
    },
  ]}
  interfaceCode={`interface ComponenteProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}`}
  extensibilityTitle={t('props.extensibility.title')}
  extensibilityNotes={t('props.extensibility.notes')}
/>
```

**Regras:**
- Use múltiplas entradas em `tables` para componentes compostos (ex: Alert tem 3 tabelas: Alert, AlertTitle, AlertDescription; Sonner tem 2: Toaster provider + toast() API)
- `interfaceCode` opcional — bloco em `<code>` mostrando a interface TypeScript
- `extensibilityNotes` aceita HTML (sanitizado pelo container)
- Nome da prop: renderizado em `font-mono font-bold text-primary` pelo container

---

#### Seção 10 — Design Tokens

```tsx
<DocsTokens
  title={t('tokens.title')}
  cols={{
    token:       t('tokens.cols.token'),
    value:       t('tokens.cols.value'),
    description: t('tokens.cols.description'),
  }}
  items={[
    { token: '--primary',   value: 'hsl(...)',   description: t('tokens.table.primary')   },
    { token: '--radius',    value: '0.5rem',     description: t('tokens.table.radius')    },
    /* ... */
  ]}
  customizationTitle={t('tokens.customization.title')}
  customizationCode={`/* globals.css */\n:root { --primary: #...; }`}
/>
```

---

#### Seção 11 — Acessibilidade

```tsx
<DocsAccessibility
  title={t('accessibility.title')}
  summary={t('accessibility.summary')}
  items={[1, 2, 3, 4].map(i => t(`accessibility.item${i}`))}
  keyboardTitle={t('accessibility.keyboard.title')}
  keyboardItems={[
    { key: 'Tab',    description: t('accessibility.keyboard.tab')    },
    { key: 'Enter',  description: t('accessibility.keyboard.enter')  },
    { key: 'Space',  description: t('accessibility.keyboard.space')  },
    { key: 'Escape', description: t('accessibility.keyboard.escape') },
  ]}
/>
```

**Regras:**
- `summary` e `items` aceitam HTML (sanitizado pelo container)
- `keyboardItems` vazio se o componente não recebe foco (ex: Alert, Badge)

---

#### Seção 12 — Componentes Relacionados

```tsx
<DocsRelated
  title={t('related.title')}
  items={[
    { name: 'Sonner',      description: t('related.sonner'),      path: '?path=/docs/ui-sonner--docs' },
    { name: 'AlertDialog', description: t('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
    { name: 'Badge',       description: t('related.badge'),       path: '?path=/docs/ui-badge--docs' },
  ]}
/>
```

**Regras:**
- `path` é a URL relativa do Storybook — o container usa `(window.top ?? window).location.href = path` para navegar no manager, não no iframe

---

#### Seção 13 — Notas e Dicas

```tsx
<DocsNotes
  title={t('notes.title')}
  items={[
    { title: t('notes.note1.title'), content: t('notes.note1.content') },
    { title: t('notes.note2.title'), content: t('notes.note2.content') },
  ]}
/>
```

Cada nota é um callout com borda esquerda colorida (`border-l-4 border-primary/40`). `content` aceita HTML sanitizado.

---

#### Seção 14 — Analytics

```tsx
<DocsAnalytics
  title={t('analytics.title')}
  cols={{
    event:   t('analytics.cols.event'),
    trigger: t('analytics.cols.trigger'),
    payload: t('analytics.cols.payload'),
  }}
  items={[
    { event: 'docs_page_view',     trigger: t('analytics.item1.trigger'), payload: '{ component, locale }' },
    { event: 'docs_section_viewed', trigger: t('analytics.item2.trigger'), payload: '{ section_id, component, locale }' },
    /* eventos de produto, se houver */
  ]}
/>
```

**Regras:**
- Sempre listar os eventos da docs page (`docs_page_view`, `docs_section_viewed`, `language_switched`)
- Componentes interativos podem adicionar eventos de produto (ex: `button_click`, `accordion_expand`, `dialog_open`)
- Componentes estruturais (Table, Alert, Separator): explicitar na descrição que o componente não dispara eventos próprios

---

#### Seção 15 — Critérios de Teste

```tsx
<DocsTestes
  title={t('testes.title')}
  functional={{
    title: t('testes.functional.title'),
    cols: {
      action:   t('testes.functional.cols.action'),
      result:   t('testes.functional.cols.result'),
      priority: t('testes.functional.cols.priority'),
    },
    items: [1, 2, 3, 4, 5].map(i => ({
      action:   t(`testes.functional.item${i}.action`),
      result:   t(`testes.functional.item${i}.result`),
      priority: t(`testes.functional.item${i}.priority`),
    })),
  }}
  accessibility={{
    title: t('testes.accessibility.title'),
    cols: {
      criterion: t('testes.accessibility.cols.criterion'),
      level:     t('testes.accessibility.cols.level'),
      how:       t('testes.accessibility.cols.how'),
    },
    items: [1, 2, 3].map(i => ({
      criterion: t(`testes.accessibility.item${i}.criterion`),
      level:     t(`testes.accessibility.item${i}.level`),
      how:       t(`testes.accessibility.item${i}.how`),
    })),
  }}
  visual={{
    title: t('testes.visual.title'),
    cols: {
      story:    t('testes.visual.cols.story'),
      priority: t('testes.visual.cols.priority'),
    },
    items: [1, 2, 3, 4, 5].map(i => ({
      story:    t(`testes.visual.item${i}.story`),
      priority: t(`testes.visual.item${i}.priority`),
    })),
  }}
/>
```

**Regras:**
- 3 sub-seções obrigatórias: funcional, acessibilidade, visual
- `priority` = "Alta" | "Média" | "Baixa" — o container aplica cores automaticamente (vermelho/amarelo/verde)
- Os critérios documentados aqui devem estar cobertos pelas play functions das stories

---

## Parte 2 — Stories (arquivos Storybook)

### Estrutura de arquivos obrigatória

Cada componente deve ter até **5 arquivos de stories**:

```
src/components/ui/
  ├── nome-componente.tsx                      (componente)
  ├── nome-componente.stories.tsx              (meta + Playground + withAutoDocsTab)
  ├── nome-componente-variantes.stories.tsx     (1 story por variante)
  ├── nome-componente-tamanhos.stories.tsx      (1 story por tamanho — omitir se não tem prop size)
  ├── nome-componente-composicoes.stories.tsx   (com ícone, asChild, slots compostos)
  └── nome-componente-estados.stories.tsx       (disabled, loading — omitir se não aplicável)
```

---

### Arquivo Principal — `nome-componente.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Componente } from './componente';
import { ComponenteDocs } from '@/components/docs/ComponenteDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Componente',
  component: Componente,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ComponenteDocs) },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive'], description: 'Estilo visual' },
    onClick: { action: 'clicked' },
  },
  args: {
    variant: 'default',
    onClick: fn(),
  },
} satisfies Meta<typeof Componente>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');

    await step('Clique dispara callback', async () => {
      await userEvent.click(element);
      await expect(args.onClick).toHaveBeenCalled();
    });

    // Steps alinhados com a Seção "Testes" da docs page
  },
};
```

**Regras:**
- `withAutoDocsTab(ComponenteDocs)` em `parameters.docs.page` — bridge que injeta a docs page na aba Docs do Storybook
- `onClick: { action: 'clicked' }` em `argTypes` **apenas** quando a story tem `play` function testando cliques
- Em `args`, use `fn()` para callbacks testáveis
- Para componentes não-interativos (Alert, Badge, Separator): **omitir** `argTypes.onClick`, `args.onClick` e a play function, ou testar estrutura/role em vez de cliques

---

### Arquivos secundários — Variantes / Tamanhos / Composições / Estados

Cada um tem seu próprio meta com `title: 'UI/Componente/Variantes'` etc. Não precisam de `withAutoDocsTab` (a docs page já está no arquivo principal).

```tsx
const meta = {
  title: 'UI/Componente/Variantes',
  component: Componente,
  args: { variant: 'default' /* sem onClick se não tem play function */ },
} satisfies Meta<typeof Componente>;

export const Default: Story = {
  args: { variant: 'default' },
  parameters: { docs: { description: { story: 'Quando usar…' } } },
};
```

---

## Regras Gerais

### Convenções de nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Arquivo docs | `NomeComponenteDocs.tsx` | `AlertDocs.tsx` |
| Arquivo stories principal | `nome-componente.stories.tsx` | `alert.stories.tsx` |
| Arquivos stories secundários | `nome-componente-grupo.stories.tsx` | `alert-variantes.stories.tsx` |
| Title do meta principal | `"UI/NomeComponente"` | `"UI/Alert"` |
| Title dos subgrupos | `"UI/NomeComponente/Grupo"` | `"UI/Alert/Variantes"` |

### Checklist de implementação

- [ ] `translations.json` em `docs/shared/content/{slug}/` com `{ "pt-BR": {...}, "en": {...}, "es": {...} }`
- [ ] ComponentDocs composta exclusivamente com containers `Docs*` de `@/components/docs/shared/sections` — **zero JSX inline de seção**
- [ ] `DocsHeader` usado (inclui `LanguageSwitcher` automaticamente)
- [ ] `useSeoEffect` chamado com `{ title, description, locale, componentSlug }`
- [ ] `useTranslation` com `uiTranslations + componentTranslations`
- [ ] `track('docs_page_view', ...)` em `useEffect([locale])`
- [ ] `useActiveSection` ligado ao `IntersectionObserver` + `track('docs_section_viewed', ...)`
- [ ] `<nav aria-label>` com `sticky top-8 w-52 shrink-0` envolvendo `<DocsNav>`
- [ ] Wrapper `.ds-docs` aplicado no container `flex-1`
- [ ] `navGroups` com `id` que batem exatamente com os containers renderizados
- [ ] Demonstração, variantes e Do/Don't usam o **componente real** de `@/components/ui/<slug>` — nunca HTML inline com classes manuais
- [ ] Até 5 arquivos de stories criados (menos se não aplicável)
- [ ] Story principal com `parameters.docs.page: withAutoDocsTab(ComponenteDocs)`
- [ ] `onClick: fn()` + `argTypes.onClick: { action: 'clicked' }` **somente** se há play function testando clique
- [ ] Play function alinhada com a Seção "Testes" da docs page
- [ ] Todos os `argTypes` com `description` em pt-BR

### Proibições

- **Proibido** reimplementar o HTML interno de qualquer container `Docs*` dentro da docs page
- **Proibido** copiar classes Tailwind de seção (tabelas, cards, grids Do/Don't) — use o container
- **Proibido** usar `<pre><code>` em docs pages (exceto em `anatomy.structureCode`, onde o container já cuida). Blocos de código inline usam `<div><code>`, que é o que o container já renderiza
- **Proibido** renderizar variantes/estados com `<div>` + classes CSS manuais em vez do componente real importado de `@/components/ui/<slug>`

### Componentes sem interação

Para componentes estáticos (Badge, Separator, Avatar):
- Omitir grupos que não se aplicam (Composições, Estados)
- Omitir `onClick`/play function do Playground
- Remover seções correspondentes de `navGroups` e **não** renderizar o container
- Manter no mínimo: `DocsHeader` + `DocsDemonstration` + `DocsVariants` + `DocsProps` + `DocsAccessibility`

---

## Padrões por tipo de componente

As seções abaixo documentam ajustes de **conteúdo** (quais chaves de tradução preencher, quais containers omitir). As **APIs dos containers não mudam** — só o que se passa para eles.

### Componentes Provider + API imperativa (padrão Sonner)

Componentes como **Sonner** expõem duas superfícies: um **provider** (`<Toaster />`) e uma **função imperativa** (`toast()`).

1. **`DocsVariants`** — `items` lista **tipos de toast** (`default`, `success`, `error`, `warning`, `info`, `loading`) em vez de variantes `cva()`. Cada `preview` chama a API programaticamente (`<Button onClick={() => toast.success('...')}>`).
2. **Subseção de posições** — para documentar 6 posições, use uma segunda chamada de `DocsVariants` dentro da mesma docs page, com `title = t('variants.positions.title')`.
3. **`DocsProps`** — passe **duas entradas** em `tables`: uma para `<Toaster />` provider, outra para opções de `toast()`.
4. **`DocsImport`** — use `secondaryCode` + `secondaryDescription` para separar import do provider e import da função `toast`.
5. **`DocsAnatomy`** — 7 items; `structureCode` mostra chamadas de API em vez de JSX.
6. **Analytics** — emitir evento `toast_demo_triggered` ao clicar nos botões de demonstração.

### Componentes Presentacionais Compostos (padrão Table)

Componentes como **Table** têm múltiplos sub-componentes (`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`), todos `React.forwardRef` sobre elementos HTML nativos.

1. **`DocsAnatomy`** — 8 items (um por sub-componente). `structureCode` mostra JSX aninhado.
2. **`DocsVariants`** — **title**: "Composições e Tamanhos". `items` lista composições recorrentes (`basic`, `withCaption`, `withFooter`, `empty`). Cada `preview` monta a tabela completa.
3. **Densidades** — segunda chamada de `DocsVariants` com composições aplicando `className="h-8|h-10|h-12"` no `TableHead`/`TableCell`. Esclarecer que densidade **não** é prop do componente.
4. **`DocsStates`** — apenas estados estruturais: `hover`, `selected` (via `data-state`), `empty`, `scroll`. Omitir `disabled`/`loading`.
5. **`DocsProps`** — 8 entradas em `tables`, uma por sub-componente, documentando `className`, `children`, `colSpan`, `rowSpan`, `scope`, `data-state`. Sem props customizadas.
6. **`DocsAnalytics`** — explicitar na descrição que Table é estrutural e não emite eventos próprios.
7. **Stories** — omitir `table-variantes` e `table-tamanhos`. Arquivos: `.stories.tsx`, `-composicoes`, `-estados`, `-densidades`.

### Componentes Compostos Interativos com Disclosure (padrão Accordion)

Componentes como **Accordion** (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`) implementam ARIA Disclosure.

1. **`DocsAnatomy`** — 4 items (Root, Item, Trigger, Content).
2. **`DocsVariants`** — **title**: "Modos de Operação". `items`: `single`, `multiple`, `controlled`. Cada `preview` mostra o accordion funcionando no modo (não muda cor/estilo).
3. **`DocsStates`** — `closed`, `open`, `focus`, `disabled`. Omitir `loading`. Cada entrada documenta o `data-state` correspondente.
4. **`DocsProps`** — 4 entradas em `tables`: `Accordion` (Root), `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
5. **`DocsTokens`** — inclui `--animate-accordion-up` / `--animate-accordion-down` (animações definidas no `globals.css`).
6. **Analytics** — além dos eventos de docs, `accordion_expand { label }` ao abrir um item e `accordion_collapse { label }` ao fechar. Ver `docs/shared/guidelines/07-analytics.md`.
7. **Stories** — omitir `accordion-variantes` e `accordion-tamanhos`. Arquivos: `.stories.tsx`, `-modos`, `-estados`, `-composicoes`.
8. **Play function** — cobrir 6 critérios: clicar trigger fechado abre; clicar aberto (collapsible) fecha; modo single alterna; disabled bloqueia; Enter expande; Space expande. Verificar `aria-expanded` via `toHaveAttribute('aria-expanded', 'true'|'false')`.
9. **Chaves de tradução** — conflito: `props.table.type` é coluna "Tipo"; para descrever a prop `type` use sufixo `_prop` (`props.table.type_prop`).

### Componentes de Feedback Não-Interativos (padrão Alert)

Componentes como **Alert** (`Alert` + `AlertTitle` + `AlertDescription`) são banners de status. Não recebem foco, não têm `disabled`/`loading`.

1. **`DocsAnatomy`** — 4 items: `Alert` (`div[role=alert]`), `AlertTitle` (`h5`), `AlertDescription` (`div`), ícone SVG opcional (filho direto do `Alert`).
2. **`DocsVariants`** — 4 entradas (`default`, `destructive` como props; `success` e `warning` via `className`). Cada `preview` mostra o alerta completo (ícone + `AlertTitle` + `AlertDescription`), não isolado. Omitir seção de tamanhos.
3. **`DocsStates`** — `complete`, `withoutTitle`, `withoutIcon`, `dynamicInsert`. Omitir `loading`/`disabled`.
4. **`DocsProps`** — 3 entradas em `tables`: `Alert` (variant, className, children), `AlertTitle` (className, children), `AlertDescription` (className, children). Todos aceitam atributos HTML nativos via `forwardRef`.
5. **Play function** — estrutura e a11y, não interação:
   - `role="alert"` no elemento raiz (`getByRole('alert')`)
   - Variante `destructive` aplica a classe correta
   - Ícone SVG filho direto recebe posicionamento absoluto via seletor CSS
   - `AlertTitle` renderiza como `h5`
6. **`DocsAnalytics`** — Alert é estrutural: listar apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir `alert_dismiss` (payload: `{ label: string }`) apenas se o alerta tiver ação de dismissal.
7. **Stories** — omitir `alert-tamanhos`. Arquivos: `.stories.tsx`, `-variantes`, `-composicoes`, `-estados`.
8. **`role="alert"` + WCAG 4.1.3** — inserção dinâmica no DOM é anunciada por leitores de tela (ARIA Live Region implícita). Cobrir na seção de Acessibilidade e verificar com `getByRole('alert')`.
9. **Ícone via CSS absoluto** — `[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4` no `alertVariants` posiciona qualquer SVG filho direto. Texto recuado via `[&>svg~*]:pl-7`. Documentar em `notes.note2` e na Anatomia.

### Componentes Modais de Confirmação (padrão AlertDialog)

Componentes como **AlertDialog** são overlays de decisão forçada.

1. **Sem `cva()`** — não há prop `variant`. `DocsVariants.items` documenta **tipos de uso** (`destructive`, `neutral`) — padrões contextuais. Cada `preview` usa `defaultOpen` na instância para renderizar o modal aberto no card.
2. **`DocsAnatomy`** — 9 items cobrindo todos os sub-componentes.
3. **`DocsStates`** — `closed` (padrão) e `open`. Omitir `loading`/`disabled`.
4. **`DocsProps`** — props do root (`open`, `defaultOpen`, `onOpenChange`) + prop `asChild` no Trigger.
5. **`DocsNotes`** — overlay não fecha ao clicar (diferente do Dialog). Documentar em uma nota dedicada.
6. **`DocsAccessibility`** — `role="alertdialog"` anuncia imediatamente sem foco (diferente de `dialog`).
7. **Stories** — omitir `alert-dialog-tamanhos`. Usar `defaultOpen={true}` nas stories de variantes/estados para que Chromatic capture o modal visível.
8. **Play function** — 6 critérios: trigger abre modal com `role="alertdialog"`; Cancel fecha e retorna foco; Escape fecha; Tab não escapa (focus trap); overlay **não** fecha; Action fecha + dispara callback.
9. **Analytics de produto** — `dialog_open { component: "alert_dialog", location, label }` ao abrir; `dialog_confirm { component: "alert_dialog", location, label }` ao confirmar; `dialog_close { component: "alert_dialog", location, label, trigger: "cancel_button" | "escape" }` ao cancelar. Ver `docs/shared/guidelines/07-analytics.md`.
10. **`notes.tip${i}Title`** — título separado de `notes.tip${i}` (descrição). Não aninhar (`flattenDict` não indexa objetos intermediários).
