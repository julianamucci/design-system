import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from 'lucide-vue-next';

const meta = {
  title: 'UI/ToggleGroup/Variantes',
  component: ToggleGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do ToggleGroup: single (seleção exclusiva), multiple (combinada) e vertical (orientação empilhada).',
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" default-value="center" aria-label="Alinhamento do texto">
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
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    await step('Single tem item inicial pressionado', async () => {
      await expect(center).toHaveAttribute('aria-pressed', 'true');
    });
    await step('aria-label presente no grupo', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]');
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });
  },
};

export const Multiple: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, Bold, Italic, Underline },
    setup() { return {}; },
    template: `
      <ToggleGroup type="multiple" :default-value="['bold', 'italic']" aria-label="Formatação">
        <ToggleGroupItem value="bold" aria-label="Negrito">
          <Bold aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico">
          <Italic aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Sublinhado">
          <Underline aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Negrito' });
    const italic = canvas.getByRole('button', { name: 'Itálico' });
    const underline = canvas.getByRole('button', { name: 'Sublinhado' });
    await step('Multiple permite múltiplos itens pressionados', async () => {
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
      await expect(italic).toHaveAttribute('aria-pressed', 'true');
      await expect(underline).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, LayoutGrid, List },
    setup() { return {}; },
    template: `
      <ToggleGroup
        type="single"
        orientation="vertical"
        variant="outline"
        default-value="grid"
        aria-label="Modo de visualização"
      >
        <ToggleGroupItem value="grid" aria-label="Grade">
          <LayoutGrid aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="Lista">
          <List aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('button', { name: 'Grade' });
    await step('Vertical reflete orientation no DOM', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]');
      await expect(group).toHaveAttribute('data-orientation', 'vertical');
    });
    await step('Item inicial está pressionado', async () => {
      await expect(grid).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
