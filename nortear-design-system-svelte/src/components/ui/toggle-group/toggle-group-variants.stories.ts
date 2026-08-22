import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';
import { ligado } from './toggle-group.fixtures';
import {
  toggleGroupFormatacaoSource,
  toggleGroupSource,
  toggleGroupVerticalSource,
} from './toggle-group.source';

/** Clica só quando o estado atual não é o desejado — a play tem que sobreviver
 *  ao replay do painel Interactions, que roda no mesmo DOM. */
async function definir(el: Element, on: boolean): Promise<void> {
  if (ligado(el) !== on) await userEvent.click(el);
}

const meta: Meta = {
  title: 'UI/ToggleGroup/Variants',
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
          'Variantes do ToggleGroup: single (escolha exclusiva), multiple (combinação) e vertical (items empilhados).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Single: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: {
        story:
          'Seleção exclusiva — o valor é uma string. Ideal para alinhamento. A lib anuncia o conjunto como grupo de rádio: cada item vem com role="radio" e aria-checked.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Renderiza 3 itens com role=radio (exclusivo)', async () => {
      await expect(items).toHaveLength(3);
    });

    await step('ToggleGroup tem aria-label de categoria', async () => {
      const group = canvas.getByRole('group');
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
    });

    await step('functional.item1 — escolher um item desliga o anterior', async () => {
      await definir(items[1], true);
      await expect(ligado(items[1])).toBe(true);
      await expect(items[1]).toHaveAttribute('data-state', 'on');
      await definir(items[0], true);
      await expect(ligado(items[0])).toBe(true);
      await expect(ligado(items[1])).toBe(false);
      // Volta ao estado inicial (nenhum selecionado) para a próxima rodada.
      await definir(items[0], false);
    });
  },
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    kind: 'formatting',
    ariaLabel: 'Formatação',
  },
  parameters: {
    covers: ['functional.item2', 'visual.item2', 'accessibility.item4'],
    docs: {
      source: { transform: toggleGroupFormatacaoSource },
      description: {
        story:
          'Seleção combinada — o valor é um array de strings. Ideal para formatação Bold/Italic/Underline. No modo combinado cada item é um botão com aria-pressed.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');
    const ativos = () => items.filter((b) => b.getAttribute('aria-pressed') === 'true');

    await step('Renderiza 3 itens (o modo combinado usa role=button)', async () => {
      await expect(items).toHaveLength(3);
    });

    await step('accessibility.item4 — aria-pressed e data-state contam a mesma história', async () => {
      for (const it of items) {
        const on = it.getAttribute('aria-pressed') === 'true';
        await expect(it).toHaveAttribute('data-state', on ? 'on' : 'off');
      }
    });

    await step('functional.item2 — ligar um item soma; desligar subtrai', async () => {
      await definir(items[0], true);
      await definir(items[1], true);
      await expect(ativos()).toHaveLength(2);

      await definir(items[1], false);
      await expect(ativos()).toHaveLength(1);
      await expect(items[0]).toHaveAttribute('aria-pressed', 'true');

      // Volta ao estado inicial (nenhum ativo) para a próxima rodada.
      await definir(items[0], false);
    });
  },
};

export const Vertical: Story = {
  args: {
    type: 'single',
    orientation: 'vertical',
    kind: 'view',
    ariaLabel: 'Modo de visualização',
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: toggleGroupVerticalSource },
      description: {
        story: 'orientation="vertical" — items empilhados; navegação por ArrowUp/ArrowDown.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    const items = canvas.getAllByRole('radio');

    await step('data-orientation=vertical', async () => {
      await expect(group).toHaveAttribute('data-orientation', 'vertical');
    });

    await step('Renderiza 2 itens (Grade/Lista)', async () => {
      await expect(items).toHaveLength(2);
    });

    await step('Empilhado de verdade: o segundo item começa abaixo do primeiro', async () => {
      // `data-orientation` certo com CSS ausente deixaria os dois lado a lado.
      const a = items[0].getBoundingClientRect();
      const b = items[1].getBoundingClientRect();
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    });

    await step('As setas verticais navegam dentro do grupo', async () => {
      (items[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(items[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(items[0]).toHaveFocus();
    });
  },
};

export const Outline: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: 'variant="outline" — o conjunto ganha uma borda só e os items perdem a sua, emendados num container. Herdada via Context para todos os ToggleGroupItem.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    const items = canvas.getAllByRole('radio');

    await step('visual.item4 — a variante outline emenda os itens num container só', async () => {
      await expect(group).toHaveAttribute('data-variant', 'outline');
      // `data-variant="outline"` certo com CSS ausente daria três botões
      // soltos — é o defeito que só a medida pega.
      await expect(parseFloat(getComputedStyle(group).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(items[0]).borderTopWidth)).toBe(0);
    });
  },
};
