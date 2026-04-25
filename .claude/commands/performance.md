---
description: Especialista em Performance — audita bundle size, renderização e carregamento de componentes e docs pages
argument-hint: <component-slug|all> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em Performance

Você é um especialista em performance frontend para design systems. Seu trabalho é auditar e otimizar o carregamento e renderização de componentes e docs pages.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente ou `all` para auditoria completa
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Auditoria: O que Verificar

Dispare todos os `Grep` do mesmo check em paralelo no mesmo turno.

### 1. Imports Pesados

Use `Grep` nativo em paralelo nas 4 stacks:

- **Wildcard de ícones** (cada ícone ~200B, lib inteira ~200KB) — padrão `import \*.*from 'lucide-` em `design-system-<stack>/src/`
- **Barrel imports** que puxam toda a lib UI — padrão `from '@/components/ui'` (sem subpath) em arquivos `.tsx`/`.ts`/`.vue`/`.svelte` dentro de `src/components/docs/`
- **Re-exports wildcard** que quebram tree-shaking — padrão `export \*` em `design-system-<stack>/src/components/ui/index.ts`

### 2. Renderização Desnecessária

**React — objetos inline em componentes UI** (não docs pages — lá são intencionais):
- `Grep` padrão `style=\{\{` em `design-system-react/src/components/ui/`

**Vue — `cn()` chamado diretamente no template** (recalcula a cada render, deveria ser `computed`):
- `Grep` padrão `:class="cn\(` em `design-system-vue/src/components/ui/`

### 3. Classes Tailwind Dinâmicas (quebram purge/tree-shaking CSS)

Use `Grep` em paralelo nas 4 stacks para template literals construindo classes:
- Padrão `` `text-\${ `` em `design-system-<stack>/src/`
- Padrão `` `bg-\${ `` em `design-system-<stack>/src/`
- Padrão `` `border-\${ `` em `design-system-<stack>/src/`

Cada ocorrência deve usar um mapa de classes completas:
```tsx
// ERRADO — Tailwind não detecta a classe em build time
<div className={`bg-${color}`}>

// CERTO — detectável pelo scanner de Tailwind
const bgColors = { primary: 'bg-primary', secondary: 'bg-secondary' } as const;
<div className={bgColors[color]}>
```

### 4. IntersectionObserver

`Grep` padrão `IntersectionObserver` em `design-system-<stack>/src/` para cada stack no escopo.

Para cada uso encontrado:
- [ ] `disconnect()` chamado no cleanup (React: retorno do `useEffect`; Svelte: retorno do `$effect`; Vue: `onUnmounted`)?
- [ ] Instância única por página, não uma por elemento observado?
- [ ] `threshold` e `rootMargin` definidos explicitamente?

### 5. @apply em CSS (duplica propriedades no output)

`Grep` padrão `@apply` em `design-system-<stack>/src/` (arquivos `.css`).

Cada `@apply` copia as propriedades CSS no lugar de referenciar a classe utilitária — preferir classes inline no template.

---

## Métricas-Alvo

| Métrica | Alvo |
|---------|------|
| Bundle por componente | ≤15KB gzip |
| Storybook build total | ≤10MB gzip |
| Story load time | ≤500ms |
| LCP (docs page) | ≤2.5s |
| CLS | ≤0.1 |

---

## Correções Comuns

### Importar ícones individualmente

```tsx
// ANTES (puxa lib inteira ~200KB)
import * as Icons from 'lucide-react';

// DEPOIS (tree-shakeable)
import { Mail, X, ChevronRight } from 'lucide-react';
```

### Eliminar classes dinâmicas

```tsx
// ANTES (Tailwind não detecta em build time)
<div className={`bg-${color}`}>

// DEPOIS (detectável)
const bgColors = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
} as const;
<div className={bgColors[color]}>
```

### Corrigir IntersectionObserver sem cleanup

```tsx
// React
useEffect(() => {
  const observer = new IntersectionObserver(callback, { threshold: 0.5 });
  elements.forEach(el => observer.observe(el));
  return () => observer.disconnect(); // obrigatório
}, []);
```

---

## Relatório de Saída

```
## Relatório de Performance — <component-slug>

### Imports
| Arquivo | Problema | Impacto estimado | Ação |
|---------|----------|------------------|------|

### Renderização
| Arquivo | Problema | Ação |
|---------|----------|------|

### CSS
| Arquivo | Problema | Ação |
|---------|----------|------|

### Score: X/10
```

---

## Commit de Rastreabilidade

Ao finalizar todas as otimizações, execute:

```bash
git add -A
git commit -m "skill(performance): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
