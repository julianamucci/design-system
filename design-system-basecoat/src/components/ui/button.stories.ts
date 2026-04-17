import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function btnClass(variant = 'default', size = 'default'): string {
  const prefix = size === 'icon' ? 'btn-icon' : size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn';
  return variant === 'default' ? prefix : `${prefix}-${variant}`;
}

function buildButton(args: {
  variant?: string;
  size?: string;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  onClick?: (e: MouseEvent) => void;
}): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = btnClass(args.variant, args.size);
  if (args.label) el.textContent = args.label;
  if (args.ariaLabel) el.setAttribute('aria-label', args.ariaLabel);
  if (args.disabled) el.disabled = true;
  if (args.onClick) el.addEventListener('click', args.onClick);
  return el;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ButtonArgs = {
  variant: string;
  size: string;
  disabled: boolean;
  label: string;
  onClick: (e: MouseEvent) => void;
};

const meta: Meta<ButtonArgs> = {
  title: 'UI/Button',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createButtonDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      description: 'Define o estilo visual do botão',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      description: 'Define o tamanho e o preenchimento',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o botão — remove interatividade e aplica opacidade 50%',
    },
    label: {
      control: 'text',
      description: 'Texto do botão',
    },
    onClick: { action: 'clicked' },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    label: 'Button',
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<ButtonArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O Playground é a story principal onde todas as propriedades podem ser testadas interativamente.
 *
 * @summary Demonstração interativa do componente Button.
 */
export const Playground: Story = {
  render: (args) => buildButton(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Clica no botão habilitado', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    await step('Botão permanece habilitado após interação', async () => {
      await expect(button).toBeEnabled();
      await expect(button).not.toHaveAttribute('disabled');
    });

    await step('Botão recebe foco → focus-visible disponível', async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });

    await step('Pressiona Enter com foco → onClick dispara', async () => {
      button.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });

    await step('Pressiona Space com foco → onClick dispara', async () => {
      button.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard(' ');
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cobre os 5 critérios de teste: clique, estado habilitado, foco, Enter e Space. Veja a aba **Interactions**.',
      },
    },
  },
};
