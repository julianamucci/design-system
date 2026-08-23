// ─── Resizable — Vanilla factory standalone ─────────────────────────────────
// Visual: classes .nds-resizable-* (standalone).
// Divisor arrastável + redimensionamento por teclado (setas, Home, End, Enter).

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type ResizablePanel = {
  content: HTMLElement;
  /** Tamanho inicial em porcentagem do grupo (0–100). */
  defaultSize?: number;
  /** Mínimo em porcentagem — é o que impede o painel de sumir. */
  minSize?: number;
  /** Máximo em porcentagem. */
  maxSize?: number;
};

export type ResizablePanelOptions = {
  direction?: 'horizontal' | 'vertical';
  panels: ResizablePanel[];
  /**
   * Mostra o pegador visual centralizado nos divisores.
   *
   * Existe como opção, e não como sempre-ligado, porque a fábrica exibia o
   * pegador incondicionalmente enquanto a story anunciava um controle
   * `withHandle` que não chegava a lugar nenhum — controle morto no painel e
   * documentação que prometia um padrão (`false`) que esta stack não cumpria.
   */
  withHandle?: boolean;
  /**
   * Nome acessível dos divisores. OBRIGATÓRIO: o divisor é um `role="separator"`
   * focável, e sem nome o leitor de tela anuncia apenas "separador, 30" — não há
   * como saber o que aquele número redimensiona.
   *
   * Uma string nomeia todos os divisores do grupo; um array nomeia um a um, que
   * é o que um grupo de três painéis ou mais precisa — dois separadores com o
   * mesmo nome são dois controles indistinguíveis na lista do leitor de tela.
   *
   * Vive aqui porque o divisor não é um elemento que quem consome receba: até
   * aqui o único caminho era percorrer `[data-slot="resizable-handle"]` depois
   * de construir, e num grupo aninhado esse percurso pega também os divisores
   * do grupo de dentro.
   */
  'aria-label'?: string | string[];
  /** Divisores travados: continuam anunciados e focáveis, mas não movem nada. */
  disabled?: boolean;
  /** Tamanhos finais, em porcentagem, ao fim de cada gesto. */
  onLayout?: (sizes: number[]) => void;
  class?: string;
};

/** Passo de cada seta, em pontos percentuais. Mesmo valor das outras stacks. */
const STEP_KEYBOARD = 2;

function limitar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─── createResizablePanel ─────────────────────────────────────────────────────

