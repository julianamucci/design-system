# Regras Gerais Obrigatórias (Nortear — Vanilla TypeScript)

* **SEU PAPEL**: Manter a consistência do projeto seguindo ESTRITAMENTE o que está definido nas guidelines. NUNCA invente seções, estruturas ou padrões que não estejam documentados. SEMPRE consulte as guidelines antes de criar ou modificar qualquer componente.
* **É OBRIGATÓRIO que funções de criação de componentes sigam o padrão `createNomeComponente(options): HTMLElement`**
* **É OBRIGATÓRIO usar as classes `.nds-*` definidas em `docs/shared/styles/nds/*.css`** (alias `@shared/styles/nds/`, importado por `src/styles/globals.css`) — CSS standalone; o projeto não usa nenhum framework de classe utilitária, e classe sem o prefixo `nds-` é inerte em runtime
* **É OBRIGATÓRIO usar APENAS ícones da biblioteca `lucide` (vanilla) para TODOS os ícones do projeto**
* **É OBRIGATÓRIO que todos os dialogs/modais usem as variáveis `--card` para background e `--card-foreground` para foreground**
* **É OBRIGATÓRIO que todo componente interativo tenha anel de foco visível de 2px** — pela utilitária `.nds-focus-ring` ou pela regra `:focus-visible` da própria folha do componente. O anel lê `--ring` com **100% da cor**: opacidade (`/50`, `/30`) derruba o contraste do indicador de foco abaixo dos 3:1 de WCAG 1.4.11
* **COMPATIBILIDADE MOBILE OBRIGATÓRIO**: Sempre que possível prefira "popover" a "hover card" ou "tooltip" para melhor compatibilidade com uso mobile
* Use melhores práticas de layout flexbox e semântica web para compor páginas
* Sistema de espaçamento baseado em múltiplos de 8px
* Use diretrizes WCAG 2.2 AA para acessibilidade
* **TIPOGRAFIA**: Use APENAS a fonte sistema definida no CSS para todos os textos
* **Use classes tipográficas `.nds-text-*` / `.nds-leading-*`** — nunca valores arbitrários nem classes utilitárias de outro framework; a tipografia está definida no CSS base
* Mantenha arquivos pequenos e coloque funções auxiliares em arquivos separados
* Use `cn()` de `@/lib/utils` para composição de classes condicionais

## Padrão de criação de componentes

Todos os componentes são **funções TypeScript** que criam e retornam `HTMLElement`.

A fábrica faz três coisas, e só três: **monta o elemento**, **escolhe as classes
`.nds-*`** (base + modificador de variante + modificador de tamanho) e **liga os
ouvintes**. Ela não escreve declaração de estilo nenhuma — quem resolve cor,
espaçamento, raio, foco e estado é a folha do componente em
`docs/shared/styles/nds/`.

```ts
// ✅ Padrão obrigatório — a fábrica compõe classes, a folha resolve o desenho
export interface ButtonOptions {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
  const { label, variant = 'default', size = 'default', disabled = false, onClick } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  // `.nds-button` é a base; `.nds-button-<variante>` e `.nds-button-<tamanho>`
  // são modificadores. O tamanho `default` não tem classe: o dimensionamento
  // base já mora em `.nds-button`.
  btn.className = cn(
    'nds-button',
    size !== 'default' && `nds-button-${size}`,
    `nds-button-${variant}`,
  );
  btn.disabled = disabled;                    // `:disabled` é seletor da folha
  btn.textContent = label;

  if (onClick) btn.addEventListener('click', onClick);

  return btn;
}
```

**Por que não há `height` no exemplo, e por que não pode haver.** A altura de um
primitivo com texto é **resultado** de `padding-block` + `line-height`, nunca um
número escrito. Com altura fixa, aumentar o tamanho de fonte do navegador faz o
texto crescer dentro de uma caixa que não cresce: ele estoura ou é recortado, e
o componente reprova WCAG 1.4.4 (Resize Text 200%). A folha `button.css` carrega
esse aviso no cabeçalho justamente para que ninguém o reintroduza. Tokens
`--height-*` continuam válidos para contêiner (card, modal, barra lateral) e
para ícone, que não têm texto para crescer.

**Estado é atributo, não classe.** `disabled`, `aria-pressed`, `aria-expanded`,
`aria-invalid`, `aria-busy` e `data-state` vão no elemento, e a folha responde a
eles por seletor. Fábrica que troca de classe para pintar estado duplica o que a
folha já sabe fazer e sai de sincronia na primeira mudança de tema.

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
el.innerHTML = `<span class="nds-font-mono">${sanitizedMarkdown}</span>`;
```
