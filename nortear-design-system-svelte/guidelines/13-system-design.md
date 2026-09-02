# System Design — Arquitetura de Software (Svelte)

## Visão Geral

- **Storybook** — a única interface, e onde a documentação vive (porta 6008)
- **Frontend-only** — sem backend, deployável em CDN estático

---

## Stack Tecnológica

```
Browser
├── Svelte 5 (UI Framework)
│   ├── Runes: $state, $props, $derived, $effect
│   └── Fragmentos nativos (sem wrapper obrigatório)
├── CSS standalone .nds-* (Styling)
│   ├── Design Tokens (CSS Variables)
│   └── Classes .nds-*
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
```

Não existe outra porta de entrada: um componente sem story é um componente inalcançável.

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
  <div class="nds-stack" data-spacing="md" role="status" aria-busy="true" aria-label="Carregando...">
    <div class="nds-skeleton" data-shape="heading" data-width="1-2"></div>
    <div class="nds-skeleton" data-shape="text" data-width="full"></div>
    <div class="nds-skeleton" data-shape="text" data-width="3-4"></div>
  </div>
{/if}
```

**Storybook**: code splitting gerenciado nativamente pelo Vite — não configurar manualmente.

### CSS-in-CSS (.nds-* + CSS Variables)

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
| Styling | CSS standalone .nds-* | Performance, DX |
| State (i18n) | $state em módulo | Leve, sem boilerplate |
| State (tema) | Storybook toolbar | Persistido via `globals` na URL |
| Forms | Superforms + Zod | TypeScript end-to-end |
| Icons | lucide-svelte | Leve, tree-shakeable |
| Components | Bits UI | Acessibilidade, customização |
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

<!-- ✅ OK — DOMPurify importado e chamado no próprio arquivo -->
{@html DOMPurify.sanitize(inputMarkdown)}
```

A chamada fica no call site, sem helper local intermediário — um wrapper
esconde o sanitizador das ferramentas de SAST. Ver `../../docs/shared/guidelines/09-seguranca-xss.md`.

---

## Adicionar Novos Componentes

**Complexidade**: O(1) — criar os arquivos, o Storybook registra automaticamente.

```
1. src/components/docs/NovoComponenteDocs.svelte      ← docs page (15 seções)
2. docs/shared/content/{slug}/translations.json       ← conteúdo compartilhado pelas stacks
3. src/components/ui/{slug}/{slug}.stories.ts         ← story principal + Playground
4. src/components/ui/{slug}/{slug}-{variants,sizes,states,compositions}.stories.ts
5. Verificar no Storybook: npm run storybook
```
