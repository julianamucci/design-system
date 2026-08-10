import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsToggle, NdsToggleIcon } from './toggle';
import { NdsToggleGroup, NdsToggleGroupIcon } from './toggle-group';

const meta: Meta = {
  title: 'UI/ToggleGroup/Composições',
  decorators: [
    moduleMetadata({ imports: [NdsToggleGroup, NdsToggleGroupIcon, NdsToggle, NdsToggleIcon] }),
  ],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const AlignmentBar: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div
        ndsToggleGroup
        variant="outline"
        defaultValue="left"
        aria-label="Alinhamento do texto"
      >
        <button ndsToggle variant="outline" value="left" aria-label="Alinhar à esquerda">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" value="center" aria-label="Centralizar">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle variant="outline" value="right" aria-label="Alinhar à direita">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
        <button ndsToggle variant="outline" value="justify" aria-label="Justificar">
          <svg ndsToggleGroupIcon kind="align-justify"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grupo = canvas.getByRole('toolbar');

    await step('visual.item4 — a variante outline emenda os itens num container só', async () => {
      await expect(grupo).toHaveAttribute('data-variant', 'outline');
      // Um container com borda; os itens perdem a sua. É o que separa o
      // "segmentado" de quatro botões soltos lado a lado.
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      const primeiro = canvas.getByRole('button', { name: 'Alinhar à esquerda' });
      await expect(parseFloat(getComputedStyle(primeiro).borderTopWidth)).toBe(0);
      await expect(parseFloat(getComputedStyle(grupo).columnGap || '0')).toBe(0);
    });

    await step('Quatro itens icon-only, cada um com a sua função no nome', async () => {
      const botoes = canvas.getAllByRole('button');
      await expect(botoes).toHaveLength(4);
      for (const botao of botoes) {
        await expect(botao.getAttribute('aria-label')).toBeTruthy();
        await expect(botao.textContent?.trim()).toBe('');
      }
    });
  },
};

export const ViewMode: Story = {
  render: () => ({
    template: `
      <div
        ndsToggleGroup
        orientation="vertical"
        variant="outline"
        defaultValue="grid"
        aria-label="Modo de visualização"
      >
        <button ndsToggle variant="outline" value="grid">
          <svg ndsToggleGroupIcon kind="grid"></svg>
          Grade
        </button>
        <button ndsToggle variant="outline" value="list">
          <svg ndsToggleIcon kind="list"></svg>
          Lista
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Texto visível dispensa aria-label no item', async () => {
      const grade = canvas.getByRole('button', { name: 'Grade' });
      const lista = canvas.getByRole('button', { name: 'Lista' });
      await expect(grade.getAttribute('aria-label')).toBe(null);
      await expect(lista.getAttribute('aria-label')).toBe(null);
    });

    await step('O grupo continua nomeado — o rótulo dele é a categoria', async () => {
      const grupo = canvas.getByRole('toolbar');
      await expect(grupo).toHaveAttribute('aria-label', 'Modo de visualização');
    });
  },
};

export const FiltersWithText: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <div
        ndsToggleGroup
        type="multiple"
        variant="default"
        [spacing]="1"
        [defaultValue]="['hidden']"
        aria-label="Filtros da lista"
      >
        <button ndsToggle variant="outline" value="hidden">
          <svg ndsToggleIcon kind="eye"></svg>
          Mostrar ocultos
        </button>
        <button ndsToggle variant="outline" value="compact">
          <svg ndsToggleIcon kind="list"></svg>
          Visão compacta
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grupo = canvas.getByRole('toolbar');
    const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
    const compacta = canvas.getByRole('button', { name: 'Visão compacta' });

    await step('visual.item5 — com espaçamento os botões deixam de ser emendados', async () => {
      // O atributo `data-spacing="0"` é o que liga o visual segmentado; acima
      // de zero ele sai de cena e vale o gap da regra base.
      await expect(grupo.getAttribute('data-spacing')).toBe(null);
      const a = ocultos.getBoundingClientRect();
      const b = compacta.getBoundingClientRect();
      await expect(b.left).toBeGreaterThan(a.right);
    });

    await step('Separados, os itens mantêm o próprio canto arredondado', async () => {
      await expect(parseFloat(getComputedStyle(ocultos).borderTopRightRadius)).toBeGreaterThan(0);
    });

    await step('Filtros independentes: um ativo não desliga o outro', async () => {
      await expect(ocultos).toHaveAttribute('aria-pressed', 'true');
      await expect(compacta).toHaveAttribute('aria-pressed', 'false');
      await expect(grupo).toHaveAttribute('aria-label', 'Filtros da lista');
    });
  },
};
