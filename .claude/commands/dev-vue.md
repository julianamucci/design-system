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

## Leituras obrigatórias — leia em paralelo antes de criar qualquer arquivo

Dispare estas 2 leituras no mesmo turno:

1. `design-system-vue/src/components/ui/<slug>/index.ts` (ou `<slug>.vue`) — o componente a documentar
2. `docs/shared/content/<slug>/translations.json` — todo o conteúdo vem daqui

Se precisar de referência de padrão específico (estrutura de docs page, play function, seção específica), consulte `design-system-vue/src/components/docs/AlertDocs.vue` pontualmente — não leia upfront.

---

## Regra Central — Sempre use componentes reais

**Stories e docs pages NUNCA recriam variantes com HTML inline ou classes Tailwind manuais.** Importe e use o componente de `@/components/ui/<slug>`:

```vue
<!-- ✅ CORRETO -->
<script setup>
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
</script>
<template>
  <Alert variant="destructive">
    <AlertTitle>Erro ao salvar</AlertTitle>
    <AlertDescription>Verifique sua conexão.</AlertDescription>
  </Alert>
</template>

<!-- ❌ ERRADO -->
<div class="bg-destructive/10 text-destructive border rounded-md px-4 py-2">Erro ao salvar</div>
```

---

## Stack Técnica

- **Vue 3** + TypeScript (Composition API)
- **Storybook 10** (`@storybook/vue3-vite`)
- **Tailwind CSS 4** + **Reka UI** (primitivos de acessibilidade)
- **class-variance-authority** + **lucide-vue-next** (ícones)
- **i18n via `useTranslation`** — **NUNCA** use `useLocaleStore` ou Pinia para locale

> `locale` vem sempre de `useTranslation()`. Pinia existe no projeto mas não gerencia idioma.

---

## Regras Anti-Boilerplate

- Apenas `<slug>.stories.ts` (story principal) carrega `tags: ['autodocs']`. Sub-stories nunca.
- Docs page injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` apenas no arquivo principal.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`.
- Categorias de sub-story dependem da categoria do componente — overlays de confirmação não têm `-variantes` nem `-tamanhos`.

---

## Tokenização de Dimensões

**Proibido usar classes hardcoded** de altura/size em componentes UI, stories e docs pages:

- ❌ `h-8`, `h-9`, `h-10`, `size-6`, `size-8`
- ✅ `h-(--height-default)`, `h-(--height-sm)`, `h-(--height-lg)`, `size-(--size-default)`

Exceções aceitas: `px-*`/`gap-*`/`py-*` (spacing interno), `[&_svg]:size-4` (ícones decorativos), `min-h-16` (Textarea). Tabela completa em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

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

### NÃO use `argTypes: { onClick: { action: 'clicked' } }` sem play function

O `argTypes.onClick` com `action` injeta um handler nos args que causa `[object Object]` no canvas quando passado via `v-bind="args"`. Use apenas em stories que testam clique E combine com `args: { onClick: fn() }`.

```ts
// ✅ stories de variantes/tamanhos (sem teste de clique)
const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
  args: { variant: 'default', disabled: false },
} satisfies Meta<typeof Button>;

// ✅ stories com play function que testam clique
const meta = {
  title: 'UI/Button/Estados',
  component: Button,
  args: { variant: 'default', onClick: fn() },
  argTypes: { onClick: { action: 'clicked' } },
} satisfies Meta<typeof Button>;
```

### withAutoDocsTab — Bridge React

Docs pages Vue são componentes `.vue` mas `parameters.docs.page` sempre espera React. O `withAutoDocsTab.tsx` faz o bridge com pragma `@jsxImportSource react` obrigatória:

```ts
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import AlertDocs from '@/components/docs/AlertDocs.vue';

parameters: {
  docs: { page: withAutoDocsTab(AlertDocs) },
},
```

---

## Paridade Stories ↔ Docs Page

**O componente renderizado em cada preview da docs page deve usar os mesmos props da story correspondente.** Use `translations.json` como fonte única:

```ts
// story e docs page consomem a mesma chave
tContent('demonstration.examples.destructive.title')
tContent('demonstration.examples.destructive.description')
```

Se houver divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story. Presets em `<slug>.examples.ts` são uma alternativa válida quando o conteúdo é estável e não precisa de tradução.

---

## Play Functions

```ts
import { fn, userEvent, within, expect } from 'storybook/test';

export const Playground: Story = {
  args: { onClick: fn() },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args" @click="args.onClick">Botão</Button>',
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByRole('button');

    await step('clique dispara callback', async () => {
      await userEvent.click(el);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};
```

- Step descriptions em português
- `fn()` nos args para callbacks testáveis
- `userEvent` para interações (não `fireEvent`)
- `pointerEventsCheck: 0` ao clicar em elemento disabled

---

## Artefatos a Criar

| Arquivo | Conteúdo |
|---------|----------|
| `<slug>.stories.ts` | Playground + `tags: ['autodocs']` + `withAutoDocsTab` + play functions |
| `<slug>-variantes.stories.ts` | Uma story por variante |
| `<slug>-tamanhos.stories.ts` | Uma story por tamanho (se aplicável) |
| `<slug>-estados.stories.ts` | Disabled, Loading, Error — com play functions |
| `<slug>-composicoes.stories.ts` | Com ícone, asChild, em formulário etc. |
| `<Slug>Docs.vue` | Docs page completa com todas as 15 seções |

---

## Imports e Hooks Obrigatórios na Docs Page

