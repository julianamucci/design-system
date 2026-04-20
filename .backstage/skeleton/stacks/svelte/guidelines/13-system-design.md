# System Design — Arquitetura de Software (Svelte)

## Visão Geral

- **Storybook** — interface principal de documentação (porta 6006)
- **Sandbox** (`App.svelte`) — desenvolvimento isolado
- **Frontend-only** — sem backend, deployável em CDN estático

---

## Stack Tecnológica

```
Browser
├── Svelte 5 (UI Framework)
│   ├── Runes: $state, $props, $derived, $effect
│   └── Fragmentos nativos (sem wrapper obrigatório)
├── Tailwind CSS 4.0 (Styling)
│   ├── Design Tokens (CSS Variables)
│   └── Utility Classes
├── Bits UI (Primitivos Acessíveis)
│   ├── Dialog, Dropdown, Select, etc.
│   └── WAI-ARIA Compliance
├── lucide-svelte (Ícones)
├── Superforms + Zod (Formulários)
└── svelte-sonner (Toasts)
```

---

## Gerenciamento de Estado

### Estado Global

- **i18n**: store reativo em `$lib/i18n.ts` — usa `$state` em módulo (`.svelte.ts`)
- **Tema**: toolbar do Storybook — não via estado no App

```ts
// src/lib/i18n.svelte.ts
let currentLocale = $state<'pt-BR' | 'en' | 'es'>('pt-BR');

export function useTranslation(slug: string) {
  return (key: string) => translations[currentLocale]?.[key] ?? key;
}
```

### Estado Local (Runes)

```svelte
<script lang="ts">
  let aberto = $state(false);
  let valor = $state('');
  let valorDobrado = $derived(Number(valor) * 2);

  $effect(() => {
    document.title = aberto ? 'Dialog aberto' : 'App';
    return () => { document.title = 'App'; }; // cleanup
  });
</script>
```

---

## Padrões de Composição

```svelte
<!-- ✅ CORRETO: Composição de componentes -->
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>

<!-- ❌ EVITAR: Componente monolítico com muitas props -->
<Card title="Título" content="..." footer={...} />
```

---

## Navegação

A navegação entre componentes é gerenciada pela **sidebar do Storybook** (`storySort`).

```ts
// ✅ CORRETO — título da story define a hierarquia
export default {
  title: 'UI/Button',
} satisfies Meta<typeof Button>;

// ❌ EVITAR — registrar no App.svelte para fins de documentação
```

---

## Performance

### Lazy loading de docs pages

```svelte
<script lang="ts">
  let DocsPage: any = $state(null);
  $effect(() => {
    import('./docs/ButtonDocs.svelte').then(m => { DocsPage = m.default; });
    return () => { DocsPage = null; };
  });
</script>

{#if DocsPage}
  <svelte:component this={DocsPage} />
{:else}
  <div class="animate-pulse bg-muted rounded h-96" aria-busy="true" aria-label="Carregando..." />
{/if}
```

**Storybook**: code splitting gerenciado nativamente pelo Vite — não configurar manualmente.

### CSS-in-CSS (Tailwind + CSS Variables)

```ts
// ✅ Mudança de tema sem re-render
document.documentElement.classList.add('dark');
// CSS recalcula cores automaticamente — zero re-render Svelte
```

---

## Anti-Patterns Evitados

### Não usar Options API (Svelte 4)

```svelte
<!-- ❌ EVITAR — Svelte 4 syntax -->
<script lang="ts">
  export let label: string;
  $: doubled = label.length * 2;
</script>

<!-- ✅ CORRETO — Svelte 5 runes -->
<script lang="ts">
  let { label }: { label: string } = $props();
  let doubled = $derived(label.length * 2);
</script>
```

### Não usar `$effect` para estado derivado

```svelte
<!-- ❌ ANTI-PATTERN — $effect para estado derivado -->
<script lang="ts">
  let count = $state(0);
  let doubled = $state(0);
  $effect(() => { doubled = count * 2; });
</script>

<!-- ✅ CORRETO — $derived -->
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

---

## Decisões Técnicas

| Decisão | Escolha | Razão |
|---------|---------|-------|
| Docs interface | Storybook 10 | Stories + docs integrados, a11y, Chromatic |
| Framework | Svelte 5 | Runes = reatividade sem boilerplate |
| Styling | Tailwind CSS 4.0 | Performance, DX |
| State (i18n) | $state em módulo | Leve, sem boilerplate |
| State (tema) | Storybook toolbar | Persistido via `globals` na URL |
| Forms | Superforms + Zod | TypeScript end-to-end |
| Icons | lucide-svelte | Leve, tree-shakeable |
| Components | Bits UI + shadcn-svelte | Acessibilidade, customização |
| Visual regression | Chromatic | Integrado ao Storybook |
| A11y | axe-playwright | Testes em browser real |

---

## Segurança

### XSS

```svelte
<!-- ✅ SEGURO — Svelte escapa automaticamente -->
<div>{inputDoUsuario}</div>

<!-- ❌ PERIGOSO — não usar com dados externos -->
{@html inputDoUsuario}

<!-- ✅ OK — com sanitização obrigatória -->
{@html sanitizeHtml(inputMarkdown)}
```

---

## Adicionar Novos Componentes

**Complexidade**: O(1) — criar os arquivos, o Storybook registra automaticamente.

```
1. src/lib/components/docs/NovoComponenteDocs.svelte  ← docs page (14 seções)
2. src/lib/components/docs/content/{slug}/translations.json
3. src/lib/components/ui/novo-componente.stories.ts   ← story principal + Playground
4. src/lib/components/ui/novo-componente-{variantes,tamanhos,estados,composicoes}.stories.ts
5. Verificar no Storybook: npm run storybook
```
