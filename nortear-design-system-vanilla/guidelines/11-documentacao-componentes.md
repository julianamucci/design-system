# Documentação de Componentes Nortear (Vanilla TS) — Regras Obrigatórias

## Princípio Fundamental: Use os Section Containers

Todas as docs pages Nortear **DEVEM usar as factory functions** em `src/components/docs/shared/sections/`. Cada seção é uma função `createDocsXxx(props): HTMLElement` que encapsula o layout, o wrapper card, os headings, os grids e a semântica. A docs page é apenas o **orquestrador** — constrói o DOM chamando essas factories e passando dados + **factory functions de preview**.

```ts
import { createDocsHeader }        from '@/components/docs/shared/sections/DocsHeader';
import { createDocsDemonstration } from '@/components/docs/shared/sections/DocsDemonstration';
import { createDocsAnatomy }       from '@/components/docs/shared/sections/DocsAnatomy';
import { createDocsWhenToUse }     from '@/components/docs/shared/sections/DocsWhenToUse';
import { createDocsDoDont }        from '@/components/docs/shared/sections/DocsDoDont';
import { createDocsImport }        from '@/components/docs/shared/sections/DocsImport';
import { createDocsVariants }      from '@/components/docs/shared/sections/DocsVariants';
import { createDocsStates }        from '@/components/docs/shared/sections/DocsStates';
import { createDocsProps }         from '@/components/docs/shared/sections/DocsProps';
import { createDocsTokens }        from '@/components/docs/shared/sections/DocsTokens';
import { createDocsAccessibility } from '@/components/docs/shared/sections/DocsAccessibility';
import { createDocsRelated }       from '@/components/docs/shared/sections/DocsRelated';
import { createDocsNotes }         from '@/components/docs/shared/sections/DocsNotes';
import { createDocsAnalytics }     from '@/components/docs/shared/sections/DocsAnalytics';
import { createDocsTestes }        from '@/components/docs/shared/sections/DocsTestes';
```

**NUNCA** reimplemente inline o HTML de uma seção. Se precisar de um layout novo, estenda o container correspondente — não duplique no consumo.

---

## Regras Nortear-Específicas

### Factory functions de preview

Em Nortear não há slots/snippets. Previews são passados como **factory functions** `() => HTMLElement`:

```ts
{
  doPreviewFactory: () => {
    const alert = createAlert({ variant: 'default' });
    alert.innerHTML = `<h5>Título claro</h5>`;
    return alert;
  },
}
```

O container chama a factory e adiciona o resultado ao DOM no local correto. Sempre retorne um **novo elemento** em cada chamada — evite reutilizar referências.

### Bridge para Docs Tab

`parameters.docs.page` do Storybook espera React. O `withAutoDocsTab` em `src/lib/` monta a docs page (função `createAlertDocs(): HTMLElement`) num container React para renderizar no Docs tab.

```ts
parameters: {
  docs: { page: withAutoDocsTab(createAlertDocs) },
},
```

### i18n reativo

Nortear não tem reatividade automática. A docs page:
1. Lê o locale inicial de `getCurrentLocale()`
2. Renderiza tudo com `translations[locale]`
3. Registra listener no locale store para re-renderizar o root quando mudar
4. Ao re-renderizar, chama `applySeo()` e `track('docs_page_view')` novamente

### Analytics

- `track('docs_page_view', {...})` no início da função + ao trocar locale
- `IntersectionObserver` registrado para disparar `track('docs_section_viewed', {...})` por seção

---

## Estrutura Obrigatória da Docs Page

```ts
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getCurrentLocale, subscribeLocale } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '../../../docs/shared/content/<slug>/translations.json';
// imports dos containers (listados acima)
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { createDocsNav } from '@/components/docs/shared/DocsNav';

export function createAlertDocs(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'ds-docs p-8 max-w-5xl mx-auto';

  function render() {
    const locale = getCurrentLocale() as 'pt-BR' | 'en' | 'es';
    const tContent = (key: string) => /* lookup em componentTranslations[locale] */;
    const tNav = (key: string) => /* lookup em uiTranslations[locale] */;

    // SEO + analytics reativos ao locale
    applySeo({
      title: tContent('seo.title'),
      description: tContent('seo.description'),
      locale,
      componentSlug: '<slug>',
    });
    track('docs_page_view', {
      component_name: '<slug>',
      locale,
      page_title: `${tContent('title')} · Design System`,
    });

    // Reset do DOM
    root.innerHTML = '';

    // Header (fora do nav)
    root.appendChild(createDocsHeader({
      title: tContent('title'),
      description: tContent('description'),
      category: tContent('category'),
      type: tContent('type'),
      installNote: 'npx shadcn@latest add <slug>',
    }));

    // Container de duas colunas
    const layout = document.createElement('div');
    layout.className = 'flex gap-16 items-start';

    // Nav sticky
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Navegação das seções do componente');
    nav.className = 'sticky top-8 w-52 shrink-0 self-start space-y-5';

    const navGroups = [
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
    ];
    const docsNav = createDocsNav({ groups: navGroups });
    nav.appendChild(docsNav.element);
    layout.appendChild(nav);

    // Conteúdo principal
    const content = document.createElement('div');
    content.className = 'ds-docs flex-1 min-w-0 space-y-12';

    content.appendChild(createDocsDemonstration({
      title: tContent('demonstration.title'),
      demoFactory: () => {
        // Retornar o componente real de @/components/ui/<slug>
        const alert = createAlert({ variant: 'default' });
        return alert;
      },
    }));

    // demais containers...

    layout.appendChild(content);
    root.appendChild(layout);

    // IntersectionObserver para active section + analytics
    const ids = navGroups.flatMap(g => g.sections.map(s => s.id));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        docsNav.setActiveSection(entry.target.id);
        track('docs_section_viewed', { section_id: entry.target.id, component_name: '<slug>', locale });
        break;
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }

  render();
  const unsubscribe = subscribeLocale(() => render());

  // Cleanup ao remover do DOM (via MutationObserver ou Storybook teardown)
  return root;
}
```

