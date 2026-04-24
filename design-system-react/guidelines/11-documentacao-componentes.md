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

Para componentes estáticos (Badge, Separator):
- Omitir grupos que não se aplicam (Composições, Estados)
- Omitir `onClick`/play function do Playground
- Remover seções correspondentes de `navGroups` e **não** renderizar o container
- Manter no mínimo: `DocsHeader` + `DocsDemonstration` + `DocsVariants` + `DocsProps` + `DocsAccessibility`

> Avatar **não entra aqui** — apesar de não ser interativo, tem composições, estados (`loaded`/`loading`/`failed`/`noImage`) e tokens próprios. Ver padrão dedicado na seção abaixo.

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

### Componentes de Feedback Não-Interativos Inline (padrão Badge)

Componentes como **Badge** (`Badge`) são rótulos visuais compactos para status, contagens, categorias ou tags. Não têm `size` prop, não recebem foco, não têm `disabled`/`loading`. Nome, categoria **Feedback**, translations em `docs/shared/content/badge/translations.json`.

1. **`DocsAnatomy`** — 4 items: `Badge` (`<div>` inline-flex), conteúdo (texto/número), ícone opcional (com `aria-hidden="true"`), prop `variant`. `structureCode` mostra `<Badge variant="...">Icon + Texto</Badge>`.
2. **`DocsVariants`** — 4 entradas nativas do `cva()`: `default`, `secondary`, `destructive`, `outline`. Cada `preview` renderiza o componente real importado de `@/components/ui/badge` com texto curto apropriado (ver `demonstration.labels.*`). **Omitir seção de tamanhos** — Badge não tem prop `size`; dimensão é única (`text-xs font-semibold px-2.5 py-0.5`).
3. **`DocsStates`** — 4 configurações contextuais: `withIcon`, `countBadge`, `asLink`, `asTrigger`. **Omitir `disabled`/`loading`** — Badge é não-interativo por padrão. A seção documenta composições comuns, não estados funcionais.
4. **`DocsProps`** — 1 única tabela para `Badge`: `variant` (`"default" | "secondary" | "destructive" | "outline"`), `className`, `children`. Nota de extensibilidade (`extensibilityNotes` / `props.extensibility`) deixa claro que `Badge` estende `HTMLAttributes<HTMLDivElement>` — aceita `onClick`, `aria-*`, `data-*`, mas para interação prefira envolver em `<button>` ou `<a>` ao invés de `onClick` direto.
5. **Play function** — estrutura e a11y, sem interação de clique:
   - Cada variante aplica a classe de fundo/texto correta (`bg-primary`, `bg-secondary`, `bg-destructive`, borda only no `outline`)
   - Ícone filho direto renderiza com `aria-hidden="true"`
   - `getByText` confirma que o rótulo comunica o estado sem depender da cor
6. **`DocsAnalytics`** — Badge é estrutural: listar apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir `badge_click` (payload: `{ label, variant }`) **apenas** quando o Badge funcionar como trigger clicável (envolto em `<button>` ou `<a>`).
7. **Stories** — **omitir `badge-tamanhos` e `badge-estados`**. Arquivos obrigatórios: `badge.stories.tsx` (Playground com `parameters.docs.page: withAutoDocsTab(BadgeDocs)` + `tags: ["autodocs"]`), `badge-variantes.stories.tsx` (Default, Secondary, Destructive, Outline — uma story por variante), `badge-composicoes.stories.tsx` (WithIcon, CountBadge, AsLink, InCard — uma por configuração contextual de `states`).
8. **Sem foco próprio** — Badge é `<div>`; `keyboardItems` no `DocsAccessibility` pode usar `{ key: "—", description: "sem tab stops próprios; quando envolvido em button/a, o pai gerencia foco" }` ou ser omitido. O wrapper interativo (`<button>`, `<a>`) é quem ganha `focus:ring-*`.
9. **Cor ≠ significado** — WCAG 1.4.1: o texto do Badge deve comunicar o estado sem depender da cor (ex: "Ativo" em vez de só fundo verde). Documentar em `accessibility.item2` e em um par Do/Don't.

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

### Containers Passivos Stateless (padrão AspectRatio)

Componentes como **AspectRatio** (`@radix-ui/react-aspect-ratio`) preservam proporção largura/altura do filho. Não têm estado próprio, não disparam eventos, não possuem `cva()` nem prop `size` — toda interação é do filho.

