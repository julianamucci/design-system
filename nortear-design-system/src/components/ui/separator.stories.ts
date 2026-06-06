import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSeparator } from './separator';
import { createSeparatorDocs } from '@/components/docs/SeparatorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SeparatorArgs = {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
};

const meta: Meta<SeparatorArgs> = {
  title: 'UI/Separator',
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createSeparatorDocs) },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do divisor.',
    },
    decorative: {
      control: 'boolean',
      description:
        'Quando true (padrão), aplica role=none e aria-hidden. Quando false, expõe role=separator + aria-orientation.',
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
};

export default meta;
type Story = StoryObj<SeparatorArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    if (args.orientation === 'horizontal') {
      wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
      wrapper.dataset.spacing = 'md';
    } else {
      wrapper.className = 'nds-cluster nds-w-full nds-max-w-md';
      wrapper.style.height = '4rem';
    }

    if (args.orientation === 'horizontal') {
      const top = document.createElement('p');
      top.className = 'nds-text-body nds-text-foreground';
      top.textContent = 'Seção superior';

      const bottom = document.createElement('p');
      bottom.className = 'nds-text-body nds-text-muted-foreground';
      bottom.textContent = 'Seção inferior';

      wrapper.append(
        top,
        createSeparator({ orientation: args.orientation, decorative: args.decorative }),
        bottom,
      );
    } else {
      const left = document.createElement('span');
      left.className = 'nds-text-body nds-text-foreground';
      left.textContent = 'Item A';

      const right = document.createElement('span');
      right.className = 'nds-text-body nds-text-muted-foreground';
      right.textContent = 'Item B';

      wrapper.append(
        left,
        createSeparator({ orientation: args.orientation, decorative: args.decorative }),
        right,
      );
    }

    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const _canvas = within(canvasElement);

    await step('Renderiza um divisor com .nds-separator', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('.nds-separator');
      await expect(separator).toBeTruthy();
    });

    if (args.decorative) {
      await step('Modo decorativo: role=none e aria-hidden', async () => {
        const separator = canvasElement.querySelector<HTMLElement>('[role="none"]');
        await expect(separator).toBeTruthy();
        await expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    } else {
      await step('Modo semântico: role=separator e aria-orientation', async () => {
        const separator = canvasElement.querySelector<HTMLElement>('[role="separator"]');
        await expect(separator).toBeTruthy();
        await expect(separator).toHaveAttribute('aria-orientation', args.orientation);
      });
    }
  },
};
