# Documentação de Componentes Vue — Regras Obrigatórias

## Princípio Fundamental: Use os Section Containers

A partir desta versão, **todas as docs pages Vue DEVEM usar os containers genéricos** em `src/components/docs/shared/sections/`. Esses componentes encapsulam o layout, o wrapper card, os headings, os grids e a semântica de cada seção. A docs page é apenas o **orquestrador** — ela passa dados via props e previews via slots nomeados.

```ts
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
```

**NUNCA** reimplemente inline o HTML das seções. Se precisar de um layout novo, estenda o container correspondente — não duplique no consumo.

---

## Regras Vue-Específicas

### Bridge React para Storybook Docs Tab

Docs pages Vue são `.vue` mas `parameters.docs.page` do Storybook sempre espera React. O `withAutoDocsTab.tsx` faz o bridge e **DEVE** conter o pragma `@jsxImportSource react` porque o `tsconfig.json` do Vue define `jsxImportSource: "vue"`:

```ts
// withAutoDocsTab.tsx no topo:
/** @jsxImportSource react */
```

Na story principal:
```ts
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import AlertDocs from '@/components/docs/AlertDocs.vue';

parameters: {
  docs: { page: withAutoDocsTab(AlertDocs) },
},
```

### Locale vem SEMPRE de `useTranslation()`

> ⚠️ **Regra inegociável**: `locale` vem de `useTranslation()`. **NUNCA** use `useLocaleStore` ou Pinia para locale — Pinia existe no projeto, mas não gerencia idioma. Usar Pinia para locale causa runtime crash.

```ts
const { t: tNav }     = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

// ✅ CORRETO
useSeoEffect(computed(() => ({ locale: locale.value, /* ... */ })));

// ❌ ERRADO — locale de Pinia
const localeStore = useLocaleStore(); // NÃO USAR
```

### Render Functions no Storybook

Sempre use o formato `{ components, setup, template }`:

```ts
render: (args) => ({
  components: { Alert, AlertTitle, AlertDescription },
  setup() { return { args }; },
  template: `
    <Alert v-bind="args">
      <AlertTitle>Título</AlertTitle>
      <AlertDescription>Descrição</AlertDescription>
    </Alert>
  `,
}),
```

**NÃO** adicione `argTypes: { onClick: { action: 'clicked' } }` em stories que não testam clique — o handler injetado vira `[object Object]` no canvas ao passar via `v-bind="args"`. Use apenas quando combinado com `args: { onClick: fn() }`.

---

## Estrutura Obrigatória da Docs Page

### Layout do `<template>`

```vue
<template>
  <div class="ds-docs p-8 max-w-5xl mx-auto">
    <DocsHeader
      :title="tContent('title')"
      :description="tContent('description')"
      :category="tContent('category')"
      :type="tContent('type')"
      install-note="npx shadcn@latest add nome-componente"
    />

    <div class="flex gap-16 items-start">
      <nav
        aria-label="Navegação das seções do componente"
        class="sticky top-8 w-52 shrink-0 self-start space-y-5"
      >
        <DocsNav :groups="navGroups" :active-section="activeSection" />
      </nav>

      <div class="ds-docs flex-1 min-w-0 space-y-12">
        <!-- Containers de seção, na ordem canônica -->
      </div>
    </div>
  </div>
</template>
```

**Regras do layout:**
- `<nav>` com `sticky top-8 w-52 shrink-0 self-start` é obrigatório — sem ele, `DocsNav` rola junto com a página
- `aria-label` no `<nav>` diferencia a navegação de outras `<nav>`
- `flex-1 min-w-0` no conteúdo permite overflow responsivo (tabelas e blocos de código)
- `.ds-docs` aplica resets tipográficos específicos da doc

### `<script setup>` — contrato obrigatório

```vue
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import DocsNav from '@/components/docs/shared/DocsNav.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/<slug>/translations.json';

// Containers genéricos (listados acima)

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: '<slug>',
})));

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: '<slug>',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

const activeSection = ref('demonstracao');
function handleSectionChange(id: string) {
  activeSection.value = id;
  track('docs_section_viewed', {
    section_id: id,
    component_name: '<slug>',
    locale: locale.value as 'pt-BR' | 'en' | 'es',
  });
}

const navGroups = computed(() => [
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

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { handleSectionChange(entry.target.id); break; }
      }
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  allSectionIds.value.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
  onUnmounted(() => observer.disconnect());
});
</script>
```

---

## Seções — Uso dos Containers

Todos os containers aceitam dados via props reativos. Use `computed()` para montar as props que dependem de `tContent()`.

### 1. Header (fora do `<nav>`)

