// ─── Table — Vanilla factories standalone ───────────────────────────────────
// Visual: classes .nds-table / .nds-table-wrapper (standalone .nds-*).

function cls(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

export function createTable(extraClass?: string): {
  wrapper: HTMLDivElement;
  table: HTMLTableElement;
} {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-table-wrapper';
  // .nds-table-wrapper tem overflow-x: auto — região rolável precisa ser
  // alcançável por teclado (WCAG 2.1.1 / axe scrollable-region-focusable).
  wrapper.tabIndex = 0;

  const table = document.createElement('table');
  table.className = cls('nds-table', extraClass);

  wrapper.appendChild(table);
  return { wrapper, table };
}

export function createTableHeader(extraClass?: string): HTMLTableSectionElement {
  const thead = document.createElement('thead');
  if (extraClass) thead.className = extraClass;
  return thead;
}

export function createTableBody(extraClass?: string): HTMLTableSectionElement {
  const tbody = document.createElement('tbody');
  if (extraClass) tbody.className = extraClass;
  return tbody;
}

export function createTableFooter(extraClass?: string): HTMLTableSectionElement {
  const tfoot = document.createElement('tfoot');
  if (extraClass) tfoot.className = extraClass;
  return tfoot;
}

export function createTableRow(extraClass?: string): HTMLTableRowElement {
  const tr = document.createElement('tr');
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
  if (extraClass) td.className = extraClass;
  if (lang) td.lang = lang;
  td.textContent = text;
  return td;
}

export function createTableCaption(text: string, extraClass?: string): HTMLTableCaptionElement {
  const caption = document.createElement('caption');
  if (extraClass) caption.className = extraClass;
  caption.textContent = text;
  return caption;
}
