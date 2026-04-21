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

## Fontes de Referência — Leia ANTES de qualquer ação

1. `docs/shared/guidelines/10-performance.md` — regras completas de performance
2. Vite config de cada stack (`vite.config.ts`)
3. `.storybook/main.ts` e `preview.ts` de cada stack

---

## Auditoria: O que Verificar

### 1. Imports Pesados

Busque imports que puxam módulos inteiros em vez de componentes individuais:

```bash
# Imports wildcard de ícones (cada ícone ~200B, lib inteira ~200KB)
grep -rn "from 'lucide-" design-system-*/src/ | grep -v "import {" | grep "import \*"

# Imports de barrels grandes
grep -rn "from '@/components/ui'" design-system-*/src/ --include="*.tsx" --include="*.ts"

# Re-exports que quebram tree-shaking
grep -rn "export \*" design-system-*/src/components/ui/index.ts 2>/dev/null
```

### 2. Renderização Desnecessária

**React — funções e objetos não memoizados:**

```bash
# Funções inline em JSX (arrow functions em props)
grep -rn "onClick={() =>" design-system-react/src/components/docs/

# Objetos inline em props
grep -rn "style={{" design-system-react/src/components/docs/
```

**Vue — computeds ausentes:**

```bash
# Chamadas de função no template (recalculam a cada render)
grep -rn ":class=\"cn(" design-system-vue/src/
```

### 3. Classes Tailwind Dinâmicas (quebram tree-shaking CSS)

```bash
# Template literals construindo classes
grep -rn '`text-\${' design-system-*/src/
grep -rn '`bg-\${' design-system-*/src/
grep -rn '`border-\${' design-system-*/src/
```

Cada ocorrência deve usar um mapa de classes completas:
```tsx
// ERRADO: `text-${color}-foreground`
// CERTO: { default: 'text-primary-foreground', destructive: 'text-destructive-foreground' }
```

### 4. IntersectionObserver

```bash
grep -rn "IntersectionObserver" design-system-*/src/
```

Para cada uso:
- [ ] Instância única (não uma por elemento)?
- [ ] `disconnect()` no cleanup?
- [ ] `threshold` e `rootMargin` otimizados?

### 5. Lazy Loading

```bash
# Imagens sem loading="lazy"
grep -rn "<img" design-system-*/src/ | grep -v "loading="

# Imagens sem dimensões explícitas (causam CLS)
grep -rn "<img" design-system-*/src/ | grep -v "width="
```

### 6. @apply em CSS (duplica estilos)

```bash
grep -rn "@apply" design-system-*/src/styles/
```

Cada `@apply` duplica as propriedades CSS em vez de usar a classe utilitária. Preferir classes inline.

### 7. Bundle Analysis

```bash
# Tamanho do build de cada stack
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  cd design-system-$stack
  npm run build-storybook 2>/dev/null && du -sh storybook-static/ 2>/dev/null
  cd ..
done
```

---

## Métricas-Alvo

| Métrica | Alvo | Como medir |
|---------|------|------------|
| Bundle por componente | ≤15KB gzip | `vite-bundle-visualizer` |
| Storybook build | ≤10MB gzip | `du -sh storybook-static/` |
| Story load time | ≤500ms | DevTools Performance tab |
| LCP (docs page) | ≤2.5s | Lighthouse |
| CLS | ≤0.1 | Lighthouse |

---

## Correções Comuns

### Memoizar callbacks em docs pages (React)

```tsx
// ANTES
const handleSectionChange = (id: string) => {
  track('docs_section_viewed', { section_id: id, locale });
};

// DEPOIS
const handleSectionChange = useCallback((id: string) => {
  track('docs_section_viewed', { section_id: id, locale });
}, [locale]);
```

### Importar ícones individualmente

```tsx
// ANTES (puxa lib inteira)
import * as Icons from 'lucide-react';

// DEPOIS (tree-shakeable)
import { Mail, X, ChevronRight } from 'lucide-react';
```

### Eliminar classes dinâmicas

```tsx
// ANTES (Tailwind não detecta)
<div className={`bg-${color}`}>

// DEPOIS (detectável)
const bgColors = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
} as const;
<div className={bgColors[color]}>
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

### CSS
| Arquivo | Problema | Ação |

### Lazy Loading
| Arquivo | Problema | Ação |

### Bundle Size
| Stack | Tamanho atual | Alvo | Status |

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
