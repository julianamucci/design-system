# 08 — Docs Pages e Foundations: Padrões e Obrigações

Consulte **antes** de criar ou editar qualquer página de documentação. Este guia cobre obrigações de produto (i18n, analytics, SEO) e armadilhas técnicas (bridge MDX, CSS vars, bullet points, Svelte/Lucide compat).

---

## 0. Checklist obrigatório — toda docs page

Antes de considerar uma docs page completa, os seguintes itens **devem** estar presentes:

| Item | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| `LanguageSwitcher` no header | `<LanguageSwitcher />` | `<LanguageSwitcher />` | `<LanguageSwitcher />` | `createLanguageSwitcher()` inline |
| Tradução via `useTranslation` | `useTranslation(translations)` | `useTranslation(translations)` | `useTranslation(translations)` | `createTranslation(translations)` |
| `translations.json` em `@shared/content/{slug}/` | obrigatório | obrigatório | obrigatório | obrigatório |
| SEO reativo ao locale | `useSeoEffect({...locale})` | `useSeoEffect(computed(...))` | `$effect(() => applySeo({...$locale}))` | `subscribe(() => applySeo(...))` |
| Analytics `docs_page_view` | `useEffect(() => track(...), [locale])` | `track(...)` on mount | `$effect(() => track(...))` | `subscribe(() => track(...))` |
| Nav lateral sticky (`<nav class="nds-docs-nav">`) | `<nav>` wrapper | `<nav>` wrapper | `<nav>` inline | `sidebar.className = 'nds-docs-nav'` |
| Layout duas colunas (`.nds-docs-layout` / cluster com `items-start`) | obrigatório | obrigatório | obrigatório | obrigatório |
| **`min-w-0` no conteúdo principal** (`nds-flex-1 nds-min-w-0` + `nds-stack`) | obrigatório | obrigatório | obrigatório | obrigatório |
| Dark mode via classe de tema no `<html>` | sim | sim | sim | sim |
| Componentes da própria biblioteca | `Badge`, `Input`, etc. | idem | badges inline (sem componentes Svelte externos no bridge) | DOM manual com classes `.nds-*` |
| `nds-list-none nds-p-0 nds-m-0` em `<ul>` + `nds-list-none` em `<li>` | obrigatório | obrigatório | obrigatório | obrigatório |
| Blocos de código: `<div><code>`, **nunca** `<pre><code>` | `<div className="nds-code-block"><code className="nds-whitespace-pre">` | idem (sem `className`) | idem (sem `className`) | idem (template string) |

### MCP (Model Context Protocol)

O addon `@storybook/addon-mcp` + `features: { componentsManifest: true }` no `main.ts` expõem a documentação dos componentes para agentes de IA via MCP. O manifest gerado (`/manifests/components.json`) inclui:

- **Props** extraídas via docgen (React: `reactDocgen`, Vue: `reactDocgenTypescript`)
- **Stories** com code snippets e IDs
- **Subcomponents** com imports e props
- **Docs entries** de arquivos `.mdx` unattached

O conteúdo renderizado das docs pages (`*Docs.tsx/vue/svelte/ts`) **não** é indexado pelo manifest — ele captura apenas metadados estáticos (props, stories, imports). Para que o conteúdo textual do `translations.json` seja acessível via MCP, crie `.mdx` files unattached ou use `parameters.docs.description` nas stories.

**Regra:** toda stack deve ter `@storybook/addon-mcp` nos addons e `componentsManifest: true` nas features do `main.ts`.

### Conteúdo compartilhado entre stacks

O texto de todas as docs pages deve residir em `docs/shared/content/{slug}/translations.json` com as três línguas (`pt-BR`, `en`, `es`). Os 4 frameworks importam via alias `@shared/content/{slug}/translations.json`.

Partes específicas de framework (package name, sintaxe de import, exemplos de código) ficam hardcoded no componente — não entram nas translations.

---

---

## 1. Montar componentes de framework em MDX (unattached pages)

`@storybook/addon-docs` renderiza MDX usando **React**. Importar um componente de outro framework diretamente no MDX e usá-lo como JSX **não funciona**.

