import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Variantes e tamanhos ─────────────────────────────────────────────────────

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

const VARIANT_CLASSES: Record<string, string> = {
  default:     `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`,
  destructive: `${BTN_BASE} bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20`,
  outline:     `${BTN_BASE} border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground`,
  secondary:   `${BTN_BASE} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  ghost:       `${BTN_BASE} hover:bg-accent hover:text-accent-foreground`,
  link:        `${BTN_BASE} text-primary underline-offset-4 hover:underline`,
};

const SIZE_CLASSES: Record<string, string> = {
  'default':  'h-9 px-4 py-2',
  'sm':       'h-8 px-3 rounded-md',
  'lg':       'h-10 px-6 rounded-md',
  'icon':     'size-9',
  'icon-sm':  'size-8',
  'icon-lg':  'size-10',
};

function buildButton(args: {
  variant?: string;
  size?: string;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  onClick?: (e: MouseEvent) => void;
}): HTMLButtonElement {
  const variant = args.variant ?? 'default';
  const size = args.size ?? 'default';

  const el = document.createElement('button');
  el.type = 'button';
  el.className = [VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default, SIZE_CLASSES[size] ?? SIZE_CLASSES.default].join(' ');
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
