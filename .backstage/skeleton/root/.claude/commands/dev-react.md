---
description: Dev React — cria stories, docs pages e exemplos para componentes React seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev React — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em React para design systems. Seu trabalho é criar stories, docs pages e exemplos de documentação para componentes React, seguindo rigorosamente os padrões estabelecidos no projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`, `input`)

---

## Stack Técnica

- **React 19** + TypeScript
- **Vite 8** + SWC
- **Storybook 10** (`@storybook/react-vite`)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Radix UI** (primitivos de acessibilidade)
- **class-variance-authority** (variantes)
- **lucide-react** (ícones)
- **Zustand** (i18n store)

---

## Fontes de Referência — Leia ANTES de qualquer ação

1. `design-system-react/STORYBOOK-ARCHITECTURE.md` — arquitetura completa
2. `design-system-react/src/components/ui/alert.stories.tsx` — Playground + play functions (REFERÊNCIA)
3. `design-system-react/src/components/ui/alert-variantes.stories.tsx` — variantes
4. `design-system-react/src/components/ui/alert-estados.stories.tsx` — estados
5. `design-system-react/src/components/ui/alert-composicoes.stories.tsx` — composições
6. `design-system-react/src/components/docs/AlertDocs.tsx` — docs page completa (REFERÊNCIA)
7. `docs/shared/guidelines/08-docs-pages-foundations.md` — checklist obrigatório
8. `design-system-react/.storybook/preview.ts` — configuração global

---

## REGRA CENTRAL — Paridade Stories ↔ Docs Page

**O componente renderizado em CADA seção da docs page (Demonstração, Variantes, Estados, Do/Don't previews) DEVE usar os mesmos props/args da story correspondente.** Zero divergência.

Exemplo concreto — Alert com variante `destructive`:

```tsx
// alert-variantes.stories.tsx
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    title: 'Erro ao salvar',
    description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    icon: AlertCircle,
  },
};
```

```tsx
// AlertDocs.tsx — seção Demonstração ou Variantes
// ✅ CORRETO: mesmos props da story
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
</Alert>

// ❌ ERRADO: título/descrição divergem da story
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>  {/* ≠ "Erro ao salvar" */}
  <AlertDescription>Algum texto diferente</AlertDescription>
</Alert>
```

### Fonte de verdade única — escolha UMA abordagem e mantenha

**Opção A (preferida): examples em `translations.json`**

```json
"demonstration": {
  "examples": {
    "default":     { "variant": "default",     "title": "...", "description": "...", "icon": "info" },
    "destructive": { "variant": "destructive", "title": "...", "description": "...", "icon": "error" },
    "success":     { "variant": "default", "icon": "success", "class": "...", "descriptionClass": "...", "title": "...", "description": "..." },
    "warning":     { ... }
  }
}
```

Stories e docs page iteram sobre as mesmas chaves via `tContent('demonstration.examples.destructive.title')`. Uma única fonte para ambas.

**Opção B: presets em `<slug>.examples.ts`**

```ts
// src/components/ui/alert.examples.ts
export const ALERT_EXAMPLES = {
  destructive: { variant: 'destructive', title: 'Erro ao salvar', description: '...', icon: AlertCircle },
  // ...
} as const;
```

Stories importam `ALERT_EXAMPLES.destructive` como `args`. Docs page renderiza `<Alert {...ALERT_EXAMPLES.destructive} />`.

**Nunca misture abordagens** — se escolher A, toda demo/variante vem de translations; se B, todas usam o preset.

### Validação antes de commit

Para cada variante exibida na docs page, confirme que:
- [ ] Existe uma story com o mesmo nome/variante (ex: `Variantes/Destructive`)
- [ ] Título, descrição, ícone e classes batem byte-a-byte entre story e docs page
- [ ] Se o conteúdo vem de `translations.json`, ambas consomem a mesma chave

Se há divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story.

---

## Docs Page Composta APENAS por Section Containers

**A docs page NUNCA contém HTML inline replicando layout de seção.** Ela é composta exclusivamente por:

1. Containers de `@/components/docs/shared/sections/Docs*` — definem layout, tipografia, espaçamento
2. Componentes reais de `@/components/ui/<slug>` — preenchem as previews/demos

Se um container ainda não existe em `shared/sections/`, rode `/docs-sections --stack react` primeiro. Nunca inline `<section id="..."><h2>...</h2><table>...</table></section>` replicando o que `DocsProps`, `DocsStates`, `DocsTokens` já fazem.

---

## Artefatos a Criar

### 1. Story Principal (`<slug>.stories.tsx`)

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Component } from './component';
import ComponentDocs from '@/components/docs/ComponentDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Component',
  component: Component,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ComponentDocs) },
  },
  argTypes: { /* controls */ },
  args: { /* defaults com fn() para callbacks */ },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { /* ... */ },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    // 5 critérios: clique, estado, foco, Enter, Space
  },
};
```

