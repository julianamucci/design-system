import type { Meta, StoryObj } from '@storybook/html';
import { expect } from 'storybook/test';
import { createResizablePanel } from './resizable';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Resizable: Horizontal (split lateral com handle vertical), Vertical (split vertical com handle horizontal) e Nested (PanelGroup dentro de Panel combinando direções).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function panelContent(label: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `nds-cluster nds-w-full nds-p-4 nds-text-body nds-font-medium ${extraClass}`.trim();
  el.dataset.justify = 'center';
  el.style.height = '100%';
  const span = document.createElement('span');
  span.textContent = label;
  el.appendChild(span);
  return el;
}

function frame(child: HTMLElement, minHeight = '220px'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.contain = 'layout';
  wrap.style.minHeight = minHeight;
  wrap.className = 'nds-w-full nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background';
  wrap.appendChild(child);
  return wrap;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => {
    const root = createResizablePanel({
      direction: 'horizontal',
      panels: [
        { defaultSize: 30, minSize: 15, content: panelContent('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
        { defaultSize: 70, minSize: 30, content: panelContent('Conteúdo principal') },
      ],
    });
    const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
    handle?.setAttribute('aria-label', 'Redimensionar Sidebar e Conteúdo — use setas para ajustar');
    return frame(root, '220px');
  },
  play: async ({ canvasElement, step }) => {
    await step('PanelGroup horizontal: handle com aria-orientation=vertical', async () => {
      const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handle).toBeTruthy();
      await expect(handle).toHaveAttribute('role', 'separator');
      await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    });
    await step('Painéis aplicam width em porcentagem', async () => {
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      await expect(panels.length).toBe(2);
      await expect(panels[0].style.width).toBe('30%');
      await expect(panels[1].style.width).toBe('70%');
    });
  },
};

export const Vertical: Story = {
  name: 'Vertical',
  render: () => {
    const root = createResizablePanel({
      direction: 'vertical',
      panels: [
        { defaultSize: 50, minSize: 20, content: panelContent('Topo') },
        { defaultSize: 50, minSize: 20, content: panelContent('Rodapé', 'nds-bg-muted nds-text-muted-foreground') },
      ],
    });
    const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
    handle?.setAttribute('aria-label', 'Redimensionar Topo e Rodapé — use setas para ajustar');
    return frame(root, '280px');
  },
  play: async ({ canvasElement, step }) => {
    await step('PanelGroup vertical: handle com aria-orientation=horizontal', async () => {
      const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    });
    await step('Painéis aplicam height em porcentagem', async () => {
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      await expect(panels[0].style.height).toBe('50%');
      await expect(panels[1].style.height).toBe('50%');
    });
  },
};

export const Nested: Story = {
  name: 'Nested',
  render: () => {
    const inner = createResizablePanel({
      direction: 'vertical',
      panels: [
        { defaultSize: 60, minSize: 20, content: panelContent('Editor') },
        { defaultSize: 40, minSize: 20, content: panelContent('Console', 'nds-bg-muted nds-text-muted-foreground') },
      ],
    });
    const innerWrap = document.createElement('div');
    innerWrap.style.height = '100%';
    innerWrap.style.width = '100%';
    innerWrap.appendChild(inner);

    const root = createResizablePanel({
      direction: 'horizontal',
      panels: [
        { defaultSize: 30, minSize: 15, content: panelContent('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
        { defaultSize: 70, minSize: 30, content: innerWrap },
      ],
    });
    root.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]').forEach((h, i) => {
      h.setAttribute('aria-label', `Redimensionar painéis (handle ${i + 1}) — use setas para ajustar`);
    });
    return frame(root, '320px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Nested: dois PanelGroups com handles em orientações distintas', async () => {
      const handles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handles.length).toBe(2);
      const orientations = Array.from(handles).map(h => h.getAttribute('aria-orientation'));
      await expect(orientations).toContain('vertical');
      await expect(orientations).toContain('horizontal');
    });
  },
};