`DocsHeader` já renderiza badges, `LanguageSwitcher`, `<h1>` e description.

```vue
<DocsHeader
  :title="tContent('title')"
  :description="tContent('description')"
  :category="tContent('category')"
  :type="tContent('type')"
  install-note="npx shadcn@latest add <slug>"
/>
```

### 2. Demonstração (`id="demonstracao"`)

Passe a demo via slot padrão. A demo **DEVE** importar o componente real de `@/components/ui/<slug>`.

```vue
<DocsDemonstration :title="tContent('demonstration.title')">
  <Alert>
    <AlertTitle>{{ tContent('demonstration.exampleTitle') }}</AlertTitle>
    <AlertDescription>{{ tContent('demonstration.exampleDescription') }}</AlertDescription>
  </Alert>
</DocsDemonstration>
```

### 3. Anatomia (`id="anatomia"`)

```vue
<DocsAnatomy
  :title="tContent('anatomy.title')"
  :items="[tContent('anatomy.item1'), tContent('anatomy.item2'), tContent('anatomy.item3')]"
  :structure-code="tContent('anatomy.structureCode')"
/>
```

`items` aceita HTML inline (`<strong>`, `<code>`) — o container sanitiza. `structureCode` é diagrama ASCII renderizado em `<pre>`.

### 4. Quando Usar (`id="quando-usar"`)

```vue
<DocsWhenToUse
  :title="tContent('usage.title')"
  :guidelines="{
    title: tContent('usage.guidelines.title'),
    items: [1,2,3,4].map(i => tContent(`usage.guidelines.item${i}`))
  }"
  :scenarios="{
    title: tContent('usage.scenarios.title'),
    cols: {
      scenario: tContent('usage.scenarios.cols.scenario'),
      use: tContent('usage.scenarios.cols.use'),
      alternative: tContent('usage.scenarios.cols.alternative')
    },
    items: [1,2,3,4,5].map(i => ({
      s: tContent(`usage.scenarios.item${i}.s`),
      u: tContent(`usage.scenarios.item${i}.u`),
      a: tContent(`usage.scenarios.item${i}.a`)
    }))
  }"
  :ux-writing="{ /* mesma estrutura */ }"
  :do="{ title: tContent('usage.do.title'), items: [...] }"
  :dont="{ title: tContent('usage.dont.title'), items: [...] }"
/>
```

### 5. Do & Don't (`id="do-dont"`) — CRÍTICO

`DocsDoDont` emite **um grid por par** — isso previne o bug de empilhar DO|DO em cima e DON'T|DON'T em baixo. Use **slots nomeados dinâmicos** para os previews.

```vue
<DocsDoDont
  :title="tContent('doDont.title')"
  :pairs="[
    {
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: tContent('doDont.pair1.do'),
      dontCaption: tContent('doDont.pair1.dont'),
    },
    { /* pair 2 */ },
  ]"
>
  <template #do-preview-0>
    <Alert><AlertTitle>Título claro</AlertTitle></Alert>
  </template>
  <template #dont-preview-0>
    <Alert><AlertTitle>Erro</AlertTitle></Alert>
  </template>
  <template #do-preview-1>...</template>
  <template #dont-preview-1>...</template>
</DocsDoDont>
```

**NUNCA** itere pares dentro de um único grid no consumidor — deixe o container fazer isso.

### 6. Importação (`id="importacao"`)

```vue
<DocsImport
  :title="tContent('import.title')"
  :description="tContent('import.description')"
  :code="`import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';`"
/>
```

### 7. Variantes (`id="variantes"`)

Slot `#variant-preview-{index}` por variante. O campo `code` é **opcional** — quando presente, o container renderiza um botão "Ver código" que expande um bloco de código.

**Layout obrigatório: vertical (`space-y-4`).** Cada card ocupa largura total — não usar grid.

**DocsExamples foi removido:** exemplos de código agora ficam embutidos em cada item de `DocsVariants` via o campo `code`.

```vue
<DocsVariants
  :title="tContent('variants.title')"
  :items="[
    {
      name: 'default',
      description: tContent('variants.default'),
      code: `<Alert>\n  <AlertTitle>Título</AlertTitle>\n  <AlertDescription>Descrição</AlertDescription>\n</Alert>`
    },
    {
      name: 'destructive',
      description: tContent('variants.destructive'),
      code: `<Alert variant=\"destructive\">...</Alert>`
    },
  ]"
>
  <template #variant-preview-0><Alert>...</Alert></template>
  <template #variant-preview-1><Alert variant="destructive">...</Alert></template>