### 2. Stories de Variantes (`<slug>-variantes.stories.tsx`)

Uma story por variante visual. Sem play functions (cobertura visual via Chromatic).

```tsx
const meta = {
  title: 'UI/Component/Variantes',
  component: Component,
  args: { /* defaults sem onClick */ },
} satisfies Meta<typeof Component>;
```

### 3. Stories de Tamanhos (`<slug>-tamanhos.stories.tsx`)

Uma story por tamanho. IconOnly deve ter play function para `aria-label`.

### 4. Stories de Estados (`<slug>-estados.stories.tsx`)

Disabled, Loading, Error, etc. DEVEM ter play functions testando:
- Estado refletido no DOM (`toBeDisabled()`, `toHaveAttribute()`)
- Interações bloqueadas quando apropriado

### 5. Stories de Composições (`<slug>-composicoes.stories.tsx`)

Com ícone, como link (asChild), com badge, etc.

### 6. Docs Page (`ComponentDocs.tsx`)

Localização: `src/components/docs/<ComponentName>Docs.tsx`

**REGRA OBRIGATÓRIA: Use o componente real de `components/ui/`.** A seção Demonstração e todos os exemplos DEVEM importar e renderizar o componente de `@/components/ui/<slug>`. Nunca recrie variantes com JSX ou classes Tailwind inline quando o componente já existe. Exemplo:

```tsx
// ✅ CORRETO — usa o componente real
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// ...
<Alert variant="destructive">
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>Verifique sua conexão e tente novamente.</AlertDescription>
</Alert>

// ❌ ERRADO — recria inline
<div className="bg-destructive/10 text-destructive border border-destructive/50 ...">Erro ao salvar</div>
```

**REGRA CRÍTICA: Cada stack deve ser independente.** A docs page React DEVE renderizar TODO o conteúdo das 15 seções usando `translations.json`. NUNCA use placeholders genéricos ("Exemplo aqui.", "Estrutura de subcomponentes."). Cada projeto será usado de forma independente.

**Referência obrigatória**: Leia `design-system-react/src/components/docs/AlertDocs.tsx` inteiro antes de criar qualquer docs page. Ele é o modelo completo para React.

#### Layout obrigatório

O JSX DEVE seguir este layout de duas colunas com navegação lateral sticky:

```tsx
<div className="ds-docs p-8 max-w-5xl mx-auto">
  <header className="mb-12 border-b pb-8 border-border/50">
    {/* badges, LanguageSwitcher, h1, description */}
  </header>

  <div className="flex gap-16 items-start">
    <nav
      aria-label="Navegação das seções do componente"
      className="sticky top-8 w-52 shrink-0 self-start space-y-5"
    >
      <DocsNav groups={navGroups} activeSection={activeSection} />
    </nav>

    <div className="flex-1 min-w-0 space-y-12">
      <section id="demonstracao">...</section>
      {/* demais seções */}
    </div>
  </div>
</div>
```

