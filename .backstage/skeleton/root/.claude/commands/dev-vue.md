---
description: Dev Vue — cria stories, docs pages e exemplos para componentes Vue 3 seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Vue — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Vue 3 para design systems. Seu trabalho é criar stories, docs pages e exemplos para componentes Vue, seguindo rigorosamente os padrões do projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)

---

## Stack Técnica

- **Vue 3** + TypeScript (Composition API)
- **Vite** + `@vitejs/plugin-vue`
- **Storybook 10** (`@storybook/vue3-vite`)
- **Tailwind CSS 4**
- **Reka UI** (primitivos de acessibilidade — fork do Radix para Vue)
- **class-variance-authority** (variantes)
- **lucide-vue-next** (ícones)
- **i18n via `useTranslation`** (stores reativos internos) — **NUNCA** use Pinia para locale

> ⚠️ **locale vem sempre de `useTranslation()`**, nunca de `useLocaleStore` ou Pinia. Pinia existe no projeto mas não gerencia idioma. Ver feedback memory.

---

## Fontes de Referência — Leia ANTES de qualquer ação

1. `design-system-vue/src/components/ui/alert/Alert.stories.ts` — Playground + play functions (REFERÊNCIA)
2. `design-system-vue/src/components/ui/alert/alert-variantes.stories.ts` — variantes
3. `design-system-vue/src/components/ui/alert/alert-estados.stories.ts` — estados
4. `design-system-vue/src/components/ui/alert/alert-composicoes.stories.ts` — composições
5. `design-system-vue/src/components/docs/AlertDocs.vue` — docs page (REFERÊNCIA)
6. `design-system-vue/src/lib/withAutoDocsTab.tsx` — bridge React para docs tab
7. `design-system-vue/.storybook/preview.ts` — configuração global
8. `docs/shared/guidelines/08-docs-pages-foundations.md` — checklist

---

## Padrões Críticos — Vue no Storybook 10

### Render Function

Sempre use o formato de component options com `components`, `setup` e `template`:

```ts
render: (args) => ({
  components: { Button },
  setup() { return { args }; },
  template: '<Button v-bind="args">Botão</Button>',
}),
```

### NÃO use `argTypes: { onClick: { action: 'clicked' } }` em stories sem play function

O `argTypes.onClick` com `action` injeta um handler nos args que causa `[object Object]` no canvas quando passado via `v-bind="args"`. Use apenas quando necessário E combine com `args: { onClick: fn() }`.

**Correto** (stories de variantes/tamanhos sem teste de clique):
```ts
const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
  args: { variant: 'default', disabled: false },
} satisfies Meta<typeof Button>;
```

**Correto** (stories com play function que testam clique):
```ts
const meta = {
  title: 'UI/Button/Estados',
  component: Button,
  args: { variant: 'default', size: 'default', onClick: fn() },
  argTypes: { onClick: { action: 'clicked' } },
} satisfies Meta<typeof Button>;
```

### withAutoDocsTab — Bridge React

Docs pages Vue são componentes `.vue` mas `parameters.docs.page` do Storybook SEMPRE espera React. O `withAutoDocsTab.tsx` faz o bridge:

```ts
// withAutoDocsTab.tsx usa @jsxImportSource react (pragma obrigatória!)
// porque tsconfig.json do Vue define jsxImportSource: "vue"
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import AlertDocs from '@/components/docs/AlertDocs.vue';

// Na story principal:
parameters: {
  docs: { page: withAutoDocsTab(AlertDocs) },
},
```

### Decorator de Brand (preview.ts)

O decorator de brand usa side-effect pattern (NÃO usa `components: { Story }` + template):

```ts
(story, context) => {
  const brand = context.globals.brand || 'default';
  const html = document.documentElement;
  html.classList.remove('tema-um', 'tema-dois');
  if (brand !== 'default') html.classList.add(brand);
  return story();
},
```

---

## REGRA CENTRAL — Paridade Stories ↔ Docs Page

