---
description: Cria os 15 componentes genéricos de seção de documentação em cada stack — containers estruturais reutilizáveis que garantem layout consistente entre todas as doc pages
argument-hint: [--stack react|vue|svelte|basecoat|all]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Docs Section Components — Orquestrador

Você é o arquiteto dos componentes de documentação genéricos. Seu trabalho é criar **15 componentes de container** em cada stack — um por seção de doc page — que encapsulam a estrutura/layout de cada seção e aceitam dados via props/slots. O conteúdo específico de cada componente (Alert Dialog, Button, etc.) é injetado depois via props; os containers apenas garantem o layout correto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`--stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Por Que Componentes Genéricos?

Guidelines de texto não são suficientes para prevenir erros de layout — o bug Do & Don't (loop único gerando DO|DO em cima, DON'T|DON'T em baixo) ocorreu mesmo com guideline documentada. Quando a estrutura está em código, erros de layout se tornam impossíveis: quem usa `<DocsDoDont pairs={...} />` não pode errar o grid porque o componente já implementa os dois grids separados.

**Benefício**: dezenas de doc pages futuras vão usar esses containers — a consistência visual é garantida por construção, não por instrução.

---

## Os 15 Componentes

| # | Nome | id da seção | Tipo |
|---|------|------------|------|
| 1 | `DocsHeader` | — | Estrutural (fora do nav) |
| 2 | `DocsDemonstration` | `demonstracao` | Container + slot |
| 3 | `DocsAnatomy` | `anatomia` | Container + dados |
| 4 | `DocsWhenToUse` | `quando-usar` | Container + dados |
| 5 | `DocsDoDont` | `do-dont` | Container + slots ← crítico |
| 6 | `DocsImport` | `importacao` | Container + dados |
| 7 | `DocsVariants` | `variantes` | Container + slots (com `code` opcional por item) |
| 8 | `DocsStates` | `estados` | Container + dados |
| 9 | `DocsProps` | `propriedades` | Container + dados |
| 10 | `DocsTokens` | `tokens` | Container + dados |
| 11 | `DocsAccessibility` | `acessibilidade` | Container + dados |
| 12 | `DocsRelated` | `relacionados` | Container + dados |
| 13 | `DocsNotes` | `notas` | Container + dados |
| 14 | `DocsAnalytics` | `analytics` | Container + dados |
| 15 | `DocsTestes` | `testes` | Container + dados |

---

## Localização dos Arquivos

```
src/components/docs/shared/sections/
├── DocsHeader.<ext>
├── DocsDemonstration.<ext>
├── DocsAnatomy.<ext>
├── DocsWhenToUse.<ext>
├── DocsDoDont.<ext>
├── DocsImport.<ext>
├── DocsVariants.<ext>
├── DocsStates.<ext>
├── DocsProps.<ext>
├── DocsTokens.<ext>
├── DocsAccessibility.<ext>
├── DocsRelated.<ext>
├── DocsNotes.<ext>
├── DocsAnalytics.<ext>
└── DocsTestes.<ext>
```

Extensões: React → `.tsx`, Vue → `.vue`, Svelte → `.svelte`, Basecoat → `.ts`

---

## Passo 1 — Auditar o que já existe

```bash
for stack in react vue svelte basecoat; do
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  echo "=== $stack ==="
  ls design-system-$stack/src/components/docs/shared/sections/ 2>/dev/null \
    | sed 's/\..*//' | sort \
    || echo "  diretório não existe — criar todos os 15 componentes"
done
```

Componentes já existentes com API compatível: **manter sem alterações**.
Componentes faltantes: **criar**.
Componentes existentes mas com API incompleta: **atualizar apenas o necessário**.

---

## Passo 2 — Criar os Componentes

Leia `design-system-react/src/components/docs/AlertDocs.tsx` **antes** de criar qualquer componente — esse é o exemplo de referência de como as seções devem se parecer visualmente.

### API de Props por Componente

#### `DocsHeader`
```ts
interface DocsHeaderProps {
  title: string
  description: string        // texto puro — sem HTML
  category: string           // label do badge (ex: "Overlay")
  type: string               // label do badge (ex: "Componente")
  installNote?: string       // badge de instalação (ex: "shadcn/ui")
}
// Renderiza: badges (category, type, install), LanguageSwitcher, h1, description
// NÃO inclui section id — é o header da página, fora do scroll spy
// LanguageSwitcher é importado pelo próprio componente
```

#### `DocsDemonstration`
```ts
interface DocsDemonstrationProps {
  title: string
  // React: children: React.ReactNode
  // Vue/Svelte: slot padrão
  // Basecoat: demoFactory: () => HTMLElement
}
// Renderiza: <section id="demonstracao"> + h2 + card wrapper (ComponentDemo)
// O card wrapper: flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm
```

#### `DocsAnatomy`
```ts
interface DocsAnatomyProps {
  title: string
  items: string[]       // texto com possível HTML inline (<strong>, <code>)
  structureCode: string // diagrama ASCII — renderizado em <pre>
}
// Renderiza: <section id="anatomia"> + h2 + lista numerada + bloco <pre> do diagrama
// items são renderizados com sanitizeHtml
```

#### `DocsWhenToUse`
```ts
interface DocsWhenToUseScenario { s: string; u: string; a: string }
interface DocsWhenToUseUXRow    { element: string; do: string; dont: string }

