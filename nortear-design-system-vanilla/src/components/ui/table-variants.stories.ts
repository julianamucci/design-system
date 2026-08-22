import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableFooter,
  createTableRow,
  createTableHead,
  createTableCell,
  createTableCaption,
} from './table';
import { createButton } from '@/components/ui/button';
import { tableSource, tableSourceCom } from './table.source';
import { COLUNAS, INVOICES, MESES, totalDe, type Invoice } from './table.fixtures';

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/Table/Variants',
  parameters: {
    // Sem argTypes: sem isto o painel Controls abre vazio.
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: { source: { transform: tableSource } },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LINHAS = INVOICES.slice(0, 3);

/**
 * Cabeçalho padrão. A última coluna é numérica e recebe `nds-text-right`: o
 * rótulo tem de acompanhar os números que ele nomeia. Esta stack não escrevia a
 * classe em lugar nenhum — a coluna de valores saía alinhada à esquerda.
 */
function buildHeader(table: HTMLTableElement, cols: string[]): void {
  const thead = createTableHeader();
  const tr = createTableRow();
  for (const col of cols) {
    tr.appendChild(createTableHead(col, col === 'Valor' ? 'nds-text-right' : undefined));
  }
  thead.appendChild(tr);
  table.appendChild(thead);
}

function buildBodyRows(table: HTMLTableElement, rows: Invoice[]): HTMLTableSectionElement {
  const tbody = createTableBody();
  for (const inv of rows) {
    const tr = createTableRow();
    tr.appendChild(createTableCell(inv.id, 'nds-font-medium'));
    tr.appendChild(createTableCell(inv.status));
    tr.appendChild(createTableCell(inv.method));
    tr.appendChild(createTableCell(inv.amount, 'nds-text-right'));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return tbody;
}

// ─── Básica ───────────────────────────────────────────────────────────────────

export const Basic: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    // Legenda VISÍVEL: o snippet do meta a deixa fora da tela, que é o oposto
    // do que esta story mostra.
    docs: { source: { transform: tableSourceCom({ captionVisivel: true }) } },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes'));
    buildHeader(table, COLUNAS);
    buildBodyRows(table, INVOICES);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Uma linha por registro, quatro colunas por linha', async () => {
      // functional.item1 — a conta sai da fixture, nunca de um número escrito à
      // mão: um dado a menos deixaria a asserção verde e a tabela errada.
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(linhas.length).toBe(INVOICES.length);
      for (const [i, linha] of linhas.entries()) {
        await expect(linha.querySelectorAll('td').length).toBe(4);
        await expect(linha).toHaveTextContent(INVOICES[i].id);
      }
      await expect(canvasElement.querySelector('tfoot')).toBeNull();
    });

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — é o caso de uso central de `nds-text-right`, e é medido
      // pelo alinhamento COMPUTADO: a classe existir no markup não prova nada.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      await expect(ths[3]).toHaveTextContent('Valor');
      await expect(getComputedStyle(ths[3]).textAlign).toBe('right');
      const valorTd = canvasElement.querySelector<HTMLElement>('tbody tr td:last-child')!;
      await expect(getComputedStyle(valorTd).textAlign).toBe('right');
      // A coluna descritiva continua à esquerda: o alinhamento é escolha por
      // coluna, não estilo da tabela.
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
    });

    await step('A legenda visível é o nome acessível da tabela', async () => {
      const tabela = canvas.getByRole('table', { name: /faturas recentes/ });
      const caption = tabela.querySelector<HTMLElement>('caption')!;
      await expect(getComputedStyle(caption).position).not.toBe('absolute');
    });
  },
};

// ─── Com rodapé ───────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: {
      source: {
        transform: tableSourceCom({ caption: 'Faturas recentes com total', comRodape: true }),
      },
    },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas recentes com total', 'nds-sr-only'));
    buildHeader(table, COLUNAS);
    buildBodyRows(table, LINHAS);

    const tfoot = createTableFooter();
    const footerRow = createTableRow();
    const totalLabel = createTableCell('Total');
    totalLabel.setAttribute('colspan', '3');
    footerRow.appendChild(totalLabel);
    footerRow.appendChild(createTableCell(totalDe(LINHAS), 'nds-text-right'));
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('O rodapé fica depois do corpo e cobre as três primeiras colunas', async () => {
      // functional.item3 — o `colspan` é o que faz o rótulo "Total" ocupar a
      // largura das colunas descritivas e o valor cair sob a coluna certa.
      const tabela = canvasElement.querySelector<HTMLElement>('table')!;
      const tfoot = tabela.querySelector<HTMLElement>('tfoot')!;
      const posicao = tabela.querySelector('tbody')!.compareDocumentPosition(tfoot);
      await expect(posicao & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector('td')).toHaveAttribute('colspan', '3');
      // O total é derivado das linhas exibidas — número fixo continuaria verde
      // depois de alguém acrescentar uma linha.
      await expect(tfoot).toHaveTextContent(totalDe(LINHAS));
      await expect(tabela.querySelectorAll('tbody tr').length).toBe(LINHAS.length);
    });

    await step('O rodapé se distingue do corpo por fundo próprio', async () => {
      // visual.item3 — `.nds-table tfoot tr` pinta hsl(var(--muted) / 0.5). Sem
      // a distinção o sumário some no meio dos registros.
      const linhaRodape = canvasElement.querySelector<HTMLElement>('tfoot tr')!;
      const linhaCorpo = canvasElement.querySelector<HTMLElement>('tbody tr')!;
      await expect(getComputedStyle(linhaRodape).backgroundColor).not.toBe(
        getComputedStyle(linhaCorpo).backgroundColor,
      );
    });
  },
};

