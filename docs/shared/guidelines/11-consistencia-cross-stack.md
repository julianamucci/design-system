# 11 — Consistência Visual Cross-Stack

Este arquivo define como garantir que o mesmo componente produz resultado visual idêntico em React, Vue, Svelte e Basecoat. Um design system multi-stack só tem valor se a aparência e o comportamento forem consistentes em todas as implementações.

---

## Princípio

**Uma especificação, quatro implementações, um resultado visual.** O usuário final não deve perceber em qual framework o componente foi renderizado. As classes Tailwind, os tokens CSS e o comportamento interativo devem ser idênticos.

---

## Fonte de Verdade

A stack **React** é a referência. Quando há divergência, o React está correto e as outras stacks devem ser ajustadas.

Hierarquia de decisão:
1. **Tokens CSS** (`docs/shared/themes/`) — compartilhados, imutáveis
2. **Classes Tailwind no `cva()`** — devem ser idênticas em todas as stacks
3. **Comportamento interativo** — mesmo fluxo de teclado, mesmos estados
4. **Markup semântico** — mesmo elemento HTML (`<button>`, `<dialog>`, etc.)

---

## O que DEVE ser Idêntico

### 1. Classes CSS do `cva()`

As classes de cada variante, tamanho e estado DEVEM ser copiadas letra por letra do React. A função `cva()` (ou equivalente) deve produzir as mesmas strings em todas as stacks.

```typescript
// Esta string DEVE ser idêntica em React, Vue, Svelte e Basecoat
const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  // ... mesmas classes em todas as stacks
};
```

**Como verificar:**

```bash
# Extrair cva() de cada stack e comparar
grep -A 5 "bg-primary" design-system-react/src/components/ui/button/index.ts
grep -A 5 "bg-primary" design-system-vue/src/components/ui/button/index.ts
grep -A 5 "bg-primary" design-system-svelte/src/components/ui/Button.svelte
# Basecoat: verificar constantes no arquivo de stories
```

### 2. Tokens CSS (variáveis custom properties)

Os temas (`docs/shared/themes/`) são compartilhados. Cada stack importa os mesmos arquivos CSS:
- `globals.css` → importa tokens base
- Temas: `crystal.css`, `industrial.css` → via classes no `<html>`

### 3. Markup semântico

| Aspecto | Deve ser idêntico |
|---------|-------------------|
| Elemento raiz | `<button>`, `<div>`, `<dialog>` — mesmo em todas |
| `data-slot` | Mesmo valor (ex: `data-slot="button"`) |
| `role` | Mesmo quando explícito |
| `aria-*` | Mesmos atributos, mesmos valores |
| Estrutura de filhos | Mesma hierarquia de elementos |

### 4. Comportamento de teclado

| Interação | Comportamento esperado (todas as stacks) |
|-----------|------------------------------------------|
| Tab | Foco no componente na ordem do DOM |
| Enter | Aciona ação primária |
| Space | Aciona ação primária (botões) |
| Escape | Fecha overlay/modal |
| Arrow keys | Navega opções (select, tabs, radio) |

---

## O que PODE ser Diferente

### API de Framework

Cada stack usa suas próprias convenções:

| Aspecto | React | Vue | Svelte | Basecoat |
|---------|-------|-----|--------|----------|
| Props | `interface Props` | `defineProps<Props>()` | `$props()` / `export let` | Não aplicável |
| Slots | `children` | `<slot />` | `<slot />` / `{@render}` | `innerHTML` |
| Events | `onClick` | `@click` / `v-on` | `on:click` / `onclick` | `addEventListener` |
| Refs | `useRef` | `ref()` | `bind:this` | `querySelector` |
| asChild | Radix `asChild` | Reka UI `as-child` | Bits UI equivalent | `role="button"` em `<a>` |

### Primitivos de Acessibilidade

| Stack | Biblioteca |
|-------|-----------|
| React | Radix UI |
| Vue | Reka UI |
| Svelte | Bits UI |
| Basecoat | HTML nativo + ARIA manual |

A biblioteca muda, mas o resultado acessível deve ser idêntico.

### Implementações vanilla (Basecoat)

Quando um pacote npm não existe para vanilla TS (ex: `sonner` só tem bindings para React, Vue e Svelte), o Basecoat cria uma **implementação própria** que replica a API e o resultado visual. Regras:

- A API pública deve seguir o mesmo contrato (mesmos nomes de função, mesmos parâmetros)
- As classes Tailwind aplicadas aos elementos DOM devem produzir resultado visual idêntico ao da biblioteca original
- Atributos ARIA devem ser explícitos (a biblioteca gerencia automaticamente; a implementação vanilla precisa declarar manualmente `role`, `aria-live`, `aria-label`, etc.)
- O componente deve usar os mesmos `data-*` attributes para que play functions e seletores de teste funcionem cross-stack (ex: `data-sonner-toast`, `data-close-button`)

---

## Processo de Auditoria Cross-Stack

### 1. Comparar `cva()` / classes

Para cada componente, extraia as classes Tailwind de cada stack e compare:

```bash
# Script de comparação rápida
for stack in react vue svelte; do
  echo "=== $stack ==="
  grep -oP "(?<=')\S+(?=')" design-system-$stack/src/components/ui/<slug>/*.{ts,vue,svelte} 2>/dev/null | sort
done
```

Diferenças nas classes = bug. A stack React é a referência.

### 2. Comparar variantes

Verifique que cada stack tem as mesmas variantes:

| Variante | React | Vue | Svelte | Basecoat |
|----------|-------|-----|--------|----------|
| default | ✅ | ✅ | ✅ | ✅ |
| secondary | ✅ | ✅ | ✅ | ✅ |
| outline | ✅ | ✅ | ✅ | ✅ |
| ghost | ✅ | ✅ | ✅ | ✅ |
| link | ✅ | ✅ | ✅ | ✅ |
| destructive | ✅ | ✅ | ✅ | ✅ |

### 3. Comparar stories

Todas as stacks devem ter as mesmas categorias de stories:

| Categoria | Stories esperadas |
|-----------|-------------------|
| Playground | 1 story interativa com play function |
| Variantes | 1 story por variante visual |
| Tamanhos | 1 story por tamanho + IconOnly |
| Estados | Disabled, Loading, (Error se aplicável) |
| Composições | Com ícone leading/trailing, como link |

### 4. Comparar visualmente

Abra o mesmo componente/variante nos 4 Storybooks lado a lado:
- React: `localhost:6006`
- Vue: `localhost:6007` (ou porta configurada)
- Svelte: `localhost:6008`
- Basecoat: `localhost:6009`

Diferenças visuais (cor, espaçamento, tipografia, border-radius) indicam classes divergentes.

### 5. Comparar acessibilidade

Rode axe nos 4 Storybooks e compare violations:

```bash
# Cada stack
cd design-system-<stack> && npx test-storybook --url http://localhost:600X
```

Violations em uma stack que não existem em outra = implementação inconsistente.

---

## Fontes de Inconsistência Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Cor diferente | Classes Tailwind divergentes no `cva()` | Copiar classes do React |
| Espaçamento diferente | Tamanhos (`h-9`, `px-4`) divergentes | Copiar do `cva()` React |
| Border-radius diferente | `rounded-md` vs `rounded-lg` | Padronizar |
| Focus ring diferente | `focus-visible:ring-*` divergente | Copiar do React |
| Hover inconsistente | `hover:bg-*` classes divergentes | Copiar do React |
| Ícone tamanho diferente | `[&_svg]:size-4` faltando | Adicionar seletor |
| Dark mode inconsistente | `dark:` classes faltando ou divergentes | Copiar do React |
| Animação faltando | `transition-all` ou `animate-spin` ausente | Copiar do React |

---

## Checklist Cross-Stack

- [ ] Classes `cva()` idênticas em todas as stacks (diff = 0)
- [ ] Mesmas variantes disponíveis (nenhuma faltando)
- [ ] Mesmos tamanhos disponíveis
- [ ] Mesmos estados implementados (disabled, loading)
- [ ] Mesmas composições (ícone, asChild/link)
- [ ] Mesma cobertura de stories
- [ ] Tokens CSS compartilhados (themes importados de `docs/shared/`)
- [ ] `storybook-docs.css` sincronizado entre stacks
- [ ] Sem violations de axe em nenhuma stack
- [ ] Visual side-by-side aprovado