**Regras do layout:**
- `<nav>` com `sticky top-8 w-52 shrink-0 self-start` é obrigatório — sem ele, `DocsNav` rola junto com a página
- `aria-label` no `<nav>` diferencia a navegação de outras `<nav>`
- `flex-1 min-w-0` no conteúdo permite overflow responsivo
- `.ds-docs` aplica resets tipográficos específicos da doc

---

## Seções — Uso dos Containers

### 1. Header (fora do `<nav>`)

```ts
root.appendChild(createDocsHeader({
  title: tContent('title'),
  description: tContent('description'),
  category: tContent('category'),
  type: tContent('type'),
  installNote: 'npx shadcn@latest add <slug>',
}));
```

### 2. Demonstração (`id="demonstracao"`)

Passe `demoFactory` retornando o componente real de `@/components/ui/<slug>`.

```ts
content.appendChild(createDocsDemonstration({
  title: tContent('demonstration.title'),
  demoFactory: () => {
    const alert = createAlert({ variant: 'default' });
    alert.innerHTML = `
      <h5 class="mb-1 font-medium leading-none tracking-tight">${tContent('demonstration.exampleTitle')}</h5>
      <div class="text-sm [&_p]:leading-relaxed">${tContent('demonstration.exampleDescription')}</div>
    `;
    return alert;
  },
}));
```

### 3. Anatomia (`id="anatomia"`)

```ts
content.appendChild(createDocsAnatomy({
  title: tContent('anatomy.title'),
  items: [tContent('anatomy.item1'), tContent('anatomy.item2'), tContent('anatomy.item3')],
  structureCode: tContent('anatomy.structureCode'),
}));
```

`items` aceita HTML inline — o container sanitiza.

### 4. Quando Usar (`id="quando-usar"`)

```ts
content.appendChild(createDocsWhenToUse({
  title: tContent('usage.title'),
  guidelines: { title: tContent('usage.guidelines.title'), items: [1,2,3,4].map(i => tContent(`usage.guidelines.item${i}`)) },
  scenarios: { title: tContent('usage.scenarios.title'), cols: {...}, items: [...] },
  uxWriting: { title: ..., cols: {...}, items: [...] },
  do: { title: tContent('usage.do.title'), items: [...] },
  dont: { title: tContent('usage.dont.title'), items: [...] },
}));
```

### 5. Do & Don't (`id="do-dont"`) — CRÍTICO

`createDocsDoDont` emite **um grid por par** (previne bug DO|DO vs DON'T|DON'T). Use `doPreviewFactory` e `dontPreviewFactory` por par.

```ts
content.appendChild(createDocsDoDont({
  title: tContent('doDont.title'),
  pairs: [
    {
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: tContent('doDont.pair1.do'),
      dontCaption: tContent('doDont.pair1.dont'),
      doPreviewFactory: () => {
        const el = createAlert({ variant: 'default' });
        el.innerHTML = `<h5>Título claro</h5>`;
        return el;
      },
      dontPreviewFactory: () => {
        const el = createAlert({ variant: 'destructive' });
        el.innerHTML = `<h5>Erro</h5>`;
        return el;
      },
    },
    { /* pair 2 */ },
  ],
}));
```

**NUNCA** itere pares em um grid único no consumidor — deixe o container fazer isso.

### 6. Importação (`id="importacao"`)

```ts
content.appendChild(createDocsImport({
  title: tContent('import.title'),
  description: tContent('import.description'),
  code: `import { createAlert } from '@/components/ui/alert';`,
}));
```

### 7. Variantes (`id="variantes"`)

O campo `code` é **opcional** — quando presente, o container renderiza um botão "Ver código" que expande um bloco de código via `toggle`.

**Layout obrigatório: vertical (`space-y-4`).** Cada card ocupa largura total — não usar grid.

