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

### Componentes de Feedback Não-Interativos Inline (padrão Badge)

Componentes como **Badge** (single root `<div>`) são rótulos visuais compactos para status, contagens, categorias ou tags. Não têm `size` prop, não recebem foco, não têm `disabled`/`loading`. Nome, categoria **Feedback**, translations em `docs/shared/content/badge/translations.json`.

1. **`DocsAnatomy`** — 4 items: `Badge` (`<div>` inline-flex), conteúdo (texto/número), ícone opcional (`aria-hidden="true"`), prop `variant`.
2. **`DocsVariants`** — 4 entradas nativas do `cva()`: `default`, `secondary`, `destructive`, `outline`. Cada slot `#variant-preview-N` renderiza `<Badge variant="...">` importado de `@/components/ui/badge`. **Omitir seção de tamanhos** — Badge não tem prop `size`.
3. **`DocsStates`** — 4 configurações contextuais: `withIcon`, `countBadge`, `asLink`, `asTrigger`. **Omitir `disabled`/`loading`**.
4. **`DocsProps`** — 1 única table para `Badge`: `variant`, `class`, default slot (`children`). Nota de extensibilidade (`props.extensibility`) deixa claro que o root aceita atributos HTML nativos (`onClick`, `aria-*`, `data-*`); para interação, preferir envolver em `<button>`/`<a>`.
5. **Play function** — estrutura e a11y, sem interação: cada variante aplica a classe correta; `getByText` confirma o rótulo; ícone filho com `aria-hidden="true"`.
6. **`DocsAnalytics`** — Badge é estrutural: listar apenas `docs_page_view`, `docs_section_viewed`, `language_switched`. Incluir `badge_click` (payload: `{ label, variant }`) **apenas** quando o Badge for envolto em trigger clicável.
7. **Stories** — **omitir `badge-tamanhos` e `badge-estados`**. Arquivos obrigatórios: `badge.stories.ts` (Playground com `parameters.docs.page: withAutoDocsTab(BadgeDocs)` + `tags: ["autodocs"]`), `badge-variantes.stories.ts` (Default, Secondary, Destructive, Outline), `badge-composicoes.stories.ts` (WithIcon, CountBadge, AsLink, InCard).
8. **Sem foco próprio** — `keyboardItems` no `DocsAccessibility` pode usar `{ key: "—", description: "sem tab stops próprios" }` ou ser omitido. Foco vem do wrapper interativo pai.
9. **Cor ≠ significado** — WCAG 1.4.1: texto deve comunicar estado sem depender de cor (ex: "Ativo" em vez de só fundo verde). Documentar em `accessibility.item2` e em par Do/Don't.

### Componentes Modais de Confirmação (padrão AlertDialog)

Componentes como **AlertDialog** são overlays de decisão forçada — não possuem `cva()` próprio; severidade vem do `Button` usado em Trigger/Action.

1. **Sem `cva()`** — sem prop `variant`. `DocsVariants.items` documenta **tipos de uso** (`destructive`, `default`) como padrões contextuais. Cada `preview` usa `:default-open="true"` no Root para Chromatic capturar o modal aberto.
2. **`DocsAnatomy`** — 9 items: Root, Trigger, Content, Header, Title, Description, Footer, Cancel, Action. `structureCode` mostra JSX aninhado completo.
3. **`DocsStates`** — `closed`, `open`, `confirmed`, `cancelled`, `controlled`. Omitir `loading`/`disabled`.
4. **`DocsProps`** — 5 tables: Root (`open`, `defaultOpen`, `onOpenChange`), Trigger (`asChild`), Content (`className`), Action (`onClick`, `className`), Cancel (`onClick`, `className`).
5. **`DocsTokens`** — 7 tokens: overlayBg, contentBg, contentForeground, border, mutedForeground, destructive, destructiveForeground, radius.
6. **`DocsNotes`** — overlay **não** fecha ao clicar fora (diferença do Dialog). Documentar em nota dedicada.
7. **`DocsAccessibility`** — `role="alertdialog"` anuncia imediatamente sem exigir foco (diferente de `dialog`). Foco inicial no Cancel.
8. **Stories** — omitir `alert-dialog-tamanhos` e `alert-dialog-variantes` (não há cva). Usar `:default-open="true"` nas stories de estados para que Chromatic capture o modal visível. Arquivos: `.stories.ts`, `-composicoes`, `-estados`.
9. **Play function** — 6 critérios: trigger abre com `role="alertdialog"`; Cancel fecha + retorna foco; Escape fecha; Tab não escapa (focus trap); overlay **não** fecha; Action fecha + dispara callback.
10. **Analytics de produto** — além dos eventos de docs: `dialog_open { component: "alert_dialog", location, label }` ao abrir; `dialog_confirm { ... }` ao confirmar; `dialog_close { ..., trigger: "cancel_button" | "escape" }` ao cancelar.