interface DocsWhenToUseProps {
  title: string
  guidelines: { title: string; items: string[] }
  scenarios: {
    title: string
    cols: { scenario: string; use: string; alternative: string }
    items: DocsWhenToUseScenario[]
  }
  uxWriting: {
    title: string
    cols: { element: string; do: string; dont: string }
    items: DocsWhenToUseUXRow[]
  }
  do:   { title: string; items: string[] }
  dont: { title: string; items: string[] }
}
// Renderiza: <section id="quando-usar"> + 4 blocos:
// 1. guidelines (bg-muted/30), 2. tabela de cenários, 3. tabela UX writing, 4. cards Do/Don't inline
```

#### `DocsDoDont` ← CRÍTICO
```ts
interface DocsDoDontPair {
  doLabel:    string          // tNav('common.do')
  dontLabel:  string          // tNav('common.dont')
  // React: doPreview/dontPreview: React.ReactNode
  // Vue: slots nomeados #do-preview-{n} / #dont-preview-{n}
  // Svelte: snippets doPreview{n} / dontPreview{n} (Svelte 5 {#snippet})
  // Basecoat: doPreviewFactory / dontPreviewFactory: () => HTMLElement
  doCaption:   string         // texto descritivo abaixo do box verde
  dontCaption: string         // texto descritivo abaixo do box vermelho
}

interface DocsDoDontProps {
  title: string
  pairs: DocsDoDontPair[]
}
// Renderiza: <section id="do-dont"> + card wrapper (ComponentDemo) + space-y-8
//   Para CADA par: um grid grid-cols-1 md:grid-cols-2 gap-6
//     Esquerda: header verde (✓ + doLabel uppercase) + box verde (preview) + caption italic
//     Direita:  header vermelho (✗ + dontLabel uppercase) + box vermelho (preview) + caption italic
// NUNCA itera pares com um único grid — cada par tem seu próprio grid
```

#### `DocsImport`
```ts
interface DocsImportProps {
  title: string
  description?: string
  code: string          // string do import (ex: "import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'")
  secondaryCode?: string // import adicional (ex: uso da função, provider, etc.)
  secondaryDescription?: string
}
// Renderiza: <section id="importacao"> + h2 + p opcional + bloco <div><code> (NUNCA <pre>)
```

#### `DocsVariants`
```ts
interface DocsVariantItem {
  name: string
  description: string
  code?: string          // opcional: se presente, renderiza botão "Ver código" colapsável
  // React: preview: React.ReactNode
  // Vue: slot #variant-preview-{name}
  // Svelte: snippet variantPreview{index}
  // Basecoat: previewFactory: () => HTMLElement
}

interface DocsVariantsProps {
  title: string
  items: DocsVariantItem[]
}
// Renderiza: <section id="variantes"> + h2 + layout vertical (space-y-4) de cards
// Cada card: preview do componente real + nome + descrição + (opcional) botão colapsável com code block
// DocsExamples foi removido — exemplos de código são integrados aos itens de DocsVariants via campo code opcional
```

#### `DocsStates`
```ts
interface DocsStateItem {
  label:    string
  trigger:  string
  behavior: string
}

interface DocsStatesProps {
  title: string
  cols: { state: string; trigger: string; behavior: string }
  items: DocsStateItem[]
}
// Renderiza: <section id="estados"> + h2 + tabela com card wrapper
// label: font-medium (NUNCA badge/pill)
```

#### `DocsProps`
```ts
interface DocsPropItem {
  name:         string
  type:         string
  defaultValue: string
  required:     string  // 'Sim'/'Não' (ou 'Yes'/'No' para en)
  description:  string
}