**DocsExamples foi removido:** exemplos de código agora ficam embutidos em cada item de `DocsVariants` via o campo `code`.

```ts
content.appendChild(createDocsVariants({
  title: tContent('variants.title'),
  items: [
    {
      name: 'default',
      description: tContent('variants.default'),
      code: `const alert = createAlert({ variant: 'default' });\nalert.innerHTML = '<h5>Título</h5><p>Descrição</p>';`,
      previewFactory: () => createAlert({ variant: 'default' })
    },
    {
      name: 'destructive',
      description: tContent('variants.destructive'),
      code: `createAlert({ variant: 'destructive' })`,
      previewFactory: () => createAlert({ variant: 'destructive' })
    },
  ],
}));
```

### 8. Estados (`id="estados"`)

O container já aplica `font-medium` na primeira coluna — não passe classes de badge.

```ts
content.appendChild(createDocsStates({
  title: tContent('states.title'),
  cols: { state: 'Estado', trigger: 'Gatilho', behavior: 'Comportamento' },
  items: [
    { label: 'Default', trigger: 'Inicial', behavior: 'Exibe título e descrição' },
    { label: 'Destructive', trigger: `variant='destructive'`, behavior: 'Aplica cor de erro' },
  ],
}));
```

### 9. Propriedades (`id="propriedades"`)

`tables` é array — um table por subcomponente.

```ts
content.appendChild(createDocsProps({
  title: tContent('props.title'),
  tables: [
    {
      title: 'createAlert (options)',
      cols: { prop: 'Prop', type: 'Tipo', default: 'Padrão', required: 'Obrig.', description: 'Descrição' },
      items: [
        { name: 'variant', type: `'default' | 'destructive'`, defaultValue: `'default'`, required: 'Não', description: '...' },
      ],
    },
  ],
  interfaceCode: `interface AlertOptions { variant?: 'default' | 'destructive' }`,
  extensibilityTitle: tContent('props.extensibilityTitle'),
  extensibilityNotes: tContent('props.extensibilityNotes'),
}));
```

### 10. Tokens (`id="tokens"`)

```ts
content.appendChild(createDocsTokens({
  title: tContent('tokens.title'),
  cols: { token: 'Token', value: 'Valor', description: 'Uso' },
  items: [
    { token: '--background', value: 'hsl(...)', description: 'Fundo padrão' },
    { token: '--destructive', value: 'hsl(...)', description: 'Fundo destructive' },
  ],
  customizationTitle: tContent('tokens.customizationTitle'),
  customizationCode: tContent('tokens.customizationCode'),
}));
```

### 11. Acessibilidade (`id="acessibilidade"`)

```ts
content.appendChild(createDocsAccessibility({
  title: tContent('accessibility.title'),
  summary: tContent('accessibility.summary'),
  items: [tContent('accessibility.item1'), tContent('accessibility.item2')],
  keyboardTitle: tContent('accessibility.keyboardTitle'),
  keyboardItems: [{ key: 'Tab', description: '...' }],
}));
```

### 12. Relacionados (`id="relacionados"`)

```ts
content.appendChild(createDocsRelated({
  title: tContent('related.title'),
  items: [
    { name: 'Alert Dialog', description: tContent('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
  ],
}));
```

### 13. Notas (`id="notas"`)

```ts
content.appendChild(createDocsNotes({
  title: tContent('notes.title'),
  items: [{ title: tContent('notes.item1.title'), content: tContent('notes.item1.content') }],
}));
```

### 14. Analytics (`id="analytics"`)

```ts
content.appendChild(createDocsAnalytics({
  title: tContent('analytics.title'),
  cols: { event: 'Evento', trigger: 'Gatilho', payload: 'Payload' },
  items: [
    { event: 'docs_page_view', trigger: 'Ao carregar', payload: '{ component_name, locale }' },
  ],
}));
```

### 15. Testes (`id="testes"`)

```ts
content.appendChild(createDocsTestes({
  title: tContent('testes.title'),
  functional: { title: ..., cols: {...}, items: [...] },
  accessibility: { title: ..., cols: {...}, items: [...] },
  visual: { title: ..., cols: {...}, items: [...] },
}));
```

> **Debt — AlertDocs.ts**: a docs page do Alert implementa esta seção inline (não usa `createDocsTestes`). Padrão canônico para novos componentes é o container acima. Se implementar inline, os cabeçalhos das tabelas **devem** usar `tNav()`:
> - Funcional: `tNav('common.userAction')`, `tNav('common.expectedResult')`, `tNav('common.priority')`
> - Acessibilidade: inline locale-aware (`getLocale() === 'en' ? 'Criterion' : ...`)
> - Visual: `tNav('common.storyState')`, `tNav('common.priority')`
> - Labels de prioridade: usar `tNav({ high: 'common.high', medium: 'common.medium', low: 'common.low' }[raw] ?? 'common.high')`
> - `priorityColor()` deve comparar o `raw` (ex: `"high"`) — nunca o label traduzido.

---

## Padrões Especiais por Componente