1. **`DocsDemonstration`** — grid responsivo (`grid-cols-1 sm:grid-cols-2 gap-6`) com 4 ratios canônicos rotulados. Labels acima de cada preview em `<p className="text-xs font-medium text-muted-foreground">`. Para ratios que crescem muito (1/1, 3/4), envolver em wrapper `max-w-[220px]` / `max-w-[260px]` para evitar cartazes gigantes.
2. **`DocsAnatomy`** — 3 items: Root (wrapper com `padding-bottom` calculado), inner `absolute inset-0` e o filho (`img | video | iframe`). `structureCode` mostra a hierarquia em 3 níveis.
3. **`DocsWhenToUse`** — **omitir `uxWriting`**: AspectRatio não tem texto visível próprio (`alt`/`title`/captions são do filho). Manter `guidelines`, `scenarios` (5 linhas) e par `do`/`dont` (4 items cada).
4. **`DocsVariants`** — renderizar como "Ratios Canônicos", não variantes `cva()`. `items` com 5 entradas fixas (`16 / 9`, `4 / 3`, `1 / 1`, `3 / 4`, `21 / 9`) — o `name` é o ratio em si, não um token `default`/`destructive`. Cada `preview` usa `ImageWithFallback` dentro de um wrapper `max-w-*` proporcional ao ratio. A chave `variants.note` deixa explícito no JSON que são padrões canônicos, não variantes `cva()` — a docs page consome via o próprio container.
5. **`DocsStates`** — 3 linhas descrevendo **ownership transfer** para o filho: `Conteúdo carregado` / `Conteúdo ausente` / `Conteúdo falhou`. A coluna "Gatilho" descreve o estado do filho, e "Comportamento" descreve o comportamento do container (que é sempre inerte). `states.note` explica no JSON que o componente é stateless.
6. **`DocsProps`** — 1 tabela única com 4 linhas: `ratio` (number, default 1), `children` (ReactNode, obrigatório), `asChild` (boolean, default false), `className` (string). `interfaceCode` mostra a interface do Radix. Sem múltiplas tabelas (componente é um único `Root`).
7. **`DocsTokens`** — AspectRatio não usa tokens próprios (container transparente). A tabela documenta apenas tokens aplicáveis **quando o componente é usado como placeholder** (skeleton): `--radius` → `rounded-md`, `--border` → `border border-border`, `--muted` → `bg-muted`. `tokens.note` no JSON deixa claro que sem filho o container é transparente. `customizationCode` instrui a aplicar classes de borda/radius **no filho, nunca no wrapper**.
8. **`DocsAccessibility`** — `keyboardItems` com uma linha explicando que não há tab stops próprios (`key: "—"`) e uma nota sobre foco passar diretamente ao filho (video/link/iframe). `accessibility.aria.item*` foca em `data-slot="aspect-ratio"` e nas regras de `alt`/`title` do filho.
9. **`DocsAnalytics`** — tabela com **uma única linha passiva**: `{ event: '—', trigger: t('analytics.note'), payload: '—' }`. A chave `analytics.note` contém a explicação "container passivo não dispara eventos próprios". Não listar `docs_page_view`/`docs_section_viewed` aqui — estes já são do layer de docs, não do componente.
10. **Stories** — criar apenas `aspect-ratio.stories.tsx`, `aspect-ratio-variantes.stories.tsx` e `aspect-ratio-composicoes.stories.tsx`. **Omitir** `-tamanhos` (não tem prop `size`) e `-estados` (stateless). Apenas o arquivo principal leva `tags: ["autodocs"]` + `withAutoDocsTab(AspectRatioDocs)`.
11. **`rounded-md` / `border` no filho** — regra visual absoluta. Nunca aplicar no wrapper AspectRatio (o raio cortaria o cálculo de `padding-bottom` e borderia um container vazio). Documentado nos pares Do/Don't e em `notes`.
12. **`ImageWithFallback`** — em React, usar sempre `@/components/figma/ImageWithFallback` para `<img>` dentro de AspectRatio (loading lazy/decoding async já embutidos). Nunca `<img>` cru em docs previews.

### Componentes de Navegação Hierárquica Compostos (padrão Breadcrumb)

Componentes como **Breadcrumb** (`Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`) são compostos por sub-componentes e **não usam `cva()`**. A aparência é uniforme; o que varia é a **composição** (com/sem ellipsis, separador customizado, colapso responsivo). Categoria **Navigation**, translations em `docs/shared/content/breadcrumb/translations.json`.

