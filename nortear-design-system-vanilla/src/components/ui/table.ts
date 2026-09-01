// ─── Table — Vanilla factories standalone ───────────────────────────────────
// Visual: classes .nds-table / .nds-table-wrapper (standalone .nds-*).
//
// `data-slot` em cada peça: era a única stack sem ele, e a diferença aparecia
// no DataTable, cujas play functions procuram [data-slot="table"] para provar
// que a grade é uma TABELA de verdade e não uma pilha de divs. Atributo de
// contrato, nunca de estilo — nenhuma folha casa com ele.

function cls(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

/**
 * O par wrapper + tabela. O wrapper é quem ROLA, e por isso é quem leva o nome.
 *
 * `regionLabel` é o nome acessível do container que rola. SEM PADRÃO, de
 * propósito. O container é o WRAPPER, e não a `<table>`: são elementos
 * diferentes e cada um tem o seu nome — um nome escrito na tabela nomeia a
 * TABELA, que é o comportamento certo e que não se quer roubar. O wrapper é o
 * que quem monta não alcança, e é ele que entra na ordem de tabulação.
 *
 * O nome é do CONTEÚDO ("Faturas de 2026"), e o design system não tem como
 * sabê-lo. Padrão genérico ("Tabela") anunciaria sem informar: quem chegou por
 * Tab já sabe que rola, o que não sabe é o que rola. Sem nome NÃO emitimos
 * papel nenhum — `aria-label` em elemento sem papel é atributo proibido, e o
 * axe acusa `aria-prohibited-attr`.
 *
 * `group` e não `region`: `region` com nome vira marco de página, e uma tela de
 * relatório empilha várias tabelas — seriam vários marcos onde não há várias
 * seções. Quem quiser marco envolve a tabela num `<section>` nomeado.
 */
export function createTable(extraClass?: string, regionLabel?: string): {
  wrapper: HTMLDivElement;
  table: HTMLTableElement;
} {
  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'table-container';
  wrapper.className = 'nds-table-wrapper';
  // .nds-table-wrapper tem overflow-x: auto — região rolável precisa ser
  // alcançável por teclado (WCAG 2.1.1 / axe scrollable-region-focusable)
  // E precisa de papel e nome, que é a outra metade da regra: foco sozinho faz
  // uma parada que o leitor de tela não sabe anunciar.
  wrapper.tabIndex = 0;
  if (regionLabel) {
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', regionLabel);
  }

  const table = document.createElement('table');
  table.dataset.slot = 'table';
  table.className = cls('nds-table', extraClass);

  wrapper.appendChild(table);
  return { wrapper, table };
}

export function createTableHeader(extraClass?: string): HTMLTableSectionElement {
  const thead = document.createElement('thead');
  thead.dataset.slot = 'table-header';
  if (extraClass) thead.className = extraClass;
  return thead;
}

export function createTableBody(extraClass?: string): HTMLTableSectionElement {
  const tbody = document.createElement('tbody');
  tbody.dataset.slot = 'table-body';
  if (extraClass) tbody.className = extraClass;
  return tbody;
}

export function createTableFooter(extraClass?: string): HTMLTableSectionElement {
  const tfoot = document.createElement('tfoot');
  tfoot.dataset.slot = 'table-footer';
  if (extraClass) tfoot.className = extraClass;
  return tfoot;
}

export function createTableRow(extraClass?: string): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.dataset.slot = 'table-row';
  if (extraClass) tr.className = extraClass;
  return tr;
}

/**
 * @param scope Relação que o cabeçalho declara. Nasce em `'col'` porque uma
 * tabela sem `scope` é uma grade muda: o leitor de tela lê os valores sem dizer
 * de que coluna vieram (WCAG 1.3.1). Cabeçalho de linha passa `'row'`.
 *
 * O default está na factory, e não em cada chamada, porque era exatamente o que
 * cada story tinha de lembrar de escrever à mão — e a docs page não lembrava.
 */
export function createTableHead(
  text: string,
  extraClass?: string,
  scope: 'col' | 'row' | 'colgroup' | 'rowgroup' = 'col',
): HTMLTableCellElement {
  const th = document.createElement('th');
  th.dataset.slot = 'table-head';
  if (extraClass) th.className = extraClass;
  th.setAttribute('scope', scope);
  th.textContent = text;
  return th;
}

/**
 * @param lang Idioma do conteúdo da célula. Use 'en' quando o texto é
 * identificador (nome de prop, tipo, token) — sem isso a voz em pt-BR do leitor
 * de tela tenta pronunciá-lo como português. WCAG 3.1.2.
 */
export function createTableCell(text: string, extraClass?: string, lang?: string): HTMLTableCellElement {
  const td = document.createElement('td');
  td.dataset.slot = 'table-cell';
  if (extraClass) td.className = extraClass;
  if (lang) td.lang = lang;
  td.textContent = text;
  return td;
}

export function createTableCaption(text: string, extraClass?: string): HTMLTableCaptionElement {
  const caption = document.createElement('caption');
  caption.dataset.slot = 'table-caption';
  if (extraClass) caption.className = extraClass;
  caption.textContent = text;
  return caption;
}
