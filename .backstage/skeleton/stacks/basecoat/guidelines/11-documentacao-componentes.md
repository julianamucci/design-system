# Documentação de Componentes Basecoat (Vanilla TS) — Regras Obrigatórias

## Princípio Fundamental: Use os Section Containers

Todas as docs pages Basecoat **DEVEM usar as factory functions** em `src/components/docs/shared/sections/`. Cada seção é uma função `createDocsXxx(props): HTMLElement` que encapsula o layout, o wrapper card, os headings, os grids e a semântica. A docs page é apenas o **orquestrador** — constrói o DOM chamando essas factories e passando dados + **factory functions de preview**.

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

## Regras Basecoat-Específicas

### Factory functions de preview

Em Basecoat não há slots/snippets. Previews são passados como **factory functions** `() => HTMLElement`:

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

Basecoat não tem reatividade automática. A docs page:
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

### AlertDialog e overlays

- Docs page explica `role="alertdialog"` vs `role="dialog"`
- Play functions: abrir, fechar com Escape, focus trap, retorno de foco
- `DocsStates` cobre `open`/`closed`

---

## Proibições

- ❌ **NUNCA** reimplemente inline o HTML de uma seção — use a factory do container
- ❌ **NUNCA** copie classes Tailwind dos containers para blocos `innerHTML`
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
