import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Table } from './index';
import TableVarianteBasica from './TableVarianteBasica.svelte';
import TableVarianteComRodape from './TableVarianteComRodape.svelte';
import TableVarianteCaptionSrOnly from './TableVarianteCaptionSrOnly.svelte';
import TableVarianteComAcoes from './TableVarianteComAcoes.svelte';
import TableVarianteRolagemHorizontal from './TableVarianteRolagemHorizontal.svelte';
import {
  tableBasicaSource,
  tableWithActionsSource,
  tableWithFooterSource,
  tableCaptionOcultaSource,
  tableScrollHorizontalSource,
  tableSource,
} from './table.source';

const meta: Meta = {
  title: 'Components/Tables/Table/Variants',
  component: Table,
  tags: ['tables'],
  parameters: {
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: tableSource },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: { source: { transform: tableBasicaSource } },
  },
  render: () => ({
    Component: TableVarianteBasica,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A tabela é uma tabela, com as seções semânticas no lugar', async () => {
      // functional.item1 — o que faz um leitor de tela anunciar "tabela, 4
      // colunas" é a tag, não a classe. Uma grade montada com div passaria
      // visualmente e sumiria da árvore de acessibilidade.
      const table = canvas.getByRole('table');
      await expect(table.tagName).toBe('TABLE');
      await expect(table).toHaveClass('nds-table');
      await expect(table.querySelector('thead')).toHaveAttribute('data-slot', 'table-header');
      await expect(table.querySelector('tbody')).toHaveAttribute('data-slot', 'table-body');
    });

    await step('Uma linha por registro, quatro colunas por linha', async () => {
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(5);
      for (const line of lines) {
        await expect(line).toHaveAttribute('data-slot', 'table-row');
        await expect(line.querySelectorAll('td').length).toBe(4);
      }
    });

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — é o caso de uso central de `nds-text-right`: número se lê
      // pela unidade, alinhado à direita, e o rótulo tem de acompanhar. A
      // asserção é do alinhamento COMPUTADO, não da classe: por muito tempo o
      // seletor de `th` do CSS compartilhado vencia a utilitária e a classe era
      // inerte — verde no markup, torto na tela.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      const valueTh = ths[ths.length - 1];
      await expect(valueTh).toHaveTextContent('Valor');
      await expect(getComputedStyle(valueTh).textAlign).toBe('right');
      const valueTd = canvasElement.querySelector<HTMLElement>('tbody tr td:last-child')!;
      await expect(getComputedStyle(valueTd).textAlign).toBe('right');
      // A coluna descritiva continua à esquerda: o alinhamento é escolha por
      // coluna, não estilo da tabela.
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
    });

    await step('A legenda visível é o nome acessível da tabela', async () => {
      const table = canvas.getByRole('table', { name: /faturas recentes/ });
      const caption = table.querySelector<HTMLElement>('caption')!;
      await expect(caption.classList.contains('nds-sr-only')).toBe(false);
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: { source: { transform: tableWithFooterSource } },
  },
  render: () => ({
    Component: TableVarianteComRodape,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé fica depois do corpo e cobre as três primeiras colunas', async () => {
      // functional.item3 — o `colspan` é o que faz o rótulo "Total" ocupar a
      // largura das colunas descritivas e o valor cair sob a coluna certa.
      const table = canvasElement.querySelector<HTMLElement>('table')!;
      const tfoot = table.querySelector<HTMLElement>('tfoot')!;
      await expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
      const position = table.querySelector('tbody')!.compareDocumentPosition(tfoot);
      await expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector('td')).toHaveAttribute('colspan', '3');
      // O total é a soma das linhas do corpo — número escrito à mão que não
      // fecha é defeito que só a conta pega.
      await expect(tfoot).toHaveTextContent('R$ 1.400,00');
      await expect(table.querySelectorAll('tbody tr').length).toBe(5);
    });

    await step('O rodapé se distingue do corpo por fundo próprio', async () => {
      // visual.item3 — `.nds-table tfoot tr` pinta hsl(var(--muted) / 0.5). Sem
      // a distinção o sumário some no meio dos registros.
      const lineFooter = canvasElement.querySelector<HTMLElement>('tfoot tr')!;
      const lineBody = canvasElement.querySelector<HTMLElement>('tbody tr')!;
      await expect(getComputedStyle(lineFooter).backgroundColor).not.toBe(
        getComputedStyle(lineBody).backgroundColor,
      );
    });
  },
};

export const CaptionSrOnly: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item2'],
    docs: { source: { transform: tableCaptionOcultaSource } },
  },
  render: () => ({
    Component: TableVarianteCaptionSrOnly,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A legenda está no DOM e fora da tela', async () => {
      // functional.item6 — `display: none` tiraria também da árvore de
      // acessibilidade; `nds-sr-only` recorta a caixa e mantém a leitura.
      // A asserção é do EFEITO: assertar a classe deixava passar o caso em que
      // ela existe no markup e não existe no CSS.
      const caption = canvasElement.querySelector<HTMLElement>('caption')!;
      await expect(caption).toHaveTextContent('Lista de faturas recentes');
      await expect(getComputedStyle(caption).position).toBe('absolute');
      const r = caption.getBoundingClientRect();
      await expect(Math.max(r.width, r.height)).toBeLessThanOrEqual(2);
    });

    await step('A tabela continua nomeada para o leitor de tela', async () => {
      // accessibility.item2 — é isto que a legenda invisível existe para
      // garantir; sem ela o leitor anuncia só "tabela".
      await expect(canvas.getByRole('table', { name: /Lista de faturas recentes/ })).toBeTruthy();
    });
  },
};

export const WithRowActions: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item4'],
    docs: { source: { transform: tableWithActionsSource } },
  },
  render: () => ({
    Component: TableVarianteComAcoes,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada ação diz a qual fatura pertence', async () => {
      // accessibility.item3 — três botões chamados "Ações" seriam três
      // controles indistinguíveis na lista de elementos do leitor de tela.
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBe(3);
      for (const button of buttons) {
        await expect(button.getAttribute('aria-label')).toMatch(/Ações para fatura #INV-\d{3}/);
        // O botão mora dentro da própria linha do registro que ele edita.
        const id = button.getAttribute('aria-label')!.replace('Ações para fatura ', '');
        await expect(button.closest('tr')).toHaveTextContent(id);
      }
    });

    await step('O botão de ação é discreto (variante ghost)', async () => {
      // visual.item4 — a coluna de ações não pode competir com o dado; o ghost
      // é o que o conteúdo compartilhado documenta para ação por linha.
      const button = canvas.getAllByRole('button')[0];
      await expect(button).toHaveClass('nds-button', 'nds-button-ghost');
    });
  },
};

export const HorizontalScroll: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: tableScrollHorizontalSource } },
  },
  render: () => ({
    Component: TableVarianteRolagemHorizontal,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Quem rola é o container, e ele aceita foco', async () => {
      // functional.item5 — sem o wrapper a tabela empurraria a página inteira
      // para o lado; sem o tabindex a rolagem existiria só para o mouse
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      await expect(wrapper).toHaveClass('nds-table-wrapper');
      await expect(wrapper).toHaveAttribute('tabindex', '0');
      await expect(getComputedStyle(wrapper).overflowX).toBe('auto');
      await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
    });

    await step('A rolagem chega ao fim da tabela', async () => {
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      wrapper.focus();
      await expect(wrapper).toHaveFocus();
      wrapper.scrollLeft = wrapper.scrollWidth;
      await expect(wrapper.scrollLeft).toBeGreaterThan(0);
    });
  },
};
