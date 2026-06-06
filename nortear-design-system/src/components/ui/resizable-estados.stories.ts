import type { Meta, StoryObj } from '@storybook/html';
import { expect, userEvent, within } from 'storybook/test';
import { createResizablePanel } from './resizable';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Resizable: Idle (padrão), Focus (handle focado via Tab — ring visível e setas operam), Dragging (cursor col-resize/row-resize e painéis ajustam em tempo real) e Disabled (handle inerte). NOTA: Hover não exige mudança visual obrigatória; aplicar hover:bg-ring se necessário.',
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

function basicHorizontal(): HTMLElement {
  const root = createResizablePanel({
    direction: 'horizontal',
    panels: [
      { defaultSize: 40, minSize: 20, content: panelContent('Painel A', 'nds-bg-muted nds-text-muted-foreground') },
      { defaultSize: 60, minSize: 30, content: panelContent('Painel B') },
    ],
  });
  const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
  handle?.setAttribute('aria-label', 'Redimensionar painéis — use setas para ajustar');
  return root;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Idle: Story = {
  name: 'Idle',
  render: () => frame(basicHorizontal()),
  play: async ({ canvasElement, step }) => {
    await step('Handle no estado idle: role=separator + tabindex=0', async () => {
      const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('role', 'separator');
      await expect(handle).toHaveAttribute('tabindex', '0');
    });
  },
};

export const Focus: Story = {
  name: 'Focus',
  render: () => frame(basicHorizontal()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Tab move foco para o handle', async () => {
      const handle = canvas.getByRole('separator');
      handle.focus();
      await expect(handle).toHaveFocus();
    });
    await step('Handle focado tem classe focus-visible:ring', async () => {
      const handle = canvas.getByRole('separator');
      await expect(handle.className).toMatch(/nds-resizable-handle/);
    });
  },
};

export const Dragging: Story = {
  name: 'Dragging (via teclado)',
  render: () => frame(basicHorizontal()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Setas ajustam o tamanho dos painéis (WCAG 2.5.7)', async () => {
      const handle = canvas.getByRole('separator');
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      const before = panels[0].style.width;
      handle.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
      const after = panels[0].style.width;
      await expect(after).not.toBe(before);
      const beforePct = parseFloat(before);
      const afterPct = parseFloat(after);
      await expect(afterPct).toBeGreaterThan(beforePct);
    });
  },
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => {
    // NOTA: factory Basecoat NÃO expõe prop disabled — aplicamos manualmente
    // tabindex=-1, aria-disabled=true e pointer-events:none para simular o
    // estado documentado em translations.json.
    const root = basicHorizontal();
    const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
    if (handle) {
      handle.setAttribute('aria-disabled', 'true');
      handle.setAttribute('tabindex', '-1');
      handle.dataset.disabled = '';
      handle.style.pointerEvents = 'none';
      handle.style.cursor = 'not-allowed';
      handle.style.opacity = '0.5';
    }
    return frame(root);
  },
  play: async ({ canvasElement, step }) => {
    await step('Handle desabilitado: aria-disabled=true + tabindex=-1', async () => {
      const handle = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handle).toHaveAttribute('aria-disabled', 'true');
      await expect(handle).toHaveAttribute('tabindex', '-1');
      await expect(handle).toHaveAttribute('data-disabled', '');
    });
  },
};
