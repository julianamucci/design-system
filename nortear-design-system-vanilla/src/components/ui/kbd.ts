import { cn } from '@/lib/utils';
// ─── Kbd — Vanilla factories alinhadas ao primitive React ─────────────────────────────
//
// API:
//   const group = createKbdGroup();
//   group.appendChild(createKbd({ children: 'Ctrl' }));
//   group.appendChild(document.createTextNode('+'));
//   group.appendChild(createKbd({ children: 'B' }));
//
// Renderiza <kbd> nativo (semântica HTML) com aparência de tecla física.

export interface KbdOptions {
  /** Conteúdo: texto curto (Ctrl, B, ⌘) ou nodes. */
  children?: string | HTMLElement | Array<string | HTMLElement>;
  /** Alias para `children: string`. */
  text?: string;
  /** Nome acessível: o atalho em forma legível (ex.: "Command", "Shift"). */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /** Classes adicionais. */
  className?: string;
}

export interface KbdGroupOptions {
  className?: string;
}

export function createKbd(options: KbdOptions = {}): HTMLElement {
  const { children, text, className } = options;
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const ariaLabel = options['aria-label'] ?? options.label;

  const el = document.createElement('kbd');
  el.setAttribute('data-slot', 'kbd');
  el.className = cn('nds-kbd', className);
  if (ariaLabel) el.setAttribute('aria-label', ariaLabel);

  const content = children ?? text;
  if (content !== undefined && content !== null) {
    const items = Array.isArray(content) ? content : [content];
    for (const item of items) {
      if (typeof item === 'string') {
        el.appendChild(document.createTextNode(item));
      } else if (item instanceof Node) {
        el.appendChild(item);
      }
    }
  }

  return el;
}

export function createKbdGroup(options: KbdGroupOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('kbd');
  el.setAttribute('data-slot', 'kbd-group');
  el.className = cn('nds-kbd-group', className);

  return el;
}
