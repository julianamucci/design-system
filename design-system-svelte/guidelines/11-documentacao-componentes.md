# Documentação de Componentes Svelte 5 — Regras Obrigatórias

## Princípio Fundamental: Use os Section Containers

Todas as docs pages Svelte **DEVEM usar os containers genéricos** em `src/components/docs/shared/sections/`. Esses componentes encapsulam o layout, o wrapper card, os headings, os grids e a semântica de cada seção. A docs page é apenas o **orquestrador** — passa dados via props e previews via **snippets** (Svelte 5 `{#snippet}` + `{@render}`).

```svelte
<script lang="ts">
  import DocsHeader from '$lib/../components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '$lib/../components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy from '$lib/../components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse from '$lib/../components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont from '$lib/../components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport from '$lib/../components/docs/shared/sections/DocsImport.svelte';
  import DocsVariants from '$lib/../components/docs/shared/sections/DocsVariants.svelte';
  import DocsStates from '$lib/../components/docs/shared/sections/DocsStates.svelte';
  import DocsProps from '$lib/../components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens from '$lib/../components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '$lib/../components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated from '$lib/../components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes from '$lib/../components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics from '$lib/../components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes from '$lib/../components/docs/shared/sections/DocsTestes.svelte';
</script>
```

**NUNCA** reimplemente inline o HTML das seções. Se precisar de um layout novo, estenda o container correspondente — não duplique no consumo.

---

## Regras Svelte-Específicas

### Svelte 5 Runes

- Use `$props()` para props, **nunca** `export let`.
- Use `$state()` para estado reativo local.
- Use `$effect(...)` para side effects (SEO, analytics, IntersectionObserver).
- Use `$derived(...)` para computed values.
- Use `{#snippet name()}` + `{@render name()}` para passar conteúdo a containers (equivalente a children/slots).

### Wrapper Story Svelte

Stories Svelte em Storybook 10 precisam de um `StoryWrapper.svelte` que garante labels e props corretos — similar ao `ButtonStory.svelte`.

```ts
// AlertStory.svelte — wrapper genérico
// Usado em meta.component para que stories recebam props via args
```

### Docs Tab Bridge

Storybook espera React em `parameters.docs.page`. O `withAutoDocsTab.tsx` (em `src/lib/`) converte a docs page `.svelte` para um componente React montável dentro do Docs tab.

```ts
parameters: {
  docs: { page: withAutoDocsTab(AlertDocs) },
},
```

---

## Estrutura Obrigatória da Docs Page

### Layout `.svelte`

```svelte
<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import { applySeo } from '$lib/use-seo';
  import { track } from '$lib/analytics';
  import { sanitizeHtml } from '$lib/sanitize-html';
  import LanguageSwitcher from '$lib/../components/product/LanguageSwitcher.svelte';
  import DocsNav from '$lib/../components/docs/shared/DocsNav.svelte';
  import uiTranslations from '$lib/i18n/ui.json';
  import componentTranslations from '$lib/../../../docs/shared/content/<slug>/translations.json';

  // Containers genéricos (listados acima)

  // Helper t() reativo — locale store do projeto
  const tContent = $derived((key: string) => /* lookup em componentTranslations */);
  const tNav = $derived((key: string) => /* lookup em uiTranslations */);

  // SEO reativo
  $effect(() => {
    applySeo({
      title: tContent('seo.title'),
      description: tContent('seo.description'),
      locale: $locale,
      componentSlug: '<slug>',
    });
  });

  // Analytics — page view
  $effect(() => {
    track('docs_page_view', {
      component_name: '<slug>',
      locale: $locale,
      page_title: `${tContent('title')} · Design System`,
    });
  });

  // Active section tracking
  let activeSection = $state('demonstracao');
  function handleSectionChange(id: string) {
    activeSection = id;
    track('docs_section_viewed', { section_id: id, component_name: '<slug>', locale: $locale });
  }

  const navGroups = $derived([
    { label: tNav('nav.overview'), sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy') },
      { id: 'quando-usar',  label: tNav('nav.usage') },
      { id: 'do-dont',      label: tNav('nav.doDont') },
    ]},
    { label: tNav('nav.techRef'), sections: [
      { id: 'importacao',   label: tNav('nav.import') },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'estados',      label: tNav('nav.states') },
      { id: 'propriedades', label: tNav('nav.props') },
      { id: 'tokens',       label: tNav('nav.tokens') },
    ]},
    { label: tNav('nav.context'), sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related') },
      { id: 'notas',          label: tNav('nav.notes') },
    ]},
    { label: tNav('nav.quality'), sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes') },
    ]},
  ]);

  $effect(() => {
    const ids = navGroups.flatMap(g => g.sections.map(s => s.id));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) { handleSectionChange(entry.target.id); break; }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  });
</script>

<div class="ds-docs p-8 max-w-5xl mx-auto">
  <DocsHeader
    title={tContent('title')}
    description={tContent('description')}
    category={tContent('category')}
    type={tContent('type')}
    installNote="npx shadcn@latest add <slug>"
  />

  <div class="flex gap-16 items-start">
    <nav
      aria-label="Navegação das seções do componente"
      class="sticky top-8 w-52 shrink-0 self-start space-y-5"
    >
      <DocsNav groups={navGroups} {activeSection} />
    </nav>

    <div class="ds-docs flex-1 min-w-0 space-y-12">
      <!-- Containers de seção, na ordem canônica -->
    </div>
  </div>
</div>
```