</DocsVariants>
```

### 8. Estados (`id="estados"`)

Tabela de estados — label da primeira coluna é `font-medium` (nunca badge).

```vue
<DocsStates
  :title="tContent('states.title')"
  :cols="{ state: 'Estado', trigger: 'Gatilho', behavior: 'Comportamento' }"
  :items="[
    { label: 'Default', trigger: 'Inicial', behavior: 'Exibe título e descrição' },
    { label: 'Destructive', trigger: 'variant=\"destructive\"', behavior: 'Aplica cor de erro' },
  ]"
/>
```

### 9. Propriedades (`id="propriedades"`)

`tables` é array — para componentes compostos (ex: Alert/AlertTitle/AlertDescription), use um table por subcomponente.

```vue
<DocsProps
  :title="tContent('props.title')"
  :tables="[
    {
      title: 'Alert',
      cols: { prop: 'Prop', type: 'Tipo', default: 'Padrão', required: 'Obrig.', description: 'Descrição' },
      items: [
        { name: 'variant', type: '\"default\" | \"destructive\"', defaultValue: '\"default\"', required: 'Não', description: 'Controla cor e ícone' },
        { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: 'Classes adicionais' },
      ]
    },
    { title: 'AlertTitle', cols: {...}, items: [...] },
  ]"
  :interface-code="`interface AlertProps extends HTMLAttributes<HTMLDivElement> {\n  variant?: 'default' | 'destructive';\n}`"
  :extensibility-title="tContent('props.extensibilityTitle')"
  :extensibility-notes="tContent('props.extensibilityNotes')"
/>
```

### 10. Tokens (`id="tokens"`)

```vue
<DocsTokens
  :title="tContent('tokens.title')"
  :cols="{ token: 'Token', value: 'Valor', description: 'Uso' }"
  :items="[
    { token: '--background', value: 'hsl(...)', description: 'Fundo padrão do Alert' },
    { token: '--destructive', value: 'hsl(...)', description: 'Fundo variant destructive' },
  ]"
  :customization-title="tContent('tokens.customizationTitle')"
  :customization-code="tContent('tokens.customizationCode')"
/>
```

### 11. Acessibilidade (`id="acessibilidade"`)

```vue
<DocsAccessibility
  :title="tContent('accessibility.title')"
  :summary="tContent('accessibility.summary')"
  :items="[
    tContent('accessibility.item1'),
    tContent('accessibility.item2'),
  ]"
  :keyboard-title="tContent('accessibility.keyboardTitle')"
  :keyboard-items="[
    { key: 'Tab', description: 'Move o foco para o próximo elemento focável' },
  ]"
/>
```

### 12. Relacionados (`id="relacionados"`)

Cards navegam via `(window.top ?? window).location.href` — trabalha bem dentro do iframe do Storybook.

```vue
<DocsRelated
  :title="tContent('related.title')"
  :items="[
    { name: 'Alert Dialog', description: tContent('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
    { name: 'Toast', description: tContent('related.toast'), path: '?path=/docs/ui-toast--docs' },
  ]"
/>
```

### 13. Notas (`id="notas"`)

```vue
<DocsNotes
  :title="tContent('notes.title')"
  :items="[
    { title: tContent('notes.item1.title'), content: tContent('notes.item1.content') },
  ]"
/>
```

### 14. Analytics (`id="analytics"`)

```vue
<DocsAnalytics
  :title="tContent('analytics.title')"
  :cols="{ event: 'Evento', trigger: 'Gatilho', payload: 'Payload' }"
  :items="[
    { event: 'docs_page_view', trigger: 'Ao carregar a docs page', payload: '{ component_name, locale }' },
    { event: 'docs_section_viewed', trigger: 'Ao entrar em uma seção', payload: '{ section_id, component_name, locale }' },
  ]"
/>
```

### 15. Testes (`id="testes"`)

```vue
<DocsTestes
  :title="tContent('testes.title')"
  :functional="{
    title: tContent('testes.functional.title'),
    cols: { action: 'Ação', result: 'Resultado', priority: 'Prioridade' },
    items: [
      { action: 'Renderizar Alert', result: 'role=\"alert\" presente', priority: 'Alta' },
    ]
  }"
  :accessibility="{ title: ..., cols: { criterion, level, how }, items: [...] }"
  :visual="{ title: ..., cols: { story, priority }, items: [...] }"
