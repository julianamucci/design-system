import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, within } from 'storybook/test';

import InputGroupAlignmentsStory from './InputGroupAlignmentsStory.svelte';
import {
  addonOfAlign,
  addonsOf,
  inputGroupControl,
  inputGroupRoots,
  visualStart,
  visualTop,
} from './input-group.fixtures';
import { inputGroupAlignmentsSource, inputGroupSource } from './input-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A variação do InputGroup é a POSIÇÃO do acompanhamento, e ela mora num
// atributo que a folha lê: `[data-align]`. Não há classe por alinhamento para
// medir aqui, e é por isso que estas stories medem a ORDEM VISUAL — que é o que
// a pessoa vê — em vez do nome do atributo sozinho.

const meta: Meta = {
  title: 'Components/Form/InputGroup/Variants',
  tags: ['form'],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      // A transform do META vale para todas as stories do arquivo; cada story
      // sobrescreve só quando as opções fixas dela diferem. Sem esta linha o
      // painel Code volta a despejar o nome do componente compilado.
      source: { transform: inputGroupSource },
      description: {
        component:
          'As quatro posições do addon. As duas em linha mantêm tudo numa fila; as duas em bloco ocupam a largura inteira e fazem o grupo virar coluna — decisão da folha compartilhada, sem opção de direção para passar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Alignments: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    docs: { source: { transform: inputGroupAlignmentsSource } },
  },
  render: () => ({ Component: InputGroupAlignmentsStory }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const groups = inputGroupRoots(canvasElement);

    await step('Cada moldura carrega a posição declarada', async () => {
      // functional.item4, primeira metade: o atributo chegou.
      await expect(groups).toHaveLength(4);
      const positions = groups.map((group) => addonsOf(group)[0].dataset.align);
      await expect(positions).toEqual([
        'inline-start',
        'inline-end',
        'block-start',
        'block-end',
      ]);
    });

    await step('Em linha, a ordem VISUAL acompanha a posição', async () => {
      // functional.item4, segunda metade — e a que importa. O atributo sozinho
      // não prova nada: quem move o addon é a folha, por `order`. Medir a
      // caixa é o que separa "o atributo está lá" de "o addon está no lugar".
      const leading = groups[0];
      const trailing = groups[1];

      const leadingAddon = addonOfAlign(leading, 'inline-start')!;
      await expect(visualStart(leadingAddon)).toBeLessThan(
        visualStart(inputGroupControl(leading)),
      );

      const trailingAddon = addonOfAlign(trailing, 'inline-end')!;
      await expect(visualStart(trailingAddon)).toBeGreaterThan(
        visualStart(inputGroupControl(trailing)),
      );
    });

    await step('Em bloco, o grupo empilha e o addon ocupa a largura inteira', async () => {
      const above = groups[2];
      const below = groups[3];

      const aboveAddon = addonOfAlign(above, 'block-start')!;
      await expect(visualTop(aboveAddon)).toBeLessThan(visualTop(inputGroupControl(above)));

      const belowAddon = addonOfAlign(below, 'block-end')!;
      const belowField = inputGroupControl(below);
      await expect(visualTop(belowAddon)).toBeGreaterThan(visualTop(belowField));

      // A largura inteira é o que distingue o addon em bloco do em linha: ele
      // não divide a fila com o campo, ele ocupa a própria.
      const addonWidth = belowAddon.getBoundingClientRect().width;
      const fieldWidth = belowField.getBoundingClientRect().width;
      await expect(Math.abs(addonWidth - fieldWidth)).toBeLessThan(2);
    });

    await step('Nenhuma moldura ganhou papel ou nome que não foi pedido', async () => {
      // Nenhuma das quatro recebeu `aria-label`: o rótulo do campo é quem
      // nomeia, e um grupo nomeado à toa faz o leitor de tela repetir.
      await expect(canvas.queryAllByRole('group', { name: /./ })).toHaveLength(0);
      for (const group of groups) {
        await expect(group).toHaveAttribute('role', 'group');
        await expect(group.hasAttribute('aria-label')).toBe(false);
      }
    });
  },
};
