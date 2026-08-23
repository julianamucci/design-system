import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { NdsToggle, NdsToggleIcon, type ToggleVariant, type ToggleSize } from './toggle';
import { NdsToggleDocs } from '@/components/docs/ToggleDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type ToggleArgs = {
  variant: ToggleVariant;
  size: ToggleSize;
  pressed: boolean;
  disabled: boolean;
  label: string;
  iconOnly: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code mostra o `template` da
 * story, com o `@if` que alterna icon-only e rótulo visível e os bindings
 * ligados aos args. O `transform` devolve o uso real, com os valores atuais dos
 * controls.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ToggleArgs> }): string {
  const {
    variant = 'default',
    size = 'default',
    pressed = false,
    disabled = false,
    label = 'Mostrar ocultos',
    iconOnly = true,
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    size === 'default' ? '' : `size="${size}"`,
    pressed ? '[defaultPressed]="true"' : '',
    disabled ? '[disabled]="true"' : '',
    // Toggle sem texto visível não tem nome acessível nenhum sem isto.
    iconOnly ? `aria-label="${label || 'Alternar'}"` : '',
  ].filter(Boolean).join(' ');

  const abre = attrs ? `<button ndsToggle ${attrs}>` : '<button ndsToggle>';
  const content = iconOnly
    ? '      <svg ndsToggleIcon kind="bold"></svg>'
    : `      <svg ndsToggleIcon kind="eye"></svg>\n      ${label}`;

  return `import { NdsToggle, NdsToggleIcon } from '@/components/ui/toggle';

@Component({
  imports: [NdsToggle, NdsToggleIcon],
  template: \`
    ${abre}
${content}
    </button>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<ToggleArgs> = {
  title: 'UI/Toggle',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsToggle, NdsToggleIcon] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsToggleDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual. "outline" acrescenta borda.',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Degrau de densidade do controle.',
    },
    pressed: {
      control: 'boolean',
      description: 'Estado inicial não-controlado, encaminhado a defaultPressed.',
    },
    disabled: { control: 'boolean', description: 'Desabilita o controle.' },
    label: {
      control: 'text',
      description: 'Texto do rótulo — visível, ou nome acessível quando icon-only.',
    },
    iconOnly: {
      control: 'boolean',
      description: 'Sem texto visível: o rótulo vira aria-label, que é obrigatório aqui.',
    },
    // Sem entrada em argTypes o renderer Angular não repassa a função em
    // `props`, e o `(pressedChange)` do template fica ligado a nada — sem erro.
    onPressedChange: {
      control: false,
      description: 'Emitido ao alternar, com o novo estado.',
      table: { type: { summary: '(pressed: boolean) => void' } },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    pressed: false,
    disabled: false,
    label: 'Mostrar ocultos',
    iconOnly: true,
    onPressedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ToggleArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
    ],
  },
  render: (args) => ({
    props: {
      ...args,
      // Nome acessível vem do rótulo quando não há texto visível — mesma regra
      // do Button para peças icon-only.
      computedAriaLabel: args.iconOnly ? args.label || 'Alternar' : null,
    },
    template: `
      <button
        ndsToggle
        [variant]="variant"
        [size]="size"
        [defaultPressed]="pressed"
        [disabled]="disabled"
        [attr.aria-label]="computedAriaLabel"
        (pressedChange)="onPressedChange($event)"
      >
        @if (iconOnly) {
          <svg ndsToggleIcon kind="bold"></svg>
        } @else {
          <svg ndsToggleIcon kind="eye"></svg>
          {{ label }}
        }
      </button>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    await step('É um <button> de verdade, com a classe do design system', async () => {
      // O primitivo só marca role="button" em host não-nativo; aqui o host JÁ é
      // <button>, então a ausência do atributo é o resultado correto.
      await expect(btn.tagName).toBe('BUTTON');
      await expect(btn).toHaveClass(/nds-toggle/);
      await expect(btn).toHaveAttribute('data-slot', 'toggle');
    });

    await step('Variante e tamanho viram data-attribute, e "default" é a ausência', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza nos defaults e nenhum atributo apareceria.
      await expect(btn.getAttribute('data-variant')).toBe(
        args.variant === 'default' ? null : args.variant,
      );
      await expect(btn.getAttribute('data-size')).toBe(
        args.size === 'default' ? null : args.size,
      );
    });

    await step('aria-pressed e data-state contam a mesma história', async () => {
      // `aria-pressed` vem do primitivo; `data-state` é o contrato de markup
      // das outras quatro stacks, que este componente emite de propósito. Ler o
      // par junto é o que impede os dois de divergirem.
      const esperado = args.pressed ? 'on' : 'off';
      await expect(btn).toHaveAttribute('data-state', esperado);
      await expect(btn.getAttribute('aria-pressed')).toBe(String(args.pressed));
    });

    await step('O nome acessível existe nos dois modos', async () => {
      const name = args.iconOnly ? btn.getAttribute('aria-label') : btn.textContent?.trim();
      await expect(name).toBeTruthy();
      // Ícone decorativo: quem lê a tela não deve ouvi-lo duas vezes.
      await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    if (!args.disabled) {
      await step('O clique alterna o estado e emite o novo valor', async () => {
        // Lido antes e comparado depois: reexecutar a play no painel
        // Interactions parte do estado que a rodada anterior deixou, e uma
        // asserção absoluta inverteria de rodada em rodada.
        const antes = btn.getAttribute('aria-pressed');
        await userEvent.click(btn);
        const depois = btn.getAttribute('aria-pressed');
        await expect(depois).not.toBe(antes);
        await expect(btn.getAttribute('data-state')).toBe(depois === 'true' ? 'on' : 'off');
        await expect(args.onPressedChange).toHaveBeenCalledWith(depois === 'true');
      });

      await step('Space alterna, com o mesmo resultado do clique', async () => {
        btn.focus();
        const antes = btn.getAttribute('aria-pressed');
        await userEvent.keyboard(' ');
        await expect(btn.getAttribute('aria-pressed')).not.toBe(antes);
      });

      await step('Enter alterna, idêntico a Space', async () => {
        const antes = btn.getAttribute('aria-pressed');
        await userEvent.keyboard('{Enter}');
        await expect(btn.getAttribute('aria-pressed')).not.toBe(antes);
      });
    }
  },
};