### Containers Passivos Stateless (padrão AspectRatio)

Componentes como **AspectRatio** (base: `reka-ui`) preservam proporção largura/altura do filho. Não têm estado, não disparam eventos, não possuem `cva()` nem prop `size` — toda interação é do filho.

1. **`DocsDemonstration`** — grid responsivo (`grid-cols-1 sm:grid-cols-2 gap-6`) com 4 ratios canônicos rotulados. Labels em `<p class="text-xs font-medium text-muted-foreground">`. Ratios que crescem muito (1/1, 3/4) usam wrapper `max-w-[220px]` / `max-w-[260px]`.
2. **`DocsAnatomy`** — 3 items: Root (`data-slot="aspect-ratio"` com `padding-bottom` calculado pelo Reka), inner `absolute inset-0` e o filho (`img | video | iframe`).
3. **`DocsWhenToUse`** — **omitir `uxWriting`**: AspectRatio não tem texto visível próprio. Passar apenas `guidelines`, `scenarios` (5 linhas) e `do`/`dont` (4 items cada).
4. **`DocsVariants`** — renderizar como "Ratios Canônicos", não variantes `cva()`. `items` com 5 entradas fixas (`16 / 9`, `4 / 3`, `1 / 1`, `3 / 4`, `21 / 9`). O `name` é o próprio ratio. `variants.note` no JSON deixa explícito que são padrões canônicos, não `cva()`.
5. **`DocsStates`** — 3 linhas descrevendo **ownership transfer** ao filho: `Conteúdo carregado` / `Conteúdo ausente` / `Conteúdo falhou`. Coluna "Gatilho" descreve o estado do filho; "Comportamento" descreve a inércia do container. `states.note` explica que o componente é stateless.
6. **`DocsProps`** — 1 tabela única com 4 linhas: `ratio` (number, default 1), `children` / slot (obrigatório), `asChild` (boolean, default false), `class` (string).
7. **`DocsTokens`** — AspectRatio não usa tokens próprios. Documentar apenas os tokens aplicáveis **quando usado como placeholder** (skeleton): `--radius` → `rounded-md`, `--border` → `border border-border`, `--muted` → `bg-muted`. `tokens.note` no JSON deixa claro que o container é transparente sem filho. `customizationCode` instrui a aplicar borda/radius **no filho**, nunca no wrapper.
8. **`DocsAccessibility`** — `keyboardItems` com linha `{ key: "—", description: "sem tab stops próprios" }` + nota sobre foco passar ao filho. `accessibility.aria.item*` foca em `data-slot="aspect-ratio"` e `alt`/`title` do filho.
9. **`DocsAnalytics`** — tabela com **uma única linha passiva**: `{ event: '—', trigger: tContent('analytics.note'), payload: '—' }`. Não listar `docs_page_view`/`docs_section_viewed` aqui (são do layer de docs, não do componente).
10. **Stories** — criar apenas `.stories.ts`, `-variantes` e `-composicoes`. **Omitir** `-tamanhos` (sem `size`) e `-estados` (stateless). Só o arquivo principal leva `tags: ["autodocs"]`.
11. **`rounded-md` / `border` no filho** — regra visual absoluta: nunca aplicar no wrapper AspectRatio.

### Componentes Display Compositionais com Estados (padrão Avatar)

Componentes como **Avatar** (base: `reka-ui` — `Avatar`, `AvatarImage`, `AvatarFallback`) são displays passivos com **composições** em vez de variantes `cva()`. Têm tamanho padrão (`h-10 w-10`) aplicado no Root e estados internos de carregamento.

