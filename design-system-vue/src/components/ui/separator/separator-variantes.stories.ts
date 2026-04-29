import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Separator } from './index';

const meta = {
  title: 'UI/Separator/Variantes',
  component: Separator,
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Separator pela direção do divisor: horizontal (h-px w-full) e vertical (w-px h-full em flex container).',
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="w-[360px] space-y-3">
        <div class="text-sm">Section A — conteúdo acima do divisor.</div>
        <Separator orientation="horizontal" />
        <div class="text-sm">Section B — conteúdo abaixo do divisor.</div>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="flex h-10 items-center gap-4 text-sm">
        <span>Início</span>
        <Separator orientation="vertical" />
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Sobre</span>
      </div>
    `,
  }),
};
