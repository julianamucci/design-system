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

A árvore da página não se monta à mão. Ela é o que `createDocsPageLayout`
devolve, e é esta:

```
div.sb-unstyled.ds-docs.nds-page          (data-width="wide")
├── header                                 (DocsHeader)
└── div.nds-sidebar-layout                 (data-sidebar-sticky="true")
    ├── nav.nds-stack                      (data-spacing="md", aria-label)
    │   └── DocsNav
    └── main.ds-docs.nds-stack             (data-spacing="2xl", tabindex="-1", aria-labelledby)
```

O manejo devolve `root`, `headerSlot`, `main`, `rebuildNav()`,
`setActiveSection()` e `destroy()`. A docs page preenche o `headerSlot`, pendura
as seções no `main` e não constrói coluna nenhuma.

```ts
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getCurrentLocale, subscribeLocale } from '@/lib/i18n';
import DOMPurify from 'dompurify';   // chamado no call site, sem wrapper local
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '../../../docs/shared/content/<slug>/translations.json';
// imports dos containers (listados acima)
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { createDocsPageLayout } from '@/components/docs/shared/sections/DocsPageLayout';

export function createAlertDocs(): HTMLElement {
  // O layout já nasce com header slot, nav e <main>. Nada de coluna à mão.
  const layout = createDocsPageLayout({ navGroups: [], componentSlug: '<slug>' });

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

    // Header — vai no slot do layout, não no root
    layout.headerSlot.replaceChildren(createDocsHeader({
      title: tContent('title'),
      description: tContent('description'),
      category: tContent('category'),
      type: tContent('type'),
      installNote: 'npx nortear add <slug>',
    }));

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
    layout.rebuildNav(navGroups);

    // Conteúdo principal — o <main> do layout, esvaziado a cada render
    const content = layout.main;
    content.replaceChildren();

    content.appendChild(createDocsDemonstration({
      title: tContent('demonstration.title'),
      demoFactory: () => {
        // Retornar o componente real de @/components/ui/<slug>
        const alert = createAlert({ variant: 'default' });
        return alert;
      },
    }));

    // demais containers...

    // IntersectionObserver para active section + analytics
    const ids = navGroups.flatMap(g => g.sections.map(s => s.id));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        layout.setActiveSection(entry.target.id);
        track('docs_section_viewed', { section_id: entry.target.id, component_name: '<slug>', locale });
        break;
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }

  render();
  const unsubscribe = subscribeLocale(() => render());

  // Cleanup ao remover do DOM (via MutationObserver ou Storybook teardown):
  // além do unsubscribe, chamar layout.destroy() para soltar o observador de
  // cliques do tracking.
  return layout.root;
}
```

**Regras do layout:**
- **O layout vem de `createDocsPageLayout` — não se remonta.** A coluna fixa é `.nds-sidebar-layout[data-sidebar-sticky="true"]`: a folha resolve as duas colunas, o vão entre elas, a largura da barra lateral, o grudar da navegação ao rolar e o empilhar em tela estreita. Cada docs page que montasse a sua própria divergiria da vizinha na primeira mudança de largura
- O ritmo vertical é `.nds-stack` com `data-spacing` — `md` entre os grupos da navegação, `2xl` entre as seções do conteúdo. Não há classe de espaço vertical avulsa no sistema
- `aria-label` no `<nav>` diferencia a navegação de outras `<nav>` da página
- O conteúdo é o landmark `<main>`, com `tabindex="-1"` (recebe o foco do atalho "Ir para o conteúdo" sem entrar na ordem de tabulação) e `aria-labelledby` apontando ao `<h1>` do header — o leitor de tela anuncia "principal, <título da página>" ao cair ali
- `.sb-unstyled` desliga o estilo de prosa que o Storybook injeta na subárvore; `.ds-docs` aplica os resets tipográficos da doc; `.nds-page` dá largura máxima e respiro lateral, com `data-width="wide"`

---

## Seções — Uso dos Containers

### 1. Header (fora do `<nav>`)

```ts
root.appendChild(createDocsHeader({
  title: tContent('title'),
  description: tContent('description'),
  category: tContent('category'),
  type: tContent('type'),
  installNote: 'npx nortear add <slug>',
}));
```

### 2. Demonstração (`id="demonstracao"`)

Passe `demoFactory` retornando o componente real de `@/components/ui/<slug>`.