/>
```

---

## Padrões Especiais por Componente

### Componentes com Provider (Sonner, Toast)

Use 2 tables em `DocsProps`:
- Table 1: props do provider (`<Toaster />`)
- Table 2: API imperativa (`toast()` function signature)

### Componentes Compostos (Table, Accordion, AlertDialog)

Use N tables em `DocsProps`, uma por subcomponente. Exemplo Accordion: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.

### Componentes Compostos Interativos com Disclosure (padrão Accordion)

Componentes como **Accordion** implementam ARIA Disclosure via sub-componentes (Root, Item, Trigger, Content).

1. **`DocsVariants`** — `title`: "Modos de Operação". `items`: `single`, `multiple`, `controlled`. `id` da seção: `"modos"` (não `"variantes"`). Atualizar `navGroups` para usar `{ id: 'modos', label: tNav('nav.variants') }`.
2. **`DocsAnatomy`** — 4 items: Root, Item, Trigger, Content.
3. **`DocsStates`** — `closed`, `open`, `focus`, `disabled`. Omitir `loading`.
4. **`DocsProps`** — 4 tables: `Accordion` (Root), `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
5. **`DocsTokens`** — 7 tokens; incluir `--animate-accordion-up` / `--animate-accordion-down`.
6. **Analytics** — além dos eventos de docs, `accordion_expand { label }` ao expandir e `accordion_collapse { label }` ao fechar.
7. **Stories** — arquivos: `.stories.ts`, `-modos`, `-estados`, `-composicoes`. Omitir `-variantes` e `-tamanhos`.
8. **Play function** — 6 critérios: clicar trigger fechado abre; clicar aberto (collapsible) fecha; modo single alterna; disabled bloqueia; Enter expande; Space expande. Verificar `aria-expanded` via `toHaveAttribute`.
9. **Chave de tradução conflitante** — `props.table.type` nomeia a coluna "Tipo"; usar `props.table.type_prop` para descrever a prop `type` (evita ambiguidade no `flattenDict`).

### Componentes Radix com `dangerouslySetInnerHTML`

Componentes Radix/Reka com children internos **não** aceitam `dangerouslySetInnerHTML` direto. Use `<span v-html="...">` dentro do slot.

### Alert e componentes não-interativos

- Stories sem `argTypes.onClick`
- Play functions testam estrutura: `getByRole('alert')`, `toBeVisible()`, classes CSS de variante
- Seção `DocsStates` descreve configurações visuais (`complete`, `withoutTitle`, `withoutIcon`, `dynamicInsert`) — não estados funcionais (disabled, loading)

### AlertDialog e overlays

- Docs page deve explicar `role="alertdialog"` vs `role="dialog"`
- Play functions testam: abrir, fechar com Escape, focus trap, retorno de foco
- `DocsStates` cobre `open`/`closed`

---

## Proibições

- ❌ **NUNCA** reimplemente o HTML de uma seção inline (grids, cards, wrappers). Use o container.
- ❌ **NUNCA** copie classes Tailwind dos containers para o `<template>` da docs — o design evolui no container.
- ❌ **NUNCA** use `<pre><code>` em blocos de código (exceto `structureCode` em `DocsAnatomy`). Os containers já usam `<div><code class="whitespace-pre">`.
- ❌ **NUNCA** itere pares Do/Don't em um único grid — deixe `DocsDoDont` fazer o split.
- ❌ **NUNCA** recrie variantes com divs/classes manuais — use sempre o componente real de `@/components/ui/<slug>`.
- ❌ **NUNCA** use `useLocaleStore`/Pinia para locale — use sempre `useTranslation()`.
- ❌ **NUNCA** use `argTypes.onClick` em stories que não testam clique.
- ❌ **NUNCA** omita o wrapper `<nav sticky>` do `DocsNav`.

## Checklist Final

- [ ] Todos os containers importados de `@/components/docs/shared/sections/`
- [ ] Nenhum HTML de seção inline no `<template>` da docs
- [ ] `DocsHeader` com category/type/installNote
- [ ] `DocsDemonstration` com slot padrão usando o componente real
- [ ] `DocsVariants` com layout vertical (`space-y-4`) e campo `code` opcional por item
- [ ] `DocsDoDont` com slots `#do-preview-N` / `#dont-preview-N` (um por par)
- [ ] `DocsProps` com tables array (múltiplos para componentes compostos)
- [ ] `DocsStates` — labels `font-medium`, sem badges
- [ ] Layout `flex gap-16 items-start` com `<nav sticky top-8 w-52 shrink-0 self-start>`
- [ ] `locale` de `useTranslation()`, nunca de Pinia
- [ ] `useSeoEffect` com computed reativo ao locale
- [ ] `watch(locale)` dispara `track('docs_page_view')`
- [ ] IntersectionObserver dispara `track('docs_section_viewed')`
- [ ] `withAutoDocsTab` com pragma `@jsxImportSource react`
- [ ] `translations.json` com 3 idiomas completos
- [ ] Nenhuma story com `argTypes.onClick` sem `fn()` em args