**Regras do layout:**
- `<nav>` com `sticky top-8 w-52 shrink-0 self-start` é obrigatório — sem ele, `DocsNav` rola junto com a página
- `aria-label` no `<nav>` diferencia a navegação de outras `<nav>`
- `flex-1 min-w-0` no conteúdo permite overflow responsivo
- `.ds-docs` aplica resets tipográficos específicos da doc

---

## Seções — Uso dos Containers

### 1. Header (fora do `<nav>`)

```svelte
<DocsHeader
  title={tContent('title')}
  description={tContent('description')}
  category={tContent('category')}
  type={tContent('type')}
  installNote="npx shadcn@latest add <slug>"
/>
```

### 2. Demonstração (`id="demonstracao"`)

Use snippet `children` (snippet padrão) com o componente real de `$lib/../components/ui/<slug>`.

```svelte
<DocsDemonstration title={tContent('demonstration.title')}>
  <Alert>
    <AlertTitle>{tContent('demonstration.exampleTitle')}</AlertTitle>
    <AlertDescription>{tContent('demonstration.exampleDescription')}</AlertDescription>
  </Alert>
</DocsDemonstration>
```

### 3. Anatomia (`id="anatomia"`)

```svelte
<DocsAnatomy
  title={tContent('anatomy.title')}
  items={[tContent('anatomy.item1'), tContent('anatomy.item2'), tContent('anatomy.item3')]}
  structureCode={tContent('anatomy.structureCode')}
/>
```

`items` aceita HTML inline — o container sanitiza.

### 4. Quando Usar (`id="quando-usar"`)

```svelte
<DocsWhenToUse
  title={tContent('usage.title')}
  guidelines={{ title: tContent('usage.guidelines.title'), items: [1,2,3,4].map(i => tContent(`usage.guidelines.item${i}`)) }}
  scenarios={{ title: tContent('usage.scenarios.title'), cols: {...}, items: [...] }}
  uxWriting={{ title: ..., cols: {...}, items: [...] }}
  do={{ title: tContent('usage.do.title'), items: [...] }}
  dont={{ title: tContent('usage.dont.title'), items: [...] }}
/>
```

### 5. Do & Don't (`id="do-dont"`) — CRÍTICO

`DocsDoDont` emite **um grid por par** (previne bug DO|DO vs DON'T|DON'T). Use **snippets por par** no consumidor.

```svelte
<script>
  const doDontPairs = $derived([
    {
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: tContent('doDont.pair1.do'),
      dontCaption: tContent('doDont.pair1.dont'),
      doPreview: do1,
      dontPreview: dont1,
    },
    { /* pair 2 */ },
  ]);
</script>

{#snippet do1()}
  <Alert><AlertTitle>Título claro</AlertTitle></Alert>
{/snippet}
{#snippet dont1()}
  <Alert><AlertTitle>Erro</AlertTitle></Alert>
{/snippet}

<DocsDoDont title={tContent('doDont.title')} pairs={doDontPairs} />
```

O container renderiza cada par com `{@render pair.doPreview()}` e `{@render pair.dontPreview()}`. **NUNCA** itere pares em um grid único no consumidor.

### 6. Importação (`id="importacao"`)

```svelte
<DocsImport
  title={tContent('import.title')}
  description={tContent('import.description')}
  code={`import { Alert, AlertTitle, AlertDescription } from '$lib/../components/ui/alert';`}
/>
```

### 7. Variantes (`id="variantes"`)

O campo `code` é **opcional** — quando presente, o container renderiza um botão "Ver código" que expande um bloco de código.

**Layout obrigatório: vertical (`space-y-4`).** Cada card ocupa largura total — não usar grid.

