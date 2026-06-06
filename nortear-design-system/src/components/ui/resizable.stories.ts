import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { createResizableDocs } from '@/components/docs/ResizableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ResizableArgs = {
  direction: 'horizontal' | 'vertical';
  defaultSizeA: number;
  minSizeA: number;
  defaultSizeB: number;
  minSizeB: number;
  withHandle: boolean;
};

const meta: Meta<ResizableArgs> = {
  title: 'UI/Resizable',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createResizableDocs) },
  },
  argTypes: {
    direction: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do PanelGroup — horizontal (split lateral) ou vertical (split vertical).',
    },
    defaultSizeA: {
      control: { type: 'number', min: 5, max: 95, step: 5 },
      description: 'Tamanho inicial do painel A (porcentagem 0–100).',
    },
    minSizeA: {
      control: { type: 'number', min: 0, max: 50, step: 5 },
      description: 'Tamanho mínimo do painel A em porcentagem.',
    },
    defaultSizeB: {
      control: { type: 'number', min: 5, max: 95, step: 5 },
      description: 'Tamanho inicial do painel B (porcentagem 0–100).',
    },
    minSizeB: {
      control: { type: 'number', min: 0, max: 50, step: 5 },
      description: 'Tamanho mínimo do painel B em porcentagem.',
    },
    withHandle: {
      control: 'boolean',
      description:
        'Pegador visual no Handle. NOTA: factory Basecoat SEMPRE exibe o grip visual — argType para paridade conceitual com react-resizable-panels/reka-ui Splitter/paneforge.',
    },
  },
  args: {
    direction: 'horizontal',
    defaultSizeA: 30,
    minSizeA: 15,
    defaultSizeB: 70,
    minSizeB: 30,
    withHandle: true,
  },
};

export default meta;
type Story = StoryObj<ResizableArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function panelContent(label: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `nds-cluster nds-text-body nds-font-medium ${extraClass}`.trim();
  el.dataset.justify = 'center';
  el.dataset.align = 'center';
  el.style.height = '100%';
  el.style.width = '100%';
  el.style.padding = '1rem';
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

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const root = createResizablePanel({
      direction: args.direction,
      panels: [
        { defaultSize: args.defaultSizeA, minSize: args.minSizeA, content: panelContent('Painel A', 'nds-bg-muted nds-text-muted-foreground')},
        { defaultSize: args.defaultSizeB, minSize: args.minSizeB, content: panelContent('Painel B') },
      ],
    });
    const handle = root.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
    handle?.setAttribute('aria-label', 'Redimensionar painéis — use setas para ajustar');
    return frame(root, args.direction === 'vertical' ? '280px' : '220px');
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Root tem data-slot=resizable', async () => {
      const root = canvasElement.querySelector('[data-slot="resizable"]');
      await expect(root).toBeTruthy();
    });

    await step('Handle tem role=separator + aria-orientation correto', async () => {
      const handle = canvas.getByRole('separator');
      await expect(handle).toBeTruthy();
      const expectedOrientation = args.direction === 'horizontal' ? 'vertical' : 'horizontal';
      await expect(handle).toHaveAttribute('aria-orientation', expectedOrientation);
      await expect(handle).toHaveAttribute('tabindex', '0');
    });

    await step('Handle tem aria-label descritivo', async () => {
      const handle = canvas.getByRole('separator');
      await expect(handle).toHaveAttribute('aria-label', 'Redimensionar painéis — use setas para ajustar');
    });

    await step('Seta de teclado ajusta o tamanho (WCAG 2.5.7)', async () => {
      const handle = canvas.getByRole('separator');
      handle.focus();
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      const before = args.direction === 'horizontal' ? panels[0].style.width : panels[0].style.height;
      const key = args.direction === 'horizontal' ? '{ArrowRight}' : '{ArrowDown}';
      await userEvent.keyboard(key);
      const after = args.direction === 'horizontal' ? panels[0].style.width : panels[0].style.height;
      await expect(after).not.toBe(before);
    });
  },
};
