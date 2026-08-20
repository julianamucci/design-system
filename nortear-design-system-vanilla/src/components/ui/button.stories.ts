import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createButton, createButtonIcon, type ButtonVariant, type ButtonSize } from './button';
import { buttonPlaygroundSource } from './button.source';
import { createButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ButtonArgs = {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  disabled: boolean;
  onClick?: (e: MouseEvent) => void;
  // Documentadas na aba "API Reference" sem control — o Playground não as
  // encaminha para a factory, mas fazem parte de ButtonOptions.
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
};

const meta: Meta<ButtonArgs> = {
  title: 'UI/Button',
  tags: ['autodocs', 'form'],
  parameters: {
    design: figmaDesign('button'),
    docs: {
      page: withAutoDocsTab(createButtonDocs),
      source: { transform: buttonPlaygroundSource },
    },
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
    // Estava em `args` sem argType: ficava fora da aba API Reference.
    // A aba "API Reference" documenta a API real; o Playground não encaminha
    // estas três, então control ativo aqui seria controle morto.
    'aria-label': {
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
    const isIcon = args.size === 'icon' || args.size === 'icon-sm' || args.size === 'icon-lg';
    const btn = createButton({
      variant: args.variant,
      size: args.size,
      label: isIcon ? undefined : args.label,
      'aria-label': isIcon ? (args.label || 'Ação') : undefined,
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

    await step('O botão nativo declara type=button', async () => {
      // Sem o atributo o navegador assume submit: dentro de um <form>, um
      // "Cancelar" envia a página. Medido nas cinco stacks, o Vue era a única
      // sem declarar — e nenhuma story monta form, então nada acusava.
      await expect(button).toHaveAttribute('type', 'button');
    });

    await step('Clique dispara onClick', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalled();
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      // As fábricas tinham três grafias para o mesmo conceito — `ariaLabel`,
      // `'aria-label'` e `label`. A unificação manteve as antigas como apelido
      // em vez de apagá-las, porque apagar quebraria chamador em silêncio.
      //
      // Compatibilidade sem teste é promessa: esta asserção é o que separa
      // "aceitamos o nome antigo" de "aceitávamos, e alguém removeu sem notar".
      const antigo = createButton({ size: 'icon', ariaLabel: 'Adicionar' });
      await expect(antigo).toHaveAttribute('aria-label', 'Adicionar');

      // E o canônico vence quando os dois vierem — dois nomes disputando um
      // atributo é o defeito que a unificação existe para fechar.
      const ambos = createButton({
        size: 'icon',
        ariaLabel: 'Antigo',
        'aria-label': 'Canônico',
      });
      await expect(ambos).toHaveAttribute('aria-label', 'Canônico');
    });

    await step('Tab leva o foco ao botão', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural do DOM". Forçar o foco passaria até com tabindex="-1".
      // O clique do passo anterior deixou o foco no botão; sem zerar, o Tab
      // sairia dele e a asserção mediria o contrário do que promete.
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