**Regras do layout:**
- `<nav>` com `sticky top-8` — mantém a navegação visível ao rolar
- `w-52 shrink-0 self-start` — largura fixa 13rem, não encolhe, alinha ao topo
- `flex-1 min-w-0` no conteúdo — ocupa o espaço restante, permite overflow responsivo
- **NUNCA** use `DocsNav` sem o wrapper `<nav>` sticky

#### Seções obrigatórias (Header + 15 seções com `id`)

1. **Header** (estrutural, fora do nav) — badges (category, type), LanguageSwitcher, h1, description, install badge
2. **Demonstração** (`id="demonstracao"`) — demos interativos do componente real
3. **Anatomia** (`id="anatomia"`) — lista numerada com `sanitizeHtml(t('anatomy.itemN'))` + bloco de estrutura
4. **Quando Usar** (`id="quando-usar"`) — 4 blocos: guidelines, cenários, UX Writing, Do/Don't
5. **Do & Don't** (`id="do-dont"`) — **layout obrigatório detalhado abaixo**
6. **Importação** (`id="importacao"`) — blocos de código com imports
7. **Variantes** (`id="variantes"`) — cards com título/descrição + preview real + toggle de código por variante (DocsVariants absorveu a antiga seção Exemplos)
8. **Estados** (`id="estados"`) — tabela de estados
9. **Propriedades** (`id="propriedades"`) — tabelas de props (2 se provider + API)
10. **Tokens** (`id="tokens"`) — tabela de tokens CSS + customização
11. **Acessibilidade** (`id="acessibilidade"`) — lista + cards de teclado
12. **Relacionados** (`id="relacionados"`) — grid de cards com links
13. **Notas** (`id="notas"`) — callouts
14. **Analytics** (`id="analytics"`) — tabela de eventos GA4
15. **Testes** (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

#### Layout obrigatório da seção Do & Don't

**ERRO COMUM**: usar um único grid com `v-for` / `map` sobre `[1, 2]` gerando uma coluna por par — isso empilha DO+DON'T dentro de cada coluna, produzindo DO|DO em cima e DON'T|DON'T em baixo. O layout correto é **dois grids separados** (um por par), cada um com DO à esquerda e DON'T à direita.

```tsx
<section id="do-dont">
  <h2 className="text-xl font-semibold mb-4">{tContent("doDont.title")}</h2>
  {/* Card wrapper obrigatório — igual ao ComponentDemo */}
  <div className="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
    <div className="space-y-8 w-full">

      {/* Pair 1: grid separado com DO à esquerda, DON'T à direita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
            <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.do")}</span>
          </div>
          <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
            {/* visual preview — usa o componente real, nunca texto puro */}
          </div>
          <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair1.do")}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
            <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.dont")}</span>
          </div>
          <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
            {/* visual preview */}
          </div>
          <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair1.dont")}</p>
        </div>
      </div>

      {/* Pair 2: segundo grid separado — mesma estrutura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... */}
      </div>

    </div>
  </div>
</section>
```

Regras:
- Cada par = um `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">` próprio
- Nunca iterar pares com `map([1,2])` em um único grid — produz layout errado
- Preview boxes usam o componente real (Button, Badge, etc.) ou texto semântico — nunca vazio
- Labels via `tNav("common.do")` / `tNav("common.dont")` (vêm de uiTranslations)
- Descrição abaixo do box: `italic px-1`

#### Obrigações técnicas

- [ ] `useTranslation(componentTranslations)` + `useTranslation(uiTranslations)`
- [ ] `useSeoEffect({ title, description, locale, componentSlug })`
- [ ] `useEffect(() => track('docs_page_view', ...), [locale])`
- [ ] `useActiveSection()` com `track('docs_section_viewed', ...)`
- [ ] `<LanguageSwitcher />` no header
- [ ] `sanitizeHtml()` para todo conteúdo de translations com HTML
- [ ] `list-none p-0 m-0` em `<ul>` e `list-none` em `<li>` (reset obrigatório)

#### Blocos de código — NUNCA usar `<pre>`

Blocos de código (import, exemplos) devem usar `<div><code>`, **nunca** `<pre><code>`. O `<pre>` causa renderização inconsistente no Storybook (margens e padding diferentes).

```tsx
// ✅ CORRETO
<div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code className="whitespace-pre">{`import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';`}</code>
</div>

// ❌ ERRADO
<pre className="..."><code>...</code></pre>
```

Exceção: `<pre>` é permitido apenas para diagramas ASCII (`anatomy.structureCode`) onde espaços são semânticos. O wrapper do `<pre>` DEVE ter `overflow-x-auto`:
```tsx
<div className="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
  <pre className="font-mono text-sm whitespace-pre">{t('anatomy.structureCode')}</pre>
</div>
```

---

## Regras Críticas de Renderização

### Tabelas — card wrapper obrigatório

**Toda tabela deve estar dentro de um card com padding e overflow horizontal:**

```tsx
// ✅ CORRETO
<div className="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
  <table className="w-full text-sm">...</table>
</div>

// ❌ ERRADO — overflow-hidden corta o conteúdo e não resolve scroll horizontal
<div className="rounded-lg border border-border overflow-hidden">
  <div className="overflow-x-auto">
    <table>...</table>
  </div>
</div>
```

### Tabela de estados — nome em texto plano, não badge

A primeira coluna das tabelas de estados (`id="estados"`) usa `font-medium` simples. **Nunca** use `<span>` com classes de badge/pill para o nome do estado:

```tsx
// ✅ CORRETO
<td className="p-3 border-r border-border font-medium">{t('states.key.label')}</td>

// ❌ ERRADO
<td className="p-3 border-r border-border">
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 ...">
    {t('states.key.label')}
  </span>
</td>
```

### `dangerouslySetInnerHTML` em componentes compostos (Radix)

Componentes Radix que renderizam `{children}` internamente (ex: `AccordionContent`, `DialogContent`, `TooltipContent`) **não aceitam** `dangerouslySetInnerHTML` diretamente — o React vai lançar erro de conflito entre `children` e `dangerouslySetInnerHTML`. Use um `<span>` wrapper interno:

```tsx
// ✅ CORRETO
<AccordionContent>
  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('content')) }} />
