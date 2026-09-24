import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
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
import { ChevronDown, createElement } from 'lucide';
import { tableSource, tableSourceWith } from './table.source';
import { COLUMNS, INVOICES, MONTHS, totalOf, type Invoice } from './table.fixtures';

const meta: Meta = {
  tags: ['tables'],
  title: 'Components/Tables/Table/Variants',
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

const LINES = INVOICES.slice(0, 3);

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
    docs: { source: { transform: tableSourceWith({ captionVisible: true }) } },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes'));
    buildHeader(table, COLUMNS);
    buildBodyRows(table, INVOICES);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Uma linha por registro, quatro colunas por linha', async () => {
      // functional.item1 — a conta sai da fixture, nunca de um número escrito à
      // mão: um dado a menos deixaria a asserção verde e a tabela errada.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(INVOICES.length);
      for (const [i, line] of lines.entries()) {
        await expect(line.querySelectorAll('td').length).toBe(4);
        await expect(line).toHaveTextContent(INVOICES[i].id);
      }
      await expect(canvasElement.querySelector('tfoot')).toBeNull();
    });

    await step('A coluna de valores alinha à direita, rótulo junto com os números', async () => {
      // visual.item1 — é o caso de uso central de `nds-text-right`, e é medido
      // pelo alinhamento COMPUTADO: a classe existir no markup não prova nada.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>('thead th')];
      await expect(ths[3]).toHaveTextContent('Valor');
      await expect(getComputedStyle(ths[3]).textAlign).toBe('right');
      const valueTd = canvasElement.querySelector<HTMLElement>('tbody tr td:last-child')!;
      await expect(getComputedStyle(valueTd).textAlign).toBe('right');
      // A coluna descritiva continua à esquerda: o alinhamento é escolha por
      // coluna, não estilo da tabela.
      await expect(getComputedStyle(ths[0]).textAlign).toBe('left');
    });

    await step('A legenda visível é o nome acessível da tabela', async () => {
      const table = canvas.getByRole('table', { name: /faturas recentes/ });
      const caption = table.querySelector<HTMLElement>('caption')!;
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
        transform: tableSourceWith({ caption: 'Faturas recentes com total', withFooter: true }),
      },
    },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas recentes com total', 'nds-sr-only'));
    buildHeader(table, COLUMNS);
    buildBodyRows(table, LINES);

    const tfoot = createTableFooter();
    const footerRow = createTableRow();
    const totalLabel = createTableCell('Total');
    totalLabel.setAttribute('colspan', '3');
    footerRow.appendChild(totalLabel);
    footerRow.appendChild(createTableCell(totalOf(LINES), 'nds-text-right'));
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('O rodapé fica depois do corpo e cobre as três primeiras colunas', async () => {
      // functional.item3 — o `colspan` é o que faz o rótulo "Total" ocupar a
      // largura das colunas descritivas e o valor cair sob a coluna certa.
      const table = canvasElement.querySelector<HTMLElement>('table')!;
      const tfoot = table.querySelector<HTMLElement>('tfoot')!;
      const position = table.querySelector('tbody')!.compareDocumentPosition(tfoot);
      await expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector('td')).toHaveAttribute('colspan', '3');
      // O total é derivado das linhas exibidas — número fixo continuaria verde
      // depois de alguém acrescentar uma linha.
      await expect(tfoot).toHaveTextContent(totalOf(LINES));
      await expect(table.querySelectorAll('tbody tr').length).toBe(LINES.length);
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

// ─── Legenda só para leitor de tela ───────────────────────────────────────────

export const CaptionSrOnly: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item2'] },
  // Sem override: a legenda fora da tela já é o que o snippet do meta mostra.
  render: () => {
    const block = document.createElement('div');
    block.className = 'nds-stack';
    block.dataset.spacing = 'sm';

    const title = document.createElement('h2');
    title.className = 'nds-text-h3 nds-m-0';
    title.textContent = 'Faturas recentes';
    block.appendChild(title);

    const { wrapper, table } = createTable();
    // `nds-sr-only`, com prefixo: `sr-only` não existe no CSS deste projeto, e
    // a legenda ficava VISÍVEL, duplicando o título logo acima.
    table.appendChild(createTableCaption('Lista de faturas recentes', 'nds-sr-only'));
    buildHeader(table, COLUMNS);
    buildBodyRows(table, LINES);
    block.appendChild(wrapper);

    return block;
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
        transform: tableSourceWith({ caption: 'Faturas recentes com ações', withActions: true }),
      },
    },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas recentes com ações', 'nds-sr-only'));

    const thead = createTableHeader();
    const headerRow = createTableRow();
    for (const col of COLUMNS) {
      headerRow.appendChild(createTableHead(col, col === 'Valor' ? 'nds-text-right' : undefined));
    }
    // O cabeçalho da coluna de ações não é decorativo: sem ele a coluna existe
    // para quem vê e some para quem navega por cabeçalhos. Quem sai da tela é o
    // RÓTULO, num span — `nds-sr-only` no próprio `th` tiraria a célula do fluxo
    // da tabela e desmontaria a grade.
    const thActions = createTableHead('');
    const labelActions = document.createElement('span');
    labelActions.className = 'nds-sr-only';
    labelActions.textContent = 'Ações';
    thActions.appendChild(labelActions);
    headerRow.appendChild(thActions);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = buildBodyRows(table, LINES);
    for (const [i, tr] of [...tbody.rows].entries()) {
      const actionCell = createTableCell('', 'nds-text-right');
      actionCell.appendChild(
        createButton({
          variant: 'ghost',
          size: 'sm',
          label: 'Ações',
          'aria-label': `Ações para fatura ${LINES[i].id}`,
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
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBe(LINES.length);
      for (const [i, button] of buttons.entries()) {
        await expect(button).toHaveAccessibleName(`Ações para fatura ${LINES[i].id}`);
        // O botão mora dentro da própria linha do registro que ele opera.
        await expect(button.closest('tr')).toHaveTextContent(LINES[i].id);
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

// ─── Rolagem horizontal ───────────────────────────────────────────────────────

export const HorizontalScroll: Story = {
  parameters: { covers: ['functional.item5'] },
  // Sem override: a rolagem é do wrapper que a montagem canônica já cria — o
  // que muda aqui é só quantas colunas o exemplo tem.
  render: () => {
    // A legenda nomeia a TABELA; o segundo argumento nomeia o WRAPPER, que é
    // quem rola e quem entra na ordem de tabulação. São elementos diferentes e
    // cada um precisa do seu nome: sem o segundo, quem chega por Tab faz uma
    // parada que o leitor de tela não sabe anunciar (C4 e C5 do PRD).
    const legenda = 'Faturas por mês de competência';
    const { wrapper, table } = createTable(undefined, legenda);
    table.appendChild(createTableCaption(legenda, 'nds-sr-only'));

    const thead = createTableHeader();
    const headerRow = createTableRow();
    headerRow.appendChild(createTableHead('Fatura'));
    for (const month of MONTHS) headerRow.appendChild(createTableHead(month));
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createTableBody();
    for (const inv of LINES) {
      const tr = createTableRow();
      tr.appendChild(createTableCell(inv.id, 'nds-font-medium'));
      for (const _month of MONTHS) tr.appendChild(createTableCell(inv.amount, 'nds-text-right'));
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
      // Foco sem papel nem nome é metade do contrato: `aria-label` em elemento
      // sem papel é atributo proibido (axe aria-prohibited-attr), e papel sem
      // nome anuncia uma parada sem dizer o que rola.
      await expect(wrapper).toHaveAttribute('role', 'group');
      await expect(wrapper).toHaveAccessibleName('Faturas por mês de competência');
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

// ─── Linhas expansíveis ───────────────────────────────────────────────────────

/** Ids do detalhe: únicos por montagem, porque a story monta em mais de um lugar. */
let detailSeq = 0;

/**
 * Uma linha de dados com disclosure, e a linha irmã que ela revela.
 *
 * As quatro decisões da forma, e o motivo de cada uma:
 *
 * 1. **`aria-expanded` no BOTÃO, nunca na `<tr>`.** A linha já usa `data-state`
 *    para a SELEÇÃO, e os dois estados coexistem — uma linha marcada pode estar
 *    aberta. Quem faz a linha reagir ao controle é a folha compartilhada, por
 *    `tbody tr:has([aria-expanded="true"])`; o `:has()` existe exatamente para
 *    o estado morar no controle e o efeito acontecer na linha.
 * 2. **A revelada é IRMÃ, sempre no DOM, escondida por `hidden`.** O `id` dela é
 *    o alvo do `aria-controls`, e um alvo que some deixa o atributo apontando
 *    para nada. O `colspan` é fixado na montagem — colunas de dado mais a do
 *    disclosure — e não muda ao abrir.
 * 3. **O leitor de tela anuncia pelo `aria-expanded`.** O nome acessível é do
 *    REGISTRO ("Detalhes da fatura #INV-001") e não muda: trocar "Mostrar" por
 *    "Ocultar" diria a mesma coisa duas vezes e ficaria em desacordo com o
 *    atributo no instante entre uma escrita e outra. Nada de live region — a
 *    mudança de estado do próprio controle já é anunciada.
 * 4. **A ordem de foco sai do DOM.** A linha revelada vem imediatamente depois
 *    da linha de dados, então o que ela contém é o próximo ponto de tabulação
 *    depois do controle, sem `tabindex` nenhum. Fechada, ela é `hidden`: sai da
 *    tabulação e da árvore de acessibilidade pelo mesmo atributo.
 */
function buildExpandableRow(
  tbody: HTMLTableSectionElement,
  invoice: Invoice,
  selected = false,
): void {
  const detailId = `table-row-detail-${++detailSeq}`;

  const row = createTableRow();
  if (selected) row.setAttribute('data-state', 'selected');

  const controlCell = createTableCell('');
  const toggle = createButton({
    variant: 'ghost',
    size: 'icon-sm',
    'aria-label': `Detalhes da fatura ${invoice.id}`,
  });
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', detailId);
  // Sem classe de tamanho: `.nds-button > svg` já dimensiona o ícone dentro do
  // botão. `nds-chevron` é a rotação global do disclosure, e ela casa com
  // `[aria-expanded="true"]` — o mesmo atributo que a folha da tabela lê.
  const chevron = createElement(ChevronDown);
  chevron.setAttribute('aria-hidden', 'true');
  chevron.classList.add('nds-chevron');
  toggle.appendChild(chevron);
  controlCell.appendChild(toggle);
  row.appendChild(controlCell);

  row.appendChild(createTableCell(invoice.id, 'nds-font-medium'));
  row.appendChild(createTableCell(invoice.status));
  row.appendChild(createTableCell(invoice.method));
  row.appendChild(createTableCell(invoice.amount, 'nds-text-right'));
  tbody.appendChild(row);

  const detailRow = createTableRow();
  detailRow.id = detailId;
  detailRow.hidden = true;
  const detailCell = createTableCell('');
  detailCell.setAttribute('colspan', String(COLUMNS.length + 1));

  const stack = document.createElement('div');
  stack.className = 'nds-stack';
  stack.dataset.spacing = 'sm';
  const description = document.createElement('p');
  description.className = 'nds-text-muted-foreground';
  description.textContent = `Emitida por ${invoice.method}, no valor de ${invoice.amount}.`;
  // Um controle dentro do detalhe: é ele que prova que o conteúdo revelado vem
  // depois do disclosure na tabulação — e que some dela quando a linha fecha.
  const receipt = createButton({
    variant: 'outline',
    size: 'sm',
    label: 'Baixar recibo',
    'aria-label': `Baixar recibo da fatura ${invoice.id}`,
  });
  stack.append(description, receipt);
  detailCell.appendChild(stack);
  detailRow.appendChild(detailCell);
  tbody.appendChild(detailRow);

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    detailRow.hidden = open;
  });
}

export const WithExpandableRows: Story = {
  parameters: {
    // Os três itens nasceram nesta mesma rodada, junto com a decisão de que a
    // linha expansível é recurso do Table. O `visual.item7` é o que prova o
    // conserto de cascata: marcada E expandida mantém a cor da seleção.
    covers: ['functional.item8', 'visual.item7', 'accessibility.item5'],
    docs: {
      source: {
        transform: tableSourceWith({
          caption: 'Faturas recentes com detalhes',
          withExpandableRows: true,
        }),
      },
    },
  },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Faturas recentes com detalhes', 'nds-sr-only'));

    const thead = createTableHeader();
    const headerRow = createTableRow();
    // A coluna do disclosure vem primeiro e tem cabeçalho: o rótulo sai da tela
    // num span, e não por classe no `th`, que desmontaria a grade.
    const thDetails = createTableHead('');
    const labelDetails = document.createElement('span');
    labelDetails.className = 'nds-sr-only';
    labelDetails.textContent = 'Detalhes';
    thDetails.appendChild(labelDetails);
    headerRow.appendChild(thDetails);
    for (const col of COLUMNS) {
      headerRow.appendChild(createTableHead(col, col === 'Valor' ? 'nds-text-right' : undefined));
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createTableBody();
    // A segunda também está MARCADA: aberta e selecionada ao mesmo tempo é o
    // caso que o `:not([data-state="selected"])` da folha protege.
    for (const [i, inv] of LINES.entries()) buildExpandableRow(tbody, inv, i === 1);
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const rows = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const toggles = () => canvas.getAllByRole('button', { name: /^Detalhes da fatura/ });

    // Cada par de linhas é dado + detalhe: 0 dado, 1 detalhe, 2 dado marcado…
    const collapsedBackground = getComputedStyle(rows()[0]).backgroundColor;
    const selectedBackground = getComputedStyle(rows()[2]).backgroundColor;

    await step('Fechada, a linha de detalhe sai da tela e da tabulação', async () => {
      await expect(rows().length).toBe(LINES.length * 2);
      for (const [i, toggle] of toggles().entries()) {
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAttribute('aria-controls', rows()[i * 2 + 1].id);
        // O detalhe atravessa as colunas de dado MAIS a do disclosure.
        const cell = rows()[i * 2 + 1].querySelector('td')!;
        await expect(cell).toHaveAttribute('colspan', String(COLUMNS.length + 1));
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
      await expect(toggles()[0]).toHaveAccessibleName(`Detalhes da fatura ${LINES[0].id}`);
    });

    await step('O conteúdo revelado é o próximo ponto de tabulação', async () => {
      // A linha irmã vem logo depois da linha de dados no DOM: a ordem de foco
      // sai daí, sem `tabindex` nenhum.
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: `Baixar recibo da fatura ${LINES[0].id}` }),
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