**DocsExamples foi removido:** exemplos de código agora ficam embutidos em cada item de `DocsVariants` via o campo `code`.

```svelte
{#snippet vDefault()}<Alert>...</Alert>{/snippet}
{#snippet vDestructive()}<Alert variant="destructive">...</Alert>{/snippet}

<DocsVariants
  title={tContent('variants.title')}
  items={[
    {
      name: 'default',
      description: tContent('variants.default'),
      code: `<Alert>\n  <AlertTitle>Título</AlertTitle>\n  <AlertDescription>Descrição</AlertDescription>\n</Alert>`,
      preview: vDefault
    },
    {
      name: 'destructive',
      description: tContent('variants.destructive'),
      code: `<Alert variant="destructive">...</Alert>`,
      preview: vDestructive
    },
  ]}
/>
```

### 8. Estados (`id="estados"`)

Labels da primeira coluna: `font-medium` (nunca badge) — o container já aplica.

```svelte
<DocsStates
  title={tContent('states.title')}
  cols={{ state: 'Estado', trigger: 'Gatilho', behavior: 'Comportamento' }}
  items={[
    { label: 'Default', trigger: 'Inicial', behavior: 'Exibe título e descrição' },
    { label: 'Destructive', trigger: 'variant="destructive"', behavior: 'Aplica cor de erro' },
  ]}
/>
```

### 9. Propriedades (`id="propriedades"`)

`tables` é array — um table por subcomponente em componentes compostos.

```svelte
<DocsProps
  title={tContent('props.title')}
  tables={[
    {
      title: 'Alert',
      cols: { prop: 'Prop', type: 'Tipo', default: 'Padrão', required: 'Obrig.', description: 'Descrição' },
      items: [
        { name: 'variant', type: '"default" | "destructive"', defaultValue: '"default"', required: 'Não', description: '...' },
      ],
    },
    { title: 'AlertTitle', cols: {...}, items: [...] },
  ]}
  interfaceCode={`interface AlertProps extends HTMLAttributes<HTMLDivElement> { variant?: 'default' | 'destructive' }`}
  extensibilityTitle={tContent('props.extensibilityTitle')}
  extensibilityNotes={tContent('props.extensibilityNotes')}
/>
```

### 10. Tokens (`id="tokens"`)

```svelte
<DocsTokens
  title={tContent('tokens.title')}
  cols={{ token: 'Token', value: 'Valor', description: 'Uso' }}
  items={[
    { token: '--background', value: 'hsl(...)', description: 'Fundo padrão' },
    { token: '--destructive', value: 'hsl(...)', description: 'Fundo destructive' },
  ]}
  customizationTitle={tContent('tokens.customizationTitle')}
  customizationCode={tContent('tokens.customizationCode')}
/>
```

### 11. Acessibilidade (`id="acessibilidade"`)

```svelte
<DocsAccessibility
  title={tContent('accessibility.title')}
  summary={tContent('accessibility.summary')}
  items={[tContent('accessibility.item1'), tContent('accessibility.item2')]}
  keyboardTitle={tContent('accessibility.keyboardTitle')}
  keyboardItems={[{ key: 'Tab', description: '...' }]}
/>
```

### 12. Relacionados (`id="relacionados"`)

```svelte
<DocsRelated
  title={tContent('related.title')}
  items={[
    { name: 'Alert Dialog', description: tContent('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
  ]}
/>
```

### 13. Notas (`id="notas"`)

```svelte
<DocsNotes
  title={tContent('notes.title')}
  items={[{ title: tContent('notes.item1.title'), content: tContent('notes.item1.content') }]}
/>
```

### 14. Analytics (`id="analytics"`)

```svelte
<DocsAnalytics
  title={tContent('analytics.title')}
  cols={{ event: 'Evento', trigger: 'Gatilho', payload: 'Payload' }}
  items={[
    { event: 'docs_page_view', trigger: 'Ao carregar', payload: '{ component_name, locale }' },
  ]}
/>
```

### 15. Testes (`id="testes"`)

```svelte
<DocsTestes
  title={tContent('testes.title')}
  functional={{ title: ..., cols: {...}, items: [...] }}
  accessibility={{ title: ..., cols: {...}, items: [...] }}
  visual={{ title: ..., cols: {...}, items: [...] }}
/>
```