```ts
content.appendChild(createDocsDemonstration({
  title: tContent('demonstration.title'),
  demoFactory: () => {
    const alert = createAlert({ variant: 'default' });
    // Título e descrição já têm classe própria na folha do Alert; não há
    // tipografia a acrescentar no call site.
    alert.innerHTML = DOMPurify.sanitize(`
      <h5 class="nds-alert-title">${tContent('demonstration.exampleTitle')}</h5>
      <section class="nds-alert-description"><p>${tContent('demonstration.exampleDescription')}</p></section>
    `);
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

**Layout obrigatório: vertical.** O container empilha os itens num `.nds-stack`; cada card ocupa largura total — não usar grade.

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

O container já dá o peso de fonte da primeira coluna — passe texto plano, sem classe de badge.

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

Sempre sanitize antes de atribuir a `innerHTML`, importando e chamando `DOMPurify` **no próprio arquivo** — helper local esconde o sanitizador do SAST (ver `09-seguranca-xss.md`):

```ts
import DOMPurify from 'dompurify';

el.innerHTML = DOMPurify.sanitize(tContent('anatomy.item1'));
```

Containers já fazem isso para os props de texto que aceitam HTML. No consumidor, só sanitize quando montar `innerHTML` diretamente em factories.

### Alert e componentes não-interativos

- Stories sem handlers de clique
- Play functions testam `getByRole('alert')`, classes CSS
- `DocsStates` cobre configurações visuais (`complete`, `withoutTitle`, `withoutIcon`, `dynamicInsert`) — não loading/disabled

### Componentes de Feedback Não-Interativos Inline (padrão Badge)

Componentes como **Badge** usam a factory vanilla-TS `createBadge({ variant?, className?, children? })` de `./badge`, que retorna um `HTMLElement` `<div>` inline-flex. Não têm `size`, não recebem foco, não têm `disabled`/`loading`. Nome, categoria **Feedback**, translations em `docs/shared/content/badge/translations.json`.

1. **`createDocsAnatomy`** — 4 items: Root (`<div>` inline-flex), conteúdo (texto/número), ícone opcional (`aria-hidden="true"`), prop `variant`.
2. **`createDocsVariants`** — 5 entradas nativas da fábrica: `default`, `destructive`, `warning`, `success`, `info`. Cada `previewFactory` chama `createBadge({ variant, children: 'label' })`. **Omitir seção de tamanhos** — Badge não tem `size` na factory.
3. **`createDocsCompositions`** — 3 configurações contextuais: `withIcon`, `asTrigger`, `withCounter`. **Omitir `disabled`/`loading`**. Cada cartão descreve a composição vanilla: `withIcon` mostra como injetar ícone SVG com `aria-hidden`; `asTrigger` mostra envolver o `HTMLElement` retornado em `<button>` via `document.createElement`; `withCounter` monta `createBadgeCounter` dentro do `children` da etiqueta.
4. **`createDocsProps`** — 1 única table para `createBadge`: `variant` (`"default" | "destructive" | "warning" | "success" | "info"`), `className`, `children` (string ou `HTMLElement`). Nota em `props.extensibility` deixa claro que o `HTMLElement` resultante aceita `setAttribute('aria-*', ...)`, `addEventListener('click', ...)`, mas para interação preferir envolver em `<button>`/`<a>` ao invés de listener direto.
5. **Play function** — estrutura e a11y, sem interação: cada variante aplica a classe correta; `getByText` confirma o rótulo; ícone filho com `aria-hidden="true"`.
6. **`createDocsAnalytics`** — Badge é estrutural: listar apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir `badge_click` (payload: `{ label, variant }`) **apenas** quando o `HTMLElement` estiver envolto em trigger clicável.
7. **Stories** — **omitir `badge-tamanhos` e `badge-estados`**. Arquivos obrigatórios: `badge.stories.ts` (Playground + `withAutoDocsTab(createBadgeDocs)` + `tags: ["autodocs"]`), `badge-variants.stories.ts` (Default, Destructive, Semantics), `badge-compositions.stories.ts` (WithIcon, WithCounter, AsButton). Previews chamam `createBadge(...)` e fazem `render: () => el`.
8. **Sem foco próprio** — `keyboardItems` no `createDocsAccessibility` pode usar `{ key: "—", description: "sem tab stops próprios" }` ou ser omitido. Foco vem do wrapper `<button>`/`<a>` pai.
9. **Cor ≠ significado** — WCAG 1.4.1: texto deve comunicar estado sem depender de cor (ex: "Ativo" em vez de só fundo verde). Documentar em `accessibility.item2` e em par Do/Don't.

### Componentes Modais de Confirmação (padrão AlertDialog)

Componentes como **AlertDialog** (implementação vanilla-TS com foco-trap manual e `role="alertdialog"`) são overlays de decisão forçada — sem `cva()`; severidade vem da factory do Button usada em Trigger/Action.

1. **Sem `cva()`** — sem prop `variant`. `DocsVariants.items` documenta **tipos de uso** (`destructive`, `default`). A factory aceita `defaultOpen`, que é como as capturas visuais nascem com o modal aberto — não é preciso simular o clique no gatilho.
2. **`DocsAnatomy`** — 10 items: Root (wrapper), Trigger (button), Content (dialog), Header, Title (`h2`), Description (`p`, **opcional**), Footer, Cancel (button), Action (button), Media (bloco de ícone, opcional). `structureCode` mostra a estrutura HTML gerada.
3. **`DocsStates`** — `closed`, `open`, `confirmed`, `cancelled`, `controlled`. Omitir `loading`/`disabled`.
4. **`DocsProps`** — 5 tables: `createAlertDialog({ trigger, title, description?, media?, cancelButton, actionButton, defaultOpen?, onOpenChange?, class? })`, `createAlertDialogTrigger`, `createAlertDialogContent({ className })`, `createAlertDialogAction({ onClick, className })`, `createAlertDialogCancel({ onClick, className })`. `description` é **opcional**: sem ela o painel não declara `aria-describedby`.
5. **`DocsTokens`** — 7 tokens: overlayBg, contentBg, contentForeground, border, mutedForeground, destructive, radius.
6. **`DocsNotes`** — overlay **não** fecha ao clicar fora (diferença do Dialog). Documentar em nota dedicada.
7. **`DocsAccessibility`** — `role="alertdialog"` + `aria-modal="true"` aplicados pela factory. Focus trap manual via listeners `keydown` em Tab/Shift+Tab. Foco inicial no Cancel; `Escape` fecha.
8. **Stories** — omitir `alert-dialog-tamanhos` e `alert-dialog-variantes`. Abrir programaticamente com `queueMicrotask(() => trigger.click())` nas stories que precisam do modal visível para Chromatic. Arquivos: `.stories.ts`, `-composicoes`, `-estados`.
9. **Play function** — 6 critérios: trigger abre com `role="alertdialog"`; Cancel fecha + retorna foco ao trigger; Escape fecha; Tab não escapa (focus trap); overlay **não** fecha; Action fecha + dispara callback.
10. **Analytics de produto** — além dos eventos de docs: `dialog_open { component, location, label }`, `dialog_confirm { ... }`, `dialog_close { ..., trigger: "cancel_button" | "escape" }`.

### Containers Passivos Stateless (padrão AspectRatio)

Componentes como **AspectRatio** usam a factory `createAspectRatio({ ratio, content, className })` de `./aspect-ratio`. A proporção é a propriedade CSS nativa `aspect-ratio`, lida da custom property `--ratio` que a fábrica escreve no root; `.nds-aspect-ratio > *` já põe o filho em `position: absolute; inset: 0` e 100% nos dois eixos. Sem estado, sem eventos, sem variante, sem `size`.

1. **`createDocsDemonstration`** — `demoFactory` retorna uma grade responsiva `.nds-grid-responsive-2` com 4 ratios canônicos. Os rótulos usam a escada tipográfica do sistema (`.nds-text-caption`) em `--muted-foreground`. **Não existe utilitária de largura máxima arbitrária** — os degraus disponíveis são `.nds-max-w-*`; ratio que precise de moldura menor escolhe o degrau, nunca uma medida escrita.
2. **`createDocsAnatomy`** — 2 items: Root (`.nds-aspect-ratio`, que carrega `--ratio`) e o filho (`img | video | iframe`), que a folha posiciona e estica. `structureCode` mostra a hierarquia. Não há item de "inner": ele não existe no markup, e listá-lo descrevia uma peça que nunca foi construída.
3. **`createDocsWhenToUse`** — **omitir `uxWriting`**: AspectRatio não tem texto visível próprio. Passar apenas `guidelines`, `scenarios` (5 linhas) e `do`/`dont` (4 items cada).
4. **`createDocsVariants`** — renderizar como "Ratios Canônicos", não variantes `cva()`. `items` com 5 entradas fixas (`16 / 9`, `4 / 3`, `1 / 1`, `3 / 4`, `21 / 9`). Cada `previewFactory` chama `createAspectRatio({ ratio, content: imgEl })`. `variants.note` no JSON deixa explícito que são padrões canônicos.
5. **`createDocsStates`** — 3 linhas descrevendo **ownership transfer** ao filho: `Conteúdo carregado` / `Conteúdo ausente` / `Conteúdo falhou`. `states.note` explica que o componente é stateless.
6. **`createDocsProps`** — 1 tabela única com 4 linhas: `ratio` (number, default 1), `content` (`HTMLElement`, obrigatório — **não existe** `asChild` no Nortear), `className` (string), e opcionalmente demais atributos HTML. Documentar a diferença frente às demais stacks (`content` em vez de `children`).
7. **`createDocsTokens`** — o AspectRatio não usa token próprio: a única entrada do wrapper é `--ratio`. Documentar os tokens que aparecem **quando ele é usado como placeholder** — `--radius` (via `.nds-rounded-md`), `--border` e `--muted`, estes dois lidos pela folha de quem envolve. `tokens.note` no JSON explica que sem `content` o container é transparente. `customizationCode` instrui a aplicar classes no elemento passado como `content`, nunca no wrapper.
8. **`createDocsAccessibility`** — `keyboardItems` com linha `{ key: "—", description: "sem tab stops próprios" }` + nota sobre foco delegado ao filho. Foca em `data-slot="aspect-ratio"` e `alt`/`title` do elemento `content`.
9. **`createDocsAnalytics`** — tabela com **uma única linha passiva**: `{ event: '—', trigger: stripHtml(t('analytics.note')), payload: '—' }`. Não listar `docs_page_view`/`docs_section_viewed` aqui.
10. **Stories** — criar apenas `.stories.ts`, `-variantes` e `-composicoes`. **Omitir** `-tamanhos` (sem `size`) e `-estados` (stateless). Previews chamam `createAspectRatio({ ratio, content })` onde `content` é criado via `document.createElement('img')` com `alt`, `loading="lazy"`, `decoding="async"`, `.nds-rounded-md` e as utilitárias de preenchimento (`.nds-w-full`, `.nds-h-full`). O recorte (`object-fit: cover`) **não tem utilitária no sistema** — enquanto não houver, ele vem da folha de quem consome, nunca de valor no call site.
11. **Raio e contorno vão no `content`** — regra visual absoluta: nunca no wrapper AspectRatio; sempre no elemento `HTMLElement` passado como `content`.

### Componentes Display Compositionais com Estados (padrão Avatar)

Componentes como **Avatar** usam as factories vanilla-TS `createAvatar`, `createAvatarRoot`, `createAvatarImage`, `createAvatarFallback` de `./avatar`. São displays passivos com **composições** em vez de variantes de cor. O Root nasce em 32px, e cresce ou encolhe por degrau nomeado.

1. **Sem variante de cor, mas COM `size`** — `createAvatarRoot` e `createAvatar` aceitam `size` (`sm` 24px, `md` 32px, `lg` 40px, `xl` 48px, `2xl` 64px), que chega ao DOM como `data-size` no root. A folha `avatar.css` traduz o degrau numa custom property (`--avatar-size`) da qual a tipografia das iniciais e o sinal de estado derivam por cálculo. **Por isso o tamanho não pode vir por classe de medida no `className`**: o círculo mudaria e as iniciais e o sinal ficariam para trás, presos ao valor antigo. Degrau nomeado é o que mantém as três medidas em sincronia.
2. **`createDocsVariants`** — `items` com 5 entradas: `com imagem`, `com iniciais`, `com ícone`, `agrupamento`, `com status`. Cada `previewFactory` retorna um `HTMLElement` montado via as factories de avatar. A fila sobreposta é `.nds-avatar-group` (a folha faz a sobreposição e o excedente `+N` em `.nds-avatar-group-count`), e o sinal de estado é `.nds-avatar-badge`, filho do próprio avatar — não um irmão dentro de um wrapper montado à mão. Sem variante de cor.
3. **`createDocsAnatomy`** — 4 items: Root (`createAvatarRoot`), Image (`createAvatarImage`), Fallback (`createAvatarFallback`), e o sibling de status ou o ring em grupos.
4. **`createDocsStates`** — 4 linhas: `loaded`, `loading`, `failed`, `noImage`. Omitir `disabled`/`error`. Como a base é vanilla, o fallback troca via listener `onerror` da `<img>` (a própria factory cuida disso quando `createAvatar` é chamado com `src` + `fallbackText`).
5. **`createDocsProps`** — 3 tables: `createAvatarRoot` (`size`, `className`), `createAvatarImage` (`src`, `alt`, `className`), `createAvatarFallback` (`text`, `className`). A factory de alto nível `createAvatar({ src, alt, fallbackText, size, delayMs, className })` pode ser documentada em nota ou num 4º table — escolher uma das abordagens e manter consistente. `delayMs` é a espera antes de mostrar as iniciais, para que a imagem rápida não faça o fallback piscar.
6. **`createDocsTokens`** — 7 tokens: `--muted`, `--muted-foreground`, `--background`, `--border`, `--primary`, `--radius-full` (o círculo, fixo pela folha), `--ring`.
7. **`createDocsAccessibility`** — (a) `alt` descritivo em `createAvatarImage` quando é única pista visual; (b) `alt=""` + `setAttribute('aria-hidden', 'true')` no fallback quando o nome está visível; (c) `setAttribute('aria-label', 'Online')` no `<span>` de status; (d) `role="group"` + `aria-label` no wrapper de grupo; (e) contraste iniciais ≥ 4.5:1.
8. **`createDocsAnalytics`** — Avatar é passivo: apenas eventos da docs. Incluir `avatar_click` só quando envolvido por link/botão em produto.
9. **`createDocsDoDont`** — pares canônicos: (a) "com fallback" (`createAvatar({ src, alt, fallbackText })`) vs "sem fallback" (`createAvatarRoot()` + `createAvatarImage()` sem `createAvatarFallback`); (b) "iniciais 2 letras maiúsculas" vs "iniciais minúsculas/3+ letras".
10. **Stories** — 4 arquivos: `avatar.stories.ts` (Playground + `withAutoDocsTab`), `avatar-compositions.stories.ts` (WithImage, WithInitials, WithIcon, Group, WithStatus), `avatar-sizes.stories.ts` (Sm, Md, Lg, Xl, TwoXl — um por degrau de `data-size`), `avatar-states.stories.ts` (Loaded, Loading, Failed, NoImage). **Não criar story de variantes de cor**. Apenas o principal leva `tags: ["autodocs"]`. As sub-stories chamam a factory que constrói o elemento e fazem `render: () => el`.
11. **`AvatarFallback` obrigatório** — toda composição com `createAvatarImage` deve incluir `createAvatarFallback` irmão. Sem ele, erro de `src` deixa o container vazio. Documentar em par Do/Don't e em `notes`.
12. **Iniciais canônicas** — 2 letras maiúsculas: primeira do nome + primeira do sobrenome. Regra em `usage.uxWriting.table.initials`.

### Componentes de Visualização de Dados (padrão Chart) — Nortear

Componentes como **Chart** são camada de theming sobre **Apache ECharts**: a factory `createChart(opts)` de `./chart` registra o tema do design system a partir dos tokens do `<html>` e o reaplica quando a classe muda — trocar marca, modo escuro, densidade ou fonte recolore o gráfico sem recarregar. Quatro tipos cobertos: `bar`, `line`, `area`, `pie`. `buildChartOption(opts)` é o construtor puro do objeto de configuração, exportado à parte para quem precisa customizar antes de desenhar. Categoria **Display**, translations em `docs/shared/content/chart/translations.json`.

**Seções a renderizar (15 seções canônicas):**

| Seção | Container | Chaves principais do translations.json |
|-------|-----------|----------------------------------------|
| Header | `createDocsHeader` | `title`, `description`, `category`, `type` |
| Demonstração | `createDocsDemonstration` | `demonstration.title`, `demonstration.labels.bar`, `demonstration.labels.line`, `demonstration.labels.chartTitle` |
| Anatomia | `createDocsAnatomy` | `anatomy.title`, `anatomy.item1`–`item4`, `anatomy.structureLabel`, `anatomy.structureCode` |
| Quando Usar | `createDocsWhenToUse` | `usage.title`, `usage.guidelines.item1`–`item6`, `usage.scenarios.cols.*`, `usage.scenarios.item1`–`item6`, `usage.uxWriting.*`, `usage.do.item1`–`item4`, `usage.dont.item1`–`item3` |
| Do & Don't | `createDocsDoDont` | `doDont.title`, `doDont.pair1.*`, `doDont.pair2.*` |
| Importação | `createDocsImport` | `import.title`, `import.vanilla` |
| Tipos de Gráfico | `createDocsCompositions` | `variants.title`, `variants.visualTitle`, `variants.note`, `variants.items.bar`/`line`/`area`/`pie`/`smallInline`, `variants.compositionsTitle`, `variants.compositions.inCard.*` |
| Estados | `createDocsStates` | `states.title`, `states.cols.*`, `states.empty.*`, `states.loading.*`, `states.singleSeries.*`, `states.multiSeries.*` |
| Propriedades | `createDocsProps` | `props.title`, `props.containerTitle`, `props.table.config`, `props.table.className`, `props.extensibilityTitle`, `props.extensibility` |
| Tokens | `createDocsTokens` | `tokens.title`, `tokens.table.*`, `tokens.customizationTitle`, `tokens.note` |
| Acessibilidade | `createDocsAccessibility` | `accessibility.title`, `accessibility.summary`, `accessibility.item1`–`item6`, `accessibility.keyboardTitle`, `accessibility.keyboard.*` |
| Relacionados | `createDocsRelated` | `related.title`, `related.alternatives`, `related.usedWith`, `related.table`, `related.card`, `related.dataTable` |
| Notas | `createDocsNotes` | `notes.title`, `notes.tip1`–`tip5` |
| Analytics | `createDocsAnalytics` | `analytics.title`, `analytics.description`, `analytics.table.*` |
| Testes | `createDocsTestes` | `testes.title`, `testes.functional.*`, `testes.accessibility.*`, `testes.visual.*` |

**Regras específicas do Chart Nortear:**

1. **Quatro tipos cobertos** — `type: 'bar' | 'line' | 'area' | 'pie'`. A seção de tipos renderiza esses 4 cards mais `smallInline`, e um bloco separado de composições (`variants.compositionsTitle` + `variants.compositions.inCard.*`). Exibir `variants.note` acima dos cards via `element.innerHTML = DOMPurify.sanitize(t('variants.note'))`. **Não** documentar tipo que a factory não registra (dispersão, radar, mapa de calor): prometer desenho que não sai é pior que omitir — esses exigiriam registrar um módulo extra da lib.

2. **Uma tabela de props** — `createDocsProps` usa **1 tabela**, documentando as entradas de `ChartOptions`:
   - `type`: `'bar' | 'line' | 'area' | 'pie'` (default `bar`)
   - `data`: `ChartDataPoint[]` — dataset simples de 1 série
   - `xAxis` + `series`: forma multi-série (`ChartSeries[]`)
   - `height`: number (px); sem valor, vale o piso de `.nds-chart`
   - `renderer`: `'svg' | 'canvas'` (default `svg`)
   - `title` (texto VISÍVEL acima dos eixos), `showLegend`, `class`, `aria-label` (nome acessível do container; `label` segue aceito como apelido depreciado), `emptyLabel`
   Chave de título: `props.containerTitle` (`"createChart"` como título da tabela). `props.extensibilityTitle` cobre `buildChartOption`, para quem precisa ajustar o objeto antes de desenhar.

3. **`DocsImport`** — usar apenas `import.vanilla`:
   ```ts
   import { createChart } from '@/components/ui/chart';
   ```
   Omitir `import.basic` e `import.withBuilders`. **Nunca** documentar import direto da lib de gráfico: chamá-la sem passar pela factory pula o registro do tema e o desenho sai com a paleta padrão dela.

4. **`createDocsDemonstration`** — `demoFactory` retorna um container com alternância entre os tipos usando `labels.bar`, `labels.line` e `labels.area`. Dados hardcoded com 6 meses e `labels.chartTitle` como título.

5. **`aria-label` obrigatório nos previews** — o container é `role="img"`; sem ele o desenho é conteúdo perdido. A frase diz o que o gráfico mostra, não que é um gráfico. Não confundir com `title`, que é texto visível dentro do desenho.

6. **`DocsStates`** — 4 estados: `empty`, `loading`, `singleSeries`, `multiSeries`. Sem `disabled`/`error`. Estado `loading` usa `Skeleton` (factory `createSkeleton`) com as mesmas dimensões do container. O estado vazio é frase completa com orientação para a próxima ação, nunca "Sem dados.".

7. **`createDocsAccessibility`** — `keyboardItems` com 4 entradas. Não há navegação granular por ponto de dado: o container é `role="img"` com `aria-label` autoral, e dataset crítico pede resumo textual à parte, fora da tela por `.nds-sr-only`. A informação nunca vive só na cor (WCAG 1.4.1) — a trama por série vem ligada pelo bloco `aria` do objeto de configuração, e a legenda nomeia cada série por escrito. Os 3:1 de objeto gráfico (WCAG 1.4.11) vêm do **contorno** das formas em `--foreground`, não da cor de série.

8. **`notes.tip3`** — nota crítica sobre a superfície da API do Vanilla (`createChart(opts)` + `buildChartOption(opts)`), renderizada de forma destacada (borda diferente ou ícone de aviso no callout).

9. **`createDocsTestes`** — `functional` (6 items), `accessibility` (4 items com `{criterion, level, how}`), `visual` (4 items com `{story, priority}`).

10. **Sanitização obrigatória** — todo `innerHTML` com conteúdo do translations.json passa por `DOMPurify.sanitize()`, com o import e a chamada no próprio arquivo. Os campos de tokens, notas e acessibilidade contêm `<code>` inline.

11. **Stories Nortear** — criar 5 arquivos: `chart.stories.ts` (Playground + `withAutoDocsTab(createChartDocs)`), `chart-variantes.stories.ts` (Bar, Line, Area, Pie), `chart-composicoes.stories.ts` (SingleSeries, MultiSeries, InCard, SmallInline), `chart-estados.stories.ts` (Empty, Loading, SingleSeries, MultiSeries) e `chart-configuracoes.stories.ts` (renderer, altura, legenda). Não criar `-tamanhos` — não há prop `size`. Previews chamam `createChart({...})` e fazem `render: () => el`.

12. **SEO — descrições longas** — o `translations.json` gerado tem descrições SEO acima de 155 chars nos 3 idiomas. Usar as descrições como estão; gap a ser corrigido pelo ux-writer.

---

## Proibições

- ❌ **NUNCA** reimplemente inline o HTML de uma seção — use a factory do container
- ❌ **NUNCA** copie classes `.nds-*` dos containers para blocos `innerHTML` sem necessidade — herde via composição
- ❌ **NUNCA** use `<pre><code>` em blocos de código (exceto `structureCode` em `DocsAnatomy`)
- ❌ **NUNCA** itere pares Do/Don't em um único grid — deixe `createDocsDoDont` fazer o split
- ❌ **NUNCA** recrie variantes com divs/classes manuais — use sempre a factory do componente real
- ❌ **NUNCA** use `innerHTML` com string não sanitizada vinda de `translations.json`
- ❌ **NUNCA** monte a coluna de navegação à mão — o `<nav>` e o grudar ao rolar vêm de `createDocsPageLayout`
- ❌ **NUNCA** retorne a mesma referência em múltiplas chamadas de factory — crie novos elementos

## Checklist Final

- [ ] Todos os containers importados de `src/components/docs/shared/sections/`
- [ ] Nenhum HTML de seção inline no consumidor
- [ ] `createDocsHeader` com category/type/installNote
- [ ] `createDocsDemonstration` com `demoFactory` retornando o componente real
- [ ] `createDocsVariants` empilhado na vertical (`.nds-stack`) e campo `code` opcional por item
- [ ] `createDocsDoDont` com `doPreviewFactory` / `dontPreviewFactory` por par
- [ ] `createDocsProps` com tables array (múltiplos para componentes compostos)
- [ ] `createDocsStates` — labels em texto plano (o container dá o peso da primeira coluna)
- [ ] Página montada por `createDocsPageLayout` — header no `headerSlot`, seções no `main`, navegação por `rebuildNav()`
- [ ] `applySeo` chamado no início + ao trocar locale
- [ ] `track('docs_page_view')` chamado no início + ao trocar locale
- [ ] IntersectionObserver dispara `track('docs_section_viewed')`
- [ ] `withAutoDocsTab` monta a função `createAlertDocs`
- [ ] Listener de locale re-renderiza o root
- [ ] `translations.json` com 3 idiomas completos
- [ ] `DOMPurify.sanitize()` em todo `innerHTML` com conteúdo de translations, importado e chamado no próprio arquivo