interface DocsPropsProps {
  title: string
  cols: { prop: string; type: string; default: string; required: string; description: string }
  items: DocsPropItem[]
  interfaceCode?:       string  // interface TypeScript explícita
  extensibilityTitle?:  string
  extensibilityNotes?:  string  // HTML com sanitizeHtml
  // Para componentes com múltiplas APIs (ex: Sonner):
  secondaryTitle?: string
  secondaryCols?:  typeof cols
  secondaryItems?: DocsPropItem[]
}
// Renderiza: <section id="propriedades"> + h2 + tabela(s) com card wrapper + interface block
// name: font-mono font-bold text-primary
// type: font-mono text-muted-foreground
```

#### `DocsTokens`
```ts
interface DocsTokenItem {
  token:       string
  value:       string
  description: string
}

interface DocsTokensProps {
  title: string
  cols: { token: string; value: string; description: string }
  items: DocsTokenItem[]
  customizationTitle?: string
  customizationCode?:  string
}
// Renderiza: <section id="tokens"> + h2 + tabela com card wrapper + bloco de customização opcional
// token: font-mono text-primary
```

#### `DocsAccessibility`
```ts
interface DocsKeyboardItem {
  key:         string  // ex: "Tab", "Enter", "Esc"
  description: string
}

interface DocsAccessibilityProps {
  title:         string
  summary:       string  // HTML
  items:         string[]  // itens HTML (WCAG, ARIA, etc.)
  keyboardTitle: string
  keyboardItems: DocsKeyboardItem[]
}
// Renderiza: <section id="acessibilidade"> + h2 + lista com sanitizeHtml + grid de cards de teclado
```

#### `DocsRelated`
```ts
interface DocsRelatedItem {
  name:        string
  description: string
  path:        string  // rota Storybook (ex: "?path=/docs/ui-button--docs")
}

interface DocsRelatedProps {
  title: string
  items: DocsRelatedItem[]
}
// Renderiza: <section id="relacionados"> + h2 + grid de cards clicáveis
// Click: (window.top ?? window).location.href = item.path
```

#### `DocsNotes`
```ts
interface DocsNoteItem {
  title:   string
  content: string  // HTML
}

interface DocsNotesProps {
  title: string
  items: DocsNoteItem[]
}
// Renderiza: <section id="notas"> + h2 + callouts (bg-muted/30 rounded-lg border-l-4)
```

#### `DocsAnalytics`
```ts
interface DocsAnalyticsEventItem {
  event:   string
  trigger: string
  payload: string
}

interface DocsAnalyticsProps {
  title: string
  cols: { event: string; trigger: string; payload: string }
  items: DocsAnalyticsEventItem[]
}
// Renderiza: <section id="analytics"> + h2 + tabela com card wrapper
```

#### `DocsTestes`
```ts
interface DocsTestItem {
  action:   string
  result:   string
  priority: string  // "Alta" | "Média" | "Baixa"
}
interface DocsA11yTestItem {
  criterion: string
  level:     string  // "AA" | "AAA"
  how:       string
}
interface DocsVisualTestItem {
  story:    string
  priority: string
}

interface DocsTestesProps {
  title: string
  functional: {
    title: string
    cols: { action: string; result: string; priority: string }
    items: DocsTestItem[]
  }
  accessibility: {
    title: string
    cols: { criterion: string; level: string; how: string }
    items: DocsA11yTestItem[]
  }
  visual: {
    title: string
    cols: { story: string; priority: string }
    items: DocsVisualTestItem[]
  }
}
// Renderiza: <section id="testes"> + h2 + 3 sub-seções com tabelas e card wrappers
```

---

## Passo 3 — Implementação por Stack

### Regras gerais (todas as stacks)

- Todo `innerHTML` / `dangerouslySetInnerHTML` / `v-html` / `{@html}` com dado de prop **deve** passar por `sanitizeHtml`
- Blocos de código: `<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">...</code></div>` — **NUNCA `<pre>`** (exceto `structureCode` em DocsAnatomy)
- Tabelas: sempre dentro de `<div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">`
- `DocsStates` — primeira coluna: `font-medium` simples, nunca badge/pill

### React

Cada componente é uma função exportada nomeada. Importa `sanitizeHtml` de `@/lib/sanitize-html`. Usa `dangerouslySetInnerHTML={{ __html: sanitizeHtml(str) }}` para conteúdo HTML de props.

