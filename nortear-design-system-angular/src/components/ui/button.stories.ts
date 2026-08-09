import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { NdsButton, NdsButtonIcon, type ButtonVariant, type ButtonSize } from './button';
import { NdsButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ButtonArgs = {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  disabled: boolean;
  onClick?: (e: MouseEvent) => void;
  // Documentadas na aba "API Reference" sem control — o Playground não as
  // encaminha para o componente, mas fazem parte da API do NdsButton.
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
};

const meta: Meta<ButtonArgs> = {
  title: 'UI/Button',
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

/**
 * Ver a nota em separator.stories.ts: o painel Code mostra o `template` da
 * story, com o `@if` que alterna texto e ícone e os bindings ligados aos args.
 * O `transform` devolve o uso real, com os valores atuais dos controls.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ButtonArgs> }): string {
  const { variant = 'default', size = 'default', label = 'Salvar', disabled = false } =
    ctx.args ?? {};
  const isIcon = size.startsWith('icon');

  // Só o que difere do default entra no snippet — documentação que repete
  // valor padrão ensina ruído.
  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    size === 'default' ? '' : `size="${size}"`,
    disabled ? '[disabled]="true"' : '',
    isIcon ? `aria-label="${label || 'Ação'}"` : '',
  ].filter(Boolean).join(' ');

  const abre = attrs ? `<button ndsButton ${attrs}>` : '<button ndsButton>';
  const conteudo = isIcon
    ? '      <svg ndsButtonIcon kind="plus"></svg>'
    : `      ${label}`;

  return `import { NdsButton${isIcon ? ', NdsButtonIcon' : ''} } from '@/components/ui/button';

@Component({
  imports: [NdsButton${isIcon ? ', NdsButtonIcon' : ''}],
  template: \`
    ${abre}
${conteudo}
    </button>
  \`,
})
export class Exemplo {}`;
}

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
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
