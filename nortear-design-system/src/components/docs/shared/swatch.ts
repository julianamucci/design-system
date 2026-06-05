export interface SwatchHandles {
  /** Elemento raiz: `<button>` (horizontal) ou `<div>` (vertical). */
  el: HTMLElement;
  /** Texto do valor HSL — só na variante horizontal. */
  valueEl?: HTMLElement;
  /** Tooltip de cópia — só na variante horizontal. */
  tooltipEl?: HTMLElement;
}

export interface SwatchOptions {
  /** Nome do token CSS sem o prefixo `--`. */
  token: string;
  /**
   * `vertical` — chip com o nome do token abaixo (mini-swatch de demonstração).
   * `horizontal` — chip + `--token` + valor HSL, clicável para copiar.
   */
  orientation: 'vertical' | 'horizontal';
  /** Valor HSL inicial (apenas `horizontal`). */
  value?: string;
}

/**
 * Swatch de cor reutilizável da página "Cores e Temas". Duas variantes:
 * vertical (nome abaixo da cor) e horizontal (variável + código HSL, copiável).
 * A interatividade de cópia e a reatividade de texto são ligadas pelo chamador,
 * que tem acesso ao `t()` reativo — por isso retornamos os elementos internos.
 */
export function createSwatch({ token, orientation, value = '' }: SwatchOptions): SwatchHandles {
  if (orientation === 'vertical') {
    const item = document.createElement('div');
    item.className = 'nds-miniswatch';

    const chip = document.createElement('span');
    chip.className = 'nds-miniswatch-chip';
    chip.style.setProperty('--swatch-color', `var(--${token})`);

    const name = document.createElement('span');
    name.className = 'nds-miniswatch-name';
    name.textContent = token;

    item.append(chip, name);
    return { el: item };
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nds-swatch';

  const color = document.createElement('span');
  color.className = 'nds-swatch-color';
  color.style.setProperty('--swatch-color', `var(--${token})`);

  const meta = document.createElement('div');
  meta.className = 'nds-swatch-meta';

  const tokenLabel = document.createElement('span');
  tokenLabel.className = 'nds-swatch-token';
  tokenLabel.textContent = `--${token}`;

  const valueLabel = document.createElement('span');
  valueLabel.className = 'nds-swatch-value';
  valueLabel.textContent = value;

  const tooltip = document.createElement('span');
  tooltip.className = 'nds-icon-tile-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');

  meta.append(tokenLabel, valueLabel);
  btn.append(color, meta, tooltip);

  return { el: btn, valueEl: valueLabel, tooltipEl: tooltip };
}
