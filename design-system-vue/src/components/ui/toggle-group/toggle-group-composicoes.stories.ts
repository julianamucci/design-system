import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { ToggleGroup, ToggleGroupItem } from './index';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline,
  LayoutGrid, List,
} from 'lucide-vue-next';

const meta = {
  title: 'UI/ToggleGroup/Composicoes',
  component: ToggleGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do ToggleGroup: barra de alinhamento (single), barra de formatação (multiple), modo de visualização vertical e variantes outline com spacing.',
      },
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarraDeAlinhamento: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight, AlignJustify },
    setup() { return {}; },
    template: `
      <ToggleGroup type="single" default-value="left" aria-label="Alinhamento do texto">
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
    await step('4 opções de alinhamento renderizadas', async () => {
      await expect(items).toHaveLength(4);
    });
    await step('Selecionar center desativa left', async () => {
      const center = canvas.getByRole('button', { name: 'Centralizar' });
      const left = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      await userEvent.click(center);
      await expect(center).toHaveAttribute('aria-pressed', 'true');
      await expect(left).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const BarraDeFormatacao: Story = {
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
    await step('Bold já ativo, italic inativo', async () => {
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
      await expect(italic).toHaveAttribute('aria-pressed', 'false');
    });
    await step('Clicar em italic adiciona à seleção (mantém bold)', async () => {
      await userEvent.click(italic);
      await expect(italic).toHaveAttribute('aria-pressed', 'true');
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

export const ModoVisualizacaoVertical: Story = {
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

export const ComSpacing: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, Bold, Italic, Underline },
    setup() { return {}; },
    template: `
      <ToggleGroup type="multiple" :spacing="1" variant="outline" aria-label="Formatação">
        <ToggleGroupItem value="bold" aria-label="Negrito"><Bold aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico"><Italic aria-hidden="true" /></ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Sublinhado"><Underline aria-hidden="true" /></ToggleGroupItem>
      </ToggleGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Grupo com spacing > 0 renderiza itens separados', async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]');
      await expect(group).toHaveAttribute('data-spacing', '1');
    });
    await step('3 itens presentes', async () => {
      const items = canvas.getAllByRole('button');
      await expect(items).toHaveLength(3);
    });
  },
};

export const TamanhosComparados: Story = {
  render: () => ({
    components: { ToggleGroup, ToggleGroupItem, AlignLeft, AlignCenter, AlignRight },
    setup() { return {}; },
    template: `
      <div class="flex flex-col gap-3">
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
