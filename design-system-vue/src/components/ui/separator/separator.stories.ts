import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Separator } from './index';
import SeparatorDocs from '@/components/docs/SeparatorDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<any> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SeparatorDocs),
      description: {
        component:
          'Separator é um divisor visual de 1px que separa grupos de conteúdo relacionados em layouts horizontais ou verticais. Componente passivo baseado em reka-ui, com modo decorativo (padrão) ou semântico (role=separator).',
      },
    },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do divisor.',
    },
    decorative: {
      control: { type: 'boolean' },
      description:
        'Quando true, oculta de leitores de tela (role=none). Quando false, anuncia como separator.',
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Separator },
    setup() {
      return { args };
    },
    template: `
      <div :class="args.orientation === 'vertical' ? 'flex h-16 items-center gap-4 w-[320px]' : 'w-[320px] space-y-4'">
        <div class="text-sm text-muted-foreground">{{ args.orientation === 'vertical' ? 'Item A' : 'Bloco superior' }}</div>
        <Separator :orientation="args.orientation" :decorative="args.decorative" />
        <div class="text-sm text-muted-foreground">{{ args.orientation === 'vertical' ? 'Item B' : 'Bloco inferior' }}</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Separator com data-slot=separator está presente', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toBeInTheDocument();
    });

    await step('Modo decorativo padrão tem role=none', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toHaveAttribute('role', 'none');
    });

    await step('data-orientation reflete a prop orientation', async () => {
      const separator = canvasElement.querySelector('[data-slot="separator"]');
      await expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Conteúdo adjacente renderiza corretamente', async () => {
      const top = canvas.getByText('Bloco superior');
      await expect(top).toBeVisible();
    });
  },
};