1. **Sem `cva()` / sem prop `variant`** — a aparência do Breadcrumb é consistente. Não criar prop `variant` nem `size`. Customização de separador e níveis vêm por **composição** (children) e `className`.
2. **`DocsAnatomy`** — 7 items: `Breadcrumb` (nav), `BreadcrumbList` (ol), `BreadcrumbItem` (li), `BreadcrumbLink` (a), `BreadcrumbPage` (span + aria-current), `BreadcrumbSeparator` (li + aria-hidden, ChevronRight default), `BreadcrumbEllipsis` (span + sr-only). `structureCode` mostra a hierarquia `nav > ol > li > (a | span)` com separadores intercalados.
3. **`DocsVariants`** — **title**: "Configurações Disponíveis". `items` com 4 entradas: `default`, `withEllipsis`, `customSeparator`, `responsive`. Cada `preview` monta a composição completa com links reais e último item como `BreadcrumbPage`. **Nota obrigatória** em `variants.note`: "O Breadcrumb não tem variantes visuais — o que varia é a composição."
4. **`DocsStates`** — 4 configurações: `simple`, `withEllipsis`, `customSeparator`, `asChildLink`. Não são estados funcionais — são padrões de composição. Omitir `disabled`/`loading`/`error`.
5. **`DocsProps`** — 7 tables (uma por subcomponente): `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (com `href`, `render`), `BreadcrumbPage`, `BreadcrumbSeparator` (com `children` para separador custom), `BreadcrumbEllipsis`. Todos aceitam `className` + atributos HTML nativos.
6. **`DocsTokens`** — 7 tokens: `--muted-foreground` (links inativos), `--foreground` (hover e página atual), `--ring` (focus), `--text-sm` (fonte da lista), espaçamento `gap-1.5` entre itens, e `size-3.5` (separador) / `size-5` (ellipsis) para ícones.
7. **`DocsAccessibility`** — regras obrigatórias:
   - `<nav aria-label="breadcrumb">` no root
   - `aria-current="page"` no `BreadcrumbPage` (aplicado automaticamente)
   - `aria-hidden="true"` + `role="presentation"` em `BreadcrumbSeparator` e `BreadcrumbEllipsis`
   - Texto `sr-only "More"` dentro do `BreadcrumbEllipsis`
   - Contraste 4.5:1 em links inativos (`muted-foreground` sobre `background`)
8. **`DocsAnalytics`** — eventos de produto:
   - `navigation_click` (payload `{ component: 'breadcrumb', label, destination, location }`) em clique de `BreadcrumbLink`
   - `breadcrumb_ellipsis_open` (payload `{ component: 'breadcrumb', hidden_count }`) quando o usuário expande níveis colapsados
   - **Nunca** rastrear `BreadcrumbPage` — o item atual não é navegável
9. **`DocsDoDont`** — pares canônicos: (a) último item como `BreadcrumbPage` (sem link) vs todos os itens como link; (b) ellipsis para ≥5 níveis vs breadcrumb com 6+ níveis expandidos.
10. **`DocsNotes`** — 4 tips: JSON-LD automático via `useSeoEffect({ breadcrumb: [...] })`, DropdownMenu dentro do Ellipsis em mobile, integração com routers via `render`/`asChild`, label do `BreadcrumbPage` espelhando o `<h1>`.
11. **Stories** — criar 4 arquivos: `breadcrumb.stories.tsx` (Playground + `tags: ["autodocs"]` + `withAutoDocsTab(BreadcrumbDocs)`), `breadcrumb-composicoes.stories.tsx` (Default, WithEllipsis, CustomSeparator, Responsive), `breadcrumb-estados.stories.tsx` (Simple, WithEllipsis, CustomSeparator, AsChildLink), `breadcrumb-variantes.stories.tsx` (alias de Composições se preferir). **Não criar** `breadcrumb-tamanhos.stories.tsx` — sem prop `size`.
12. **`BreadcrumbPage` ≠ `BreadcrumbLink`** — regra crítica: o último item **nunca** é link. Validar em play function que o último `<li>` não contém `<a>` e que o `<span>` filho tem `aria-current="page"`.
13. **Rich snippets / JSON-LD** — o Breadcrumb é o único componente de navegação com impacto em SEO. O hook `useSeoEffect` aceita `breadcrumb: BreadcrumbEntry[]` que gera o JSON-LD `BreadcrumbList` automaticamente. Documentar em `notes.tip1` e na guideline 06-seo-geo.
14. **Labels** — substantivos ou frases nominais curtas (≤2 palavras no nível principal), sem verbo, sem ponto final. O `BreadcrumbPage` deve refletir exatamente o `<h1>` da página (máx. 3 palavras). Não abreviar ("Visão geral" não "Vis. geral").

### Componentes Display Compositionais com Estados (padrão Avatar)

Componentes como **Avatar** (`@radix-ui/react-avatar`: `Avatar`, `AvatarImage`, `AvatarFallback`) são displays passivos com **composições** em vez de variantes `cva()` — todas as "variantes" são padrões de composição de filhos. Têm tamanho padrão embutido e estados internos de carregamento de imagem.

1. **Sem `cva()` / sem prop `size`** — o Root aplica `h-10 w-10` fixo internamente. Tamanhos adicionais (`h-6 w-6`, `h-8 w-8`, `h-10 w-10`, `h-12 w-12`) vêm **sempre** via `className`. **Não criar prop `size`.**
2. **`DocsVariants`** — **title**: "Composições" ou equivalente. `items` com 5 entradas canônicas: `image`, `initials`, `icon`, `group`, `withStatus`. Cada `preview` monta a composição completa (Root + filhos + wrappers absolutos quando aplicável). Não há variantes `cva()`.
3. **`DocsAnatomy`** — 4 items: `Avatar` (Root), `AvatarImage`, `AvatarFallback`, e o elemento sibling de status (quando aplicável) / ring em grupos. `structureCode` mostra a hierarquia `<Avatar><AvatarImage /><AvatarFallback>…</AvatarFallback></Avatar>`.
4. **`DocsStates`** — 4 linhas: `loaded`, `loading`, `failed`, `noImage`. Omitir `disabled`/`error` — Avatar é passivo. A coluna "Gatilho" descreve o estado da imagem (`onLoadingStatusChange`); "Comportamento" descreve qual filho é renderizado pelo Radix.
5. **`DocsProps`** — 3 tables: `Avatar` (`className`, `asChild`, `children`), `AvatarImage` (`src`, `alt`, `onLoadingStatusChange`, `className`), `AvatarFallback` (`delayMs`, `className`, `children`). `src` e `alt` são **obrigatórios** em `AvatarImage`. `delayMs={600}` é o valor canônico no `AvatarFallback`.
6. **`DocsTokens`** — 7 tokens: `--muted` (`bg-muted` no Fallback), `--muted-foreground` (texto das iniciais), `--background` (`ring-background` em grupos e status), `--border`, `--primary` (indicador de status online), `--radius` (`rounded-full` fixo), `--ring` (foco via Radix quando dentro de link/botão).
7. **`DocsAccessibility`** — regras obrigatórias: (a) `alt` descritivo (`"Foto de perfil de [Nome]"`) em `AvatarImage` quando é a única pista visual; (b) `alt=""` + `AvatarFallback aria-hidden="true"` quando o nome já está visível ao lado; (c) indicador de status com `<span aria-label="Online">` (ou equivalente); (d) grupo opcional com `role="group" aria-label="Participantes"` no wrapper; (e) contraste das iniciais ≥ 4.5:1.
8. **`DocsAnalytics`** — Avatar é passivo: listar apenas os eventos da docs (`docs_page_view`, `docs_section_viewed`, `language_switched`). Incluir `avatar_click` (`{ component: 'avatar', location, label }`) **apenas** quando o Avatar está envolvido por link/botão em produto.
9. **`DocsDoDont`** — pares canônicos: (a) "com fallback de iniciais" vs "sem fallback" (imagem quebrada resulta em container vazio); (b) "iniciais como 2 letras maiúsculas" vs "iniciais em minúsculas/3+ letras".
10. **Stories** — criar 4 arquivos: `avatar.stories.tsx` (Playground + `tags: ["autodocs"]` + `withAutoDocsTab(AvatarDocs)`), `avatar-composicoes.stories.tsx` (WithImage, WithInitials, WithIcon, Group, WithStatus), `avatar-tamanhos.stories.tsx` (Size6, Size8, Size10 default, Size12), `avatar-estados.stories.tsx` (Loaded, Loading com `delayMs`, Failed, NoImage). **Não criar `avatar-variantes.stories.tsx`** — as "variantes" são composicionais e vão em `-composicoes`. Apenas o arquivo principal leva `tags: ["autodocs"]`.
11. **`AvatarFallback` obrigatório** — regra visual absoluta: toda instância com `AvatarImage` precisa de `AvatarFallback` irmão. Sem ele, quando `src` falha/demora, o container fica vazio. Documentar no par Do/Don't e em `notes`.
12. **Iniciais canônicas** — 2 letras maiúsculas: primeira letra do nome + primeira do sobrenome (`"João da Silva"` → `"JS"`, `"Maria"` → `"MA"`). Regra de UX writing fica em `usage.uxWriting.table.initials`.

### Componentes de Formulário com Wrapper Externo (padrão Calendar)

Componentes como **Calendar** (`react-day-picker v9`: `Calendar`, `CalendarDayButton`) são wrappers sobre bibliotecas de terceiros com **props funcionais** em vez de variantes `cva()`. As "variantes" são **modos de uso** (`single`, `multiple`, `range`) controlados por prop, não por classe. Têm dependência obrigatória de `locale` em pacote separado e são naturalmente compostos com outros componentes para formar padrões maiores (ex: `DatePicker` = Calendar + Popover + Button). Categoria **Formulário**, translations em `docs/shared/content/calendar/translations.json`.

1. **Sem `cva()` / sem prop `size` ou `variant`** — o Root aplica classes funcionais via `classNames` map (override por slot do `react-day-picker`) e `buttonVariant` reutiliza as variantes do `Button`. **Não criar prop `variant` no Calendar.**
2. **`DocsVariants`** — **title**: "Modos e Layouts". `items` com 6 entradas não-exclusivas: `single`, `multiple`, `range` (modos), `captionDropdown`, `withWeekNumber`, `numberOfMonths` (layouts/config). Cada `preview` renderiza o Calendar real com a prop correspondente. Não há variantes `cva()`. **Nota obrigatória** em `variants.note`: "O Calendar não tem variantes `cva()` — o que varia é a composição/props".
3. **`DocsAnatomy`** — 6 items: `Calendar` (Root), `Nav`, `MonthCaption`, `Weekdays`, `Day` (célula), `DayButton` (botão interno). `structureCode` mostra `<Calendar mode="single" selected onSelect locale />` com comentários dos valores aceitos por prop.
4. **`DocsStates`** — 6 linhas: `default`, `selected`, `disabled`, `today`, `outside`, `rangeMiddle`. A coluna "Gatilho" descreve a prop/condição (`selected` contém a data, `disabled` casa, `showOutsideDays` ativo, etc.); "Comportamento" descreve classes e atributos ARIA (`aria-selected`, `aria-disabled`, `bg-primary`, `bg-muted`, `opacity-50`).
5. **`DocsProps`** — **2 tabelas**: `Calendar` (Root — 11 props: `mode`, `selected`, `onSelect`, `locale`, `disabled`, `showOutsideDays`, `captionLayout`, `buttonVariant`, `numberOfMonths`, `className`, `classNames`) e `CalendarDayButton` (subcomponente auxiliar exportado). `mode`, `selected` e `onSelect` **são interdependentes** — o tipo de `selected` depende do `mode`. Documentar explicitamente na descrição da prop.
6. **`DocsTokens`** — 7 tokens: `--primary` + `--primary-foreground` (seleção), `--muted` (hoje + range middle), `--muted-foreground` (outside days + weekdays), `--foreground` (default), `--ring` (focus no DayButton), `--radius-md` (`--cell-radius` local), `--cell-size` (variável local que define o tamanho fixo de cada célula).
7. **`DocsAccessibility`** — regras obrigatórias: (a) `role="grid"` no container (herdado do react-day-picker); (b) Arrow keys navegam entre dias/semanas; (c) Page Up/Down muda mês (Shift para ano); (d) Home/End vão para início/fim da semana; (e) `aria-label` do DayButton traz a data por extenso **no locale ativo**; (f) `aria-selected` e `aria-disabled` automáticos; (g) Chevrons dos botões de navegação com `aria-hidden="true"`. `keyboardItems` cobre 5 entradas: `arrows`, `pageUpDown`, `homeEnd`, `enter`, `tab`.
8. **`DocsAnalytics`** — Calendar é campo de formulário: rastrear `field_change` (`{ component: 'calendar', field_name, value: ISO string, location }`) na seleção. Quando composto em `DatePicker`, rastrear também `dialog_open` na abertura do Popover. Omitir `button_click` dos botões internos de navegação — são mecânica do componente, não intenção do usuário.
9. **`DocsDoDont`** — pares canônicos: (a) com `locale={ptBR}` vs sem locale (fallback para inglês); (b) `disabled={{ before: new Date() }}` vs validar só no submit.
10. **`DocsNotes`** — 4 tips críticas:
    - `locale` vem de **`react-day-picker/locale`**; o `format()` do DatePicker vem de **`date-fns/locale`** — pacotes diferentes, ambos precisam configuração
    - Integração com React Hook Form via `FormField` + `field.value`/`field.onChange` — `zodResolver` valida `Date` nativamente
    - `numberOfMonths={2}` em `mode="range"` reduz cliques em reservas longas
    - `initialFocus` dentro de Popover move foco ao abrir — melhora UX por teclado
11. **Stories** — criar 4 arquivos: `calendar.stories.tsx` (Playground com `mode="single"` + `tags: ["autodocs"]` + `withAutoDocsTab(CalendarDocs)`), `calendar-modos.stories.tsx` (Single, Multiple, Range), `calendar-layouts.stories.tsx` (CaptionLabel, CaptionDropdown, TwoMonths, WithWeekNumber), `calendar-estados.stories.tsx` (Selected, Disabled, Today, WithOutsideDays, RangeWithMiddle). **Não criar** `calendar-variantes.stories.tsx` nem `calendar-tamanhos.stories.tsx` (sem cva, sem size). Nomear o grupo como "Modos" ou "Composições" em `DocsVariants`, não "Variantes". Apenas o arquivo principal leva `tags: ["autodocs"]`.
12. **`locale` obrigatório** — regra visual absoluta: toda instância em docs previews e stories precisa passar `locale={ptBR}` (ou o locale ativo). Sem isso, meses/dias caem para inglês e o Chromatic capture fica inconsistente entre builds dos 3 idiomas.
13. **`mode` determina o tipo de `selected`** — regra de tipo absoluta:
    - `mode="single"` → `selected?: Date`, `onSelect: (date: Date | undefined) => void`
    - `mode="multiple"` → `selected?: Date[]`, `onSelect: (dates: Date[] | undefined) => void`
    - `mode="range"` → `selected?: { from: Date; to?: Date }`, `onSelect: (range: DateRange | undefined) => void`
    
    Documentar nos `props.table.mode`/`selected`/`onSelect` que os 3 são interdependentes. Stories devem ter uma variação por `mode` para validar isolamento de tipos.
14. **`classNames` map** — override granular por slot do `react-day-picker`. Lista de slots válidos: `root`, `months`, `month`, `nav`, `button_previous`, `button_next`, `month_caption`, `caption_label`, `table`, `weekdays`, `weekday`, `week`, `day`, `selected`, `today`, `outside`, `disabled`, `range_start`, `range_middle`, `range_end`. Documentar em `props.table.classNames` que o override é aditivo — usar sempre junto com `cn()` para não apagar os defaults.

### Containers Estruturais com prop `size` (padrão Card)

Componentes como **Card** (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`) são containers estruturais compostos. **Não usam `cva()`** — em vez disso, têm prop `size="default"|"sm"` que propaga via `data-size` no root e subcomponentes reagem via seletores `group-data-[size=sm]/card`. Categoria **Layout**, translations em `docs/shared/content/card/translations.json`.