// ─── Legenda só para leitor de tela ───────────────────────────────────────────

export const CaptionSrOnly: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item2'] },
  // Sem override: a legenda fora da tela já é o que o snippet do meta mostra.
  render: () => {
    const bloco = document.createElement('div');
    bloco.className = 'nds-stack';
    bloco.dataset.spacing = 'sm';

    const titulo = document.createElement('h2');
    titulo.className = 'nds-text-h3 nds-m-0';
    titulo.textContent = 'Faturas recentes';
    bloco.appendChild(titulo);

    const { wrapper, table } = createTable();
    // `nds-sr-only`, com prefixo: `sr-only` não existe no CSS deste projeto, e
    // a legenda ficava VISÍVEL, duplicando o título logo acima.
    table.appendChild(createTableCaption('Lista de faturas recentes', 'nds-sr-only'));
    buildHeader(table, COLUNAS);
    buildBodyRows(table, LINHAS);
    bloco.appendChild(wrapper);

    return bloco;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A legenda está no DOM e fora da tela', async () => {
      // functional.item6 — `display: none` tiraria também da árvore de
      // acessibilidade. A asserção é do EFEITO, e não do nome da classe: a
      // versão anterior conferia `classList.contains('sr-only')` e passava
      // justamente porque a classe morta estava lá.
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

// ─── Ações por linha ──────────────────────────────────────────────────────────

export const WithRowActions: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item4'],
    // A coluna de ação muda a montagem: mais um cabeçalho e mais uma célula
    // por linha, com o nome do botão dizendo de qual fatura ele é.
    docs: {
      source: {
        transform: tableSourceCom({ caption: 'Faturas recentes com ações', comAcoes: true }),
      },
    },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas recentes com ações', 'nds-sr-only'));

    const thead = createTableHeader();
    const headerRow = createTableRow();
    for (const col of COLUNAS) {
      headerRow.appendChild(createTableHead(col, col === 'Valor' ? 'nds-text-right' : undefined));
    }
    // O cabeçalho da coluna de ações não é decorativo: sem ele a coluna existe
    // para quem vê e some para quem navega por cabeçalhos. Quem sai da tela é o
    // RÓTULO, num span — `nds-sr-only` no próprio `th` tiraria a célula do fluxo
    // da tabela e desmontaria a grade.
    const thAcoes = createTableHead('');
    const rotuloAcoes = document.createElement('span');
    rotuloAcoes.className = 'nds-sr-only';
    rotuloAcoes.textContent = 'Ações';
    thAcoes.appendChild(rotuloAcoes);
    headerRow.appendChild(thAcoes);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = buildBodyRows(table, LINHAS);
    for (const [i, tr] of [...tbody.rows].entries()) {
      const actionCell = createTableCell('', 'nds-text-right');
      actionCell.appendChild(
        createButton({
          variant: 'ghost',
          size: 'sm',
          label: 'Ações',
          'aria-label': `Ações para fatura ${LINHAS[i].id}`,
        }),
      );
      tr.appendChild(actionCell);
    }

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada ação diz a qual fatura pertence', async () => {
      // accessibility.item3 — três botões chamados "Ações" seriam três
      // controles indistinguíveis na lista de elementos do leitor de tela.
      const botoes = canvas.getAllByRole('button');
      await expect(botoes.length).toBe(LINHAS.length);
      for (const [i, botao] of botoes.entries()) {
        await expect(botao).toHaveAccessibleName(`Ações para fatura ${LINHAS[i].id}`);
        // O botão mora dentro da própria linha do registro que ele opera.
        await expect(botao.closest('tr')).toHaveTextContent(LINHAS[i].id);
      }
    });

    await step('O botão de ação é discreto (variante ghost)', async () => {
      // visual.item4 — a coluna de ações não pode competir com o dado; o ghost
      // é o que o conteúdo compartilhado documenta para ação por linha.
      const botao = canvas.getAllByRole('button')[0];
      await expect(botao).toHaveClass('nds-button', 'nds-button-ghost');
    });
  },
};

// ─── Rolagem horizontal ───────────────────────────────────────────────────────

export const HorizontalScroll: Story = {
  parameters: { covers: ['functional.item5'] },
  // Sem override: a rolagem é do wrapper que a montagem canônica já cria — o
  // que muda aqui é só quantas colunas o exemplo tem.
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas por mês de competência', 'nds-sr-only'));

    const thead = createTableHeader();
    const headerRow = createTableRow();
    headerRow.appendChild(createTableHead('Fatura'));
    for (const mes of MESES) headerRow.appendChild(createTableHead(mes));
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createTableBody();
    for (const inv of LINHAS) {
      const tr = createTableRow();
      tr.appendChild(createTableCell(inv.id, 'nds-font-medium'));
      for (const _mes of MESES) tr.appendChild(createTableCell(inv.amount, 'nds-text-right'));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Quem rola é o container, e ele aceita foco', async () => {
      // functional.item5 — sem o wrapper a tabela empurraria a página inteira
      // para o lado; sem o tabindex a rolagem existiria só para o mouse
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('.nds-table-wrapper')!;
      await expect(wrapper).toHaveAttribute('tabindex', '0');
      await expect(getComputedStyle(wrapper).overflowX).toBe('auto');
      await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
    });

    await step('A rolagem chega ao fim da tabela', async () => {
      const wrapper = canvasElement.querySelector<HTMLElement>('.nds-table-wrapper')!;
      wrapper.focus();
      await expect(wrapper).toHaveFocus();
      wrapper.scrollLeft = wrapper.scrollWidth;
      await expect(wrapper.scrollLeft).toBeGreaterThan(0);
    });
  },
};