```vue
<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/<slug>/translations.json';

// Section containers (todos os 15)
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
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

// IMPORTANTE: locale vem de useTranslation, NUNCA de useLocaleStore ou Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

// SEO reativo ao locale
useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: '<slug>',
})));

// Analytics — page view reativo ao locale
watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: '<slug>',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: tContent('seo.title'),
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

// navGroups é computed, reativo ao locale — copie a estrutura de AlertDocs.vue:
// 4 grupos (overview, techRef, context, quality) com os IDs das 14 seções
// mapeados para as chaves nav.* de uiTranslations.
const navGroups = computed(() => { /* ver AlertDocs.vue */ });
</script>
```

Use `DocsPageLayout` para o layout de duas colunas com sidebar sticky — não monte `flex gap-16` manualmente. Passe `navGroups`, `activeSection` e `componentSlug` como props.

Previews visuais (DoDont, Variants, Demonstration) são passados via **slots nomeados**.

---

## Section Containers — Use Sempre

**Nunca escreva template inline replicando layout de seção.** A docs page é composta exclusivamente por section containers + componentes reais de `@/components/ui/`.

Verifique os containers disponíveis com `Glob` em `design-system-vue/src/components/docs/shared/sections/`. Se não existirem, rode `/docs-sections --stack vue` primeiro.

### Do & Don't — bug comum

`DocsDoDont` recebe pares de previews via slots. **Nunca** use `v-for="i in 2"` em um único grid — produz DO|DO em cima e DON'T|DON'T em baixo. O container já monta dois grids separados corretamente.

---

## Docs Page — Seções Obrigatórias (15)

Toda docs page deve renderizar TODAS estas seções com conteúdo real de `translations.json`. **Nunca** use placeholders como "Exemplo aqui." ou "Documentação completa disponível na stack React":

1. Header — badges (category, type), `<LanguageSwitcher />`, h1, description
2. Demonstração (`id="demonstracao"`) — demos interativos com componente real
3. Anatomia (`id="anatomia"`) — lista numerada + bloco de estrutura
4. Quando Usar (`id="quando-usar"`) — 4 blocos: guidelines, cenários, UX Writing, Do/Don't cards
5. Do & Don't (`id="do-dont"`) — via `DocsDoDont` com previews reais
6. Importação (`id="importacao"`) — blocos de código
7. Variantes (`id="variantes"`) — cards com preview + toggle de código
8. Estados (`id="estados"`) — tabela de estados
9. Propriedades (`id="propriedades"`) — tabelas de props completas
10. Tokens (`id="tokens"`) — tabela de tokens CSS + customização
11. Acessibilidade (`id="acessibilidade"`) — lista + cards de teclado
12. Relacionados (`id="relacionados"`) — grid de cards com links
13. Notas (`id="notas"`) — callouts
14. Analytics (`id="analytics"`) — tabela de eventos GA4
15. Testes (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

---

## Regras Críticas de Renderização

### Blocos de código — nunca `<pre>`

```vue
<!-- ✅ CORRETO -->
<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code class="whitespace-pre">import { Alert } from '@/components/ui/alert';</code>
</div>

<!-- ❌ ERRADO -->
<pre class="..."><code>...</code></pre>
```

Exceção: diagramas ASCII (`anatomy.structureCode`) podem usar `<pre>` dentro de `<div class="... overflow-x-auto">`.

### Tabelas — wrapper obrigatório

```vue
<!-- ✅ card com p-4 e overflow-x-auto -->
<div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
  <table class="w-full text-sm">...</table>
</div>
```

Primeira coluna da tabela de estados: `font-medium` simples, nunca badge/pill.

### Padrões Vue para conteúdo HTML

```vue
<!-- Texto com HTML (anatomy, guidelines) -->
<span v-html="sanitizeHtml(tContent('anatomy.item1'))" />

<!-- Loops com v-for -->
<li v-for="i in [1, 2, 3]" :key="i" v-html="sanitizeHtml(tContent(`usage.guidelines.item${i}`))" />

<!-- Links internos Storybook -->
@click="(window.top ?? window).location.href = item.path"
```

### Badges

```vue
<!-- Header -->
<Badge variant="secondary" class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
  {{ tContent('category') }}
</Badge>

<!-- Prioridade em testes -->
<Badge :class="tContent(`testes.functional.item${i}.priority`) === 'high'
  ? 'rounded-md bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 font-medium text-[11px]'
  : 'rounded-md bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 font-medium text-[11px]'">
  {{ tContent(`testes.functional.item${i}.priority`) === 'high' ? tNav('common.high') : tNav('common.medium') }}
</Badge>
```

---

## Checklist Final

Itens Vue-específicos fáceis de esquecer:

- [ ] `min-w-0` no container de conteúdo — sem ele tabelas e code blocks transbordam
- [ ] `sanitizeHtml()` em todo `v-html` com conteúdo de translations
- [ ] `useSeoEffect` recebe `computed()` reativo ao locale
- [ ] `watch(locale, ..., { immediate: true })` para `docs_page_view`
- [ ] `locale` vem de `useTranslation()`, nunca de Pinia
- [ ] Render functions usam `{ components, setup, template }` format
- [ ] Sem `argTypes.onClick` em stories que não testam clique
- [ ] Bridge `withAutoDocsTab` com pragma `@jsxImportSource react`
- [ ] `<LanguageSwitcher />` presente no header da docs page
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>`
- [ ] Todas as 15 seções com conteúdo real (sem placeholders)
- [ ] Nenhum `console.log` ou `TODO` nos arquivos entregues

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-vue): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
