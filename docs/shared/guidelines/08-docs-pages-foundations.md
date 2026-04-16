# 08 — Docs Pages e Foundations: Padrões e Obrigações

Consulte **antes** de criar ou editar qualquer página de documentação. Este guia cobre obrigações de produto (i18n, analytics, SEO) e armadilhas técnicas (bridge MDX, CSS vars, bullet points, Svelte/Lucide compat).

---

## 0. Checklist obrigatório — toda docs page

Antes de considerar uma docs page completa, os seguintes itens **devem** estar presentes:

| Item | React | Vue | Svelte | Basecoat |
|---|---|---|---|---|
| `LanguageSwitcher` no header | `<LanguageSwitcher />` | `<LanguageSwitcher />` | `<LanguageSwitcher />` | `createLanguageSwitcher()` inline |
| Tradução via `useTranslation` | `useTranslation(translations)` | `useTranslation(translations)` | `useTranslation(translations)` | `createTranslation(translations)` |
| `translations.json` em `@shared/content/{slug}/` | obrigatório | obrigatório | obrigatório | obrigatório |
| SEO reativo ao locale | `useSeoEffect({...locale})` | `useSeoEffect(computed(...))` | `$effect(() => applySeo({...$locale}))` | `subscribe(() => applySeo(...))` |
| Analytics `docs_page_view` | `useEffect(() => track(...), [locale])` | `track(...)` on mount | `$effect(() => track(...))` | `subscribe(() => track(...))` |
| Dark mode via Tailwind `dark:` | sim | sim | sim | sim |
| Componentes da própria biblioteca | `Badge`, `Input`, etc. | idem | badges inline (sem componentes Svelte externos no bridge) | DOM manual com classes Tailwind |
| `list-none p-0 m-0` em `<ul>` + `list-none` em `<li>` | obrigatório | obrigatório | obrigatório | obrigatório |

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
| Basecoat (Vanilla TS) | Retorna `HTMLElement`, não elemento React — `ExpressionStatement` no indexer |

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

**Basecoat (Vanilla TS)**
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
Em elementos que precisam de contraste **garantido** (tooltips, badges de feedback, overlays), use cores Tailwind explícitas em vez de variáveis semânticas:

```tsx
// ❌ Depende de CSS var — pode falhar no bridge
className="bg-foreground text-background"

// ✅ Explícito — funciona em qualquer contexto
className="bg-neutral-900 text-white"
```

Para o restante do componente (fundo de card, bordas, texto de conteúdo), as variáveis semânticas geralmente funcionam porque o Storybook injeta o tema globalmente.

---

## 3. `<ul>` / `<li>` exigem reset explícito

O Storybook não injeta o preflight do Tailwind no contexto de bridge (e alguns stacks não têm preflight de forma alguma). Sem reset, `<ul>` renderiza com `list-style: disc` e margin/padding padrão do browser, quebrando grids de ícones e listas de itens.

### Regra obrigatória em qualquer docs page

```html
<!-- ❌ Sem reset — aparece com bullet points -->
<ul class="grid gap-1">
  <li>...</li>
</ul>

<!-- ✅ Reset explícito -->
<ul class="grid gap-1 list-none p-0 m-0">
  <li class="list-none">...</li>
</ul>
```

Aplica-se a todas as stacks: React, Vue, Svelte e Basecoat.

---

## 4. Detectar componentes de ícone Lucide via `typeof`

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

## 5. Svelte 5: não usar `lucide-svelte` em páginas de docs

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

## 6. Tooltip dentro de `<button>`: usar `overflow-visible`

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

## 7. Stub obrigatório para páginas unattached com MDX

Toda página unattached MDX (`Foundations/*`) precisa de um arquivo `.stories.*` stub para evitar erros de lint em projetos que exigem `default export` em arquivos `*.stories.*`:

```ts
// icons.stories.ts
export default {
  title: '_internal/foundations-icons-legacy',
  tags: ['!dev', '!autodocs', '!test'],
};
```

Os `tags` excluem o stub do sidebar, do autodocs e da suite de testes.
