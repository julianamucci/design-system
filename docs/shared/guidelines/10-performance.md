# 10 — Performance: Carregamento Rápido e Renderização Eficiente

Este arquivo define as regras de performance para o design system. O objetivo é garantir que componentes e docs pages carreguem rapidamente tanto no ambiente de desenvolvimento (Storybook) quanto em produção (quando consumidos por produtos).

---

## Princípios

**Menos bytes, mais rápido** — cada kilobyte importa. Bundle size é custo direto de performance para todo produto que consome o design system.

**Carregue sob demanda** — se o usuário não precisa agora, não carregue agora. Lazy loading é o padrão, eager loading é a exceção justificada.

**Meça antes de otimizar** — não otimize por instinto. Use as ferramentas de medição listadas abaixo para identificar gargalos reais.

---

## Métricas-Alvo

| Métrica | Alvo | Ferramenta |
|---------|------|------------|
| Largest Contentful Paint (LCP) | ≤2.5s | Lighthouse |
| First Input Delay (FID) | ≤100ms | Web Vitals |
| Cumulative Layout Shift (CLS) | ≤0.1 | Lighthouse |
| Bundle size por componente | ≤15KB gzipped | `vite-plugin-visualizer` |
| Storybook cold start | ≤8s | Manual (dev mode) |
| Storybook story load | ≤500ms | Manual (navegação entre stories) |

---

## 1. Bundle Size

### Tree-shaking obrigatório

Todo componente deve ser importável individualmente:

```tsx
// CORRETO — importa apenas o Button
import { Button } from '@/components/ui/button';

// INCORRETO — importa todos os componentes
import { Button, Dialog, Input, Select } from '@/components/ui';
```

Para garantir tree-shaking:
- Cada componente em sua própria pasta com barrel `index.ts`
- Sem side-effects nos módulos (`"sideEffects": false` no package.json)
- Não re-exportar tudo de um barrel `components/ui/index.ts` geral

### Dependências pesadas

| Dependência | Tamanho | Regra |
|-------------|---------|-------|
| `lucide-react/vue/svelte` | ~200B por ícone | Importar ícones individualmente, nunca `import * from 'lucide-*'` |
| `class-variance-authority` | ~1.5KB | OK — essencial para variantes |
| `clsx` / `tailwind-merge` | ~1KB | OK — usado em `cn()` |
| `zod` | ~14KB | Importar apenas esquemas necessários |
| `pinia` / `zustand` | ~1-2KB | OK — state management essencial |

### Análise de bundle

```bash
# React
npx vite-bundle-visualizer

# Todas as stacks — verificar tamanho do build Storybook
npm run build-storybook && du -sh storybook-static/
```

---

## 2. Renderização

### Evitar re-renders desnecessários

**React:**
```tsx
// INCORRETO — cria nova função a cada render
<Button onClick={() => handleClick(id)}>

// CORRETO — useCallback estabiliza a referência
const handleClick = useCallback(() => { ... }, [id]);
<Button onClick={handleClick}>
```

```tsx
// INCORRETO — objeto novo a cada render força re-render do filho
<Component style={{ color: 'red' }}>

// CORRETO — objeto estável
const style = useMemo(() => ({ color: 'red' }), []);
<Component style={style}>
```

**Vue:**
```vue
<!-- CORRETO — computed é cacheado -->
<script setup>
const buttonClass = computed(() => cn(base, props.variant));
</script>

<!-- INCORRETO — recalcula a cada render -->
<template>
  <button :class="cn(base, variant)">
</template>
```

**Svelte:**
```svelte
<!-- CORRETO — $derived é cacheado -->
<script>
  let buttonClass = $derived(cn(base, variant));
</script>

<!-- Svelte 5 é eficiente por padrão com fine-grained reactivity -->
```

### IntersectionObserver

Usado em docs pages para `docs_section_viewed`. Regras:
- Criar UMA instância de observer, não uma por seção
- `rootMargin` e `threshold` otimizados (`-20% 0px -70% 0px`, threshold `0`)
- Disconnect no cleanup (`useEffect` return / `onUnmount`)

---

## 3. Carregamento

### Lazy Loading de Docs Pages

Docs pages são pesadas (traduções, analytics, SEO, componentes demo). DEVEM ser lazy-loaded:

**React:**
```tsx
// CORRETO
const AlertDocs = React.lazy(() => import('./components/docs/AlertDocs'));

// No Storybook — withAutoDocsTab já faz isso internamente
```

**Storybook:**
O Storybook gerencia code-splitting nativamente — cada story é um chunk separado. Não precisa de configuração manual.