### Componentes com Provider (Sonner)

Use 2 tables em `DocsProps` — uma para mount options (`createToaster()`), outra para API imperativa (`toast()`).

### Componentes Compostos (Table, Accordion, AlertDialog)

N tables em `DocsProps`, uma por subcomponente ou factory function.

### Componentes Compostos Interativos com Disclosure (padrão Accordion)

Componentes como **Accordion** usam a factory `createAccordion(options)` de `./accordion`.

1. **`createDocsVariants`** — `title`: "Modos de Operação". Items: `single`, `multiple`, `controlled`. A seção emite `id="modos"` — atualizar o array `navGroups` para `{ id: 'modos', label: tNav('nav.variants') }`.
2. **`createDocsAnatomy`** — 4 items: Root (`div[data-slot="accordion"]`), Item, Trigger (`button[data-slot="accordion-trigger"]`), Content.
3. **`createDocsStates`** — `closed`, `open`, `focus`, `disabled`. Omitir `loading`.
4. **`createDocsProps`** — 4 tables para `AccordionOptions` (root), item options, trigger attributes, content attributes.
5. **`createDocsTokens`** — 7 tokens; incluir `--animate-accordion-up` / `--animate-accordion-down`.
6. **Analytics** — além dos eventos de docs, `accordion_expand { label }` ao expandir e `accordion_collapse { label }` ao fechar.
7. **XSS** — trigger text via `textContent`, não `innerHTML`. CHEVRON_SVG via `insertAdjacentHTML` apenas por ser constante compile-time.
8. **Stories** — arquivos: `.stories.ts`, `-modos`, `-estados`, `-composicoes`. Omitir `-variantes` e `-tamanhos`.
9. **Ícones Lucide** — usar `import { Info } from 'lucide'` + cast `Info as unknown as LucideIconNode[]` + helper `createIcon(nodes)` com `createElementNS` loop. Nunca `.toSvg()`.
10. **Chave de tradução conflitante** — usar `props.table.type_prop` para a prop `type`.

### HTML de conteúdo

Sempre use `sanitizeHtml()` antes de atribuir a `innerHTML`:

```ts
el.innerHTML = sanitizeHtml(tContent('anatomy.item1'));
```

Containers já fazem isso para os props de texto que aceitam HTML. No consumidor, só sanitize quando montar `innerHTML` diretamente em factories.

### Alert e componentes não-interativos

- Stories sem handlers de clique
- Play functions testam `getByRole('alert')`, classes CSS
- `DocsStates` cobre configurações visuais (`complete`, `withoutTitle`, `withoutIcon`, `dynamicInsert`) — não loading/disabled

### Componentes de Feedback Não-Interativos Inline (padrão Badge)

Componentes como **Badge** usam a factory vanilla-TS `createBadge({ variant?, className?, children? })` de `./badge`, que retorna um `HTMLElement` `<div>` inline-flex. Não têm `size`, não recebem foco, não têm `disabled`/`loading`. Nome, categoria **Feedback**, translations em `docs/shared/content/badge/translations.json`.

1. **`createDocsAnatomy`** — 4 items: Root (`<div>` inline-flex), conteúdo (texto/número), ícone opcional (`aria-hidden="true"`), prop `variant`.
2. **`createDocsVariants`** — 4 entradas nativas do `cva()`: `default`, `secondary`, `destructive`, `outline`. Cada `previewFactory` chama `createBadge({ variant, children: 'label' })`. **Omitir seção de tamanhos** — Badge não tem `size` na factory.
3. **`createDocsStates`** — 4 configurações contextuais: `withIcon`, `countBadge`, `asLink`, `asTrigger`. **Omitir `disabled`/`loading`**. Cada linha descreve a composição vanilla: `withIcon` mostra como injetar ícone SVG com `aria-hidden`; `asLink`/`asTrigger` mostram envolver o `HTMLElement` retornado em `<a>`/`<button>` via `document.createElement`.
4. **`createDocsProps`** — 1 única table para `createBadge`: `variant` (`"default" | "secondary" | "destructive" | "outline"`), `className`, `children` (string ou `HTMLElement`). Nota em `props.extensibility` deixa claro que o `HTMLElement` resultante aceita `setAttribute('aria-*', ...)`, `addEventListener('click', ...)`, mas para interação preferir envolver em `<button>`/`<a>` ao invés de listener direto.
5. **Play function** — estrutura e a11y, sem interação: cada variante aplica a classe correta; `getByText` confirma o rótulo; ícone filho com `aria-hidden="true"`.
6. **`createDocsAnalytics`** — Badge é estrutural: listar apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir `badge_click` (payload: `{ label, variant }`) **apenas** quando o `HTMLElement` estiver envolto em trigger clicável.
7. **Stories** — **omitir `badge-tamanhos` e `badge-estados`**. Arquivos obrigatórios: `badge.stories.ts` (Playground + `withAutoDocsTab(createBadgeDocs)` + `tags: ["autodocs"]`), `badge-variantes.stories.ts` (Default, Secondary, Destructive, Outline), `badge-composicoes.stories.ts` (WithIcon, CountBadge, AsLink, InCard). Previews chamam `createBadge(...)` e fazem `render: () => el`.
8. **Sem foco próprio** — `keyboardItems` no `createDocsAccessibility` pode usar `{ key: "—", description: "sem tab stops próprios" }` ou ser omitido. Foco vem do wrapper `<button>`/`<a>` pai.
9. **Cor ≠ significado** — WCAG 1.4.1: texto deve comunicar estado sem depender de cor (ex: "Ativo" em vez de só fundo verde). Documentar em `accessibility.item2` e em par Do/Don't.