### O que acontece

| Stack | Erro ao fazer `<MeuComponente />` no MDX |
|---|---|
| React | Funciona nativamente — addon-docs é React |
| Vue | `Element type is invalid: expected a string… but got: object` |
| Svelte | `TypeError: node.remove is not a function` em `remove_effect_dom` |
| Vanilla (Vanilla TS) | Retorna `HTMLElement`, não elemento React — `ExpressionStatement` no indexer |

### Solução: bridge React com `useEffect`

Para qualquer stack não-React, montar o componente imperativamento dentro de um wrapper React:

**Vue 3**
```mdx
import { createElement, useEffect, useRef } from 'react';
import { createApp } from 'vue';
import MeuComponente from './MeuComponente.vue';

export function DocsPage() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const app = createApp(MeuComponente);
    app.mount(ref.current);
    return () => {
      try { app.unmount(); } catch {}
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);
  return createElement('div', { ref, style: { flex: 1, height: '100%' } });
}

<DocsPage />
```

**Svelte 5**
```mdx
import { createElement, useEffect, useRef } from 'react';
import { mount, unmount } from 'svelte';
import MeuComponente from './MeuComponente.svelte';

export function DocsPage() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const app = mount(MeuComponente, { target: ref.current });
    return () => {
      try { unmount(app); } catch {}
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);
  return createElement('div', { ref, style: { flex: 1, height: '100%' } });
}

<DocsPage />
```

**Vanilla (Vanilla TS)**
```mdx
import { createElement, useEffect, useRef } from 'react';
import { createMinhaDocsPage } from './MinhaDocsPage';

export function DocsPage() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = createMinhaDocsPage();
    ref.current.appendChild(el);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, []);
  return createElement('div', { ref, style: { flex: 1, height: '100%' } });
}

<DocsPage />
```

> `createElement` (não JSX) mantém o wrapper mínimo e evita parser JSX no MDX.

---

## 2. CSS vars de tema não resolvem dentro do bridge

Dentro do bridge `useEffect`, o DOM node criado pelo `ref` existe fora do contexto de estilo normal do Storybook. Algumas variáveis CSS de tema (`--foreground`, `--background`, `--border`, etc.) **podem não resolver corretamente**.

### Sintomas
- Tooltip com texto invisível (`bg-foreground text-background` → mesma cor)
- Bordas ou backgrounds ausentes em elementos internos

### Regra
Em elementos que precisam de contraste **garantido** (tooltips, badges de feedback, overlays), use cores explícitas (valor literal) em vez de variáveis semânticas:

```tsx
// ❌ Depende de CSS var — pode falhar no bridge
className="nds-bg-foreground nds-text-background"

// ✅ Explícito — funciona em qualquer contexto
style={{ background: '#171717', color: '#ffffff' }}
```

Para o restante do componente (fundo de card, bordas, texto de conteúdo), as variáveis semânticas geralmente funcionam porque o Storybook injeta o tema globalmente.

---

## 3. Tabelas: zerar margin-block e padrão de card

### 3.1 margin-block injetada pelo Storybook

O Storybook injeta `margin-block` (ou `margin-top`/`margin-bottom`) em elementos `<table>` via suas folhas CSS. O arquivo `storybook-docs.css` já contém o reset global dentro de `.ds-docs`:

```css
.ds-docs table {
  margin: 0;
}
```

**Não adicione `mt-*` ou `mb-*` direto na `<table>` para compensar o gap** — o reset CSS cobre todos os casos.

### 3.2 Padrão único para tabelas de documentação

Toda tabela de documentação deve estar dentro de **uma única div** com `border rounded-xl overflow-x-auto p-4 shadow-sm`. Não use dois wrappers aninhados, nem `overflow-hidden` sem padding.