</AccordionContent>

// ❌ ERRADO — React error: "Can only set one of children or props.dangerouslySetInnerHTML"
<AccordionContent dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('content')) }} />
```

### Props booleanas inválidas em componentes compostos

Não passe props booleanas que não existem no tipo de um componente. Exemplo: `<Accordion type="multiple">` do Radix **não aceita** `collapsible` — passar `collapsible={false}` vaza um atributo DOM inválido. Use `undefined` para omitir:

```tsx
// ✅ CORRETO
<Accordion
  type={mode === 'multiple' ? 'multiple' : 'single'}
  collapsible={mode !== 'multiple' ? true : undefined}
/>

// ❌ ERRADO — gera warning "Received false for a non-boolean attribute collapsible"
<Accordion type="multiple" collapsible={false} />
```

---

## Convenções de Código

### Naming

- Stories: `title: 'UI/<ComponentName>'` (PascalCase)
- Sub-stories: `title: 'UI/<ComponentName>/Variantes'`
- Docs: `<ComponentName>Docs.tsx`
- Translations: `docs/shared/content/<slug>/translations.json`

### Imports

Todos os componentes UI já estão implementados em `src/components/ui/`. Importe sempre de lá — nunca reimplemente.

```tsx
// UI components — SEMPRE de @/components/ui/<slug>
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// (demais componentes usados nos demos da docs page)
// Docs utilities
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
// Product components
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
// Shared content
import translations from '@shared/content/<slug>/translations.json';
```

### Play Functions

```tsx
play: async ({ canvasElement, step, args }) => {
  const canvas = within(canvasElement);

  await step('Descrição em português', async () => {
    // assertions
  });
},
```

- Step descriptions em português
- Usar `fn()` nos args para callbacks testáveis
- `userEvent` para interações (não `fireEvent`)
- `pointerEventsCheck: 0` ao clicar em elemento disabled

---

## Sidebar Sort Order

Configurado em `preview.ts`:
```
Foundations → UI → [*, [Docs, Playground, Variantes, Tamanhos, Composições, Estados, *]]
```

---

## Section Components — Uso Obrigatório na Docs Page

**ANTES de escrever qualquer JSX inline na docs page**, verifique se os section containers genéricos existem:

```bash
ls design-system-react/src/components/docs/shared/sections/ 2>/dev/null
```

Se existirem (`DocsDoDont.tsx`, `DocsVariants.tsx`, etc.), **use-os** — nunca reimplemente o HTML das seções. Se não existirem, rode `/docs-sections --stack react` primeiro.

**Imports na docs page:**
```tsx
import { DocsHeader }        from '@/components/docs/shared/sections/DocsHeader';
import { DocsDemonstration } from '@/components/docs/shared/sections/DocsDemonstration';
import { DocsAnatomy }       from '@/components/docs/shared/sections/DocsAnatomy';
import { DocsWhenToUse }     from '@/components/docs/shared/sections/DocsWhenToUse';
import { DocsDoDont }        from '@/components/docs/shared/sections/DocsDoDont';
import { DocsImport }        from '@/components/docs/shared/sections/DocsImport';
import { DocsVariants }      from '@/components/docs/shared/sections/DocsVariants';
import { DocsStates }        from '@/components/docs/shared/sections/DocsStates';
import { DocsProps }         from '@/components/docs/shared/sections/DocsProps';
import { DocsTokens }        from '@/components/docs/shared/sections/DocsTokens';
import { DocsAccessibility } from '@/components/docs/shared/sections/DocsAccessibility';
import { DocsRelated }       from '@/components/docs/shared/sections/DocsRelated';
import { DocsNotes }         from '@/components/docs/shared/sections/DocsNotes';
import { DocsAnalytics }     from '@/components/docs/shared/sections/DocsAnalytics';
import { DocsTestes }        from '@/components/docs/shared/sections/DocsTestes';
```

A docs page passa dados via props e filhos (slots/children). O layout de cada seção é responsabilidade do container — a docs page apenas fornece o conteúdo.

---

## Checklist Final

- [ ] Story principal com Playground + play function + withAutoDocsTab
- [ ] Stories de variantes (1 por variante)
- [ ] Stories de tamanhos (1 por tamanho + IconOnly com aria-label test)
- [ ] Stories de estados (disabled + loading + outros, com play functions)
- [ ] Stories de composições (com ícone, como link/asChild, etc.)
- [ ] **Demonstração usa o componente real de `@/components/ui/<slug>`** (nunca HTML inline)
- [ ] **Variantes mostram o componente real**, não divs com classes Tailwind manuais
- [ ] **DocsVariants com layout vertical (`space-y-4`) e campo `code` opcional por item** — DocsExamples foi removido
- [ ] **Docs page composta APENAS por containers de `shared/sections/Docs*`** + componentes de `components/ui/` — zero HTML inline replicando layout de seção
- [ ] **Paridade stories ↔ docs page**: cada componente mostrado em Demonstração/Variantes/Estados usa os MESMOS props da story correspondente (título, descrição, ícone, classes batem byte-a-byte)
- [ ] Fonte de verdade única escolhida (translations.json / examples.ts) e mantida em todas as seções
- [ ] **Docs page com TODAS as 15 seções renderizadas** (não placeholders)
- [ ] Layout de duas colunas (`flex gap-16 items-start`) com `<nav>` sticky wrapper
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>`
- [ ] translations.json com os 3 idiomas
- [ ] useSeoEffect reativo ao locale
- [ ] Analytics: docs_page_view + docs_section_viewed
- [ ] `sanitizeHtml()` em todo `dangerouslySetInnerHTML`
- [ ] Nenhum `console.log` ou `TODO` nos arquivos
- [ ] Storybook sidebar mostra o componente na ordem correta

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-react): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