### Componentes Modais de Confirmação (padrão AlertDialog)

Componentes como **AlertDialog** (implementação vanilla-TS com foco-trap manual e `role="alertdialog"`) são overlays de decisão forçada — sem `cva()`; severidade vem da factory do Button usada em Trigger/Action.

1. **Sem `cva()`** — sem prop `variant`. `DocsVariants.items` documenta **tipos de uso** (`destructive`, `default`). Como a factory `createAlertDialog` **não aceita** `open`/`defaultOpen` inicial, cada `previewFactory` chama `queueMicrotask(() => trigger.click())` para abrir programaticamente no mount — Chromatic captura o modal visível.
2. **`DocsAnatomy`** — 9 items: Root (wrapper), Trigger (button), Content (dialog), Header, Title (`h2`), Description (`p`), Footer, Cancel (button), Action (button). `structureCode` mostra a estrutura HTML gerada.
3. **`DocsStates`** — `closed`, `open`, `confirmed`, `cancelled`, `controlled`. Omitir `loading`/`disabled`.
4. **`DocsProps`** — 5 tables: `createAlertDialog({ trigger, title, description, cancelButton, actionButton, onOpenChange? })`, `createAlertDialogTrigger`, `createAlertDialogContent({ className })`, `createAlertDialogAction({ onClick, className })`, `createAlertDialogCancel({ onClick, className })`. Factory **não** aceita `open`/`defaultOpen` — controle programático via `trigger.click()`.
5. **`DocsTokens`** — 7 tokens: overlayBg, contentBg, contentForeground, border, mutedForeground, destructive, destructiveForeground, radius.
6. **`DocsNotes`** — overlay **não** fecha ao clicar fora (diferença do Dialog). Documentar em nota dedicada.
7. **`DocsAccessibility`** — `role="alertdialog"` + `aria-modal="true"` aplicados pela factory. Focus trap manual via listeners `keydown` em Tab/Shift+Tab. Foco inicial no Cancel; `Escape` fecha.
8. **Stories** — omitir `alert-dialog-tamanhos` e `alert-dialog-variantes`. Abrir programaticamente com `queueMicrotask(() => trigger.click())` nas stories que precisam do modal visível para Chromatic. Arquivos: `.stories.ts`, `-composicoes`, `-estados`.
9. **Play function** — 6 critérios: trigger abre com `role="alertdialog"`; Cancel fecha + retorna foco ao trigger; Escape fecha; Tab não escapa (focus trap); overlay **não** fecha; Action fecha + dispara callback.
10. **Analytics de produto** — além dos eventos de docs: `dialog_open { component, location, label }`, `dialog_confirm { ... }`, `dialog_close { ..., trigger: "cancel_button" | "escape" }`.

### Containers Passivos Stateless (padrão AspectRatio)

Componentes como **AspectRatio** usam a factory `createAspectRatio({ ratio, content, className })` de `./aspect-ratio`. Preservam proporção largura/altura do filho via `padding-bottom: (1 / ratio) * 100%` + inner `position: absolute; inset: 0`. Sem estado, sem eventos, sem `cva()`, sem `size`.