1. **Sem `cva()` / com prop `size`** — a variação visual vem da prop `size` em vez de variants de `cva()`. O Card aplica `data-size={size}` no root e os subcomponentes consultam esse atributo via `group-data-[size=sm]/card:*` (padding, font-size). **Não criar variantes `cva()`.**
2. **`DocsVariants`** — **title**: "Tamanhos e Composições". `items` com 5 entradas: `default`, `sm` (tamanhos), `withFooter`, `withAction`, `withImage` (composições). A nota (`variants.note`) deixa claro que não são variantes `cva()` — são `size` + composição de subcomponentes.
3. **`DocsAnatomy`** — 7 items (um por subcomponente): Card (root), CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter. `structureCode` mostra a composição hierárquica.
4. **`DocsStates`** — 5 linhas: `default`, `small`, `interactive`, `withImage`, `withFooter`. Omitir `disabled`/`loading` (Card é passivo).
5. **`DocsProps`** — **7 tabelas** (uma por subcomponente). O Card tem `size` + `className` + `children`; demais subcomponentes aceitam `className` + atributos HTML nativos de `<div>`. Todos estendem `React.ComponentProps<"div">` via `...props`.
6. **`DocsTokens`** — 7 tokens: `--radius-card` (CSS var local aplicada via `rounded-(--radius-card)`), `--card` (fundo), `--card-foreground` (texto), `--muted` (footer `bg-muted/50`), `--muted-foreground` (CardDescription), `--foreground` (ring `ring-foreground/10`), `--border` (divisor acima do CardFooter).
7. **`DocsAccessibility`** — regras obrigatórias:
   - Container **passivo** — Card não recebe foco nem eventos de teclado
   - `CardTitle` como âncora via `aria-labelledby` quando o Card é anunciado como região
   - `aria-label` contextual em botões internos (listas de cards exigem `"Excluir produto Cadeira X"` em vez de `"Excluir"`)
   - Card clicável: envolver em `<a>` ou `<button>` com `aria-label` descritivo — **não usar `onClick` no root**
   - `CardAction` preserva ordem DOM mesmo com grid `[1fr_auto]`