### Imagens e Ícones

- Ícones SVG inline (lucide) — já otimizados, sem lazy loading necessário
- Imagens em docs pages — usar `loading="lazy"` e `width`/`height` explícitos:

```html
<img src="anatomy.png" alt="Anatomia do botão" width="600" height="400" loading="lazy" />
```

### Fontes

- Fontes do sistema (`font-family: system-ui`) — sem download necessário
- Se fontes custom forem adicionadas — usar `font-display: swap` e preload:

```html
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin />
```

---

## 4. CSS

### Tailwind CSS 4

O Tailwind 4 (via `@tailwindcss/vite`) faz tree-shaking automático — apenas classes usadas são incluídas no bundle. Regras adicionais:

- **Não gere classes dinamicamente** — o Tailwind scanner precisa encontrar classes completas no código:

```tsx
// INCORRETO — Tailwind não detecta
const color = `text-${variant}-foreground`;

// CORRETO — classe completa visível
const colors: Record<string, string> = {
  default: 'text-primary-foreground',
  destructive: 'text-destructive-foreground',
};
```

- **Evite `@apply` em componentes** — `@apply` duplica CSS. Use classes Tailwind diretamente.
- **`storybook-docs.css`** — use seletores específicos (`.ds-docs .text-primary`), nunca wildcards (`[class*="text-"]`).

### Critical CSS

No Storybook, o CSS é injetado inline pelo Vite — não há necessidade de critical CSS manual. Para produção, o consumidor do design system gerencia o critical CSS.

---

## 5. JavaScript

### Evitar computações pesadas no render

```tsx
// INCORRETO — filtra/ordena a cada render
function Component({ items }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map(item => <Item key={item.id} {...item} />);
}

// CORRETO — memoriza
function Component({ items }) {
  const sorted = useMemo(() =>
    [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  return sorted.map(item => <Item key={item.id} {...item} />);
}
```

### Debounce em event handlers frequentes

```tsx
// Para resize, scroll, input — debounce de 150-300ms
const handleResize = useMemo(
  () => debounce(() => { /* ... */ }, 200),
  []
);
```

### Web Workers

Para operações pesadas (parsing de JSON grande, validação complexa com Zod), considere Web Workers. Não é necessário para a maioria dos componentes do design system.

---

## 6. Storybook-Específico

### Story Isolation

Cada story deve ser independente — sem estado compartilhado entre stories. Isso permite que o Storybook carregue cada story isoladamente.

### Addon Performance

Addons ativos afetam o tempo de carregamento:

| Addon | Impacto | Ação |
|-------|---------|------|
| `@storybook/addon-docs` | Médio (~200ms) | Necessário — manter |
| `@storybook/addon-a11y` | Baixo (~50ms) | Necessário — manter |
| `@storybook/addon-themes` | Baixo (~30ms) | Necessário — manter |
| `@storybook/addon-vitest` | Médio (~150ms) | Necessário — manter |
| `@storybook/addon-onboarding` | Baixo (~20ms) | Remover após setup inicial |

### Preview-head.html

Scripts em `preview-head.html` bloqueiam o carregamento:
- GA4 script — usa `async` (não bloqueia)
- Theme sync script — deve ser inline e mínimo (apenas lê URL params e aplica classes)

---

## Checklist de Performance

### Componentes

- [ ] Importações individuais (tree-shakeable)
- [ ] Sem dependências pesadas desnecessárias
- [ ] `useCallback` / `useMemo` em handlers e objetos derivados (React)
- [ ] `computed` para valores derivados (Vue)
- [ ] Classes Tailwind completas (não construídas dinamicamente)
- [ ] Sem `@apply` em componentes

### Docs Pages

- [ ] Lazy-loaded (ou delegado ao Storybook code-splitting)
- [ ] IntersectionObserver com instância única e cleanup
- [ ] Imagens com `loading="lazy"` e dimensões explícitas
- [ ] Translations JSON importado estaticamente (não fetched)

### Build

- [ ] `npm run build-storybook` completa em ≤60s
- [ ] Bundle total do Storybook ≤10MB (gzipped)
- [ ] Nenhum warning de chunk size no build

---

## Ferramentas de Medição

```bash
# Tamanho do build Storybook
npm run build-storybook && du -sh storybook-static/

# Análise visual do bundle
npx vite-bundle-visualizer

# Lighthouse no Storybook deployado
npx lighthouse https://url-do-storybook --only-categories=performance

# Web Vitals no browser
# Performance tab do DevTools → Experience section
```
