import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next';
import ToggleGroupDocs from '@/components/docs/ToggleGroupDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleGroupDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Modo de seleção. Define se modelValue é string ou array.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas.',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual herdado pelos itens.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Altura herdada pelos itens.',
    },
    spacing: {
      control: { type: 'number', min: 0, max: 4, step: 1 },
      description: 'Distância entre itens. 0 conecta bordas (segmented).',
    },
    'onUpdate:modelValue': {
      action: 'update:modelValue',
      description: 'Disparado ao trocar a seleção.',
    },
  },
  args: {
    type: 'single',
    disabled: false,
    orientation: 'horizontal',
    variant: 'default',
    size: 'default',
    spacing: 0,
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return { args }; },
    template: `
      <ToggleGroup
        :key="String(args.type) + String(args.orientation)"
        v-bind="args"
        aria-label="Alinhamento do texto"
      >
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
          <AlignLeft aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar">
          <AlignCenter aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita">
          <AlignRight aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const right = canvas.getByRole('button', { name: 'Alinhar à direita' });

    await step('Grupo renderiza 3 itens com aria-label próprio', async () => {
      await expect(left).toBeInTheDocument();
      await expect(center).toBeInTheDocument();
      await expect(right).toBeInTheDocument();
    });

    await step('Itens começam não-pressionados', async () => {
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      await expect(center).toHaveAttribute('aria-pressed', 'false');
      await expect(right).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Clique em center ativa center (single)', async () => {
      await userEvent.click(center);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Clique em right desativa center (seleção exclusiva)', async () => {
      await userEvent.click(right);
      await expect(right).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('aria-pressed', 'false');
    });

    await step('ArrowRight move foco sem ativar', async () => {
      (right as HTMLElement).focus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(center).toHaveFocus();
    });

    await step('Space alterna o item focado', async () => {
      (center as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await expect(center).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