8. **`DocsAnalytics`** — Card é estrutural: listar apenas `docs_page_view`/`docs_section_viewed`/`language_switched` por padrão. Incluir `button_click` (quando há Button no footer) e `card_click` (quando o Card inteiro é navegável via wrapper `<a>`/`<button>`).
9. **`DocsDoDont`** — pares canônicos: (a) Card com título + descrição + ações vs Card como divisor visual; (b) botões com `aria-label` contextual vs botões ambíguos em listas.
10. **Stories** — criar 4 arquivos: `card.stories.tsx` (Playground + `tags: ["autodocs"]` + `withAutoDocsTab(CardDocs)`), `card-tamanhos.stories.tsx` (Default, Small), `card-composicoes.stories.tsx` (WithFooter, WithAction, WithImage, ProductCard, MetricCard, ProfileCard), `card-estados.stories.tsx` (Default, Clickable, WithFooter). **Não criar** `card-variantes.stories.tsx` — Card não tem `cva()`. Apenas o arquivo principal leva `tags: ["autodocs"]`.
11. **`data-size` contagioso** — regra visual absoluta: a prop `size` só fica no Card root. Os subcomponentes **nunca** aceitam prop `size` — eles reagem via `group-data-[size=sm]/card:*` consultando o atributo do root. Documentar em `notes.tip3`.
12. **`CardFooter` detecta-se via `has-`** — o Card usa `has-data-[slot=card-footer]:pb-0` para absorver o padding inferior quando o footer existe. Sem isso, o footer dobra o espaçamento visual. Documentar em `notes.tip1`.
13. **Imagem como primeiro/último filho** — o Card aplica `*:[img:first-child]:rounded-t-(--radius-card)` e `*:[img:last-child]:rounded-b-(--radius-card)` + remove o padding correspondente (`has-[>img:first-child]:pt-0`). Não precisa classes manuais nas imagens. Documentar em `notes.tip2`.
14. **`CardAction` como grid slot** — `grid-cols-[1fr_auto]` ativado apenas quando `CardAction` está presente (via `has-data-[slot=card-action]`). A ação fica à direita mantendo ordem DOM original — leitores de tela anunciam na ordem lógica (título → descrição → ação), não na ordem visual (título → ação → descrição).

