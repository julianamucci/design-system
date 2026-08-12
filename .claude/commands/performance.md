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
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `vanilla`, `angular` ou `all` (padrão: `all`)

---

## Auditoria: O que Verificar

Dispare todos os `Grep` do mesmo check em paralelo no mesmo turno.

### 1. Imports Pesados

Use `Grep` nativo em paralelo nas 5 stacks:

- **Wildcard de ícones** (cada ícone ~200B, lib inteira ~200KB) — padrão `import \*.*from 'lucide-` em `nortear-design-system-<stack>/src/`
- **Barrel imports** que puxam toda a lib UI — padrão `from '@/components/ui'` (sem subpath) em arquivos `.tsx`/`.ts`/`.vue`/`.svelte` dentro de `src/components/docs/`
- **Re-exports wildcard** que quebram tree-shaking — padrão `export \*` em `nortear-design-system-<stack>/src/components/ui/index.ts`

### 2. Renderização Desnecessária

**React — objetos inline em componentes UI** (não docs pages — lá são intencionais):
- `Grep` padrão `style=\{\{` em `nortear-design-system-react/src/components/ui/`

**Vue — `cn()` chamado diretamente no template** (recalcula a cada render, deveria ser `computed`):
- `Grep` padrão `:class="cn\(` em `nortear-design-system-vue/src/components/ui/`

### 3. Classes montadas por interpolação

Use `Grep` em paralelo nas 5 stacks para template literals construindo classes:
- Padrão `` `nds-\${ `` em `nortear-design-system-<stack>/src/`
- Padrão `` `nds-text-\${ `` / `` `nds-bg-\${ `` em `nortear-design-system-<stack>/src/`

Classe montada em runtime não é rastreável: nada garante que a regra exista no
CSS `.nds-*`, e a única forma de descobrir é olhando a tela. Use um mapa de
classes completas, que quebra no typecheck quando um valor não é previsto:

```tsx
// ERRADO — `nds-bg-fancy` pode simplesmente não existir
<div className={`nds-bg-${color}`}>

// CERTO — o mapa é o contrato
const bg = { primary: 'nds-bg-primary', secondary: 'nds-bg-secondary' } as const;
<div className={bg[color]}>
```

O contraponto é o `data-*`: quando o CSS já resolve a variante por atributo
(`.nds-button[data-variant="destructive"]`), passe o valor no atributo em vez de
concatenar nome de classe.

### 4. IntersectionObserver

`Grep` padrão `IntersectionObserver` em `nortear-design-system-<stack>/src/` para cada stack no escopo.

Para cada uso encontrado:
- [ ] `disconnect()` chamado no cleanup (React: retorno do `useEffect`; Svelte: retorno do `$effect`; Vue: `onUnmounted`)?
- [ ] Instância única por página, não uma por elemento observado?
- [ ] `threshold` e `rootMargin` definidos explicitamente?

### 5. `@apply` — diretiva inerte, de lib que saiu do projeto

Onde procurar a diretiva do título: `nortear-design-system-<stack>/src/`
(arquivos `.css`) e `docs/shared/content/*/translations.json` (o snippet de
customização, que é onde ela mais sobrevive).

Ela depende do build do Tailwind, e nenhuma das 5 stacks o declara em
`dependencies` nem em `devDependencies` — medido. Ou seja, ninguém processa a
diretiva: no CSS ela é regra inválida, e num snippet de documentação é conselho
inerte, porque quem seguir não obtém estilo nenhum.

Cuidado com a correção: "preferir classe inline no template" era a orientação
de quando o custo seria duplicação no output, e essa lib saiu daqui. Hoje o
problema é a instrução não funcionar. Substitua por CSS comum sobre a classe
`.nds-*` do componente, usando as custom properties que ele expõe.

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
// ANTES (nada garante que a regra exista no CSS)
<div className={`bg-${color}`}>

// DEPOIS (o mapa é o contrato)
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
