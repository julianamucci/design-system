# Regras Gerais Obrigatórias (Basecoat — Vanilla TypeScript)

* **SEU PAPEL**: Manter a consistência do projeto seguindo ESTRITAMENTE o que está definido nas guidelines. NUNCA invente seções, estruturas ou padrões que não estejam documentados. SEMPRE consulte as guidelines antes de criar ou modificar qualquer componente.
* **É OBRIGATÓRIO que funções de criação de componentes sigam o padrão `createNomeComponente(options): HTMLElement`**
* **É OBRIGATÓRIO usar os estilos do arquivo `./styles/globals.css` via classes Tailwind**
* **É OBRIGATÓRIO usar APENAS ícones da biblioteca `lucide` (vanilla) para TODOS os ícones do projeto**
* **É OBRIGATÓRIO que todos os dialogs/modais usem as variáveis `--card` para background e `--card-foreground` para foreground**
* **É OBRIGATÓRIO que todos os componentes interativos tenham `focus-visible` com 2px de espessura (ring-2)**
* **É OBRIGATÓRIO que todos os componentes interativos usem `focus-visible:ring-ring` com 100% da cor (SEM opacidade como /50 ou /30)**
* **COMPATIBILIDADE MOBILE OBRIGATÓRIO**: Sempre que possível prefira "popover" a "hover card" ou "tooltip" para melhor compatibilidade com uso mobile
* Use melhores práticas de layout flexbox e semântica web para compor páginas
* Sistema de espaçamento baseado em múltiplos de 8px
* Use diretrizes WCAG 2.2 AA para acessibilidade
* **TIPOGRAFIA**: Use APENAS a fonte sistema definida no CSS para todos os textos
* **NÃO use classes de tamanho de fonte ou altura de linha do Tailwind** (ex: text-2xl, leading-none) — a tipografia está definida no CSS base
* Mantenha arquivos pequenos e coloque funções auxiliares em arquivos separados
* Use `cn()` de `@/lib/utils` para composição de classes condicionais

## Padrão de criação de componentes

Todos os componentes são **funções TypeScript** que criam e retornam `HTMLElement`:

```ts
// ✅ Padrão obrigatório
export interface ButtonOptions {
  label: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
  const { label, variant = 'default', size = 'default', disabled = false, onClick } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    variant === 'outline' && 'border border-input bg-background hover:bg-accent',
    size === 'sm' && 'h-8 px-3 text-sm',
    size === 'default' && 'h-9 px-4',
    size === 'lg' && 'h-10 px-6',
    disabled && 'pointer-events-none opacity-50'
  );
  btn.disabled = disabled;
  btn.textContent = label;

  if (onClick) {
    btn.addEventListener('click', onClick);
  }

  return btn;
}
```

## Estado de componente: `data-*` attributes

```ts
// Estado via data-* — não variáveis globais mutáveis
dialog.setAttribute('data-state', 'open');
dialog.setAttribute('data-state', 'closed');

// CSS responde a data-*
// [data-state="open"] { display: block; }
// [data-state="closed"] { display: none; }
```

## Comunicação entre componentes: Custom Events

```ts
// Disparar evento
btn.dispatchEvent(new CustomEvent('ds:dialog-open', {
  bubbles: true,
  detail: { dialogId: 'confirm-delete' }
}));

// Escutar evento
document.addEventListener('ds:dialog-open', (e: CustomEvent) => {
  openDialog(e.detail.dialogId);
});
```

## Ícones com lucide (vanilla)

```ts
import { createIcons, AlertCircle, Check, X } from 'lucide';

// Renderizar ícone como SVG string
const iconSvg = `<svg ...>${/* conteúdo do ícone */}</svg>`;

// Ou usar a API de criação automática
createIcons({ icons: { AlertCircle, Check, X } });

// No HTML: <i data-lucide="alert-circle"></i>
// createIcons() substituirá pelo SVG real
```

## Imports obrigatórios

```ts
import { cn } from '@/lib/utils';
import { applyStorybookSeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
```

## `innerHTML` — uso restrito

```ts
// ❌ NUNCA com dados do usuário
el.innerHTML = `<span>${inputDoUsuario}</span>`;

// ✅ textContent para texto do usuário
el.textContent = inputDoUsuario;

// ✅ innerHTML com conteúdo controlado (sem dados externos)
el.innerHTML = `<span class="font-mono">${sanitizedMarkdown}</span>`;
```