1. **`createDocsDemonstration`** — `demoFactory` retorna grid responsivo (`grid-cols-1 sm:grid-cols-2 gap-6`) com 4 ratios canônicos. Labels em `<p class="text-xs font-medium text-muted-foreground">`. Ratios 1/1 e 3/4 em wrapper `max-w-[220px]` / `max-w-[260px]`.
2. **`createDocsAnatomy`** — 3 items: Root (wrapper com `padding-bottom` calculado manualmente), inner `absolute inset-0` e o filho (`img | video | iframe`). `structureCode` mostra a hierarquia.
3. **`createDocsWhenToUse`** — **omitir `uxWriting`**: AspectRatio não tem texto visível próprio. Passar apenas `guidelines`, `scenarios` (5 linhas) e `do`/`dont` (4 items cada).
4. **`createDocsVariants`** — renderizar como "Ratios Canônicos", não variantes `cva()`. `items` com 5 entradas fixas (`16 / 9`, `4 / 3`, `1 / 1`, `3 / 4`, `21 / 9`). Cada `previewFactory` chama `createAspectRatio({ ratio, content: imgEl })`. `variants.note` no JSON deixa explícito que são padrões canônicos.
5. **`createDocsStates`** — 3 linhas descrevendo **ownership transfer** ao filho: `Conteúdo carregado` / `Conteúdo ausente` / `Conteúdo falhou`. `states.note` explica que o componente é stateless.
6. **`createDocsProps`** — 1 tabela única com 4 linhas: `ratio` (number, default 1), `content` (`HTMLElement`, obrigatório — **não existe** `asChild` no Nortear), `className` (string), e opcionalmente demais atributos HTML. Documentar a diferença frente às demais stacks (`content` em vez de `children`).
7. **`createDocsTokens`** — Nortear AspectRatio não usa tokens próprios. Documentar apenas os tokens aplicáveis **quando usado como placeholder**: `--radius` → `nds-rounded-md`, `--border` → `nds-border`, `--muted` → `nds-bg-muted`. `tokens.note` no JSON explica que sem `content` o container é transparente. `customizationCode` instrui a aplicar classes no elemento passado como `content`, nunca no wrapper.
8. **`createDocsAccessibility`** — `keyboardItems` com linha `{ key: "—", description: "sem tab stops próprios" }` + nota sobre foco delegado ao filho. Foca em `data-slot="aspect-ratio"` e `alt`/`title` do elemento `content`.
9. **`createDocsAnalytics`** — tabela com **uma única linha passiva**: `{ event: '—', trigger: stripHtml(t('analytics.note')), payload: '—' }`. Não listar `docs_page_view`/`docs_section_viewed` aqui.
10. **Stories** — criar apenas `.stories.ts`, `-variantes` e `-composicoes`. **Omitir** `-tamanhos` (sem `size`) e `-estados` (stateless). Previews chamam `createAspectRatio({ ratio, content })` onde `content` é criado via `document.createElement('img')` com `alt`, `loading="lazy"`, `decoding="async"` e classes `rounded-md object-cover w-full h-full`.
11. **`rounded-md` / `border` no `content`** — regra visual absoluta: nunca aplicar no wrapper AspectRatio; aplicar sempre no elemento `HTMLElement` passado como `content`.

### Componentes Display Compositionais com Estados (padrão Avatar)

Componentes como **Avatar** usam as factories vanilla-TS `createAvatar`, `createAvatarRoot`, `createAvatarImage`, `createAvatarFallback` de `./avatar`. São displays passivos com **composições** em vez de variantes `cva()`. O Root aplica `h-10 w-10` por padrão.

1. **Sem `cva()` / sem `size`** — `createAvatarRoot` sempre renderiza `h-10 w-10`. Outros tamanhos (`h-6 w-6`, `h-8 w-8`, `h-12 w-12`) vêm via `className`. **Não aceitar `size` na factory.**
2. **`createDocsVariants`** — `items` com 5 entradas: `com imagem`, `com iniciais`, `com ícone`, `agrupamento`, `com status`. Cada `previewFactory` retorna um `HTMLElement` montado via as factories de avatar (ou combinações manuais com `document.createElement` para wrappers como `flex -space-x-2` e `relative inline-block`). Sem `cva()`.
3. **`createDocsAnatomy`** — 4 items: Root (`createAvatarRoot`), Image (`createAvatarImage`), Fallback (`createAvatarFallback`), e o sibling de status ou o ring em grupos.
4. **`createDocsStates`** — 4 linhas: `loaded`, `loading`, `failed`, `noImage`. Omitir `disabled`/`error`. Como a base é vanilla, o fallback troca via listener `onerror` da `<img>` (a própria factory cuida disso quando `createAvatar` é chamado com `src` + `fallbackText`).
5. **`createDocsProps`** — 3 tables: `createAvatarRoot` (`className`), `createAvatarImage` (`src`, `alt`, `className`), `createAvatarFallback` (`text`, `className`). A factory de alto nível `createAvatar({ src, alt, fallbackText, className })` pode ser documentada em nota ou em um 4º table — escolher uma das abordagens e manter consistente. **Não existe `delayMs` na factory vanilla** — documentar ausência em `notes` quando for relevante (outras stacks aceitam `delayMs`).
6. **`createDocsTokens`** — 7 tokens: `--muted`, `--muted-foreground`, `--background`, `--border`, `--primary`, `--radius` (`rounded-full` fixo), `--ring`.
7. **`createDocsAccessibility`** — (a) `alt` descritivo em `createAvatarImage` quando é única pista visual; (b) `alt=""` + `setAttribute('aria-hidden', 'true')` no fallback quando o nome está visível; (c) `setAttribute('aria-label', 'Online')` no `<span>` de status; (d) `role="group"` + `aria-label` no wrapper de grupo; (e) contraste iniciais ≥ 4.5:1.
8. **`createDocsAnalytics`** — Avatar é passivo: apenas eventos da docs. Incluir `avatar_click` só quando envolvido por link/botão em produto.
9. **`createDocsDoDont`** — pares canônicos: (a) "com fallback" (`createAvatar({ src, alt, fallbackText })`) vs "sem fallback" (`createAvatarRoot()` + `createAvatarImage()` sem `createAvatarFallback`); (b) "iniciais 2 letras maiúsculas" vs "iniciais minúsculas/3+ letras".
10. **Stories** — 4 arquivos: `avatar.stories.ts` (Playground + `withAutoDocsTab`), `avatar-composicoes.stories.ts` (WithImage, WithInitials, WithIcon, Group, WithStatus), `avatar-tamanhos.stories.ts` (Size6, Size8, Size10 default, Size12), `avatar-estados.stories.ts` (Loaded, Loading, Failed, NoImage). **Não criar `avatar-variantes.stories.ts`**. Apenas o principal leva `tags: ["autodocs"]`. As sub-stories chamam a factory que constrói o elemento e fazem `render: () => el`.
11. **`AvatarFallback` obrigatório** — toda composição com `createAvatarImage` deve incluir `createAvatarFallback` irmão. Sem ele, erro de `src` deixa o container vazio. Documentar em par Do/Don't e em `notes`.
12. **Iniciais canônicas** — 2 letras maiúsculas: primeira do nome + primeira do sobrenome. Regra em `usage.uxWriting.table.initials`.

