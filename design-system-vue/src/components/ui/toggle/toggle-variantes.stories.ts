import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold, Italic, Eye } from 'lucide-vue-next';

const meta = {
  title: 'UI/Toggle/Variantes',
  component: Toggle,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Toggle: default (sem borda), outline (borda input) e withLabel (ícone + texto visível).',
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Toggle, Bold },
    setup() { return {}; },
    template: `
      <Toggle aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });
    await step('Toggle default renderiza icon-only com aria-label', async () => {
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
    await step('Ícone interno tem aria-hidden=true', async () => {
      const svg = toggle.querySelector('svg');
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Outline: Story = {
  render: () => ({
    components: { Toggle, Italic },
    setup() { return {}; },
    template: `
      <Toggle variant="outline" aria-label="Itálico">
        <Italic aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Itálico' });
    await step('Toggle outline renderiza com borda input', async () => {
      await expect(toggle).toBeInTheDocument();
      await expect(toggle.className).toMatch(/border-input/);
    });
  },
};

export const WithLabel: Story = {
  render: () => ({
    components: { Toggle, Eye },
    setup() { return {}; },
    template: `
      <Toggle variant="outline">
        <Eye aria-hidden="true" />
        Mostrar ocultos
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: /Mostrar ocultos/i });
    await step('Toggle com label visível renderiza texto', async () => {
      await expect(toggle).toBeInTheDocument();
      await expect(canvas.getByText('Mostrar ocultos')).toBeVisible();
    });
  },
};
