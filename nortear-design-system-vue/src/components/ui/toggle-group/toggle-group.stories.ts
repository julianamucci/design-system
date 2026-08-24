import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next';
import ToggleGroupDocs from '@/components/docs/ToggleGroupDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { toggleGroupSource } from './toggle-group.source';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleGroupDocs), source: { transform: toggleGroupSource } },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Modo de seleção. Define se modelValue é string ou array.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas.',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual herdado pelos itens.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Altura herdada pelos itens.',
    },
    'onUpdate:modelValue': {
      // `control: false` porque o valor é uma função: sem isso o painel
      // Controls mostrava um campo vazio e a regra `argtype_without_arg`
      // cobrava um valor inicial que não existe para callback.
      control: false,
      description: 'Disparado ao trocar a seleção.',
      table: { type: { summary: '(value: string | string[]) => void' } },
    },
  },
  args: {
    type: 'single',
    disabled: false,
    orientation: 'horizontal',
    variant: 'default',
    size: 'default',
    'onUpdate:modelValue': fn(),
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return { args }; },
    template: `
      <ToggleGroup
        :key="String(args.type) + String(args.orientation)"
        v-bind="args"
        aria-label="Alinhamento do texto"
      >
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
          <AlignLeft aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar">
          <AlignCenter aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita">
          <AlignRight aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const right = canvas.getByRole('button', { name: 'Alinhar à direita' });
    const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;

    /** Só clica quando o estado atual não é o desejado — a play tem que
     *  sobreviver ao replay do painel Interactions, que roda no mesmo DOM. */
    const definir = async (button: HTMLElement, ligado: boolean) => {
      if ((button.getAttribute('aria-pressed') === 'true') !== ligado) {
        await userEvent.click(button);
      }
    };

    await step('accessibility.item5 — o grupo e cada item icon-only têm nome', async () => {
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
      await expect(left).toHaveAttribute('aria-label', 'Alinhar à esquerda');
      await expect(center).toHaveAttribute('aria-label', 'Centralizar');
      await expect(right).toHaveAttribute('aria-label', 'Alinhar à direita');
    });

    await step('Orientação chega ao markup', async () => {
      await expect(group).toHaveAttribute('data-orientation', String(args.orientation));
    });

    await step('accessibility.item4 — aria-pressed e data-state contam a mesma história', async () => {
      for (const b of [left, center, right]) {
        const ligado = b.getAttribute('aria-pressed') === 'true';
        await expect(b).toHaveAttribute('data-state', ligado ? 'on' : 'off');
      }
    });

    await step('Selecionar um item desliga o anterior (exclusivo)', async () => {
      await definir(center, true);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      await expect(args['onUpdate:modelValue']).toHaveBeenCalled();
    });

    await step('functional.item3 — a seta move o foco sem ativar nada', async () => {
      const antes = [left, center, right].map((b) => b.getAttribute('aria-pressed'));
      (right as HTMLElement).focus();
      await userEvent.keyboard(args.orientation === 'vertical' ? '{ArrowUp}' : '{ArrowLeft}');
      await expect(center).toHaveFocus();
      const depois = [left, center, right].map((b) => b.getAttribute('aria-pressed'));
      await expect(depois).toEqual(antes);
    });

    await step('functional.item4 — Space alterna o item focado', async () => {
      // Lido antes e comparado depois: reexecutar a play parte do estado que a
      // rodada anterior deixou, e uma asserção absoluta inverteria de rodada
      // em rodada.
      (center as HTMLElement).focus();
      const antes = center.getAttribute('aria-pressed');
      await userEvent.keyboard(' ');
      await expect(center.getAttribute('aria-pressed')).not.toBe(antes);
    });

    await step('Enter alterna, idêntico a Space', async () => {
      const antes = center.getAttribute('aria-pressed');
      await userEvent.keyboard('{Enter}');
      await expect(center.getAttribute('aria-pressed')).not.toBe(antes);
    });

    await step('Seleção devolvida ao estado inicial', async () => {
      await definir(center, false);
      await definir(left, false);
      await definir(right, false);
      await expect(
        canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true'),
      ).toHaveLength(0);
    });
  },
};