> **Debt — AlertDocs.svelte**: a docs page do Alert implementa esta seção inline (não usa `DocsTestes`). Padrão canônico para novos componentes é o container acima. Se implementar inline, os cabeçalhos das tabelas **devem** usar `$tNavStore`:
> - Funcional: `$tNavStore('common.userAction')`, `$tNavStore('common.expectedResult')`, `$tNavStore('common.priority')`
> - Acessibilidade: inline locale-aware (`$locale === 'en' ? 'Criterion' : ...`)
> - Visual: `$tNavStore('common.storyState')`, `$tNavStore('common.priority')`
> - Labels de prioridade: `$tNavStore(priorityKeyMap[raw] ?? 'common.high')` onde `priorityKeyMap = { high: 'common.high', medium: 'common.medium', low: 'common.low' }`
> - `priorityColor()` deve comparar o `raw` (ex: `"high"`) — nunca o label traduzido.

---

## Padrões Especiais por Componente

### Componentes com Provider (Sonner)

Use 2 tables em `DocsProps` — uma para `<Toaster />`, outra para API imperativa `toast()`.

### Componentes Compostos (Table, Accordion, AlertDialog)

N tables em `DocsProps`, uma por subcomponente.

### Componentes Compostos Interativos com Disclosure (padrão Accordion)

Componentes como **Accordion** (Bits UI `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`) implementam ARIA Disclosure.