### Componentes de Visualização de Dados (padrão Chart) — Nortear

Componentes como **Chart** no Nortear usam a factory `createChart({ data, type, height, colors })` de `./chart` — API simplificada, **sem Recharts**. Apenas os tipos **`bar`** e **`line`** são suportados via prop `type`. O gráfico é SVG puro renderizado pela factory sem dependências externas. Categoria **Display**, translations em `docs/shared/content/chart/translations.json`.

**Seções a renderizar (15 seções canônicas):**

| Seção | Container | Chaves principais do translations.json |
|-------|-----------|----------------------------------------|
| Header | `createDocsHeader` | `title`, `description`, `category`, `type` |
| Demonstração | `createDocsDemonstration` | `demonstration.title`, `demonstration.labels.bar`, `demonstration.labels.line`, `demonstration.labels.chartTitle` |
| Anatomia | `createDocsAnatomy` | `anatomy.title`, `anatomy.item1`–`item4`, `anatomy.structureLabel`, `anatomy.structureCode` |
| Quando Usar | `createDocsWhenToUse` | `usage.title`, `usage.guidelines.item1`–`item6`, `usage.scenarios.cols.*`, `usage.scenarios.item1`–`item6`, `usage.uxWriting.*`, `usage.do.item1`–`item4`, `usage.dont.item1`–`item3` |
| Do & Don't | `createDocsDoDont` | `doDont.title`, `doDont.pair1.*`, `doDont.pair2.*` |
| Importação | `createDocsImport` | `import.title`, `import.basecoat` |
| Tipos de Gráfico | `createDocsVariants` | `variants.title`, `variants.visualTitle`, `variants.note`, `variants.items.bar`, `variants.items.line` |
| Estados | `createDocsStates` | `states.title`, `states.cols.*`, `states.empty.*`, `states.loading.*`, `states.singleSeries.*`, `states.multiSeries.*` |
| Propriedades | `createDocsProps` | `props.title`, `props.containerTitle`, `props.table.config`, `props.table.className`, `props.extensibilityTitle`, `props.extensibility` |
| Tokens | `createDocsTokens` | `tokens.title`, `tokens.table.*`, `tokens.customizationTitle`, `tokens.note` |
| Acessibilidade | `createDocsAccessibility` | `accessibility.title`, `accessibility.summary`, `accessibility.item1`–`item6`, `accessibility.keyboardTitle`, `accessibility.keyboard.*` |
| Relacionados | `createDocsRelated` | `related.title`, `related.alternatives`, `related.usedWith`, `related.table`, `related.card`, `related.dataTable` |
| Notas | `createDocsNotes` | `notes.title`, `notes.tip1`–`tip5` |
| Analytics | `createDocsAnalytics` | `analytics.title`, `analytics.description`, `analytics.table.*` |
| Testes | `createDocsTestes` | `testes.title`, `testes.functional.*`, `testes.accessibility.*`, `testes.visual.*` |

**Regras específicas do Chart Nortear:**

1. **Apenas `bar` e `line`** — a factory `createChart` suporta apenas `type: 'bar' | 'line'`. `DocsVariants` deve renderizar apenas 2 cards (`bar`, `line`). Os tipos `area`, `pie`, `radar`, `radialBar` aparecem na seção de tipos mas com nota explícita de que não são suportados no Nortear — exibir `variants.note` via `element.innerHTML = sanitizeHtml(t('variants.note'))` acima dos cards.

2. **API simplificada** — a factory expõe apenas `createChart({ data, type, height, colors })`. `DocsProps` usa **1 tabela** (não 3 como no React), documentando apenas as props da factory:
   - `data`: array de pontos `{label, value}` ou `{label, values: number[]}`
   - `type`: `'bar' | 'line'`
   - `height`: number (pixels)
   - `colors`: string[] (tokens CSS ou valores hex)
   Chave de título: `props.containerTitle` (`"createChart"` como título da tabela).

