import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold, Eye } from 'lucide-vue-next';
import ToggleDocs from '@/components/docs/ToggleDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type ToggleArgs = {
  modelValue?: boolean;
  defaultValue: boolean;
  disabled: boolean;
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  label: string;
  iconOnly: boolean;
  'onUpdate:modelValue'?: (value: boolean) => void;
};

/**
 * O painel Code imprime o `template` da story, com o `v-if` que alterna
 * icon-only e rótulo visível e o `v-bind="args"`. O `transform` devolve o uso
 * real, com os valores atuais dos controls.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ToggleArgs> }): string {
  const {
    variant = 'default',
    size = 'default',
    defaultValue = false,
    disabled = false,
    label = 'Mostrar ocultos',
    iconOnly = true,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet: documentação que repete valor
  // default ensina ruído.
  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    size === 'default' ? '' : `size="${size}"`,
    defaultValue ? ':default-value="true"' : '',
    disabled ? ':disabled="true"' : '',
    // Toggle sem texto visível não tem nome acessível nenhum sem isto.
    iconOnly ? `aria-label="${label || 'Alternar'}"` : '',
  ].filter(Boolean);

  const abertura = attrs.length ? `<Toggle ${attrs.join(' ')}>` : '<Toggle>';
  const conteudo = iconOnly
    ? '  <Bold aria-hidden="true" />'
    : `  <Eye aria-hidden="true" />\n  ${label}`;

  return `${abertura}\n${conteudo}\n</Toggle>`;
}

const meta: Meta<ToggleArgs> = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(ToggleDocs),
      source: { transform: playgroundSource },
    },
  },
  argTypes: {
    // Prop CONTROLADA: dar valor aqui congelaria o Playground no valor do
    // control — o clique atualizaria o estado interno e o arg o puxaria de
    // volta. Fica como documentação; quem move o estado inicial é o outro.
    modelValue: {
      control: false,
      description: 'Estado controlado. Use junto com o callback de mudança.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: '—' } },
    },
    defaultValue: {
      control: 'boolean',
      description: 'Estado inicial não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual. "outline" acrescenta borda.',
      table: { type: { summary: '"default" | "outline"' }, defaultValue: { summary: '"default"' } },
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Degrau de densidade: piso de altura e recuo lateral.',
      table: {
        type: { summary: '"default" | "sm" | "lg"' },
        defaultValue: { summary: '"default"' },
      },
    },
    label: {
      control: 'text',
      description: 'Texto do rótulo — visível, ou nome acessível quando icon-only.',
      table: { type: { summary: 'string' } },
    },
    iconOnly: {
      control: 'boolean',
      description: 'Sem texto visível: o rótulo vira aria-label, obrigatório aqui.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    'onUpdate:modelValue': {
      control: false,
      description: 'Emitido ao alternar, com o novo estado.',
      table: { type: { summary: '(value: boolean) => void' } },
    },
  },
  args: {
    defaultValue: false,
    disabled: false,
    variant: 'default',
    size: 'default',
    label: 'Mostrar ocultos',
    iconOnly: true,
    'onUpdate:modelValue': fn(),
  },
};

export default meta;
type Story = StoryObj<ToggleArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
    ],
  },
  render: (args) => ({
    components: { Toggle, Bold, Eye },
    setup() {
      return { args };
    },
    template: `
      <Toggle
        :key="String(args.defaultValue)"
        :default-value="args.defaultValue"
        :disabled="args.disabled"
        :variant="args.variant"
        :size="args.size"
        :aria-label="args.iconOnly ? (args.label || 'Alternar') : undefined"
        @update:modelValue="args['onUpdate:modelValue']"
      >
        <template v-if="args.iconOnly">
          <Bold aria-hidden="true" />
        </template>
        <template v-else>
          <Eye aria-hidden="true" />
          {{ args.label }}
        </template>
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button');

    await step('É um <button> de verdade, com a classe do design system', async () => {
      await expect(toggle.tagName).toBe('BUTTON');
      await expect(toggle).toHaveClass(/nds-toggle/);
      await expect(toggle).toHaveAttribute('data-slot', 'toggle');
    });

    await step('Variante e tamanho viram data-attribute, e "default" é a ausência', async () => {
      await expect(toggle.getAttribute('data-variant')).toBe(
        args.variant === 'default' ? null : args.variant,
      );
      await expect(toggle.getAttribute('data-size')).toBe(
        args.size === 'default' ? null : args.size,
      );
    });

    await step('O nome acessível existe nos dois modos', async () => {
      const nome = args.iconOnly ? toggle.getAttribute('aria-label') : toggle.textContent?.trim();
      await expect(nome).toBeTruthy();
      // Ícone decorativo: quem lê a tela não deve ouvi-lo duas vezes.
      await expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O alvo de toque cabe no mínimo de 24px (WCAG 2.5.8)', async () => {
      const caixa = toggle.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThanOrEqual(24);
      await expect(caixa.height).toBeGreaterThanOrEqual(24);
    });

    if (!args.disabled) {
      await step('O clique alterna o estado e emite o novo valor', async () => {
        // Lido antes e comparado depois: reexecutar a play no painel
        // Interactions parte do estado que a rodada anterior deixou, e uma
        // asserção absoluta inverteria de rodada em rodada.
        const antes = toggle.getAttribute('aria-pressed');
        await userEvent.click(toggle);
        const depois = toggle.getAttribute('aria-pressed');
        await expect(depois).not.toBe(antes);
        await expect(toggle.getAttribute('data-state')).toBe(depois === 'true' ? 'on' : 'off');
        await expect(args['onUpdate:modelValue']).toHaveBeenCalledWith(depois === 'true');
      });

      await step('Space alterna, com o mesmo resultado do clique', async () => {
        (toggle as HTMLElement).focus();
        await expect(toggle).toHaveFocus();
        const antes = toggle.getAttribute('aria-pressed');
        await userEvent.keyboard(' ');
        await expect(toggle.getAttribute('aria-pressed')).not.toBe(antes);
      });

      await step('Enter alterna, idêntico a Space', async () => {
        const antes = toggle.getAttribute('aria-pressed');
        await userEvent.keyboard('{Enter}');
        await expect(toggle.getAttribute('aria-pressed')).not.toBe(antes);
      });
    }
  },
};
