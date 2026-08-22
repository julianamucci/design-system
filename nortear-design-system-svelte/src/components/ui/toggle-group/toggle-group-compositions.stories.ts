import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';
import { ligado } from './toggle-group.fixtures';
import {
  toggleGroupBarraDeAlinhamentoSource,
  toggleGroupFormatacaoSource,
  toggleGroupSource,
  toggleGroupVisualizacaoVerticalSource,
} from './toggle-group.source';

/** Clica só quando o estado atual não é o desejado — a play tem que sobreviver
 *  ao replay do painel Interactions, que roda no mesmo DOM. */
async function definir(el: Element, on: boolean): Promise<void> {
  if (ligado(el) !== on) await userEvent.click(el);
}

const meta: Meta = {
  title: 'UI/ToggleGroup/Compositions',
  component: ToggleGroupStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; as que trocam o conjunto de
      // opções sobrescrevem com a sua própria marcação logo abaixo.
      source: { transform: toggleGroupSource },
      description: {
        component:
          'Composicoes do ToggleGroup: barra de alinhamento (single), formatação de texto (multiple) e modo de visualização (vertical).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AlignmentBar: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
    items: [
      { value: 'left', ariaLabel: 'Alinhar à esquerda', icon: 'alignLeft' },
      { value: 'center', ariaLabel: 'Centralizar', icon: 'alignCenter' },
      { value: 'right', ariaLabel: 'Alinhar à direita', icon: 'alignRight' },
      { value: 'justify', ariaLabel: 'Justificar', icon: 'alignJustify' },
    ],
  },
  parameters: {
    docs: {
      source: { transform: toggleGroupBarraDeAlinhamentoSource },
      description: {
        story: 'Barra de alinhamento clássica — 4 opções mutuamente exclusivas (type=single).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Renderiza 4 opções de alinhamento', async () => {
      await expect(items).toHaveLength(4);
      for (const it of items) await expect(it.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Selecionar "Centralizar" desativa os outros', async () => {
      await definir(items[0], true);
      await definir(items[1], true);
      await expect(items[1]).toHaveAttribute('aria-checked', 'true');
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
      // Volta ao estado inicial (nenhum selecionado) para a próxima rodada.
      await definir(items[1], false);
    });
  },
};

export const FormattingToolbar: Story = {
  args: {
    type: 'multiple',
    kind: 'formatting',
    ariaLabel: 'Formatação',
  },
  parameters: {
    docs: {
      source: { transform: toggleGroupFormatacaoSource },
      description: {
        story: 'Barra de formatação Bold/Italic/Underline — combinações independentes (type=multiple).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');

    await step('Negrito + Itálico podem ser ativados juntos', async () => {
      await definir(items[0], true);
      await definir(items[1], true);
      await expect(items[0]).toHaveAttribute('aria-pressed', 'true');
      await expect(items[1]).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Desligar Negrito não mexe em Itálico', async () => {
      await definir(items[0], false);
      await expect(items[0]).toHaveAttribute('aria-pressed', 'false');
      await expect(items[1]).toHaveAttribute('aria-pressed', 'true');
      // Volta ao estado inicial (nenhum ativo) para a próxima rodada.
      await definir(items[1], false);
    });
  },
};

export const VerticalViewMode: Story = {
  args: {
    type: 'single',
    orientation: 'vertical',
    variant: 'outline',
    kind: 'view',
    ariaLabel: 'Modo de visualização',
  },
  parameters: {
    docs: {
      source: { transform: toggleGroupVisualizacaoVerticalSource },
      description: {
        story: 'Modo de visualização Grade/Lista vertical com variante outline. ArrowDown navega.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('ArrowDown navega para o próximo item', async () => {
      (items[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(items[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(items[0]).toHaveFocus();
    });

    await step('Empilhado de verdade: o segundo item começa abaixo do primeiro', async () => {
      const a = items[0].getBoundingClientRect();
      const b = items[1].getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });

    await step('O grupo continua nomeado — o rótulo dele é a categoria', async () => {
      const group = canvas.getByRole('group');
      await expect(group).toHaveAttribute('aria-label', 'Modo de visualização');
    });
  },
};

export const SegmentedOutline: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    spacing: 0,
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    docs: {
      description: {
        story: 'Visual segmented (spacing=0 + outline) — bordas conectadas, estilo barra única.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-spacing=0', async () => {
      await expect(group).toHaveAttribute('data-spacing', '0');
    });
  },
};

export const SeparatedItems: Story = {
  args: {
    type: 'single',
    // Variante padrão de propósito: `variant="outline"` no grupo emenda os
    // botões num container com borda única e zera a borda de cada um — o
    // oposto do que esta composição demonstra.
    spacing: 2,
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story: 'Items separados (spacing > 0) — botões distintos, sem bordas conectadas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    const items = canvas.getAllByRole('radio');

    await step('visual.item5 — com espaçamento os botões deixam de ser emendados', async () => {
      await expect(group).toHaveAttribute('data-spacing', '2');
      const a = items[0].getBoundingClientRect();
      const b = items[1].getBoundingClientRect();
      await expect(b.left).toBeGreaterThan(a.right);
    });

    await step('Separados, os itens mantêm o próprio canto arredondado', async () => {
      await expect(parseFloat(getComputedStyle(items[0]).borderTopRightRadius)).toBeGreaterThan(0);
    });
  },
};
