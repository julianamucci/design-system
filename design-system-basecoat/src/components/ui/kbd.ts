// ─── Kbd — Vanilla factories alinhadas ao shadcn ─────────────────────────────
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
  /** Atalho como aria-label legível (ex.: "Command", "Shift"). */
  label?: string;
  /** Classes adicionais. */
  className?: string;
}

export interface KbdGroupOptions {
  className?: string;
}

export function createKbd(options: KbdOptions = {}): HTMLElement {
  const { children, text, label, className } = options;

  const el = document.createElement('kbd');
  el.setAttribute('data-slot', 'kbd');
  el.className = 'nds-kbd';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (label) el.setAttribute('aria-label', label);

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
  el.className = 'nds-kbd-group';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