export function createResizablePanel(options: ResizablePanelOptions): DestroyableElement {
  const { direction = 'horizontal', panels, disabled = false, withHandle = false, onLayout } = options;
  const horizontalIs = direction === 'horizontal';
  const count = panels.length;

  /** Encerra o arraste em curso, se houver. `null` fora de arraste. */
  let soltarArrasto: (() => void) | null = null;

  const root = document.createElement('div');
  root.dataset.slot = 'resizable';
  root.dataset.direction = direction;
  root.className = cn('nds-resizable', options.class);

  /** Nome do divisor `i` — string única vale para todos; array indexa. */
  const labelOf = (i: number): string | undefined => {
    const label = options['aria-label'];
    return Array.isArray(label) ? label[i] : label;
  };

  const minimumOf = (i: number) => panels[i]?.minSize ?? 10;
  const maximoDe = (i: number) => panels[i]?.maxSize ?? 100;

  // `defaultSize` declarado manda; quem não declarou divide a sobra por igual.
  const declarados = panels.map((p) => p.defaultSize);
  const noDeclaration = declarados.filter((d) => d === undefined).length;
  const sumDeclarada = declarados.reduce<number>((acc, d) => acc + (d ?? 0), 0);
  const fatia = noDeclaration > 0 ? Math.max(0, 100 - sumDeclarada) / noDeclaration : 0;
  const raw = declarados.map((d, i) => limitar(d ?? fatia, minimumOf(i), maximoDe(i)));
  const sumBruta = raw.reduce((a, b) => a + b, 0);
  /** Sempre normalizado para somar 100 — é o que o `aria-valuenow` anuncia. */
  const sizes = sumBruta > 0 ? raw.map((s) => (s / sumBruta) * 100) : raw.map(() => 100 / count);

  const panelEls: HTMLElement[] = [];
  const handleEls: HTMLElement[] = [];

  /**
   * O tamanho viaja por `--panel-size`, e não por `width`/`height` inline.
   *
   * A folha compartilhada dá `flex-basis: 0` ao painel: com isso o eixo
   * principal sai de `flex-grow`, e `width` inline é IGNORADO. A fábrica
   * escrevia `width: 30%` desde sempre, as stories afirmavam esse `style.width`
   * — e os painéis apareciam todos do mesmo tamanho na tela, com a suíte verde.
   */
  function applySize(i: number): void {
    panelEls[i]?.style.setProperty('--panel-size', String(Math.round(sizes[i] * 1e4) / 1e4));
  }

  /** `aria-valuenow` só serve se for o tamanho REAL do painel anterior. */
  function anunciar(i: number): void {
    const h = handleEls[i];
    if (!h) return;
    const sum = (sizes[i] ?? 0) + (sizes[i + 1] ?? 0);
    h.setAttribute('aria-valuenow', String(Math.round(sizes[i])));
    h.setAttribute('aria-valuemin', String(Math.round(minimumOf(i))));
    // O teto não é o `maxSize` do painel: o vizinho também tem um mínimo, e é o
    // menor dos dois que o gesto respeita.
    h.setAttribute('aria-valuemax', String(Math.round(Math.min(maximoDe(i), sum - minimumOf(i + 1)))));
  }

  /**
   * Move o divisor `i`: o que um painel ganha, o vizinho perde. Só os dois se
   * mexem — num grupo de cinco painéis, arrastar um divisor não pode empurrar o
   * layout inteiro.
   */
  function aplicar(i: number, deltaPct: number, base: number[]): void {
    const sum = (base[i] ?? 0) + (base[i + 1] ?? 0);
    const teto = Math.min(maximoDe(i), sum - minimumOf(i + 1));
    const piso = Math.max(minimumOf(i), sum - maximoDe(i + 1));
    if (piso > teto) return;

    sizes[i] = limitar(base[i] + deltaPct, piso, teto);
    sizes[i + 1] = sum - sizes[i];
    applySize(i);
    applySize(i + 1);
    anunciar(i);
  }

  /** Fim de interação: uma emissão por gesto, não uma por pixel. */
  function finalizar(): void {
    onLayout?.(sizes.map((s) => Math.round(s * 10) / 10));
  }

  panels.forEach((panel, i) => {
    const panelEl = document.createElement('div');
    panelEl.dataset.slot = 'resizable-panel';
    panelEl.className = 'nds-resizable-panel';
    // O painel rola (`overflow: auto` na folha compartilhada). Região rolável
    // precisa ser alcançável por teclado, senão o conteúdo escondido fica
    // inacessível a quem não usa mouse (WCAG 2.1.1).
    panelEl.setAttribute('tabindex', '0');
    panelEl.appendChild(panel.content);
    panelEls.push(panelEl);
    root.appendChild(panelEl);
    applySize(i);

    // Divisor entre painéis (não depois do último)
    if (i < panels.length - 1) {
      const handle = document.createElement('div');
      handle.dataset.slot = 'resizable-handle';
      handle.setAttribute('role', 'separator');
      handle.setAttribute('aria-orientation', horizontalIs ? 'vertical' : 'horizontal');
      handle.setAttribute('tabindex', '0');
      handle.className = 'nds-resizable-handle';
      const label = labelOf(i);
      if (label) handle.setAttribute('aria-label', label);
      if (disabled) {
        // `aria-disabled` em vez de sumir da ordem de tabulação: um controle que
        // desaparece do Tab não tem como explicar por que está travado.
        handle.setAttribute('aria-disabled', 'true');
        handle.dataset.disabled = '';
      }

      // Grip (alça com pontos) — SVG via createElementNS (sem innerHTML).
      if (withHandle) {
        const grip = document.createElement('div');
        grip.className = 'nds-resizable-grip';
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('xmlns', SVG_NS);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        // Seis pontinhos não têm nada a dizer a um leitor de tela: quem carrega
        // o significado é o aria-label do separator.
        svg.setAttribute('aria-hidden', 'true');
        for (const [cx, cy] of [['9','5'],['9','12'],['9','19'],['15','5'],['15','12'],['15','19']]) {
          const c = document.createElementNS(SVG_NS, 'circle');
          c.setAttribute('cx', cx);
          c.setAttribute('cy', cy);
          c.setAttribute('r', '1');
          svg.appendChild(c);
        }
        grip.appendChild(svg);
        handle.appendChild(grip);
      }

      handle.addEventListener('mousedown', (e) => {
        if (disabled) return;
        e.preventDefault();
        const start = horizontalIs ? e.clientX : e.clientY;
        // A conta parte SEMPRE do tamanho do mousedown: somar incrementos a cada
        // mousemove acumula o erro e o divisor descola do cursor.
        const base = [...sizes];
        let arrastando = true;

        const onMove = (ev: MouseEvent) => {
          if (!arrastando) return;
          const totalPx = horizontalIs ? root.offsetWidth : root.offsetHeight;
          if (!totalPx) return;
          const pos = horizontalIs ? ev.clientX : ev.clientY;
          aplicar(i, ((pos - start) / totalPx) * 100, base);
        };

        const onUp = () => {
          if (!arrastando) return;
          arrastando = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          soltarArrasto = null;
          finalizar();
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        // O par só se desfaz no `mouseup`. Quem tirasse o grupo da página com o
        // botão ainda pressionado — arrastar e a tela trocar debaixo do
        // ponteiro — deixava `mousemove` e `mouseup` vivos no `document`,
        // recalculando larguras de painéis que já não existiam.
        soltarArrasto = onUp;
      });

      /**
       * O equivalente por teclado do arrasto (WCAG 2.1.1 e 2.5.7).
       *
       * As setas do eixo do grupo movem um passo; as do outro eixo são
       * ignoradas de propósito, para não roubar a rolagem de quem só está
       * passando o foco.
       */
      handle.addEventListener('keydown', (e) => {
        if (disabled) return;
        const sum = (sizes[i] ?? 0) + (sizes[i + 1] ?? 0);
        let delta = 0;
        switch (e.key) {
          case 'ArrowRight': if (horizontalIs) delta = STEP_KEYBOARD; break;
          case 'ArrowLeft':  if (horizontalIs) delta = -STEP_KEYBOARD; break;
          case 'ArrowDown':  if (!horizontalIs) delta = STEP_KEYBOARD; break;
          case 'ArrowUp':    if (!horizontalIs) delta = -STEP_KEYBOARD; break;
          case 'Home': delta = minimumOf(i) - sizes[i]; break;
          case 'End':  delta = Math.min(maximoDe(i), sum - minimumOf(i + 1)) - sizes[i]; break;
          case 'Enter': delta = (panels[i].defaultSize ?? sizes[i]) - sizes[i]; break;
          default: return;
        }
        if (delta === 0 && !['Home', 'End', 'Enter'].includes(e.key)) return;
        e.preventDefault();
        aplicar(i, delta, [...sizes]);
        finalizar();
      });

      handleEls.push(handle);
      root.appendChild(handle);
    }
  });

  handleEls.forEach((_, i) => anunciar(i));

  return tornarDestruivel(root, root, () => {
    soltarArrasto?.();
  });
}
