import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';
import { ligado } from './toggle-group.fixtures';
import {
  alignmentToggleGroupBarSource,
  toggleGroupFormattingSource,
  toggleGroupSource,
  toggleGroupVisualizacaoVerticalSource,
} from './toggle-group.source';

/** Clica só quando o estado atual não é o desejado — a play tem que sobreviver
 *  ao replay do painel Interactions, que roda no mesmo DOM. */
async function definir(el: Element, on: boolean): Promise<void> {
  if (ligado(el) !== on) await userEvent.click(el);
}

const meta: Meta = {
  title: 'Components/Form/ToggleGroup/Compositions',
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
      source: { transform: alignmentToggleGroupBarSource },
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
    covers: ['visual.item5'],
    docs: {
      source: { transform: toggleGroupFormattingSource },
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
    await step('visual.item5 — os itens são emendados, sem espaço entre eles', async () => {
      const primeiro = items[0].getBoundingClientRect();
      const segundo = items[1].getBoundingClientRect();
      // Meio pixel de folga: o arredondamento do layout, não um gap.
      await expect(Math.abs(segundo.left - primeiro.right)).toBeLessThanOrEqual(0.5);
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
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    docs: {
      description: {
        story: 'Visual segmented (outline) — bordas conectadas, estilo barra única.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo carrega a variante que emenda as bordas', async () => {
      await expect(group).toHaveAttribute('data-variant', 'outline');
    });
  },
};
