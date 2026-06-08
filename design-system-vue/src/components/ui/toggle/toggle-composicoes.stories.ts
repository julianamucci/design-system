import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold, Italic, Underline, List, Eye, LayoutGrid } from 'lucide-vue-next';

const meta = {
  title: 'UI/Toggle/Composicoes',
  component: Toggle,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do Toggle: barra de formatação, filtro de visualização, tamanhos comparados e Toggle isolado em painel.',
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarraDeFormatacao: Story = {
  render: () => ({
    components: { Toggle, Bold, Italic, Underline, List },
    setup() { return {}; },
    template: `
      <div class="flex items-center gap-1 rounded-md border p-1">
        <Toggle aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle aria-label="Itálico">
          <Italic aria-hidden="true" />
        </Toggle>
        <Toggle aria-label="Sublinhado">
          <Underline aria-hidden="true" />
        </Toggle>
        <Toggle aria-label="Lista">
          <List aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggles = canvas.getAllByRole('button');
    await step('4 toggles renderizados', async () => {
      await expect(toggles).toHaveLength(4);
    });
    await step('Cada toggle tem aria-label próprio', async () => {
      await expect(toggles[0]).toHaveAttribute('aria-label', 'Negrito');
      await expect(toggles[1]).toHaveAttribute('aria-label', 'Itálico');
      await expect(toggles[2]).toHaveAttribute('aria-label', 'Sublinhado');
      await expect(toggles[3]).toHaveAttribute('aria-label', 'Lista');
    });
    await step('Toggles são independentes', async () => {
      await userEvent.click(toggles[0]);
      await expect(toggles[0]).toHaveAttribute('aria-pressed', 'true');
      await expect(toggles[1]).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const FiltroDeVisualizacao: Story = {
  render: () => ({
    components: { Toggle, Eye, LayoutGrid },
    setup() { return {}; },
    template: `
      <div class="flex items-center gap-2">
        <Toggle variant="outline">
          <Eye aria-hidden="true" />
          Mostrar ocultos
        </Toggle>
        <Toggle variant="outline" :default-value="true">
          <LayoutGrid aria-hidden="true" />
          Visão compacta
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Toggles com label visível renderizam', async () => {
      await expect(canvas.getByText('Mostrar ocultos')).toBeVisible();
      await expect(canvas.getByText('Visão compacta')).toBeVisible();
    });
    await step('Visão compacta começa ativa', async () => {
      const compact = canvas.getByRole('button', { name: /Visão compacta/i });
      await expect(compact).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

export const TamanhosComparados: Story = {
  render: () => ({
    components: { Toggle, Bold },
    setup() { return {}; },
    template: `
      <div class="flex items-center gap-2">
        <Toggle size="sm" aria-label="Negrito pequeno">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle size="default" aria-label="Negrito padrão">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle size="lg" aria-label="Negrito grande">
          <Bold aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggles = canvas.getAllByRole('button');
    await step('3 tamanhos renderizados', async () => {
      await expect(toggles).toHaveLength(3);
    });
  },
};

export const ToggleEmPainel: Story = {
  render: () => ({
    components: { Toggle, Eye },
    setup() { return {}; },
    template: `
      <div class="flex items-center justify-between rounded-lg border p-4 w-80">
        <div class="space-y-0.5">
          <p class="text-sm font-medium">Mostrar arquivados</p>
          <p class="text-sm text-muted-foreground">
            Inclui itens marcados como arquivados na lista.
          </p>
        </div>
        <Toggle variant="outline" aria-label="Mostrar arquivados">
          <Eye aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Mostrar arquivados' });
    await step('Toggle isolado em painel com descrição', async () => {
      await expect(toggle).toBeInTheDocument();
      await expect(canvas.getByText(/Inclui itens marcados/)).toBeVisible();
    });
  },
};
