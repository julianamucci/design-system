// ─── Toggle — Vanilla factory standalone ────────────────────────────────────
//
// Visual: classe .nds-toggle (standalone).
// Variantes/tamanhos via data-variant/data-size.

import { cn } from '@/lib/utils';

export type ToggleVariant = 'default' | 'outline';
export type ToggleSize = 'default' | 'sm' | 'lg';

export type ToggleOptions = {
  pressed?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  class?: string;
  onClick?: (pressed: boolean) => void;
  /**
   * Nome acessível do botão. OBRIGATÓRIO no toggle só de ícone — que é o caso
   * canônico deste componente: sem texto visível, `aria-pressed` sozinho faz o
   * leitor de tela anunciar "pressionado" sem dizer o quê.
   *
   * Existe como opção, e não como `setAttribute` depois de construir, porque o
   * contorno some na primeira refatoração e leva o nome junto — em silêncio,
   * porque nada na tela muda.
   */
  'aria-label'?: string;
  /**
   * Filhos diretos do botão. Aceita lista porque o caso com rótulo é ícone
   * MAIS texto lado a lado — e os dois precisam ser filhos DIRETOS: o espaço
   * entre eles vem do `gap` do próprio `.nds-toggle`, e a medida do ícone da
   * regra `.nds-toggle > svg`. Embrulhar os dois num `<span>` tirava os dois
   * efeitos e obrigava a compensar com estilo inline na story.
   */
  children?: ToggleChild | ToggleChild[];
};

type ToggleChild = HTMLElement | SVGElement | string;

export function createToggle(options: ToggleOptions = {}): HTMLButtonElement {
  const { disabled = false, variant = 'default', size = 'default', onClick } = options;
  let pressed = options.pressed ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.slot = 'toggle';
  btn.className = cn('nds-toggle', options.class);
  if (variant !== 'default') btn.dataset.variant = variant;
  if (size !== 'default') btn.dataset.size = size;
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-pressed', String(pressed));
  btn.dataset.state = pressed ? 'on' : 'off';

  if (options['aria-label']) btn.setAttribute('aria-label', options['aria-label']);
  if (disabled) btn.disabled = true;

  if (options.children) {
    const filhos = Array.isArray(options.children) ? options.children : [options.children];
    for (const filho of filhos) {
      // `append` com string cria nó de texto — nunca interpreta markup, então
      // não há caminho de injeção aqui.
      btn.append(filho);
    }
  }

  function setPressed(next: boolean): void {
    pressed = next;
    btn.setAttribute('aria-pressed', String(next));
    btn.dataset.state = next ? 'on' : 'off';
    onClick?.(next);
  }

  if (!disabled) {
    btn.addEventListener('click', () => setPressed(!pressed));
  }

  return btn;
}
