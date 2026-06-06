# System Design — Arquitetura de Software (Nortear)

## Visão Geral

- **Storybook** — interface principal de documentação (porta 6006)
- **Sandbox** (`app.ts`) — desenvolvimento isolado
- **Frontend-only** — sem backend, deployável em CDN estático

---

## Stack Tecnológica

```
Browser
├── TypeScript (linguagem tipada)
├── HTML/DOM API (criação de elementos)
├── CSS standalone (`.nds-*`) — sem Tailwind
├── lucide (ícones vanilla)
├── Zod (validação de schema)
└── @storybook/html-vite (documentação)
```

---

## Padrão de Módulo de Componente

Cada componente é um módulo TypeScript:

```ts
// src/components/ui/button.ts

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonOptions {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function createButton(options: ButtonOptions = {}): HTMLButtonElement {
  // ... implementação
}
```

**Convenção**: `create{NomeComponente}(options: {NomeComponente}Options): HTMLElement`

---

## Estado de Componente

### data-* attributes (não variáveis globais)

```ts
// ✅ CORRETO — estado via data-*
dialog.setAttribute('data-state', 'open');
input.setAttribute('data-invalid', 'true');

// CSS responde a data-*:
// [data-state="open"] { display: block; }
// [data-invalid="true"] { border-color: hsl(var(--destructive)); }
```

### Módulo de estado compartilhado

Para estado simples compartilhado entre componentes:

```ts
// src/lib/state.ts
let _theme = 'default';
const _listeners = new Set<() => void>();

export const themeState = {
  get: () => _theme,
  set: (theme: string) => {
    _theme = theme;
    _listeners.forEach(fn => fn());
  },
  subscribe: (fn: () => void) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
```

---

## Comunicação entre Componentes

### Custom Events

```ts
// Disparar
btn.dispatchEvent(new CustomEvent('ds:action', {
  bubbles: true,
  detail: { type: 'delete', id: '123' }
}));

// Escutar
document.addEventListener('ds:action', (e: CustomEvent<{ type: string; id: string }>) => {
  if (e.detail.type === 'delete') handleDelete(e.detail.id);
});
```

**Convenção de nomes de eventos**: prefixo `ds:` + `objeto_ação` em snake_case — ex: `ds:dialog_open`, `ds:form_submit`.

---

## Fluxo de Dados

Dentro de um ComponentDocs ou feature:

```
createComponenteDocs()
    ↓
createSection() / createDocsHeader()
    ↓
createNomeComponente(options)
    ↓
Event listeners
    ↓
dispatchEvent / update DOM
```

---

## Performance

### Reutilização de elementos

```ts
// ✅ Atualizar elemento existente em vez de recriar
function updateButton(btn: HTMLButtonElement, newLabel: string) {
  btn.textContent = newLabel;
}

// ❌ Evitar recriar e reanexar desnecessariamente
function rebuildButton() {
  const parent = btn.parentElement;
  parent?.replaceChild(createButton({ label: newLabel }), btn);
}
```

### Event delegation

```ts
// ✅ Preferir event delegation para listas longas
list.addEventListener('click', (e) => {
  const item = (e.target as HTMLElement).closest('[data-item-id]');
  if (item) handleItemClick(item.dataset.itemId!);
});

// ❌ Evitar listener por item em listas grandes
items.forEach((item) => item.addEventListener('click', handleItemClick));
```

---

## Anti-Patterns Evitados

### Variáveis globais mutáveis

```ts
// ❌ EVITAR
let globalDialog: HTMLElement | null = null;

// ✅ CORRETO — retornar instâncias, não armazenar globalmente
const dialog = createDialog({ title: 'Confirmar' });
document.body.appendChild(dialog.element);
dialog.open();
```

### innerHTML com dados externos

```ts
// ❌ NUNCA
container.innerHTML = `<span>${api.data.nome}</span>`;

// ✅ textContent ou createElement
const span = document.createElement('span');
span.textContent = api.data.nome;
container.appendChild(span);
```

---

## Decisões Técnicas

| Decisão | Escolha | Razão |
|---------|---------|-------|
| Framework | Vanilla TypeScript | Zero overhead, máxima interoperabilidade |
| Storybook | @storybook/html-vite | Suporte nativo a HTML puro |
| Styling | CSS standalone (`.nds-*`) | Independência total de frameworks CSS |
| State | data-* attributes + Custom Events | Sem dependências externas |
| Forms | HTML nativo + Zod | Validação tipada sem dependência de framework |
| Icons | lucide (vanilla) | Leve, tree-shakeable |
| Visual regression | Chromatic | Integrado ao Storybook |
| A11y | axe-playwright | Testes em browser real |

---

## Segurança

```ts
// ✅ textContent para dados do usuário (escapa automaticamente)
el.textContent = inputDoUsuario;

// ✅ setAttribute para atributos (escapa automaticamente)
el.setAttribute('aria-label', inputDoUsuario);

// ❌ NUNCA innerHTML com dados externos
el.innerHTML = inputDoUsuario;

// ✅ OK — innerHTML com conteúdo controlado e sanitizado
el.innerHTML = `<code>${sanitizeHtml(markdownContent)}</code>`;
```

---

## Adicionar Novos Componentes

```
1. src/components/docs/NovoComponenteDocs.ts  ← createNovoComponenteDocs(): HTMLElement
2. src/components/docs/content/{slug}/translations.json
3. src/components/ui/novo-componente.stories.ts  ← story principal + render
4. src/components/ui/novo-componente-{variantes,tamanhos,estados,composicoes}.stories.ts
5. Verificar no Storybook: npm run storybook
```
