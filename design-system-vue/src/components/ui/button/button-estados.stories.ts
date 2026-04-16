import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Button } from './index';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'UI/Button/Estados',
  component: Button,
  args: {
    variant: 'default',
    size: 'default',
    onClick: fn(),
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `<Button v-bind="args" @click="args.onClick">Botão</Button>`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão possui atributo disabled no DOM', async () => {
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute('disabled');
    });

    await step('Clicar no botão disabled não dispara onClick', async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado desabilitado — remove pointer-events e aplica opacidade 50%. Não use como único feedback de validação; combine com mensagens de erro contextuais.',
      },
    },
  },
};

// ─── Loading ──────────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: 'Loading',
  args: { disabled: true },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: `
      <Button v-bind="args">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 animate-spin">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Aguarde…
      </Button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await step('Botão em loading possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado de carregamento. Combine `disabled` com um ícone animado via `animate-spin`. Impede cliques duplos e dá feedback visual.',
      },
    },
  },
};