```html
<!-- ✅ CORRETO: uma div, p-4 mínimo, overflow-x-auto para responsividade -->
<div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
  <table class="w-full border-collapse text-sm">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>

<!-- ❌ ERRADO: dois wrappers aninhados acumulam espaçamento -->
<ComponentDemo>
  <div class="overflow-x-auto">
    <table>...</table>
  </div>
</ComponentDemo>

<!-- ❌ ERRADO: overflow-hidden sem padding = borda colada na tabela -->
<div class="border rounded-xl overflow-hidden shadow-sm">
  <table>...</table>
</div>

<!-- ❌ ERRADO: sem nenhum padding no wrapper -->
<div class="border rounded-xl overflow-x-auto shadow-sm">
  <table>...</table>
</div>
```

> **`ComponentDemo`** é exclusivo para demonstrações interativas de componentes de UI (ex: mostrar um `<Alert>` funcionando). **Nunca** use `ComponentDemo` para envolver tabelas de dados — as tabelas não são demos, são conteúdo de documentação.

### 3.3 Herança de font-size em células

O `text-sm` é definido **apenas no `<table>`**. As células `<td>` e `<th>` **herdam** esse tamanho — nunca aplique `text-xs` ou qualquer classe de font-size explícita em `<td>`. Use apenas classes de formatação (`font-mono`, `font-bold`, `text-primary`, `text-muted-foreground`, etc.).

```html
<!-- ✅ CORRETO: cells herdam text-sm do table -->
<table class="w-full border-collapse text-sm">
  <tr>
    <td class="p-3 font-mono font-bold text-primary">variant</td>
    <td class="p-3 font-mono text-muted-foreground">"default" | "outline"</td>
    <td class="p-3 text-muted-foreground">Descrição da prop</td>
  </tr>
</table>

<!-- ❌ ERRADO: text-xs no td duplica/conflita com herança -->
<table class="w-full border-collapse text-sm">
  <tr>
    <td class="p-3 text-xs font-mono">variant</td>
  </tr>
</table>
```

### 3.4 Padding padrão de containers em docs pages

**`p-4` é o padding padrão de todos os containers de conteúdo em docs pages.** Aplica-se a: Card wrappers de shared sections (DocsAccessibility, DocsWhenToUse, DocsDoDont, DocsVariants, DocsStates, DocsProps, DocsTokens, DocsAnalytics, DocsTestes), preview boxes (Do/Don't), e qualquer `<div>` com `border + rounded + background`. Não use `p-3` (insuficiente), nem `p-5`/`p-6`/`p-10` (cria inconsistência entre seções).

```html
<!-- ✅ p-4 padrão -->
<div class="bg-muted/10 rounded-lg border border-border/40 p-4">...</div>
<div class="bg-card border rounded-xl p-4 shadow-sm">...</div>

<!-- ❌ p-3 insuficiente -->
<div class="bg-muted/10 rounded-lg border p-3">...</div>

<!-- ❌ p-6/p-10 fora do padrão -->
<Card class="p-6 space-y-4">...</Card>
<Card class="p-10 mt-6">...</Card>
```

**Exceções válidas** (continuam válidas em `p-4`):
- **Células de tabela** (`<th>`, `<td>`): usam `p-3` — padding de célula é independente do padding de container.
- **Cards de showcase com `overflow-hidden`**: padding vai nas sub-seções do card, não no wrapper.

Aplica-se a todas as stacks: React, Vue, Svelte e Vanilla.

---

## 4. `<ul>` / `<li>` exigem reset explícito

O CSS `.nds-*` não aplica um reset global de lista no contexto de bridge (e alguns stacks não têm reset de forma alguma). Sem reset, `<ul>` renderiza com `list-style: disc` e margin/padding padrão do browser, quebrando grids de ícones e listas de itens.

### Regra obrigatória em qualquer docs page

```html
<!-- ❌ Sem reset — aparece com bullet points -->
<ul class="nds-grid" data-spacing="xs">
  <li>...</li>
</ul>

<!-- ✅ Reset explícito -->
<ul class="nds-grid nds-list-none nds-p-0 nds-m-0" data-spacing="xs">
  <li class="nds-list-none">...</li>
</ul>
```

Aplica-se a todas as stacks: React, Vue, Svelte e Vanilla.

---

## 5. Detectar componentes de ícone Lucide via `typeof`

Cada pacote Lucide exporta ícones com tipos diferentes dependendo da versão:

| Pacote | `typeof` do export |
|---|---|
| `lucide-react` | `'object'` (ForwardRefExoticComponent) |
| `lucide-vue-next` | `'function'` (defineComponent retorna função) |
| `lucide-svelte` | não usar — Svelte 4, incompatível com Svelte 5 runtime |
| `lucide` (vanilla) | objeto com `[tag, attrs][]` — usar `icons` export |

### Filtro robusto (React e Vue)

```ts
const ALL_ICON_NAMES = Object.keys(LucideIcons).filter((name) => {
  const value = (LucideIcons as Record<string, unknown>)[name];
  const type = typeof value;
  return (
    (type === 'function' || type === 'object') &&
    value !== null &&
    /^[A-Z]/.test(name) &&    // apenas nomes PascalCase
    !name.endsWith('Icon')    // exclui aliases *Icon duplicados
  );
});
```

Nunca use apenas `typeof === 'function'` ou apenas `typeof === 'object'` — o tipo muda entre versões do pacote.

---

## 6. Svelte 5: não usar `lucide-svelte` em páginas de docs

`lucide-svelte` compila ícones como **Svelte 4** (usa `$props`, `<slot>`, Options API). O runtime Svelte 5 chama `.remove()` em objetos internos do Svelte 4 durante cleanup de efeitos, causando:

```
TypeError: node.remove is not a function
    at remove_effect_dom (effects.js:578)
    at destroy_effect (effects.js:522)
```

### Solução: usar o pacote `lucide` (vanilla)

```ts
import { icons } from 'lucide';
// icons: Record<string, [tag: string, attrs: Record<string, string>][]>
```

Renderizar com `{@html}` para evitar efeitos aninhados dentro de `{#each}`:

```svelte
<script>
  import { icons } from 'lucide';

  const ICON_SVG: Record<string, string> = {};
  for (const [name, data] of Object.entries(icons)) {
    ICON_SVG[name] = data
      .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k,v]) => `${k}="${v}"`).join(' ')}/>`)
      .join('');
  }
