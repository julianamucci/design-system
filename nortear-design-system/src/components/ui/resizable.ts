// ─── Resizable — Vanilla factory standalone ─────────────────────────────────
// Visual: classes .nds-resizable-* (zero Tailwind/basecoat-css).
// Drag handle + keyboard resize (Arrow keys).

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResizablePanel = {
  content: HTMLElement;
  defaultSize?: number;
  minSize?: number;
};

export type ResizablePanelOptions = {
  direction?: 'horizontal' | 'vertical';
  panels: ResizablePanel[];
  class?: string;
};

// ─── createResizablePanel ─────────────────────────────────────────────────────

export function createResizablePanel(options: ResizablePanelOptions): HTMLElement {
  const { direction = 'horizontal', panels } = options;
  const isHorizontal = direction === 'horizontal';
  const count = panels.length;

  const root = document.createElement('div');
  root.dataset.slot = 'resizable';
  root.dataset.direction = direction;
  root.className = 'nds-resizable';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  // Distribute sizes
  const defaultSizes = panels.map((p) => p.defaultSize ?? 100 / count);
  const sizes = [...defaultSizes];

  const panelEls: HTMLElement[] = [];

  function applySize(i: number): void {
    const p = panelEls[i];
    if (isHorizontal) {
      p.style.width = `${sizes[i]}%`;
      p.style.height = '100%';
    } else {
      p.style.height = `${sizes[i]}%`;
      p.style.width = '100%';
    }
  }

  panels.forEach((panel, i) => {
    const panelEl = document.createElement('div');
    panelEl.dataset.slot = 'resizable-panel';
    panelEl.className = 'nds-resizable-panel';
    // Panels may overflow — make them focusable for keyboard scroll (WCAG SC 2.1.1).
    panelEl.setAttribute('tabindex', '0');
    panelEl.appendChild(panel.content);
    panelEls.push(panelEl);
    root.appendChild(panelEl);
    applySize(i);

    // Add handle between panels (not after the last)
    if (i < panels.length - 1) {
      const handle = document.createElement('div');
      handle.dataset.slot = 'resizable-handle';
      handle.setAttribute('role', 'separator');
      handle.setAttribute('aria-orientation', isHorizontal ? 'vertical' : 'horizontal');
      handle.setAttribute('aria-valuenow', '50');
      handle.setAttribute('aria-valuemin', '0');
      handle.setAttribute('aria-valuemax', '100');
      handle.setAttribute('tabindex', '0');
      handle.className = 'nds-resizable-handle';

      // Grip (alça com pontos) — SVG via createElementNS (sem innerHTML).
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

      // Drag logic
      let dragging = false;
      let startPos = 0;
      let startSizeA = 0;
      let startSizeB = 0;
      const minA = panels[i].minSize ?? 10;
      const minB = panels[i + 1].minSize ?? 10;

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        startPos = isHorizontal ? e.clientX : e.clientY;
        startSizeA = sizes[i];
        startSizeB = sizes[i + 1];

        const onMove = (e: MouseEvent) => {
          if (!dragging) return;
          const pos = isHorizontal ? e.clientX : e.clientY;
          const delta = pos - startPos;
          const totalPx = isHorizontal ? root.offsetWidth : root.offsetHeight;
          const deltaPct = (delta / totalPx) * 100;
          let newA = startSizeA + deltaPct;
          let newB = startSizeB - deltaPct;
          if (newA < minA) { newB += newA - minA; newA = minA; }
          if (newB < minB) { newA += newB - minB; newB = minB; }
          sizes[i] = newA;
          sizes[i + 1] = newB;
          applySize(i);
          applySize(i + 1);
        };

        const onUp = () => {
          dragging = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      // Keyboard resize
      handle.addEventListener('keydown', (e) => {
        const step = 2;
        const minA = panels[i].minSize ?? 10;
        const minB = panels[i + 1].minSize ?? 10;
        let delta = 0;
        if (isHorizontal && e.key === 'ArrowRight') delta = step;
        if (isHorizontal && e.key === 'ArrowLeft') delta = -step;
        if (!isHorizontal && e.key === 'ArrowDown') delta = step;
        if (!isHorizontal && e.key === 'ArrowUp') delta = -step;
        if (delta === 0) return;
        e.preventDefault();
        let newA = sizes[i] + delta;
        let newB = sizes[i + 1] - delta;
        if (newA < minA) { newB += newA - minA; newA = minA; }
        if (newB < minB) { newA += newB - minB; newB = minB; }
        sizes[i] = newA;
        sizes[i + 1] = newB;
        applySize(i);
        applySize(i + 1);
      });

      root.appendChild(handle);
    }
  });

  return root;
}