1. **`DocsVariants`** — `title`: "Modos de Operação". `items`: `single`, `multiple`, `controlled`. Seção usa `id="modos"` (não `id="variantes"`). Atualizar navGroups para `{ id: 'modos', label: tNav('nav.variants') }`.
2. **`DocsAnatomy`** — 4 items: Root, Item, Trigger, Content.
3. **`DocsStates`** — `closed`, `open`, `focus`, `disabled`. Omitir `loading`.
4. **`DocsProps`** — 4 tables: `Accordion` (Root), `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
5. **`DocsTokens`** — 7 tokens; incluir `--animate-accordion-up` / `--animate-accordion-down`.
6. **Analytics** — além dos eventos de docs, `accordion_expand { label }` ao expandir e `accordion_collapse { label }` ao fechar.
7. **Wrapper story** — `AccordionStory.svelte` recebe `type`, `collapsible`, `defaultValue`, `items[]`. `AccordionControlledStory.svelte` usa `$state` + `onValueChange` de Bits UI. `AccordionBadgeStory.svelte` para composição com Badge.
8. **Stories** — arquivos: `.stories.ts`, `-modos`, `-estados`, `-composicoes`. Omitir `-variantes` e `-tamanhos`.
9. **Play function** — 6 critérios: abrir, fechar (collapsible), modo single alterna, disabled bloqueia, Enter, Space.
10. **Chave de tradução conflitante** — usar `props.table.type_prop` para a prop `type` (evita colidir com a chave de coluna `type`).

### Bits UI e `dangerouslySetInnerHTML` equivalente

Svelte usa `{@html}` para conteúdo HTML. Sempre sanitize: `{@html sanitizeHtml(value)}`. Componentes Bits que recebem children internamente podem precisar de `<span>{@html ...}</span>` wrapper.

### Alert e não-interativos

- Stories sem handlers de clique
- Play functions testam `getByRole('alert')`, classes CSS
- `DocsStates` cobre configurações visuais (`complete`, `withoutTitle`, `withoutIcon`, `dynamicInsert`) — não loading/disabled

### Componentes de Feedback Não-Interativos Inline (padrão Badge)

Componentes como **Badge** (single root `<div>`) são rótulos visuais compactos para status, contagens, categorias ou tags. Não têm `size` prop, não recebem foco, não têm `disabled`/`loading`. Nome, categoria **Feedback**, translations em `docs/shared/content/badge/translations.json`.

1. **`DocsAnatomy`** — 4 items: `Badge` (`<div>` inline-flex), conteúdo (texto/número), ícone opcional (`aria-hidden="true"`), prop `variant`.
2. **`DocsVariants`** — 4 entradas nativas do `cva()`: `default`, `secondary`, `destructive`, `outline`. Cada snippet `variantN()` renderiza `<Badge variant="...">` importado de `$lib/../components/ui/badge`. **Omitir seção de tamanhos** — Badge não tem prop `size`.
3. **`DocsStates`** — 4 configurações contextuais: `withIcon`, `countBadge`, `asLink`, `asTrigger`. **Omitir `disabled`/`loading`**.
4. **`DocsProps`** — 1 única table para `Badge`: `variant`, `class`, children Snippet. Nota de extensibilidade (`props.extensibility`) deixa claro que o root aceita atributos HTML nativos (`onclick`, `aria-*`, `data-*`); para interação, preferir envolver em `<button>`/`<a>`.
5. **Play function** — estrutura e a11y, sem interação: cada variante aplica classes corretas; `getByText` confirma o rótulo; ícone filho com `aria-hidden="true"`.
6. **`DocsAnalytics`** — Badge é estrutural: listar apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir `badge_click` (payload: `{ label, variant }`) **apenas** quando envolvido em trigger clicável.
7. **Stories** — **omitir `badge-tamanhos` e `badge-estados`**. Arquivos obrigatórios: `badge.stories.ts` (Playground com `parameters.docs.page: withAutoDocsTab(BadgeDocs)` + `tags: ["autodocs"]`), `badge-variantes.stories.ts` (Default, Secondary, Destructive, Outline), `badge-composicoes.stories.ts` (WithIcon, CountBadge, AsLink, InCard).
8. **Sem foco próprio** — `keyboardItems` no `DocsAccessibility` pode usar `{ key: "—", description: "sem tab stops próprios" }` ou ser omitido. Foco vem do wrapper interativo pai.
9. **Cor ≠ significado** — WCAG 1.4.1: texto deve comunicar estado sem depender de cor (ex: "Ativo" em vez de só fundo verde). Documentar em `accessibility.item2` e em par Do/Don't.

### Componentes Modais de Confirmação (padrão AlertDialog)

Componentes como **AlertDialog** (implementado sobre bits-ui) são overlays de decisão forçada — não possuem `cva()` próprio; severidade vem do `Button` usado em Trigger/Action.

1. **Sem `cva()`** — sem prop `variant`. `DocsVariants.items` documenta **tipos de uso** (`destructive`, `default`). Cada `preview` (snippet Svelte) usa `defaultOpen={true}` no Root para Chromatic capturar o modal aberto.
2. **`DocsAnatomy`** — 9 items: Root, Trigger, Content, Header, Title, Description, Footer, Cancel, Action. `structureCode` mostra a estrutura aninhada.
3. **`DocsStates`** — `closed`, `open`, `confirmed`, `cancelled`, `controlled`. Omitir `loading`/`disabled`.
4. **`DocsProps`** — 5 tables: Root (`open`, `defaultOpen`, `onOpenChange`), Trigger (`asChild` via `<AlertDialogTrigger asChild let:builder>`), Content (`class`), Action (`on:click`, `class`), Cancel (`on:click`, `class`). Em Svelte 5, `defaultOpen` é uncontrolled; passar `open` força modo controlado.
5. **`DocsTokens`** — 7 tokens: overlayBg, contentBg, contentForeground, border, mutedForeground, destructive, destructiveForeground, radius.
6. **`DocsNotes`** — overlay **não** fecha ao clicar fora (diferença do Dialog). Documentar em nota dedicada.
7. **`DocsAccessibility`** — `role="alertdialog"` anuncia imediatamente. Foco inicial no Cancel.
8. **Stories** — omitir `alert-dialog-tamanhos` e `alert-dialog-variantes`. Usar `AlertDialogStory.svelte` wrapper com prop `defaultOpen` para Chromatic capturar o modal visível. Arquivos: `.stories.ts`, `-composicoes`, `-estados`.
9. **Play function** — 6 critérios: trigger abre com `role="alertdialog"`; Cancel fecha + retorna foco; Escape fecha; Tab não escapa (focus trap); overlay **não** fecha; Action fecha + dispara callback.
10. **Analytics de produto** — além dos eventos de docs: `dialog_open { component, location, label }`, `dialog_confirm { ... }`, `dialog_close { ..., trigger: "cancel_button" | "escape" }`.

### Containers Passivos Stateless (padrão AspectRatio)

Componentes como **AspectRatio** (base: `bits-ui`) preservam proporção largura/altura do filho. Não têm estado, não disparam eventos, não possuem `cva()` nem prop `size` — toda interação é do filho.

1. **`DocsDemonstration`** — grid responsivo (`grid-cols-1 sm:grid-cols-2 gap-6`) com 4 ratios canônicos. Labels acima de cada preview em `<p class="text-xs font-medium text-muted-foreground">`. Ratios 1/1 e 3/4 ficam dentro de `max-w-[220px]` / `max-w-[260px]`.
2. **`DocsAnatomy`** — 3 items: Root (`data-slot="aspect-ratio"` com `padding-bottom` calculado), inner `absolute inset-0` e o filho (`img | video | iframe`).
3. **`DocsWhenToUse`** — **omitir `uxWriting`**: AspectRatio não tem texto visível próprio. Passar apenas `guidelines`, `scenarios` (5 linhas) e `do`/`dont` (4 items cada).
4. **`DocsVariants`** — renderizar como "Ratios Canônicos". `items` com 5 entradas fixas (`16 / 9`, `4 / 3`, `1 / 1`, `3 / 4`, `21 / 9`). Sem `cva()` — o nome é o próprio ratio. `variants.note` no JSON deixa explícito que são padrões canônicos.
5. **`DocsStates`** — 3 linhas descrevendo **ownership transfer** ao filho: `Conteúdo carregado` / `Conteúdo ausente` / `Conteúdo falhou`. `states.note` explica que o componente é stateless.
6. **`DocsProps`** — 1 tabela única com 4 linhas: `ratio` (number, default 1), `children` snippet (obrigatório), `asChild` (boolean), `class` (string).
7. **`DocsTokens`** — AspectRatio não usa tokens próprios. Documentar apenas os tokens aplicáveis **quando usado como placeholder** (skeleton): `--radius` → `rounded-md`, `--border` → `border`, `--muted` → `bg-muted`. `tokens.note` explica que o container é transparente sem filho. `customizationCode` instrui a aplicar borda/radius no filho.
8. **`DocsAccessibility`** — `keyboardItems` com linha `{ key: "—", description: "sem tab stops próprios" }` + nota sobre foco delegado ao filho. Foca em `data-slot="aspect-ratio"` e `alt`/`title` do filho.
9. **`DocsAnalytics`** — tabela com **uma única linha passiva**: `{ event: '—', trigger: stripHtml($tStore('analytics.note')), payload: '—' }`. Não listar `docs_page_view`/`docs_section_viewed` aqui.
10. **Stories** — criar apenas `.stories.ts`, `-variantes` e `-composicoes`. **Omitir** `-tamanhos` (sem `size`) e `-estados` (stateless).
11. **`rounded-md` / `border` no filho** — regra visual absoluta: nunca aplicar no wrapper AspectRatio.

### Componentes Display Compositionais com Estados (padrão Avatar)

Componentes como **Avatar** (base: `bits-ui` — `Avatar`, `AvatarImage`, `AvatarFallback`) são displays passivos com **composições** em vez de variantes `cva()`. Têm tamanho padrão (`h-10 w-10`) no Root e estados internos de carregamento.

1. **Sem `cva()` / sem prop `size`** — o Root aplica `h-10 w-10` fixo. Tamanhos (`h-6 w-6`, `h-8 w-8`, `h-10 w-10`, `h-12 w-12`) vêm **sempre** via `class`. **Não criar prop `size`.**
2. **`DocsVariants`** — **title**: "Composições". `items` com 5 entradas: `image`, `initials`, `icon`, `group`, `withStatus`. Cada snippet `variantN()` monta a composição completa usando o componente real (`<Avatar>` + filhos). Sem `cva()`.
3. **`DocsAnatomy`** — 4 items: `Avatar` (Root), `AvatarImage`, `AvatarFallback`, e o sibling de status ou o ring em grupos. `structureCode` com `<Avatar><AvatarImage /><AvatarFallback>…</AvatarFallback></Avatar>`.
4. **`DocsStates`** — 4 linhas: `loaded`, `loading`, `failed`, `noImage`. Omitir `disabled`/`error`. Em Svelte 5, o `onLoadingStatusChange` do `AvatarImage` do bits-ui dispara o gatilho; o próprio componente decide qual filho renderizar.
5. **`DocsProps`** — 3 tables: `Avatar` (`class`, children Snippet), `AvatarImage` (`src`, `alt`, `onLoadingStatusChange`, `class`), `AvatarFallback` (`delayMs`, `class`, children Snippet). `src`/`alt` obrigatórios. Usar `delayMs={600}` como valor canônico.
6. **`DocsTokens`** — 7 tokens: `--muted`, `--muted-foreground`, `--background`, `--border`, `--primary`, `--radius` (`rounded-full` fixo), `--ring`.
7. **`DocsAccessibility`** — (a) `alt` descritivo (`"Foto de perfil de [Nome]"`) em `AvatarImage` quando é única pista visual; (b) `alt=""` + `AvatarFallback aria-hidden="true"` quando o nome está ao lado; (c) `<span aria-label="…">` no indicador de status; (d) grupo com `role="group" aria-label="…"` no wrapper; (e) contraste iniciais ≥ 4.5:1.
8. **`DocsAnalytics`** — Avatar é passivo: apenas eventos da docs. Incluir `avatar_click` só quando envolvido por link/botão em produto.
9. **`DocsDoDont`** — pares canônicos: (a) "com fallback" vs "sem fallback"; (b) "iniciais 2 letras maiúsculas" vs "iniciais minúsculas/3+ letras".
10. **Stories** — 4 arquivos: `avatar.stories.ts` (+ `withAutoDocsTab(AvatarDocs)`), `avatar-composicoes.stories.ts` (WithImage, WithInitials, WithIcon, Group, WithStatus), `avatar-tamanhos.stories.ts` (Size6, Size8, Size10 default, Size12), `avatar-estados.stories.ts` (Loaded, Loading com `delayMs`, Failed, NoImage). **Não criar `avatar-variantes.stories.ts`**. Apenas o principal leva `tags: ["autodocs"]`. Quando for preciso wrapper de interação, usar `AvatarStory.svelte`.
11. **`AvatarFallback` obrigatório** — toda instância com `AvatarImage` precisa de `AvatarFallback` irmão. Sem ele, falha/demora resulta em container vazio. Documentar em par Do/Don't e em `notes`.
12. **Iniciais canônicas** — 2 letras maiúsculas: primeira letra do nome + primeira do sobrenome. Regra em `usage.uxWriting.table.initials`.

### Componentes de Visualização de Dados (padrão Chart) — Svelte 5

Componentes como **Chart** no Svelte expõem apenas **`ChartContainer`** e **`ChartTooltip`** como primitivos do design system. Não há `ChartLegend`, `ChartLegendContent` nem `ChartTooltipContent` como componentes separados no Svelte — o tooltip é configurado via props do `ChartTooltip`. Gráficos internos são SVG puro renderizado com `{@html}` a partir de dados calculados. Categoria **Display**, translations em `docs/shared/content/chart/translations.json`.

**Seções a renderizar (15 seções canônicas):**

| Seção | Container | Chaves principais do translations.json |
|-------|-----------|----------------------------------------|
| Header | `DocsHeader` | `title`, `description`, `category`, `type` |
| Demonstração | `DocsDemonstration` | `demonstration.title`, `demonstration.labels.*` |
| Anatomia | `DocsAnatomy` | `anatomy.title`, `anatomy.item1`–`item4`, `anatomy.structureLabel`, `anatomy.structureCode` |
| Quando Usar | `DocsWhenToUse` | `usage.title`, `usage.guidelines.item1`–`item6`, `usage.scenarios.cols.*`, `usage.scenarios.item1`–`item6`, `usage.uxWriting.*`, `usage.do.item1`–`item4`, `usage.dont.item1`–`item3` |
| Do & Don't | `DocsDoDont` | `doDont.title`, `doDont.pair1.*`, `doDont.pair2.*` |
| Importação | `DocsImport` | `import.title`, `import.basic` |
| Tipos de Gráfico | `DocsVariants` | `variants.title`, `variants.visualTitle`, `variants.note`, `variants.items.bar`–`radialBar` |
| Estados | `DocsStates` | `states.title`, `states.cols.*`, `states.empty.*`, `states.loading.*`, `states.singleSeries.*`, `states.multiSeries.*` |
| Propriedades | `DocsProps` | `props.title`, `props.containerTitle`, `props.tooltipTitle`, `props.table.*`, `props.extensibilityTitle`, `props.extensibility` |
| Tokens | `DocsTokens` | `tokens.title`, `tokens.table.*`, `tokens.customizationTitle`, `tokens.note` |
| Acessibilidade | `DocsAccessibility` | `accessibility.title`, `accessibility.summary`, `accessibility.item1`–`item6`, `accessibility.keyboardTitle`, `accessibility.keyboard.*` |
| Relacionados | `DocsRelated` | `related.title`, `related.alternatives`, `related.usedWith`, `related.table`, `related.card`, `related.dataTable` |
| Notas | `DocsNotes` | `notes.title`, `notes.tip1`–`tip5` |
| Analytics | `DocsAnalytics` | `analytics.title`, `analytics.description`, `analytics.table.*` |
| Testes | `DocsTestes` | `testes.title`, `testes.functional.*`, `testes.accessibility.*`, `testes.visual.*` |

**Regras específicas do Chart Svelte:**

1. **`ChartContainer` + `ChartTooltip` apenas** — Svelte 5 expõe apenas `ChartContainer` e `ChartTooltip` como componentes do design system. A legenda (`ChartLegend`) e conteúdos de tooltip customizados são implementados com SVG inline ou HTML estruturado dentro do slot do `ChartContainer`.

2. **Sem `cva()` — usar padrão §11.3** — 6 tipos documentados nos cards: `bar`, `line`, `area`, `pie`, `radar`, `radialBar`. O campo `variants.note` deve ser exibido acima dos cards via `{@html sanitizeHtml(tContent('variants.note'))}`.

3. **`DocsProps` com 2 tabelas** — diferente do React (3 tabelas), Svelte usa apenas 2:
   - `ChartContainer` (config, id, class, children snippet) — chave `props.containerTitle`
   - `ChartTooltip` (indicator, hideLabel, nameKey, etc.) — chave `props.tooltipTitle`
   Omitir a tabela `ChartLegendContent` — não existe como componente separado no Svelte.

4. **`DocsImport`** — usar apenas `import.basic`:
   ```svelte
   import { ChartContainer, ChartTooltip } from '$lib/../components/ui/chart';
   ```
   Omitir `import.withRecharts` e `import.basecoat`.

5. **SVG puro — sem lucide-svelte** — dentro dos previews de gráfico, usar SVG inline gerado programaticamente. Nunca `lucide-svelte` (incompatível com Svelte 5).

6. **`DocsStates`** — 4 estados: `empty`, `loading`, `singleSeries`, `multiSeries`. Sem `disabled`/`error`.

7. **`DocsAccessibility`** — `keyboardItems` com 4 entradas via chaves `accessibility.keyboard.*`. O `accessibilityLayer` do Recharts não existe no Svelte — documentar em nota que navegação por teclado é implementada via atributos ARIA manuais no SVG.

8. **`DocsTestes`** — `functional` (6 items), `accessibility` (4 items com `{criterion, level, how}`), `visual` (4 items com `{story, priority}`). Iteração via `$derived` array.

9. **`{@html}` obrigatoriamente sanitizado** — todos os campos HTML do translations.json (`anatomy.item*`, `notes.tip*`, `accessibility.item*`) passam por `sanitizeHtml()` antes de `{@html}`.

10. **Stories Svelte** — criar 4 arquivos: `chart.stories.ts` (Playground + `withAutoDocsTab(ChartDocs)`), `chart-tipos.stories.ts` (Bar, Line — apenas os tipos suportados em preview interativo), `chart-composicoes.stories.ts` (WithTooltip, SingleSeries, MultiSeries), `chart-estados.stories.ts` (Empty, Loading). Não criar `-variantes` nem `-tamanhos`.

11. **Svelte 5 runes** — usar `$state`, `$derived`, `$effect` — nunca `onMount`/`afterUpdate`/`$:`.

12. **SEO — descrições longas** — o `translations.json` gerado tem descrições SEO acima de 155 chars nos 3 idiomas. Usar as descrições como estão; gap a ser corrigido pelo ux-writer.

---

## Proibições

- ❌ **NUNCA** reimplemente inline o HTML de uma seção — use o container
- ❌ **NUNCA** copie classes Tailwind dos containers para o template da docs
- ❌ **NUNCA** use `<pre><code>` em blocos de código (exceto `structureCode` em `DocsAnatomy`)
- ❌ **NUNCA** itere pares Do/Don't em um único grid — deixe `DocsDoDont` fazer o split
- ❌ **NUNCA** recrie variantes com divs/classes manuais — use sempre o componente real
- ❌ **NUNCA** use `export let` — use sempre `$props()` (Svelte 5)
- ❌ **NUNCA** omita o wrapper `<nav sticky>` do `DocsNav`
- ❌ **NUNCA** use `{@html ...}` sem `sanitizeHtml()`

## Checklist Final

- [ ] Todos os containers importados de `src/components/docs/shared/sections/`
- [ ] Nenhum HTML de seção inline no template
- [ ] `DocsHeader` com category/type/installNote
- [ ] `DocsDemonstration` com children snippet usando o componente real
- [ ] `DocsVariants` com layout vertical (`space-y-4`) e campo `code` opcional por item
- [ ] `DocsDoDont` com snippets individuais por par (`preview: snippetRef`)
- [ ] `DocsProps` com tables array (múltiplos para componentes compostos)
- [ ] `DocsStates` — labels em texto plano (container já aplica `font-medium`)
- [ ] Layout `flex gap-16 items-start` com `<nav sticky top-8 w-52 shrink-0 self-start>`
- [ ] Svelte 5 runes: `$props`, `$state`, `$derived`, `$effect`
- [ ] `applySeo` em `$effect` — reativo ao `$locale`
- [ ] `track('docs_page_view')` em `$effect` reativo ao locale
- [ ] IntersectionObserver dispara `track('docs_section_viewed')`
- [ ] `withAutoDocsTab` usa a docs page Svelte
- [ ] `translations.json` com 3 idiomas completos
- [ ] `sanitizeHtml()` em todo `{@html}`