### Componentes de Visualização de Dados (padrão Chart)

Componentes como **Chart** (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`) são wrappers de theming sobre **Recharts** — não substituem Recharts, mas aplicam tokens de cor do design system via `ChartConfig`. Não usam `cva()` próprio; o tipo de gráfico é determinado pelo primitivo Recharts usado dentro do `ChartContainer`. Categoria **Display**, translations em `docs/shared/content/chart/translations.json`.

**Seções a renderizar (15 seções canônicas):**

| Seção | Container | Chaves principais do translations.json |
|-------|-----------|----------------------------------------|
| Header | `DocsHeader` | `title`, `description`, `category`, `type` |
| Demonstração | `DocsDemonstration` | `demonstration.title`, `demonstration.labels.*` |
| Anatomia | `DocsAnatomy` | `anatomy.title`, `anatomy.item1`–`item4`, `anatomy.structureLabel`, `anatomy.structureCode` |
| Quando Usar | `DocsWhenToUse` | `usage.title`, `usage.guidelines.item1`–`item6`, `usage.scenarios.cols.*`, `usage.scenarios.item1`–`item6`, `usage.uxWriting.*`, `usage.do.item1`–`item4`, `usage.dont.item1`–`item3` |
| Do & Don't | `DocsDoDont` | `doDont.title`, `doDont.pair1.*`, `doDont.pair2.*` |
| Importação | `DocsImport` | `import.title`, `import.basic`, `import.withRecharts`, `import.basecoat` |
| Tipos de Gráfico | `DocsVariants` | `variants.title`, `variants.visualTitle`, `variants.note`, `variants.items.bar`–`radialBar` |
| Estados | `DocsStates` | `states.title`, `states.cols.*`, `states.empty.*`, `states.loading.*`, `states.singleSeries.*`, `states.multiSeries.*` |
| Propriedades | `DocsProps` | `props.title`, `props.containerTitle`, `props.tooltipTitle`, `props.legendTitle`, `props.table.*`, `props.extensibilityTitle`, `props.extensibility` |
| Tokens | `DocsTokens` | `tokens.title`, `tokens.table.*`, `tokens.customizationTitle`, `tokens.note` |
| Acessibilidade | `DocsAccessibility` | `accessibility.title`, `accessibility.summary`, `accessibility.item1`–`item6`, `accessibility.keyboardTitle`, `accessibility.keyboard.*`, `accessibility.aria.*`, `accessibility.screenReader.*` |
| Relacionados | `DocsRelated` | `related.title`, `related.alternatives`, `related.usedWith`, `related.table`, `related.card`, `related.dataTable` |
| Notas | `DocsNotes` | `notes.title`, `notes.tip1`–`tip5` |
| Analytics | `DocsAnalytics` | `analytics.title`, `analytics.description`, `analytics.table.*` |
| Testes | `DocsTestes` | `testes.title`, `testes.functional.*`, `testes.accessibility.*`, `testes.visual.*` |

**Regras específicas do Chart:**

1. **Sem `cva()` — usar padrão §11.3** — o tipo do gráfico é determinado pelo primitivo Recharts. `DocsVariants` usa o padrão "Cards de tipo" (§11.3): 6 entradas (`bar`, `line`, `area`, `pie`, `radar`, `radialBar`). O campo `variants.note` (chave `variants.note`) deve ser exibido acima dos cards via bloco de texto sanitizado.

2. **`DocsProps` com 3 tabelas** — usar `tables` array com 3 entradas:
   - `ChartContainer` (config, id, className, children, initialDimension) — chave `props.containerTitle`
   - `ChartTooltipContent` (indicator, hideLabel, hideIndicator, nameKey, labelKey, formatter, labelFormatter) — chave `props.tooltipTitle`
   - `ChartLegendContent` (hideIcon, verticalAlign) — chave `props.legendTitle`

3. **`DocsImport` com 3 blocos de código** — a seção import documenta 3 padrões distintos via `secondaryCode` e `tertiaryCode` (ou renderização customizada):
   - Básico React: `import { ChartContainer, ChartTooltip, ... } from '@/components/ui/chart'`
   - Com primitivos Recharts: `import { BarChart, Bar, ... } from 'recharts'`
   - Basecoat (nota informativa apenas, sem import real de componente)

4. **`DocsDemonstration`** — deve renderizar 3 tabs ou toggle entre `bar`, `line` e `area` usando os labels de `demonstration.labels.*`. Os dados de demonstração são hardcoded na docs page — não vêm do translations.json.

5. **`DocsStates`** — 4 estados: `empty`, `loading`, `singleSeries`, `multiSeries`. Labels via `states.{key}.label`. Omitir `disabled`/`error` — Chart é passivo.

6. **`DocsAccessibility`** — `keyboardItems` com 4 entradas: `Tab` (`accessibility.keyboard.tab`), `ArrowRight` (`accessibility.keyboard.arrowRight`), `ArrowLeft` (`accessibility.keyboard.arrowLeft`), `noOtherKeys` (`accessibility.keyboard.noOtherKeys`).

7. **`DocsRelated`** — 3 items: `Table` (chave `related.table`), `Card` (chave `related.card`), `DataTable` (chave `related.dataTable`).

8. **`DocsNotes`** — 5 tips (`notes.tip1`–`notes.tip5`), sem sub-chave `title` (título é gerado pelo container). Cada tip contém HTML inline com `<code>`.

9. **`DocsAnalytics`** — Chart é passivo: apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir nota (`analytics.description`) de que interações específicas podem ser rastreadas via callbacks do Recharts.

10. **`DocsTestes`** — estrutura:
    - `functional`: 6 items (`testes.functional.item1`–`item6`) — `{ action, result, priority }`
    - `accessibility`: 4 items (`testes.accessibility.item1`–`item4`) — `{ criterion, level, how }`
    - `visual`: 4 items (`testes.visual.item1`–`item4`) — `{ story, priority }`

11. **Dependência peer Recharts** — `installNote` no `DocsHeader` deve ser `"npx shadcn@latest add chart"`. Recharts é instalado separadamente (`npm install recharts`). Documentado em `notes.tip1`.

12. **`accessibilityLayer` obrigatório** — toda demonstração e preview de variante deve incluir `accessibilityLayer` no componente Recharts raiz (`<BarChart accessibilityLayer>`, `<LineChart accessibilityLayer>`, etc.).

13. **`aria-label` obrigatório** — toda instância de `ChartContainer` em demos/previews deve incluir `aria-label` descritivo.

14. **Stories** — criar 4 arquivos: `chart.stories.tsx` (Playground + `tags: ["autodocs"]` + `withAutoDocsTab(ChartDocs)`), `chart-tipos.stories.tsx` (Bar, Line, Area, Pie, Radar, RadialBar), `chart-composicoes.stories.tsx` (WithLegend, WithTooltipCustom, MultiSeries, SingleSeries), `chart-estados.stories.tsx` (Empty, Loading, SingleSeries, MultiSeries). **Não criar** `chart-variantes.stories.tsx` nem `chart-tamanhos.stories.tsx` — Chart não tem `cva()` nem `size`. Apenas o arquivo principal leva `tags: ["autodocs"]`.

15. **SEO — descrições longas** — o `translations.json` gerado tem descrições SEO acima de 155 chars nos 3 idiomas (pt-BR: 163, en: 160, es: 165). As skills de dev devem usar as descrições como estão (o conteúdo está correto); este gap deve ser corrigido pelo ux-writer numa próxima iteração com `/ux-writer chart --fix-seo`.
