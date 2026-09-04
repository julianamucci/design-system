import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NDS_INPUT_GROUP } from './input-group';
import { NdsButton } from './button';
import {
  addonOfAlign,
  controlOf,
  groupsIn,
  NOTE_PLACEHOLDER,
  SEND_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
} from './input-group.fixtures';
import { inputGroupAlignmentsSource } from './input-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A variação do InputGroup é a POSIÇÃO do acompanhamento, e ela mora num
// atributo que a folha lê: `[data-align]`. Não há classe por alinhamento para
// medir aqui, e é por isso que estas stories medem a ORDEM VISUAL — que é o que
// a pessoa vê — em vez do nome do atributo sozinho.

const meta: Meta = {
  title: 'Components/Form/InputGroup/Variants',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_INPUT_GROUP, NdsButton] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      // A transform do META vale para todas as stories do arquivo. Sem esta
      // linha o painel Code volta a despejar o `template` da story.
      source: { transform: inputGroupAlignmentsSource },
      description: {
        component:
          'As quatro posições do addon. As duas em linha mantêm tudo numa fila; as duas em bloco ocupam a largura inteira e fazem o grupo virar coluna — decisão da folha compartilhada, sem opção de direção para passar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Onde o addon começa, na direção de leitura da página. */
function visualStart(el: HTMLElement): number {
  return el.getBoundingClientRect().left;
}

/** Topo do addon — é o que separa "acima" de "abaixo". */
function visualTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Alignments: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
  },
  render: () => ({
    // Uma moldura por posição, e cada uma com UM addon só: com dois na mesma
    // moldura não daria para afirmar qual deles a folha ordenou.
    template: `
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div ndsInputGroup>
          <div ndsInputGroupAddon align="inline-start">
            <span ndsInputGroupText>${SITE_PREFIX}</span>
          </div>
          <input ndsInputGroupInput placeholder="${SITE_PLACEHOLDER}" />
        </div>

        <div ndsInputGroup>
          <input ndsInputGroupInput placeholder="${SITE_PLACEHOLDER}" />
          <div ndsInputGroupAddon align="inline-end">
            <span ndsInputGroupText>${SITE_SUFFIX}</span>
          </div>
        </div>

        <div ndsInputGroup>
          <div ndsInputGroupAddon align="block-start">
            <span ndsInputGroupText>${SITE_PREFIX}</span>
          </div>
          <textarea ndsInputGroupTextarea rows="2" placeholder="${NOTE_PLACEHOLDER}"></textarea>
        </div>

        <div ndsInputGroup>
          <textarea ndsInputGroupTextarea rows="2" placeholder="${NOTE_PLACEHOLDER}"></textarea>
          <div ndsInputGroupAddon align="block-end">
            <button ndsButton variant="ghost" size="xs" ndsInputGroupButton>${SEND_LABEL}</button>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const groups = groupsIn(canvasElement);

    await step('Cada moldura carrega a posição declarada', async () => {
      // functional.item4, primeira metade: o atributo chegou.
      await expect(groups).toHaveLength(4);
      const positions = groups.map(
        (group) =>
          group.querySelector<HTMLElement>('[data-slot="input-group-addon"]')?.dataset.align,
      );
      await expect(positions).toEqual([
        'inline-start',
        'inline-end',
        'block-start',
        'block-end',
      ]);
    });

    await step('Em linha, a ordem VISUAL acompanha a posição', async () => {
      // functional.item4, segunda metade — e a que importa. O atributo sozinho
      // não prova nada: quem move o addon é a folha, por `order`. Medir a caixa
      // é o que separa "o atributo está lá" de "o addon está no lugar".
      const leading = groups[0];
      const trailing = groups[1];

      const leadingAddon = addonOfAlign(leading, 'inline-start') as HTMLElement;
      await expect(visualStart(leadingAddon)).toBeLessThan(visualStart(controlOf(leading)));

      const trailingAddon = addonOfAlign(trailing, 'inline-end') as HTMLElement;
      await expect(visualStart(trailingAddon)).toBeGreaterThan(visualStart(controlOf(trailing)));
    });

    await step('Em bloco, o grupo empilha e o addon ocupa a largura inteira', async () => {
      const above = groups[2];
      const below = groups[3];

      const aboveAddon = addonOfAlign(above, 'block-start') as HTMLElement;
      await expect(visualTop(aboveAddon)).toBeLessThan(visualTop(controlOf(above)));

      const belowAddon = addonOfAlign(below, 'block-end') as HTMLElement;
      const belowField = controlOf(below);
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