**`DocsDoDont` — implementação de referência obrigatória:**
```tsx
export function DocsDoDont({ title, pairs }: DocsDoDontProps) {
  return (
    <section id="do-dont">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
        <div className="space-y-8 w-full">
          {pairs.map((pair, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DO */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                  <span className="text-sm font-semibold uppercase tracking-wider">{pair.doLabel}</span>
                </div>
                <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                  {pair.doPreview}
                </div>
                <p className="text-sm text-muted-foreground italic px-1">{pair.doCaption}</p>
              </div>
              {/* DON'T */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                  <span className="text-sm font-semibold uppercase tracking-wider">{pair.dontLabel}</span>
                </div>
                <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                  {pair.dontPreview}
                </div>
                <p className="text-sm text-muted-foreground italic px-1">{pair.dontCaption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Vue

Cada componente é um `.vue` com `<script setup lang="ts">`. Props via `defineProps<Props>()`. Slots nomeados para previews:
- `DocsDemonstration`: `<slot />` padrão
- `DocsDoDont`: slots dinâmicos `#do-preview-0`, `#dont-preview-0`, `#do-preview-1`, `#dont-preview-1`, etc.
- `DocsVariants`: slot `#preview-{index}` por item

**`DocsDoDont` — estrutura de slots Vue:**
```vue
<template>
  <section id="do-dont">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
      <div class="space-y-8 w-full">
        <div v-for="(pair, index) in pairs" :key="index" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-green-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{{ pair.doLabel }}</span>
            </div>
            <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
              <slot :name="`do-preview-${index}`" />
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{{ pair.doCaption }}</p>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-red-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{{ pair.dontLabel }}</span>
            </div>
            <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
              <slot :name="`dont-preview-${index}`" />
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{{ pair.dontCaption }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

### Svelte 5

Cada componente usa `$props()` para props e `{#snippet}` / `{@render}` para previews (Svelte 5 runes).

**`DocsDoDont` — estrutura de snippets Svelte 5:**
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface DocsDoDontPair {
    doLabel: string; dontLabel: string; doCaption: string; dontCaption: string;
    doPreview: Snippet; dontPreview: Snippet;
  }
  const { title, pairs }: { title: string; pairs: DocsDoDontPair[] } = $props();
</script>

<section id="do-dont">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
    <div class="space-y-8 w-full">
      {#each pairs as pair, index}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-green-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{pair.doLabel}</span>
            </div>
            <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
              {@render pair.doPreview()}
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{pair.doCaption}</p>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-red-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{pair.dontLabel}</span>
            </div>
            <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
              {@render pair.dontPreview()}
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{pair.dontCaption}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
```

### Basecoat (Vanilla TS)

Cada componente é uma função `createDocs<Section>(props): HTMLElement`. Previews são factory functions `() => HTMLElement`.

**`DocsDoDont` — implementação factory:**
```ts
import { sanitizeHtml } from '@/lib/sanitize-html';

interface DocsDoDontPair {
  doLabel: string; dontLabel: string; doCaption: string; dontCaption: string;
  doPreviewFactory: () => HTMLElement;
  dontPreviewFactory: () => HTMLElement;
}

export function createDocsDoDont(props: { title: string; pairs: DocsDoDontPair[] }): HTMLElement {
  const section = document.createElement('section');
  section.id = 'do-dont';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const card = document.createElement('div');
  card.className = 'flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm';

  const inner = document.createElement('div');
  inner.className = 'space-y-8 w-full';

  for (const pair of props.pairs) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

    // DO column
    const doCol = document.createElement('div');
    doCol.className = 'space-y-3';
    doCol.innerHTML = `
      <div class="flex items-center gap-2 text-green-600">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
        <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(pair.doLabel)}</span>
      </div>`;
    const doBox = document.createElement('div');
    doBox.className = 'border border-green-200 rounded-xl p-6 bg-green-50/50';
    doBox.appendChild(pair.doPreviewFactory());
    const doCaption = document.createElement('p');
    doCaption.className = 'text-sm text-muted-foreground italic px-1';
    doCaption.textContent = pair.doCaption;
    doCol.append(doBox, doCaption);

    // DON'T column
    const dontCol = document.createElement('div');
    dontCol.className = 'space-y-3';
    dontCol.innerHTML = `
      <div class="flex items-center gap-2 text-red-600">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
        <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(pair.dontLabel)}</span>
      </div>`;
    const dontBox = document.createElement('div');
    dontBox.className = 'border border-red-200 rounded-xl p-6 bg-red-50/50';
    dontBox.appendChild(pair.dontPreviewFactory());
    const dontCaption = document.createElement('p');
    dontCaption.className = 'text-sm text-muted-foreground italic px-1';
    dontCaption.textContent = pair.dontCaption;
    dontCol.append(dontBox, dontCaption);

    grid.append(doCol, dontCol);
    inner.appendChild(grid);
  }

  card.appendChild(inner);
  section.append(h2, card);
  return section;
}
```

---

## Passo 4 — Quality: Verificar os Componentes Criados

```bash
SECTIONS="DocsHeader DocsDemonstration DocsAnatomy DocsWhenToUse DocsDoDont DocsImport DocsVariants DocsStates DocsProps DocsTokens DocsAccessibility DocsRelated DocsNotes DocsAnalytics DocsTestes"

for stack in react vue svelte basecoat; do
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  dir="design-system-$stack/src/components/docs/shared/sections"
  echo "=== $stack ==="
  missing=0
  for s in $SECTIONS; do
    f="$dir/$s.$ext"
    [ -f "$f" ] && echo "  ✅ $s" || { echo "  ❌ MISSING: $s"; missing=$((missing+1)); }
  done
  echo "  Faltando: $missing/15"
done
```

---

## Passo 5 — Security: Verificar sanitizeHtml

```bash
for stack in react vue svelte basecoat; do
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  dir="design-system-$stack/src/components/docs/shared/sections"
  echo "=== $stack ==="
  grep -rn "dangerouslySetInnerHTML\|v-html\|{@html\|\.innerHTML" "$dir" 2>/dev/null \
    | grep -v "sanitizeHtml" \
    && echo "  ❌ HTML dinâmico sem sanitizeHtml!" \
    || echo "  ✅ Tudo sanitizado"
done
```

---

## Passo 6 — Cross-Stack: Consistência dos Containers

```bash
echo "=== IDs de seção por stack ==="
SECTION_IDS="demonstracao anatomia quando-usar do-dont importacao variantes estados propriedades tokens acessibilidade relacionados notas analytics testes"
for id in $SECTION_IDS; do
  echo "--- id=$id ---"
  for stack in react vue svelte basecoat; do
    ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
    dir="design-system-$stack/src/components/docs/shared/sections"
    grep -rl "id=\"$id\"" "$dir" 2>/dev/null \
      && echo "  ✅ $stack" || echo "  ❌ $stack: id=$id ausente"
  done
done

echo "=== DocsDoDont: sem loop de pares ==="
for stack in react vue svelte basecoat; do
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/shared/sections/DocsDoDont.$ext"
  grep -n "v-for.*in 2\|#each \[1.*2\]\|\[1.*2\]\.map" "$file" 2>/dev/null \
    && echo "  ❌ $stack: loop fixo detectado — ERRO!" || echo "  ✅ $stack: sem loop fixo"
done
```

---

## Como os Dev Skills Usam Esses Componentes

Após a criação dos containers, as skills `dev-react`, `dev-vue`, `dev-svelte` e `dev-basecoat` **devem importar os section components** ao criar docs pages, em vez de escrever o HTML inline:

```tsx
// AlertDialogDocs.tsx — DEPOIS da criação dos containers
import { DocsDoDont }       from '@/components/docs/shared/sections/DocsDoDont';
import { DocsVariants }     from '@/components/docs/shared/sections/DocsVariants';
import { DocsProps }        from '@/components/docs/shared/sections/DocsProps';
// ...

<DocsDoDont
  title={t('doDont.title')}
  pairs={[
    {
      doLabel:      tNav('common.do'),
      dontLabel:    tNav('common.dont'),
      doPreview:    <Alert variant="default"><AlertTitle>{t('doDont.pair1.doTitle')}</AlertTitle><AlertDescription>{t('doDont.pair1.doDesc')}</AlertDescription></Alert>,
      dontPreview:  <Alert variant="destructive"><AlertTitle>{t('doDont.pair1.dontTitle')}</AlertTitle></Alert>,
      doCaption:    t('doDont.pair1.do'),
      dontCaption:  t('doDont.pair1.dont'),
    },
    // pair 2...
  ]}
/>
```

---

## Saída Esperada

```
## Docs Section Components — criação

### Componentes por stack
| Componente        | React | Vue | Svelte | Basecoat |
|-------------------|-------|-----|--------|----------|
| DocsHeader        | ✅    | ✅  | ✅     | ✅       |
| DocsDemonstration | ✅    | ✅  | ✅     | ✅       |
| DocsAnatomy       | ✅    | ✅  | ✅     | ✅       |
| DocsWhenToUse     | ✅    | ✅  | ✅     | ✅       |
| DocsDoDont        | ✅    | ✅  | ✅     | ✅       |
| ...               |       |     |        |          |

### Security
| Stack    | HTML não sanitizado | Status |
|----------|---------------------|--------|
| react    | 0                   | ✅     |

### Cross-stack
| Check                      | Status |
|----------------------------|--------|
| Todos os 16 ids presentes  | ✅/❌  |
| DocsDoDont sem loop fixo   | ✅/❌  |
| Props API consistente      | ✅/❌  |

### Score: X/16 componentes por stack
```

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(docs-sections): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
