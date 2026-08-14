import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from 'lucide-vue-next';

const meta = {
  title: 'UI/ToggleGroup/Variants',
  component: ToggleGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do ToggleGroup: single (seleção exclusiva), multiple (combinada) e vertical (orientação empilhada).',
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Clica só quando o estado atual não é o desejado. Reexecutar a play no painel
 * Interactions parte do estado que a rodada anterior deixou; um clique cego
 * inverteria o resultado a cada rodada.
 */
async function definir(botao: HTMLElement, ligado: boolean): Promise<void> {
  if ((botao.getAttribute('aria-pressed') === 'true') !== ligado) {
    await userEvent.click(botao);
  }
}

export const Single: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" default-value="center" aria-label="Alinhamento do texto">
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
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });

    await step('O modo exclusivo nasce com exatamente um item ativo', async () => {
      const pressionados = canvas
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-pressed') === 'true');
      await expect(pressionados).toHaveLength(1);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
    });
    await step('aria-label presente no grupo', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]');
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });
    await step('functional.item1 — escolher um item desliga o anterior', async () => {
      await definir(left, true);
      await expect(left).toHaveAttribute('aria-pressed', 'true');
      await expect(center).toHaveAttribute('aria-pressed', 'false');
      await expect(center).toHaveAttribute('data-state', 'off');
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(center, true);
    });
  },
};

export const Multiple: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, Bold, Italic, Underline },
    setup() { return {}; },
    template: `
      <ToggleGroup type="multiple" :default-value="['bold', 'italic']" aria-label="Formatação">
        <ToggleGroupItem value="bold" aria-label="Negrito">
          <Bold aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico">
          <Italic aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Sublinhado">
          <Underline aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Negrito' });
    const italic = canvas.getByRole('button', { name: 'Itálico' });
    const underline = canvas.getByRole('button', { name: 'Sublinhado' });
    const ativos = () =>
      canvas.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');

    await step('O modo combinado aceita mais de um ativo ao mesmo tempo', async () => {
      await definir(bold, true);
      await definir(italic, true);
      await definir(underline, false);
      await expect(ativos()).toHaveLength(2);
    });

    await step('functional.item2 — ligar um item soma; desligar subtrai', async () => {
      await definir(underline, true);
      await expect(ativos()).toHaveLength(3);
      await expect(bold).toHaveAttribute('aria-pressed', 'true');

      await definir(italic, false);
      await expect(ativos()).toHaveLength(2);
      await expect(italic).toHaveAttribute('data-state', 'off');

      // Restaura o estado inicial da story.
      await definir(italic, true);
      await definir(underline, false);
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, LayoutGrid, List },
    setup() { return {}; },
    template: `
      <ToggleGroup
        type="single"
        orientation="vertical"
        variant="outline"
        default-value="grid"
        aria-label="Modo de visualização"
      >
        <ToggleGroupItem value="grid" aria-label="Grade">
          <LayoutGrid aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="Lista">
          <List aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  parameters: { covers: ['visual.item3'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('button', { name: 'Grade' });
    const list = canvas.getByRole('button', { name: 'Lista' });

    await step('Vertical reflete orientation no DOM', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]');
      await expect(group).toHaveAttribute('data-orientation', 'vertical');
    });
    await step('Item inicial está pressionado', async () => {
      await expect(grid).toHaveAttribute('aria-pressed', 'true');
    });
    await step('Empilhado de verdade: o segundo item começa abaixo do primeiro', async () => {
      // `data-orientation` certo com CSS ausente deixaria os dois lado a lado.
      const a = grid.getBoundingClientRect();
      const b = list.getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });
    await step('As setas verticais navegam dentro do grupo', async () => {
      (grid as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(list).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(grid).toHaveFocus();
    });
  },
};
