import { cn } from '@/lib/utils';

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
  root.className = cn(
    'flex w-full h-full',
    isHorizontal ? 'flex-row' : 'flex-col',
    options.class
  );
  root.style.overflow = 'hidden';

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
    panelEl.style.overflow = 'auto';
    panelEl.style.flexShrink = '0';
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
      handle.setAttribute('tabindex', '0');
      handle.className = cn(
        'relative flex shrink-0 items-center justify-center bg-border',
        isHorizontal
          ? 'w-px cursor-col-resize hover:bg-ring focus-visible:ring-1 focus-visible:ring-ring'
          : 'h-px cursor-row-resize hover:bg-ring focus-visible:ring-1 focus-visible:ring-ring'
      );

      // Drag handle icon
      const grip = document.createElement('div');
      grip.className = cn(
        'z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border',
        isHorizontal ? '' : 'rotate-90'
      );
      grip.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>';
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
