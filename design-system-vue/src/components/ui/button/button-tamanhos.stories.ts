import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Button } from './index';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'UI/Button/Tamanhos',
  component: Button,
  args: {
    variant: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Small ────────────────────────────────────────────────────────────────────

export const Small: Story = {
  args: { size: 'sm' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `<Button v-bind="args">Botão</Button>`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tamanho compacto (h-8) para contextos com espaço reduzido — toolbars, tabelas e cards densos.',
      },
    },
  },
};

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { size: 'default' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `<Button v-bind="args">Botão</Button>`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tamanho padrão (h-9). Adequado para a maioria dos contextos de interface.',
      },
    },
  },
};

// ─── Large ────────────────────────────────────────────────────────────────────

export const Large: Story = {
  args: { size: 'lg' },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `<Button v-bind="args">Botão</Button>`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tamanho expandido (h-10) para CTAs de destaque — hero sections e landing pages.',
      },
    },
  },
};

// ─── IconOnly ─────────────────────────────────────────────────────────────────

export const IconOnly: Story = {
  args: { size: 'icon' },
  render: () => ({
    components: { Button },
    template: `
      <Button size="icon" aria-label="Fechar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </Button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Botão icon-only possui aria-label acessível', async () => {
      const button = canvas.getByRole('button', { name: 'Fechar' });
      await expect(button).toHaveAttribute('aria-label', 'Fechar');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tamanho quadrado (size-9). **Obrigatório** passar `aria-label` descritivo — sem ele o botão é inacessível para leitores de tela.',
      },
    },
  },
};
