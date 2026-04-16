import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from 'storybook/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2';

function spinnerSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type EstadosArgs = {
  onClick: (e: MouseEvent) => void;
};

const meta: Meta<EstadosArgs> = {
  title: 'UI/Button/Estados',
  args: {
    onClick: fn(),
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<EstadosArgs>;

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: (args) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = BTN_BASE;
    el.textContent = 'Botão';
    el.disabled = true;
    el.addEventListener('click', args.onClick);
    return el;
  },
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
  render: () => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = BTN_BASE;
    el.disabled = true;
    el.innerHTML = `${spinnerSvg()} Aguarde…`;
    return el;
  },
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
