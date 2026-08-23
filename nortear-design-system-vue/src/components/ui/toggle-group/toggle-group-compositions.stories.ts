import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import { definir } from './toggle-group.fixtures';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from 'lucide-vue-next';
import {
  toggleGroupBarAlignmentSource,
  toggleGroupBarFormattingSource,
  toggleGroupWithSpacingSource,
  toggleGroupSizesSource,
  toggleGroupVerticalSource,
} from './toggle-group.source';

const meta = {
  title: 'UI/ToggleGroup/Compositions',
  component: ToggleGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toggleGroupBarAlignmentSource },
      description: {
        component:
          'Padrões de composição do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple), modo de visualização vertical e variantes outline com spacing.',
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlignmentBar: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight, AlignJustify },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" variant="outline" default-value="left" aria-label="Alinhamento do texto">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="justify" aria-label="Justificar"><AlignJustify aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');
    const center = canvas.getByRole('button', { name: 'Centralizar' });
    const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });

    await step('4 opções de alinhamento renderizadas', async () => {
      await expect(items).toHaveLength(4);
      for (const b of items) await expect(b.getAttribute('aria-label')).toBeTruthy();
    });
    await step('Selecionar center desativa left', async () => {
      await definir(center, true);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(left, true);
    });
    await step('visual.item4 — a variante outline emenda os itens num container só', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      await expect(group).toHaveAttribute('data-variant', 'outline');
      await expect(parseFloat(getComputedStyle(group).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(left).borderTopWidth)).toBe(0);
    });
  },
};

export const FormattingBar: Story = {
  parameters: {
    // Modo combinado: o valor é lista e nenhum contorno emenda os itens — a do
    // meta mostraria a barra exclusiva com contorno no grupo.
    docs: { source: { transform: toggleGroupBarFormattingSource } },
  },
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, Bold, Italic, Underline },
    setup() { return {}; },
    template: `
      <ToggleGroup type="multiple" :default-value="['bold']" aria-label="Formatação">
        <ToggleGroupItem value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Negrito' });
    const italic = canvas.getByRole('button', { name: 'Itálico' });
    await step('Bold ativo, italic inativo', async () => {
      await definir(bold, true);
      await definir(italic, false);
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
      await expect(italic).toHaveAttribute('aria-pressed', 'false');
    });
    await step('Ligar italic adiciona à seleção (mantém bold)', async () => {
      await definir(italic, true);
      await expect(italic).toHaveAttribute('aria-pressed', 'true');
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
      // Volta ao estado inicial para a próxima rodada começar igual a esta.
      await definir(italic, false);
    });
  },
};

export const VerticalViewMode: Story = {
  parameters: {
    // O eixo empilhado troca o conjunto de opções e a navegação por setas — a do
    // meta mostraria a barra horizontal.
    docs: { source: { transform: toggleGroupVerticalSource } },
  },
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
        <ToggleGroupItem value="grid" aria-label="Grade"><LayoutGrid aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="Lista"><List aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('button', { name: 'Grade' });
    const list = canvas.getByRole('button', { name: 'Lista' });
    await step('Vertical com outline renderiza 2 itens', async () => {
      await expect(grid).toBeInTheDocument();
      await expect(list).toBeInTheDocument();
    });
    await step('ArrowDown move foco verticalmente', async () => {
      (grid as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(list).toHaveFocus();
    });
  },
};

export const WithSpacing: Story = {
  parameters: {
    covers: ['visual.item5'],
    // Com espaçamento o contorno muda de dono: sai da raiz e vai para cada item.
    // A do meta ensinaria justamente o contrário.
    docs: { source: { transform: toggleGroupWithSpacingSource } },
  },
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, Bold, Italic, Underline },
    setup() { return {}; },
    // O contorno vai no ITEM, não no grupo: `variant="outline"` no grupo emenda
    // os botões num container só e zera a borda de cada um — o oposto do que
    // esta composição demonstra.
    template: `
      <ToggleGroup type="multiple" :spacing="1" aria-label="Formatação">
        <ToggleGroupItem variant="outline" value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem variant="outline" value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem variant="outline" value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Negrito' });
    const italic = canvas.getByRole('button', { name: 'Itálico' });

    await step('visual.item5 — com espaçamento os botões deixam de ser emendados', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]');
      await expect(group).toHaveAttribute('data-spacing', '1');
      const a = bold.getBoundingClientRect();
      const b = italic.getBoundingClientRect();
      await expect(b.left).toBeGreaterThan(a.right);
    });
    await step('Separados, os itens mantêm borda e canto próprios', async () => {
      await expect(canvas.getAllByRole('button')).toHaveLength(3);
      await expect(parseFloat(getComputedStyle(bold).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(bold).borderTopRightRadius)).toBeGreaterThan(0);
    });
  },
};

export const SizesCompared: Story = {
  parameters: {
    // São TRÊS grupos empilhados, e não um: a comparação é a composição, e o
    // snippet do meta mostraria só um deles.
    docs: { source: { transform: toggleGroupSizesSource } },
  },
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <ToggleGroup type="single" size="sm" default-value="left" aria-label="Alinhamento pequeno">
          <ToggleGroupItem value="left" aria-label="Esquerda sm"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centro sm"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Direita sm"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" size="default" default-value="left" aria-label="Alinhamento padrão">
          <ToggleGroupItem value="left" aria-label="Esquerda default"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centro default"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Direita default"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" size="lg" default-value="left" aria-label="Alinhamento grande">
          <ToggleGroupItem value="left" aria-label="Esquerda lg"><AlignLeft aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centro lg"><AlignCenter aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Direita lg"><AlignRight aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('3 grupos com sizes diferentes renderizados', async () => {
      const groups = canvasElement.querySelectorAll('[data-slot="toggle-group"]');
      await expect(groups.length).toBe(3);
      await expect(groups[0]).toHaveAttribute('data-size', 'sm');
      await expect(groups[1]).toHaveAttribute('data-size', 'default');
      await expect(groups[2]).toHaveAttribute('data-size', 'lg');
    });
  },
};