1. **Sem `cva()` / sem prop `size`** — o Root aplica `h-10 w-10` fixo. Tamanhos (`h-6 w-6`, `h-8 w-8`, `h-10 w-10`, `h-12 w-12`) vêm **sempre** via `class`. **Não criar prop `size`.**
2. **`DocsVariants`** — **title**: "Composições". `items` com 5 entradas: `image`, `initials`, `icon`, `group`, `withStatus`. Cada slot `#variant-preview-N` monta a composição completa usando o componente real. Sem `cva()`.
3. **`DocsAnatomy`** — 4 items: `Avatar` (Root), `AvatarImage`, `AvatarFallback`, e o sibling de status ou o ring em grupos. `structureCode` mostra `<Avatar><AvatarImage /><AvatarFallback>…</AvatarFallback></Avatar>`.
4. **`DocsStates`** — 4 linhas: `loaded`, `loading`, `failed`, `noImage`. Omitir `disabled`/`error`. `onLoadingStatusChange` é o gatilho do estado; o `reka-ui` decide qual filho renderizar.
5. **`DocsProps`** — 3 tables: `Avatar` (`class`, default slot), `AvatarImage` (`src`, `alt`, `onLoadingStatusChange`, `class`), `AvatarFallback` (`delayMs`, `class`, default slot). `src` e `alt` obrigatórios em `AvatarImage`. Usar `delayMs={600}` como valor canônico.
6. **`DocsTokens`** — 7 tokens: `--muted`, `--muted-foreground`, `--background`, `--border`, `--primary`, `--radius` (`rounded-full` fixo), `--ring`.
7. **`DocsAccessibility`** — obrigatórios: (a) `alt` descritivo (`"Foto de perfil de [Nome]"`) no `AvatarImage` quando é única pista visual; (b) `alt=""` + `AvatarFallback aria-hidden="true"` quando o nome está visível ao lado; (c) `<span :aria-label="…">` no indicador de status; (d) grupo com `role="group" :aria-label="…"` no wrapper (opcional, contextual); (e) contraste das iniciais ≥ 4.5:1.
8. **`DocsAnalytics`** — Avatar é passivo: apenas eventos da docs (`docs_page_view`, `docs_section_viewed`, `language_switched`). Incluir `avatar_click` **apenas** quando envolvido por link/botão em produto.
9. **`DocsDoDont`** — pares canônicos: (a) "com fallback" vs "sem fallback" (imagem quebrada = container vazio); (b) "iniciais 2 letras maiúsculas" vs "iniciais minúsculas/3+ letras".
10. **Stories** — 4 arquivos: `avatar.stories.ts` (+ `withAutoDocsTab(AvatarDocs)`), `avatar-composicoes.stories.ts` (WithImage, WithInitials, WithIcon, Group, WithStatus), `avatar-tamanhos.stories.ts` (Size6, Size8, Size10 default, Size12), `avatar-estados.stories.ts` (Loaded, Loading com `delayMs`, Failed, NoImage). **Não criar `avatar-variantes.stories.ts`**. Apenas o principal leva `tags: ["autodocs"]`. Se precisar de wrapper de interação, criar `AvatarStory.vue`.
11. **`AvatarFallback` obrigatório** — regra absoluta: toda instância com `AvatarImage` precisa de `AvatarFallback` irmão. Sem ele, falha/demora de `src` resulta em container vazio. Documentar em par Do/Don't e em `notes`.
12. **Iniciais canônicas** — 2 letras maiúsculas: primeira letra do nome + primeira do sobrenome. Regra em `usage.uxWriting.table.initials`.

### Componentes de Visualização de Dados (padrão Chart) — Vue

Componentes como **Chart** usam **`@unovis/vue`** — API completamente diferente do React. Não há `ChartContainer` do design system no Vue; os componentes são `VisXYContainer`, `VisBar`, `VisLine`, `VisArea`, `VisDonut`, `VisAxis`, `ChartCrosshair`, `ChartTooltip` (todos de `@unovis/vue`). O design system Vue fornece apenas wrappers de theming para integrar tokens de cor. Categoria **Display**, translations em `docs/shared/content/chart/translations.json`.

**Seções a renderizar (15 seções canônicas):**