3. **`DocsImport`** — usar apenas `import.basecoat`:
   ```ts
   import { createChart } from '@/components/ui/chart';
   ```
   Omitir `import.basic` e `import.withRecharts`.

4. **`createDocsDemonstration`** — `demoFactory` deve retornar um container com toggle entre `bar` e `line` (2 botões) usando `labels.bar` e `labels.line`. Dados hardcoded com 6 meses e `labels.chartTitle` como título.

5. **SVG puro — sem Recharts** — previews nas factories não usam Recharts. A factory `createChart` gera SVG puro. Não incluir dependências de `recharts` no Nortear.

6. **`DocsStates`** — 4 estados: `empty`, `loading`, `singleSeries`, `multiSeries`. Sem `disabled`/`error`. Estado `loading` usa `Skeleton` (factory `createSkeleton`) com as mesmas dimensões do container.

7. **`createDocsAccessibility`** — `keyboardItems` com 4 entradas. No Nortear, `accessibilityLayer` não existe — acessibilidade por teclado é implementada com `tabIndex`, `aria-label`, `role="img"` e `<title>` SVG.

8. **`notes.tip3`** — nota crítica: "No Nortear, apenas os tipos `bar` e `line` são suportados via prop `type`. A API é simplificada: `createChart({ data, type, height, colors })`." Esta nota já existe em `notes.tip3` e deve ser renderizada de forma destacada (borda diferente ou ícone de aviso no callout).

9. **`createDocsTestes`** — `functional` (6 items — apenas itens 1–3 para `bar`/`line` são diretamente testáveis; itens 4–6 podem ter notas de adaptação), `accessibility` (4 items com `{criterion, level, how}`), `visual` (4 items com `{story, priority}`).

10. **`sanitizeHtml` obrigatório** — todo `innerHTML` com conteúdo do translations.json usa `sanitizeHtml()`. Os campos de tokens, notas e acessibilidade contêm `<code>` inline que devem ser sanitizados.

11. **Stories Nortear** — criar 4 arquivos: `chart.stories.ts` (Playground + `withAutoDocsTab(createChartDocs)`), `chart-tipos.stories.ts` (Bar, Line — apenas 2 tipos), `chart-composicoes.stories.ts` (WithColors, SingleSeries, MultiSeries), `chart-estados.stories.ts` (Empty, Loading). Não criar `-variantes` nem `-tamanhos`. Previews chamam `createChart({...})` e fazem `render: () => el`.

12. **SEO — descrições longas** — o `translations.json` gerado tem descrições SEO acima de 155 chars nos 3 idiomas. Usar as descrições como estão; gap a ser corrigido pelo ux-writer.

---

## Proibições

- ❌ **NUNCA** reimplemente inline o HTML de uma seção — use a factory do container
- ❌ **NUNCA** copie classes `.nds-*` dos containers para blocos `innerHTML` sem necessidade — herde via composição
- ❌ **NUNCA** use `<pre><code>` em blocos de código (exceto `structureCode` em `DocsAnatomy`)
- ❌ **NUNCA** itere pares Do/Don't em um único grid — deixe `createDocsDoDont` fazer o split
- ❌ **NUNCA** recrie variantes com divs/classes manuais — use sempre a factory do componente real
- ❌ **NUNCA** use `innerHTML` com string não sanitizada vinda de `translations.json`
- ❌ **NUNCA** omita o wrapper `<nav sticky>` do `DocsNav`
- ❌ **NUNCA** retorne a mesma referência em múltiplas chamadas de factory — crie novos elementos

## Checklist Final

- [ ] Todos os containers importados de `src/components/docs/shared/sections/`
- [ ] Nenhum HTML de seção inline no consumidor
- [ ] `createDocsHeader` com category/type/installNote
- [ ] `createDocsDemonstration` com `demoFactory` retornando o componente real
- [ ] `createDocsVariants` com layout vertical (`space-y-4`) e campo `code` opcional por item
- [ ] `createDocsDoDont` com `doPreviewFactory` / `dontPreviewFactory` por par
- [ ] `createDocsProps` com tables array (múltiplos para componentes compostos)
- [ ] `createDocsStates` — labels em texto plano (container aplica `font-medium`)
- [ ] Layout `flex gap-16 items-start` com `<nav sticky top-8 w-52 shrink-0 self-start>`
- [ ] `applySeo` chamado no início + ao trocar locale
- [ ] `track('docs_page_view')` chamado no início + ao trocar locale
- [ ] IntersectionObserver dispara `track('docs_section_viewed')`
- [ ] `withAutoDocsTab` monta a função `createAlertDocs`
- [ ] Listener de locale re-renderiza o root
- [ ] `translations.json` com 3 idiomas completos
- [ ] `sanitizeHtml()` em todo `innerHTML` com conteúdo de translations
