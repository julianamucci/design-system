import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createScrollArea } from './scroll-area';
import { createScrollAreaDocs } from '@/components/docs/ScrollAreaDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ScrollAreaArgs = {
  height: string;
  width: string;
  itemCount: number;
  className: string;
};

const meta: Meta<ScrollAreaArgs> = {
  title: 'UI/ScrollArea',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createScrollAreaDocs) },
  },
  argTypes: {
    height: {
      control: 'text',
      description: 'Altura do root (e maxHeight do viewport). OBRIGATÓRIA para o scroll funcionar.',
    },
    width: {
      control: 'text',
      description: 'Largura do root. Útil para scroll horizontal.',
    },
    itemCount: {
      control: { type: 'number', min: 1, max: 100, step: 1 },
      description: 'Número de itens da lista de demonstração.',
    },
    className: {
      control: 'text',
      description: 'Classes Tailwind extras no root.',
    },
  },
  args: {
    height: '240px',
    width: '100%',
    itemCount: 30,
    className: 'rounded-md border',
  },
};

export default meta;
type Story = StoryObj<ScrollAreaArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildList(count: number): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-list-none';
  ul.dataset.spacing = 'sm';
  ul.style.padding = '0.75rem';
  ul.style.margin = '0';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    li.className = 'nds-text-body nds-border-b-soft';
    li.style.paddingBottom = '0.5rem';
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  return ul;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createScrollArea({
      height: args.height || undefined,
      width: args.width || undefined,
      class: args.className || undefined,
      children: buildList(args.itemCount),
    }));
    return wrap;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Root tem data-slot="scroll-area" e classe base', async () => {
      const root = canvasElement.querySelector('[data-slot="scroll-area"]') as HTMLElement | null;
      await expect(root).toBeTruthy();
      await expect(root).toHaveClass('nds-scroll-area');
    });

    await step('Viewport tem data-slot e classe base', async () => {
      const viewport = canvasElement.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
      await expect(viewport).toBeTruthy();
      await expect(viewport).toHaveClass('nds-scroll-area-viewport');
    });

    await step('Altura do root é aplicada via style inline', async () => {
      const root = canvasElement.querySelector('[data-slot="scroll-area"]') as HTMLElement | null;
      await expect(root!.style.height).toBe(args.height);
    });

    await step('Conteúdo é renderizado dentro do viewport', async () => {
      const items = canvas.getAllByText(/Item \d+/);
      await expect(items.length).toBe(args.itemCount);
    });
  },
};
