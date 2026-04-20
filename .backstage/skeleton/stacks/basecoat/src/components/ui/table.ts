// Table — fábricas vanilla para construir tabelas acessíveis.
// Usa a classe `.table` do basecoat-css para estilos base; apenas overrides
// específicos do design system são aplicados diretamente nos elementos.

function cls(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

export function createTable(extraClass?: string): {
  wrapper: HTMLDivElement;
  table: HTMLTableElement;
} {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative w-full overflow-x-auto';

  const table = document.createElement('table');
  // PATCH: basecoat-css força `whitespace-nowrap` em th/td via `.table`, causando overflow horizontal em docs pages. Override explícito para permitir wrap natural.
  table.className = cls('table [&_th]:whitespace-normal [&_td]:whitespace-normal', extraClass);

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

export function createTableHead(text: string, extraClass?: string): HTMLTableCellElement {
  const th = document.createElement('th');
  th.className = cls('text-muted-foreground', extraClass);
  th.textContent = text;
  return th;
}

export function createTableCell(text: string, extraClass?: string): HTMLTableCellElement {
  const td = document.createElement('td');
  if (extraClass) td.className = extraClass;
  td.textContent = text;
  return td;
}

export function createTableCaption(text: string, extraClass?: string): HTMLTableCaptionElement {
  const caption = document.createElement('caption');
  if (extraClass) caption.className = extraClass;
  caption.textContent = text;
  return caption;
}
