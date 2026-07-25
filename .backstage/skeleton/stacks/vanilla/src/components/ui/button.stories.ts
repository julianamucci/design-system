import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createButton, createButtonIcon, type ButtonVariant, type ButtonSize } from './button';
import { createButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ButtonArgs = {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  disabled: boolean;
  onClick?: (e: MouseEvent) => void;
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
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Variante visual nativa do Button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Tamanho do Button',
    },
    label:    { control: 'text',    description: 'Texto visível do botão' },
    disabled: { control: 'boolean', description: 'Desabilita o botão'      },
  },
  args: {
    variant:  'default',
    size:     'default',
    label:    'Salvar',
    disabled: false,
    onClick:  fn(),
  },
};

export default meta;
type Story = StoryObj<ButtonArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const isIcon = args.size === 'icon' || args.size === 'icon-sm' || args.size === 'icon-lg';
    const btn = createButton({
      variant: args.variant,
      size: args.size,
      label: isIcon ? undefined : args.label,
      ariaLabel: isIcon ? (args.label || 'Ação') : undefined,
      disabled: args.disabled,
      onClick: args.onClick,
    });
    if (isIcon) btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão visível no DOM', async () => {
      await expect(button).toBeVisible();
    });

    await step('Clique dispara onClick', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalled();
    });

    await step('Recebe foco via teclado', async () => {
      (button as HTMLElement).focus();
      await expect(button).toHaveFocus();
    });

    await step('Enter aciona o botão', async () => {
      (args.onClick as ReturnType<typeof fn>).mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(args.onClick).toHaveBeenCalled();
    });

    await step('Space aciona o botão', async () => {
      (args.onClick as ReturnType<typeof fn>).mockClear();
      await userEvent.keyboard(' ');
      await expect(args.onClick).toHaveBeenCalled();
    });
  },
};