| Seção | Container | Chaves principais do translations.json |
|-------|-----------|----------------------------------------|
| Header | `DocsHeader` | `title`, `description`, `category`, `type` |
| Demonstração | `DocsDemonstration` | `demonstration.title`, `demonstration.labels.*` |
| Anatomia | `DocsAnatomy` | `anatomy.title`, `anatomy.item1`–`item4`, `anatomy.structureLabel`, `anatomy.structureCode` |
| Quando Usar | `DocsWhenToUse` | `usage.title`, `usage.guidelines.item1`–`item6`, `usage.scenarios.cols.*`, `usage.scenarios.item1`–`item6`, `usage.uxWriting.*`, `usage.do.item1`–`item4`, `usage.dont.item1`–`item3` |
| Do & Don't | `DocsDoDont` | `doDont.title`, `doDont.pair1.*`, `doDont.pair2.*` |
| Importação | `DocsImport` | `import.title`, `import.basic`, `import.withRecharts` |
| Tipos de Gráfico | `DocsVariants` | `variants.title`, `variants.visualTitle`, `variants.note`, `variants.items.bar`–`radialBar` |
| Estados | `DocsStates` | `states.title`, `states.cols.*`, `states.empty.*`, `states.loading.*`, `states.singleSeries.*`, `states.multiSeries.*` |
| Propriedades | `DocsProps` | `props.title`, `props.containerTitle`, `props.tooltipTitle`, `props.legendTitle`, `props.table.*`, `props.extensibilityTitle`, `props.extensibility` |
| Tokens | `DocsTokens` | `tokens.title`, `tokens.table.*`, `tokens.customizationTitle`, `tokens.note` |
| Acessibilidade | `DocsAccessibility` | `accessibility.title`, `accessibility.summary`, `accessibility.item1`–`item6`, `accessibility.keyboardTitle`, `accessibility.keyboard.*` |
| Relacionados | `DocsRelated` | `related.title`, `related.alternatives`, `related.usedWith`, `related.table`, `related.card`, `related.dataTable` |
| Notas | `DocsNotes` | `notes.title`, `notes.tip1`–`tip5` |
| Analytics | `DocsAnalytics` | `analytics.title`, `analytics.description`, `analytics.table.*` |
| Testes | `DocsTestes` | `testes.title`, `testes.functional.*`, `testes.accessibility.*`, `testes.visual.*` |

**Regras específicas do Chart Vue:**

1. **`@unovis/vue` — não é Recharts** — Vue usa `@unovis/vue` como biblioteca de gráficos subjacente. `ChartCrosshair` e `ChartTooltip` são importados de `@unovis/vue`, não do design system. O `structureCode` na anatomia e os exemplos de import devem refletir a API do Unovis, não a do Recharts.

2. **Sem `cva()` — usar padrão §11.3** — 6 tipos documentados nos cards: `bar`, `line`, `area`, `pie`, `radar`, `radialBar`. O campo `variants.note` deve ser exibido acima dos cards.

3. **`DocsProps` com 3 tabelas** — `ChartContainer` (ou equivalente Unovis), `ChartTooltipContent`, `ChartLegendContent`. Os nomes de props e comportamentos vêm do translations.json — a implementação interna usa Unovis.

4. **`DocsImport`** — omitir a chave `import.basecoat` (não se aplica). Usar `import.basic` e `import.withRecharts` adaptando para Unovis:
   - Import do wrapper de theming do design system
   - Import dos primitivos do `@unovis/vue`

5. **`DocsStates`** — 4 estados: `empty`, `loading`, `singleSeries`, `multiSeries`. Sem `disabled`/`error`.

6. **`DocsAccessibility`** — `keyboardItems` com 4 entradas via chaves `accessibility.keyboard.*`. No Unovis, acessibilidade por teclado pode diferir do `accessibilityLayer` do Recharts — documentar na nota de implementação Vue.

7. **`DocsNotes`** — `notes.tip4` menciona especificamente que "Vue usa `@unovis/vue` — API diferente do React". Esta é a nota mais crítica para o Vue e deve ser renderizada primeiro ou destacada visualmente.

8. **`DocsTestes`** — `functional` (6 items), `accessibility` (4 items com `{criterion, level, how}`), `visual` (4 items com `{story, priority}`).

9. **Stories Vue** — criar 4 arquivos: `chart.stories.ts` (Playground + `withAutoDocsTab(ChartDocs)`), `chart-tipos.stories.ts` (Bar, Line, Area, Pie, Radar, RadialBar), `chart-composicoes.stories.ts` (WithLegend, MultiSeries, SingleSeries), `chart-estados.stories.ts` (Empty, Loading, SingleSeries, MultiSeries). Não criar `-variantes` nem `-tamanhos`.

10. **Locale de `useTranslation()` sempre** — nunca usar `useLocaleStore`/Pinia para locale em ChartDocs.vue.

11. **SEO — descrições longas** — o `translations.json` gerado tem descrições SEO acima de 155 chars nos 3 idiomas. Usar as descrições como estão; gap a ser corrigido pelo ux-writer.

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