</script>

<!-- ✅ {@html} = sem effects aninhados dentro do {#each} -->
{#each Object.keys(icons) as name}
  <svg ...>{@html ICON_SVG[name]}</svg>
{/each}
```

### Regras anti-efeito dentro de `{#each}` longo

Em listas com centenas de itens, cada `{#if}` e `{#each}` aninhado cria um `branch effect`. Com ~1900 ícones, isso gera milhares de efeitos que travam o teardown do HMR.

```svelte
<!-- ❌ Cria branch effects por item — quebra HMR com 1900+ itens -->
{#each nomes as name}
  {#if copiado === name}
    <Check />
  {:else}
    <svg>{#each iconData as [tag, attrs]}<svelte:element .../>{/each}</svg>
  {/if}
{/each}

<!-- ✅ CSS opacity — zero branch effects -->
{#each nomes as name}
  {@const isCopied = copiado === name}
  <svg class:opacity-0={!isCopied}><!-- check --></svg>
  <svg class:opacity-0={isCopied}>{@html ICON_SVG[name]}</svg>
{/each}
```

---

## 7. Tooltip dentro de `<button>`: usar `overflow-visible`

Alguns browsers aplicam `overflow: hidden` implicitamente em `<button>`. Um tooltip com `position: absolute` e `top: -2rem` pode ser clipado e ficar invisível.

```tsx
// ✅ Garante que o tooltip não seja clipado
<button className="... relative group overflow-visible">
  ...
  <span className="absolute -top-8 ... group-hover:opacity-100">
    Tooltip
  </span>
</button>
```

---

## 8. Padrão obrigatório para a seção "Anatomia"

A seção `id="anatomia"` deve conter **dois blocos** dentro do mesmo card:

### 7.1 Lista numerada de partes

Cada item vem da chave `anatomy.item{N}` do `translations.json`. Os itens podem conter HTML inline (`<strong>`, `<code>`, `<em>`) mas **nunca** tags HTML cruas dentro de `<code>` — use entidades:

```json
// ✅ Correto — entidades HTML
"item1": "<strong>Container</strong> — o elemento <code>&lt;button&gt;</code> nativo"

// ❌ Errado — <button> será renderizado como elemento real no DOM
"item1": "<strong>Container</strong> — o elemento <code><button></code> nativo"
```

### 7.2 Bloco "Estrutura básica"

Imediatamente abaixo da lista, um `<pre>` mostrando a estrutura pseudocode do componente. As chaves obrigatórias em `translations.json`:

```json
"anatomy": {
  "item1": "...",
  "item2": "...",
  "item3": "...",
  "structureLabel": "Estrutura básica:",
  "structureCode": "&lt;ComponentName&gt;    <span class=\"text-muted-foreground\">{/* Container */}</span>\n  &lt;Icon /&gt;          <span class=\"text-muted-foreground\">{/* Ícone (opcional) */}</span>\n  Label              <span class=\"text-muted-foreground\">{/* Texto */}</span>\n&lt;/ComponentName&gt;"
}
```

Regras de `structureCode`:
- Usar `&lt;` / `&gt;` para os delimitadores JSX (nunca `<` / `>` crus)
- Comentários em `<span class="text-muted-foreground">` — passam pelo `DOMPurify.sanitize`
- Quebras de linha com `\n` (JSON string)
- Localizar os comentários (`{/* Texto */}` → `{/* Text */}` em inglês)

### 7.3 Renderização — consuma o container, não reimplemente

A docs page **não escreve esse markup**. Ela passa o conteúdo para o container genérico `DocsAnatomy` da própria stack (`src/components/docs/shared/sections/`), que recebe `title`, `items`, `structureCode` e `structureLabel`.

Reimplementar a seção inline é o que faz as 4 stacks divergirem: cada uma acaba com uma árvore de elementos e um conjunto de classes diferente para o mesmo conteúdo.

**Referência de markup: a stack Vanilla** (`DocsAnatomy.ts`) — ela não tem lib headless nem templating escondendo a estrutura, então é onde se lê o que o design system realmente define:

```
section#anatomia
└── h2.nds-section-title
└── ComponentDemo
    └── div.nds-stack[data-spacing="md"].nds-w-full
        ├── ol.nds-stack[data-spacing="sm"].nds-text-body.nds-list-none
        │   └── li.nds-row[data-spacing="sm"][data-align="start"].nds-list-none
        │       ├── span.nds-pill[data-tone="primary"]  → número
        │       └── span                                 → item sanitizado
        └── Card.nds-p-4.nds-bg-muted-soft.nds-border-soft.nds-shadow-none.nds-overflow-x
            ├── p.nds-text-caption.nds-text-muted-foreground.nds-mb-2  → structureLabel
            └── pre.nds-font-mono.nds-text-body.nds-whitespace-pre     → structureCode
```

As outras stacks reproduzem essa árvore e essas classes; só a sintaxe de templating muda.

---

## 9. Padrão obrigatório para a seção "Testes"

Toda docs page deve incluir uma seção `id="testes"` com **três sub-seções**, geradas a partir das chaves correspondentes em `translations.json`.

### 7.1 Sub-seções obrigatórias

| Sub-seção | Chave raiz | O que contém |
|-----------|-----------|--------------|
| Comportamento Funcional | `testes.functional` | Tabela: ação → resultado → prioridade |
| Acessibilidade Verificável | `testes.accessibility` | Cards com itens axe-core/WCAG |
| Regressão Visual | `testes.visual` | Tabela: story → light → dark → prioridade |

### 7.2 Estrutura de `testes` no `translations.json`

```json
"testes": {
  "title": "...",
  "functional": {
    "title": "...",
    "description": "...",
    "item1": { "action": "...", "result": "...", "priority": "high" },
    "item2": { "action": "...", "result": "...", "priority": "medium" }
  },
  "accessibility": {
    "title": "...",
    "description": "...",
    "item1": "...",
    "item2": "..."
  },
  "visual": {
    "title": "...",
    "description": "...",
    "required": "✓ Obrigatório",
    "item1": { "story": "...", "priority": "high" },
    "item2": { "story": "...", "priority": "medium" }
  }
}
```

**Regra de prioridade**: usar `"high"` ou `"medium"` como string literal (não localizado). A renderização compara com `=== 'high'` e busca `tNav("common.high")` / `tNav("common.medium")` para exibição — garantindo consistência entre stacks.

### 7.3 Iteração dinâmica

Itere sobre `item1`…`itemN` dinamicamente (não hardcode o array). Exemplo em React:

```tsx
{([1, 2, 3, 4, 5, 6] as const).map((i) => {
  const p = tContent(`testes.functional.item${i}.priority`);
  return (
    <tr key={i}>
      <td>{tContent(`testes.functional.item${i}.action`)}</td>
      <td>{tContent(`testes.functional.item${i}.result`)}</td>
      <td><Badge ...>{p === 'high' ? tNav('common.high') : tNav('common.medium')}</Badge></td>
    </tr>
  );
})}
```

Consulte o `AlertDocs` da **stack Vanilla** (`nortear-design-system-vanilla/src/components/docs/AlertDocs.ts`) como implementação de referência completa — nele a estrutura e as classes `.nds-*` aparecem sem templating de framework no meio. O `AlertDocs` da sua própria stack serve de referência para a sintaxe.

---

## 10. Stub obrigatório para páginas unattached com MDX

Toda página unattached MDX (`Foundations/*`) precisa de um arquivo `.stories.*` stub para evitar erros de lint em projetos que exigem `default export` em arquivos `*.stories.*`:

```ts
// icons.stories.ts
export default {
  title: '_internal/foundations-icons-legacy',
  tags: ['!dev', '!autodocs', '!test'],
};
```

Os `tags` excluem o stub do sidebar, do autodocs e da suite de testes.


---

## 11. Padrão obrigatório para cards da seção "Variantes"

### 11.1 Cards de variante visual

Os cards de variante exibem **2 linhas de informação** no rodapé:

1. Nome da variante — `text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1`
2. Descrição — `text-xs text-muted-foreground leading-relaxed`

```tsx
<div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
  <p className="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
    {label}
  </p>
  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
</div>
```

### 11.2 Cards de tamanho

Os cards da "Escala de Tamanhos" devem exibir **3 linhas de informação** no rodapé:

1. Nome do tamanho — `text-[11px] uppercase font-mono text-primary font-bold block`
2. Dimensão e descrição curta — `text-xs text-muted-foreground` (ex: "36px · Padrão")
3. **Referência de uso** — `text-xs text-muted-foreground/70 italic` (ex: "Formulários e ações primárias em geral")

### Chaves obrigatórias em `translations.json`

Para cada tamanho, duas chaves: `{key}` (dimensão) e `{key}Use` (contexto de uso):

```json
"sizes": {
  "sm":          "32px · Compacto",
  "smUse":       "Tabelas, toolbars e ações inline",
  "default":     "36px · Padrão",
  "defaultUse":  "Formulários e ações primárias em geral",
  "lg":          "40px · Destaque",
  "lgUse":       "CTAs de destaque e landing pages",
  "icon":        "Ajuste quadrado",
  "iconUse":     "Ações icon-only em toolbars"
}
```

> **Seção desatualizada — não implementar como está.** A terceira linha (`{key}Use`)
> não existe: nenhum `translations.json` do repo define `smUse`/`defaultUse`/etc., e
> nenhuma docs page consome essas chaves. Os cards de tamanho hoje passam por
> `DocsVariants` com `{ name, description, preview }` — duas linhas, não três.
>
> Decidir na revisão do Button se a "referência de uso" volta (aí como campo do
> container, nas 4 stacks) ou se esta seção sai da guideline. Até lá, a fonte de
> verdade é o container `DocsVariants` da stack Vanilla.

### 11.3 Cards de tipo (componentes sem cva)

Componentes que não usam `cva()` mas expõem tipos via API (ex: Sonner com `toast.success()`, `toast.error()`, etc.) usam o mesmo padrão visual dos cards de variante (§11.1), mas a área de preview exibe uma demonstração do tipo em vez de renderizar o componente com uma prop `variant`.

Chaves em `translations.json`:
```json
"variants": {
  "typesTitle": "Tipos Disponíveis",
  "items": {
    "default": "Notificação neutra para feedback geral.",
    "success": "Confirmação de ação concluída com sucesso.",
    "error": "Erro ou falha em uma operação."
  }
}
```

A área de preview chama a API do componente programaticamente (ex: `toast.success('Mensagem')`) em vez de passar uma prop.

### 11.4 Cards de posição

Componentes com opções de posicionamento (ex: Sonner) podem ter uma subseção de posições com cards no mesmo padrão de tamanho (§11.2 — 3 linhas: nome, descrição, uso). Chaves: `variants.positions.{key}` (descrição) e `variants.positions.{key}Use` (contexto de uso).

---

## 12. Tabela de Propriedades (seção "Propriedades")

A tabela de props deve ter **5 colunas** e cobrir **todas as props** do componente, incluindo props HTML nativas que o componente aceita explicitamente.

### Colunas obrigatórias

| Coluna | Chave de tradução | Notas |
|--------|------------------|-------|
| Prop | `props.table.prop` | `font-mono font-bold text-primary` (herda `text-sm` do `<table>`) |
| Tipo | `props.table.type` | `font-mono text-muted-foreground` — tipo explícito (nunca `VariantProps<...>`). Herda `text-sm` do `<table>` |
| Padrão | `props.table.default` | `font-mono` (herda `text-sm` do `<table>`) |
| Obrigatório | `props.table.required` | `text-muted-foreground`. Valor hardcoded `'Não'` / `'No'` / `'No'` conforme locale |
| Descrição | `props.table.description` | `text-muted-foreground` (herda `text-sm` do `<table>`) |

### Interface TypeScript obrigatória

Exibir sempre a interface **explícita** (não abreviada via `VariantProps`), em bloco `<div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">`:

```tsx
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}
```

### Props mínimas a documentar (Alert)

`variant`, `className` / `class`, `role` (sempre `"alert"`), composição via subcomponentes (`AlertTitle`, `AlertDescription`)

### Bloco de extensibilidade obrigatório

Após a tabela, adicionar bloco com notas sobre `className`/`class` e `asChild` (quando suportado), usando `dangerouslySetInnerHTML`/`v-html`/`{@html}`/`.innerHTML` + `DOMPurify.sanitize`. Chaves: `props.extensibilityTitle`, `props.extensibility.classNameNote`, `props.extensibility.asChildNote`.

### Componentes com múltiplas superfícies de API

Alguns componentes (ex: Sonner) expõem duas APIs distintas: um **provider** (montado uma vez) e uma **função imperativa** (chamada em qualquer componente). Nesses casos:

1. Usar um subtítulo `<h3>` para cada tabela: `props.toasterTitle` e `props.toastTitle`
2. Cada tabela segue o mesmo padrão de 5 colunas (`text-sm` no `<table>`, cells herdam)
3. As chaves ficam em namespaces separados: `props.table.*` (provider) e `props.toastTable.*` (per-call)
4. A interface TypeScript exibe ambas as interfaces em blocos separados
5. Duas seções de import: `import.basic` (provider) e `import.usage` (função)

---

## 13. Tabela de Design Tokens (seção "Tokens")

A tabela de tokens deve ter **5 colunas** e cobrir **todos os tokens CSS** usados pelo componente.

### Colunas obrigatórias

| Coluna | Chave de tradução | Notas |
|--------|------------------|-------|
| Token CSS | `tokens.table.token` | `nds-font-mono nds-text-primary nds-font-medium`, envolvido em `<code>` (herda o tamanho do `<table>`) |
| Classe `.nds-*` | `tokens.table.class` | `nds-font-mono nds-text-primary`, envolvido em `<code>` (herda o tamanho do `<table>`) |
| Parte do componente | `tokens.table.part` | `nds-text-muted-foreground` (herda o tamanho do `<table>`) |

> **Valores HSL não pertencem aqui.** Os valores por tema (light/dark HSL) serão documentados na seção de Temas do design system. A tabela de tokens da docs page de componente lista apenas quais tokens o componente **usa** e para qual parte visual.

### Tokens mínimos a documentar (Alert)

`--background`, `--foreground`, `--card`, `--card-foreground`, `--destructive`, `--border`, `--radius`

### Bloco de customização obrigatório

Após a tabela, adicionar bloco com exemplo de override via CSS variables. Chave: `tokens.customizationTitle`. Usar bloco `<div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">`:

```css
/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --primary: 262 80% 58%; /* Roxo — light mode */
  --primary-foreground: 0 0% 100%;
}
html.meu-tema.dark {
  --primary: 262 60% 75%; /* Roxo — dark mode */
  --primary-foreground: 0 0% 100%;
}
```

### Wrapper da seção Tokens

```html
<div class="space-y-6">
  <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
    <table style="margin:0"> ... </table>
  </div>
  <div class="space-y-2"> <!-- bloco customização --> </div>
</div>
```

## 14. Foundation pages — padrões do renderer genérico

Toda foundation page usa o renderer genérico da stack (`FoundationPage.tsx` / `FoundationsRenderer.vue` / `FoundationPage.svelte`+`FoundationSection.svelte` / `foundationsRenderer.ts`). As 4 stacks produzem a MESMA estrutura:

**Shell**: root `sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs` → container `nds-p-8 nds-stack nds-max-w-docs nds-mx-auto` com `data-spacing="xl"`.

**Header**: `header.nds-stack.nds-pb-8` contendo:
1. `div.nds-cluster.nds-w-full` (`data-spacing="sm" data-align="center"`) com Badge categoria (`nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium`), Badge tipo (`nds-text-muted-foreground nds-font-normal`) e `LanguageSwitcher` envolvido em `nds-spacer-start` (empurra para a direita).
2. `h1.nds-text-h1.nds-text-foreground` (sem `nds-font-bold`/`nds-tracking-tight`/`nds-m-0` — redundantes).
3. `p.nds-text-muted-foreground.nds-leading-relaxed.nds-max-w-prose`.

**LanguageSwitcher**: `nds-lang-switcher` + 3 `button.nds-lang-switcher-button` com `data-locale`, `aria-label`, `aria-pressed`. Sem ícone, sem ToggleGroup.

**Seções**: `section.nds-stack.nds-docs-section-divider` com `data-spacing="md"` (não `lg`). Título `h2.nds-text-h2.nds-text-foreground`. Chaves `body`/`audience` de topo → parágrafos simples `nds-text-body nds-leading-relaxed` (sem rótulo de chave, sem cor extra).

**Items de seção**:
- Itens objeto → grid `nds-grid` `data-cols="2" data-fixed data-spacing="md"` de componente **Card**: `CardHeader > CardTitle as="h3" + CardDescription` (title-like: `title|name|label`; body-like: `body|description|usage|use|text`); campos extras em `CardContent` (`nds-text-caption nds-text-muted-foreground`).
- Itens string → `ul.nds-stack.nds-list-none` `data-spacing="md"` com `li.nds-text-body.nds-leading-relaxed.nds-accent-start`.

**Tabelas** — forma canônica ÚNICA no translations.json:

```json
"minhaTabela": {
  "title": "…", "subtitle": "…",
  "cols": { "context": "Contexto", "duration": "Duração" },
  "rows": {
    "hover":  { "context": "Hover em primitivos", "duration": "120ms" },
    "toggle": { "context": "Toggle de estado",    "duration": "120ms" }
  }
}
```

`cols` = objeto `{ chave: rótulo }`; `rows` = objeto `{ id: { <chave da coluna>: valor } }` — cada célula mapeada pela CHAVE da coluna, nunca por posição. O componente `Table` é renderizado direto, sem wrapper com borda.

**PROIBIDO gerar `rows` como array (posicional)** — `rows: [["a","b"], …]` ou `rows: { "0": ["a","b"] }`. A forma posicional quebrou os renderers Svelte/Vanilla três vezes (squash em célula única, texto solto com vírgulas); todas as tabelas existentes foram normalizadas para a forma canônica em 2026-07. Os renderers ainda toleram arrays por segurança, mas conteúdo novo deve usar SOMENTE a forma por chave.
