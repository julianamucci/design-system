import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Table } from './index';
import TableVarianteBasica from './TableVarianteBasica.svelte';
import TableVariantWithFooter from './TableVariantWithFooter.svelte';
import TableVarianteCaptionSrOnly from './TableVarianteCaptionSrOnly.svelte';
import TableVarianteComAcoes from './TableVarianteComAcoes.svelte';
import TableVarianteRolagemHorizontal from './TableVarianteRolagemHorizontal.svelte';
import TableVariantWithExpandableRows from './TableVariantWithExpandableRows.svelte';
import {
  tableBasicaSource,
  tableWithActionsSource,
  tableWithFooterSource,
  tableCaptionOcultaSource,
  tableScrollHorizontalSource,
  tableSource,
  tableWithExpandableRowsSource,
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
    Component: TableVariantWithFooter,
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

      // A parada só é anunciável com PAPEL e NOME: `group` (e não `region`, que
      // viraria marco de página numa tela com várias tabelas) mais o nome do
      // conteúdo, que vem de fora porque o design system não o conhece.
      await expect(wrapper).toHaveAttribute('role', 'group');
      await expect(wrapper).toHaveAccessibleName('Faturas por mês de competência');
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

/**
 * Linha expansível: dois `<tr>` irmãos por registro — o de dados e o de detalhe
 * que ele revela. Fica no arquivo `-variants` porque linha expansível é FORMA
 * escolhida na montagem, irmã de `WithRowActions`, e não um estado do mesmo
 * exemplo.
 *
 * As quatro decisões da forma estão no próprio componente
 * (`TableVariantWithExpandableRows.svelte`); aqui ficam as asserções.
 */
export const WithExpandableRows: Story = {
  parameters: {
    // Os três itens nasceram nesta mesma rodada, junto com a decisão de que a
    // linha expansível é recurso do Table. O `visual.item7` é o que prova o
    // conserto de cascata: marcada E expandida mantém a cor da seleção.
    covers: ['functional.item8', 'visual.item7', 'accessibility.item5'],
    docs: { source: { transform: tableWithExpandableRowsSource } },
  },
  render: () => ({
    Component: TableVariantWithExpandableRows,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const rows = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const toggles = () => canvas.getAllByRole('button', { name: /^Detalhes da fatura/ });
    // Três registros, três pares de linhas.
    const LINES = 3;
    // Quatro colunas de dado mais a do disclosure.
    const DETAIL_COLSPAN = '5';

    // Cada par de linhas é dado + detalhe: 0 dado, 1 detalhe, 2 dado marcado…
    const collapsedBackground = getComputedStyle(rows()[0]).backgroundColor;
    const selectedBackground = getComputedStyle(rows()[2]).backgroundColor;

    await step('Fechada, a linha de detalhe sai da tela e da tabulação', async () => {
      await expect(rows().length).toBe(LINES * 2);
      for (const [i, toggle] of toggles().entries()) {
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAttribute('aria-controls', rows()[i * 2 + 1].id);
        // O detalhe atravessa as colunas de dado MAIS a do disclosure.
        const cell = rows()[i * 2 + 1].querySelector('td')!;
        await expect(cell).toHaveAttribute('colspan', DETAIL_COLSPAN);
      }
      // `hidden` tira da tela, da árvore de acessibilidade e da tabulação de uma
      // vez — por isso o botão do detalhe não é alcançável por papel.
      await expect(getComputedStyle(rows()[1]).display).toBe('none');
      await expect(canvas.queryAllByRole('button', { name: /^Baixar recibo/ }).length).toBe(0);
    });

    await step('Enter no controle abre a linha irmã, e o nome não muda', async () => {
      // Teclado, e não clique: o ponteiro deixaria a linha em `:hover`, que pinta
      // com a MESMA cor da regra que este teste existe para provar — a asserção
      // do fundo passaria com ou sem o recurso.
      toggles()[0].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(rows()[1].hidden).toBe(false);
      await expect(rows()[1].getBoundingClientRect().height).toBeGreaterThan(0);
      // Quem anuncia o estado é o `aria-expanded`; o nome continua sendo o do
      // registro, nos dois sentidos da alternância.
      await expect(toggles()[0]).toHaveAccessibleName('Detalhes da fatura #INV-001');
    });

    await step('O conteúdo revelado é o próximo ponto de tabulação', async () => {
      // A linha irmã vem logo depois da linha de dados no DOM: a ordem de foco
      // sai daí, sem `tabindex` nenhum.
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: 'Baixar recibo da fatura #INV-001' }),
      ).toHaveFocus();
    });

    await step('A linha expandida muda de fundo', async () => {
      // É o contrato da folha compartilhada (`:has([aria-expanded="true"])`), e
      // até hoje ele não tinha produtor em stack nenhuma.
      const expandedBackground = getComputedStyle(rows()[0]).backgroundColor;
      await expect(expandedBackground).not.toBe(collapsedBackground);
      await expect(expandedBackground).not.toBe('rgba(0, 0, 0, 0)');
      // A terceira continua fechada: a mudança é da linha aberta, não da tabela.
      await expect(getComputedStyle(rows()[4]).backgroundColor).toBe(collapsedBackground);
    });

    await step('Marcada e expandida ao mesmo tempo: a cor da seleção vence', async () => {
      // Os três seletores de fundo são (0,2,2) — sem o `:not([data-state="selected"])`
      // a regra do disclosure é a última do arquivo e rebaixaria a linha marcada
      // ao tom claro do hover.
      toggles()[1].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(rows()[3].hidden).toBe(false);
      await expect(getComputedStyle(rows()[2]).backgroundColor).toBe(selectedBackground);
      await expect(getComputedStyle(rows()[2]).backgroundColor).not.toBe(
        getComputedStyle(rows()[0]).backgroundColor,
      );
    });

    await step('Enter de novo fecha, e tudo volta ao estado anterior', async () => {
      toggles()[0].focus();
      await userEvent.keyboard('{Enter}');

      await expect(toggles()[0]).toHaveAttribute('aria-expanded', 'false');
      await expect(getComputedStyle(rows()[1]).display).toBe('none');
      await expect(getComputedStyle(rows()[0]).backgroundColor).toBe(collapsedBackground);
      await expect(canvas.queryAllByRole('button', { name: /^Baixar recibo/ }).length).toBe(1);
    });
  },
};