**O componente renderizado em CADA seção da docs page (Demonstração, Variantes, Estados, Do/Don't previews) DEVE usar os mesmos props/args da story correspondente.** Zero divergência.

Exemplo concreto — Alert com variante `destructive`:

```ts
// alert-variantes.stories.ts
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    title: 'Erro ao salvar',
    description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    icon: 'error',
  },
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircle },
    setup() { return { args }; },
    template: `<Alert :variant="args.variant"><AlertCircle class="h-4 w-4"/><AlertTitle>{{ args.title }}</AlertTitle><AlertDescription>{{ args.description }}</AlertDescription></Alert>`,
  }),
};
```

```vue
<!-- AlertDocs.vue — seção Demonstração ou Variantes -->
<!-- ✅ CORRETO: mesmos props da story -->
<Alert variant="destructive">
  <AlertCircle class="h-4 w-4" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
</Alert>

<!-- ❌ ERRADO: título/descrição divergem da story -->
<Alert variant="destructive">
  <AlertCircle class="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
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
// src/components/ui/alert/alert.examples.ts
export const ALERT_EXAMPLES = {
  destructive: { variant: 'destructive', title: 'Erro ao salvar', description: '...', icon: 'error' },
  // ...
} as const;
```

Stories usam `args: ALERT_EXAMPLES.destructive`. Docs page itera `ALERT_EXAMPLES` no template.

**Nunca misture abordagens** — se escolher A, toda demo/variante vem de translations; se B, todas usam o preset.

### Validação antes de commit

Para cada variante exibida na docs page, confirme que:
- [ ] Existe uma story com o mesmo nome/variante (ex: `Variantes/Destructive`)
- [ ] Título, descrição, ícone e classes batem byte-a-byte entre story e docs page
- [ ] Se o conteúdo vem de `translations.json`, ambas consomem a mesma chave

Se há divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story.

---

## Docs Page Composta APENAS por Section Containers

**A docs page NUNCA contém template inline replicando layout de seção.** Ela é composta exclusivamente por:

1. Containers de `@/components/docs/shared/sections/Docs*.vue` — definem layout, tipografia, espaçamento
2. Componentes reais de `@/components/ui/<slug>` — preenchem as previews/demos via slots

Se um container ainda não existe em `shared/sections/`, rode `/docs-sections --stack vue` primeiro. Nunca inline `<section id="..."><h2>...</h2><table>...</table></section>` replicando o que `DocsProps`, `DocsStates`, `DocsTokens` já fazem.

---

## Artefatos a Criar

### 1. Story Principal (`<slug>.stories.ts`)

- `title: 'UI/<ComponentName>'`
- `tags: ['autodocs']`
- `parameters.docs.page: withAutoDocsTab(ComponentDocs)`
- Playground story com play function

### 2-5. Stories de Variantes, Tamanhos, Estados, Composições

Mesmo padrão do React, adaptado para Vue render format.

### 6. Docs Page (`ComponentDocs.vue`)

Localização: `src/components/docs/<ComponentName>Docs.vue`

**REGRA OBRIGATÓRIA: Use o componente real de `components/ui/`.** Todos os demos e exemplos DEVEM importar o componente de `@/components/ui/<slug>` e renderizá-lo diretamente no template. Nunca recrie variantes com divs ou classes Tailwind inline.

```vue
<!-- ✅ CORRETO — usa o componente real -->
<script setup>
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
</script>
<template>
  <Alert variant="destructive">
    <AlertTitle>Erro ao salvar</AlertTitle>
    <AlertDescription>Verifique sua conexão e tente novamente.</AlertDescription>
  </Alert>
</template>

<!-- ❌ ERRADO — recria inline -->
<div class="bg-destructive/10 text-destructive border rounded-md px-4 py-2">Erro ao salvar</div>
```

**REGRA CRÍTICA: Cada stack deve ser independente.** A docs page Vue DEVE renderizar TODO o conteúdo das 15 seções usando `translations.json`. NUNCA exiba mensagens como "Documentação completa disponível na stack React" ou placeholders genéricos ("Exemplo aqui.", "Estrutura de subcomponentes."). Cada projeto será usado de forma independente.

**Referência obrigatória**: Leia `design-system-vue/src/components/docs/AlertDocs.vue` inteiro antes de criar qualquer docs page. Ele é o modelo completo para Vue — use a mesma estrutura de `<script setup>` e `<template>`.

**Referência de conteúdo**: Leia a docs page React (`design-system-react/src/components/docs/<Slug>Docs.tsx`) para entender quais seções, tabelas, cards e demos existem. A versão Vue deve ter conteúdo IDÊNTICO adaptado à sintaxe Vue.

#### Setup (`<script setup>`)

```vue
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import DocsNav from '@/components/docs/shared/DocsNav.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/<slug>/translations.json';

// IMPORTANTE: locale vem de useTranslation, NUNCA de useLocaleStore ou Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

// SEO reativo
useSeoEffect(computed(() => ({
  title: `${tContent('title')} — ${tContent('category')}`,
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: '<slug>',
})));

// Analytics — page view reativo ao locale
watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: '<slug>',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// Active section tracking
const activeSection = ref('demonstracao');
function handleSectionChange(id: string) {
  activeSection.value = id;
  track('docs_section_viewed', {
    section_id: id, component_name: '<slug>',
    locale: locale.value as 'pt-BR' | 'en' | 'es',
  });
}

// Navigation groups (computed, reativo ao locale)
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

// IntersectionObserver para active section
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

// Dados reativos para tabelas, cards, etc (computed)
// Ex: variantItems, sizeItems, tokenRows, propRows, relatedItems
</script>
```

#### Template — Layout obrigatório

O `<template>` DEVE seguir este layout de duas colunas com navegação lateral sticky:

```vue
<template>
  <div class="ds-docs p-8 max-w-5xl mx-auto">
    <!-- Header (sem id — é o topo da página) -->
    <header class="mb-12 border-b pb-8 border-border/50">
      <!-- badges, LanguageSwitcher, h1, description -->
    </header>

    <!-- Layout de duas colunas: nav lateral + conteúdo -->
    <div class="flex gap-16 items-start">
      <!-- OBRIGATÓRIO: wrapper <nav> com sticky -->
      <nav
        aria-label="Navegação das seções do componente"
        class="sticky top-8 w-52 shrink-0 self-start space-y-5"
      >
        <DocsNav :groups="navGroups" :active-section="activeSection" />
      </nav>

      <!-- Conteúdo principal -->
      <div class="ds-docs flex-1 min-w-0 space-y-12">
        <section id="demonstracao">...</section>
        <!-- demais seções -->
      </div>
    </div>
  </div>
</template>
```

**Regras do layout:**
- `<nav>` com `sticky top-8` — mantém a navegação visível ao rolar a página
- `w-52 shrink-0 self-start` — largura fixa de 13rem, não encolhe, alinha ao topo
- `aria-label` — diferencia esta navegação de outras `<nav>` na página
- `flex-1 min-w-0` no conteúdo — ocupa o espaço restante, permite overflow responsivo
- **NUNCA** use `DocsNav` diretamente sem o wrapper `<nav>` com sticky — sem ele a navegação rola junto com o conteúdo

#### Seções obrigatórias (Header + 15 seções com `id`)

O conteúdo DEVE conter TODAS estas seções com conteúdo real de `translations.json`:

1. **Header** (estrutural, fora do nav) — badges (category, type), LanguageSwitcher, h1, description, install badge
2. **Demonstração** (`id="demonstracao"`) — botões/demos interativos do componente real
3. **Anatomia** (`id="anatomia"`) — lista numerada com `v-html="sanitizeHtml(tContent('anatomy.itemN'))"` + bloco de estrutura
4. **Quando Usar** (`id="quando-usar"`) — 4 blocos obrigatórios:
   - Guidelines (bg-muted/30)
   - Tabela de cenários (usage.scenarios)
   - Tabela UX Writing (uxWriting.table)
   - Cards Do/Don't (usage.do + usage.dont)
5. **Do & Don't** (`id="do-dont"`) — **layout obrigatório: dois grids separados (um por par), cada um com DO à esquerda e DON'T à direita, dentro de card wrapper**

  **ERRO COMUM**: usar `v-for="i in 2"` (ou `v-for="i in [1,2]"`) em um único grid — gera DO+DON'T empilhados na mesma coluna, resultando em DO|DO em cima e DON'T|DON'T em baixo. Isso está ERRADO.

  ```vue
  <!-- ✅ CORRETO: dois grids separados -->
  <section id="do-dont">
    <h2 class="text-xl font-semibold mb-4">{{ tContent('doDont.title') }}</h2>
    <!-- card wrapper obrigatório -->
    <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
      <div class="space-y-8 w-full">

        <!-- Pair 1: grid próprio, DO à esquerda, DON'T à direita -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-green-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.do') }}</span>
            </div>
            <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
              <!-- preview visual com componente real -->
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.do') }}</p>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-red-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.dont') }}</span>
            </div>
            <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
              <!-- preview visual -->
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.dont') }}</p>
          </div>
        </div>

        <!-- Pair 2: segundo grid separado — mesma estrutura -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- ... -->
        </div>

      </div>
    </div>
  </section>

  <!-- ❌ ERRADO: v-for gera layout invertido -->
  <!-- <div class="grid grid-cols-2"><div v-for="i in 2">DO + DON'T empilhados</div></div> -->
  ```

  - Labels via `tNav('common.do')` / `tNav('common.dont')` (de uiTranslations — acessível se `const { t: tNav } = useTranslation(uiTranslations)` estiver declarado)
  - Preview boxes contêm o componente real (`<Alert>`, etc.) ou texto semântico — nunca vazios
6. **Importação** (`id="importacao"`) — blocos de código com imports
7. **Variantes** (`id="variantes"`) — cards com título/descrição + preview real + toggle de código por variante (DocsVariants absorveu a antiga seção Exemplos)
8. **Estados** (`id="estados"`) — tabela de estados com triggers
9. **Propriedades** (`id="propriedades"`) — tabelas de props (2 se componente tem provider + API)
10. **Tokens** (`id="tokens"`) — tabela de tokens CSS + bloco de customização
11. **Acessibilidade** (`id="acessibilidade"`) — lista v-html + cards de teclado
12. **Relacionados** (`id="relacionados"`) — grid de cards com links
13. **Notas** (`id="notas"`) — callouts com dicas
14. **Analytics** (`id="analytics"`) — tabela de eventos GA4
15. **Testes** (`id="testes"`) — 3 sub-seções: funcional (tabela), acessibilidade (cards axe), visual (tabela)

#### Padrões Vue para conteúdo HTML

```vue
<!-- Texto com HTML (anatomy, guidelines, dont items) -->
<span v-html="sanitizeHtml(tContent('anatomy.item1'))" />

<!-- Loops com v-for -->
<li v-for="i in [1, 2, 3]" :key="i" v-html="sanitizeHtml(tContent(`usage.guidelines.item${i}`))" />

<!-- Dados computados em tabelas -->
<tr v-for="prop in propRows" :key="prop.name">
  <td>{{ prop.name }}</td>
</tr>

<!-- Links internos Storybook -->
@click="(window.top ?? window).location.href = item.path"
```

#### Blocos de código — NUNCA usar `<pre>`

Blocos de código (import, exemplos) devem usar `<div><code>`, **nunca** `<pre><code>`. O `<pre>` causa renderização inconsistente no Storybook.

```vue
<!-- ✅ CORRETO -->
<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code class="whitespace-pre">import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';</code>
</div>

<!-- ❌ ERRADO -->
<pre class="..."><code>...</code></pre>
```

Exceção: `<pre>` permitido apenas para diagramas ASCII (`anatomy.structureCode`). O wrapper do `<pre>` DEVE ter `overflow-x-auto`:
```vue
<div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
  <pre class="font-mono text-sm whitespace-pre">{{ tContent('anatomy.structureCode') }}</pre>
</div>
```

---

## Regras Críticas de Renderização

### Tabelas — card wrapper obrigatório

**Toda tabela deve estar dentro de um card com padding e overflow horizontal:**

```vue
<!-- ✅ CORRETO -->
<div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
  <table class="w-full text-sm">...</table>
</div>

<!-- ❌ ERRADO — overflow-hidden corta o conteúdo -->
<div class="rounded-lg border border-border overflow-hidden">
  <div class="overflow-x-auto"><table>...</table></div>
</div>
```

### Tabela de estados — nome em texto plano, não badge

A primeira coluna das tabelas de estados (`id="estados"`) usa `font-medium` simples. **Nunca** use spans com classes de badge/pill para o nome:

```vue
<!-- ✅ CORRETO -->
<td class="p-3 border-r border-border font-medium">{{ tContent('states.key.label') }}</td>

<!-- ❌ ERRADO -->
<td class="p-3 border-r border-border">
  <span class="inline-flex items-center rounded-full border px-2 py-0.5 ...">
    {{ tContent('states.key.label') }}
  </span>
</td>
```

### DocsNav.vue — `<button>` com scrollIntoView, NUNCA `<a href="#">`

O componente `DocsNav.vue` usa `<button type="button">` com `scrollIntoView`. Links `<a href="#id">` causam navegação fora do Storybook quando a docs page roda dentro de um iframe:

```vue
<!-- ✅ CORRETO — em DocsNav.vue -->
<button
  type="button"
  @click="document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })"
>{{ section.label }}</button>

<!-- ❌ ERRADO — navega o iframe para # e sai do Storybook -->
<a :href="`#${section.id}`">{{ section.label }}</a>
```

### Composições (asChild com Reka UI)

```ts
export const AsChild: Story = {
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `
      <Button v-bind="args" as-child variant="outline">
        <a href="#">Link estilizado como botão</a>
      </Button>
    `,
  }),
};
```

---

## Convenções Vue-Específicas

- Componentes UI em `src/components/ui/<slug>/`
- Barrel export em `index.ts` com `export { default as Component } from './Component.vue'`
- Props via `defineProps<Props>()` com `withDefaults`
- Pinia é inicializado no Storybook via `setup()` em preview.ts

---

## Section Components — Uso Obrigatório na Docs Page

**ANTES de escrever qualquer template inline na docs page**, verifique se os section containers genéricos existem:

```bash
ls design-system-vue/src/components/docs/shared/sections/ 2>/dev/null
```

Se existirem (`DocsDoDont.vue`, `DocsVariants.vue`, etc.), **use-os** — nunca reimplemente o HTML das seções. Se não existirem, rode `/docs-sections --stack vue` primeiro.

**Imports na docs page:**
```vue
<script setup lang="ts">
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
</script>
```

Previews visuais (DoDont, Variants, Examples, Demonstration) são passados via **slots nomeados**. Ver API completa em `docs-sections.md`.

---

## Checklist Final

- [ ] Story principal com withAutoDocsTab + play function
- [ ] Render functions usam `{ components, setup, template }` format
- [ ] Sem `argTypes.onClick` em stories que não testam clique
- [ ] Play functions usam `@click="args.onClick"` no template
- [ ] Docs page como `.vue` com Composition API
- [ ] Bridge React via `withAutoDocsTab.tsx` (com pragma `@jsxImportSource react`)
- [ ] translations.json compartilhado de `@shared/content/`
- [ ] useSeoEffect com computed reativo
- [ ] Analytics: watch(locale) para page view + IntersectionObserver para section view
- [ ] Storybook sidebar com ordem correta
- [ ] **Demonstração importa o componente real de `@/components/ui/<slug>`** (nunca HTML inline)
- [ ] **Cards de variante usam o componente real**, não divs/spans com classes manuais
- [ ] **Docs page composta APENAS por containers de `shared/sections/Docs*.vue`** + componentes de `components/ui/` — zero template inline replicando layout de seção
- [ ] **Paridade stories ↔ docs page**: cada componente mostrado em Demonstração/Variantes/Estados usa os MESMOS args da story correspondente (título, descrição, ícone, classes batem byte-a-byte)
- [ ] Fonte de verdade única escolhida (translations.json / examples.ts) e mantida em todas as seções
- [ ] **TODAS as 15 seções renderizadas com conteúdo real** (não placeholders)
- [ ] **sanitizeHtml** em todo v-html com conteúdo de translations
- [ ] **locale vem de useTranslation**, nunca de useLocaleStore ou Pinia
- [ ] **DocsNav** envolvido por `<nav>` com `sticky top-8 w-52 shrink-0 self-start` — sem isso a navegação rola junto com a página
- [ ] **LanguageSwitcher** no header
- [ ] **DocsNav** com navGroups computados
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>`
- [ ] Conteúdo visualmente idêntico ao React (mesmas tabelas, cards, demos)

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-vue): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
