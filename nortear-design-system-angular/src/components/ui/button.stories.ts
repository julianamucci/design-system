import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { NdsButton, NdsButtonIcon } from './button';
import { buttonPlaygroundSource, type ButtonArgs } from './button.source';
import { NdsButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<ButtonArgs> = {
  title: 'Components/Form/Button',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsButton, NdsButtonIcon] })],
  parameters: {
    design: figmaDesign('button'),
    docs: { page: withAutoDocsTab(NdsButtonDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Variante visual nativa do Button',
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
      description: 'Tamanho do Button',
    },
    label:    { control: 'text',    description: 'Texto visível do botão' },
    disabled: { control: 'boolean', description: 'Desabilita o botão'      },
    ariaLabel: {
      control: false,
      description: 'Nome acessível. Obrigatório em botões icon-only.',
      table: { type: { summary: 'string' } },
    },
    type: {
      control: false,
      description: 'Tipo HTML do botão. Use "submit" dentro de forms.',
      table: { type: { summary: '"button" | "submit" | "reset"' }, defaultValue: { summary: '"button"' } },
    },
    class: {
      control: false,
      description: 'Classes adicionais, mescladas com as da variante.',
      table: { type: { summary: 'string' } },
    },
    onClick: {
      control: false,
      description: 'Callback disparado ao clique. Não dispara quando desabilitado.',
      table: { type: { summary: '(e: MouseEvent) => void' } },
    },
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
  parameters: {
    docs: { source: { transform: buttonPlaygroundSource } },
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => {
    const isIcon = args.size.startsWith('icon');
    return {
      props: {
        ...args,
        isIcon,
        // Nome acessível vem do label quando não há texto visível — mesma
        // regra do Vanilla para botões icon-only.
        computedAriaLabel: isIcon ? args.label || 'Ação' : null,
      },
      template: `
        <button
          ndsButton
          [variant]="variant"
          [size]="size"
          [disabled]="disabled"
          [attr.aria-label]="computedAriaLabel"
          (click)="onClick($event)"
        >
          @if (isIcon) {
            <svg ndsButtonIcon kind="plus"></svg>
          } @else {
            {{ label }}
          }
        </button>
      `,
    };
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão visível no DOM', async () => {
      await expect(button).toBeVisible();
    });

    await step('Classe .nds-button aplicada pelo componente', async () => {
      // O spike existe para provar que o CSS compartilhado alcança o Angular:
      // sem esta asserção, um botão sem estilo passaria despercebido.
      await expect(button).toHaveClass(/nds-button/);
      await expect(button).toHaveClass(/nds-button-default/);
    });

    await step('Clique dispara onClick', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalled();
    });

    await step('Tab leva o foco ao botão', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural do DOM". Forçar o foco passaria até com tabindex="-1".
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
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
