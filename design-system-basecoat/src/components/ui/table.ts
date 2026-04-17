// Table — fábricas vanilla para construir tabelas acessíveis com as mesmas
// classes Tailwind usadas em React/Vue/Svelte. Baseado no padrão semântico
// do basecoatui.com (`<div overflow-x-auto><table>…`) adaptado aos tokens
// do design system.

const TABLE_CLASSES = 'w-full caption-bottom text-sm';
const WRAPPER_CLASSES = 'relative w-full overflow-x-auto';
const THEAD_CLASSES = '[&_tr]:border-b';
const TBODY_CLASSES = '[&_tr:last-child]:border-0';
const TFOOT_CLASSES = 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0';
const TR_CLASSES = 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted';
const TH_CLASSES = 'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]';
const TD_CLASSES = 'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]';
const CAPTION_CLASSES = 'mt-4 text-sm text-muted-foreground';

function mergeClass(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

export function createTable(extraClass?: string): {
  wrapper: HTMLDivElement;
  table: HTMLTableElement;
} {
  const wrapper = document.createElement('div');
  wrapper.className = WRAPPER_CLASSES;

  const table = document.createElement('table');
  table.className = mergeClass(TABLE_CLASSES, extraClass);

  wrapper.appendChild(table);
  return { wrapper, table };
}

export function createTableHeader(extraClass?: string): HTMLTableSectionElement {
  const thead = document.createElement('thead');
  thead.className = mergeClass(THEAD_CLASSES, extraClass);
  return thead;
}

export function createTableBody(extraClass?: string): HTMLTableSectionElement {
  const tbody = document.createElement('tbody');
  tbody.className = mergeClass(TBODY_CLASSES, extraClass);
  return tbody;
}

export function createTableFooter(extraClass?: string): HTMLTableSectionElement {
  const tfoot = document.createElement('tfoot');
  tfoot.className = mergeClass(TFOOT_CLASSES, extraClass);
  return tfoot;
}

export function createTableRow(extraClass?: string): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = mergeClass(TR_CLASSES, extraClass);
  return tr;
}

export function createTableHead(text: string, extraClass?: string): HTMLTableCellElement {
  const th = document.createElement('th');
  th.className = mergeClass(TH_CLASSES, extraClass);
  th.textContent = text;
  return th;
}

export function createTableCell(text: string, extraClass?: string): HTMLTableCellElement {
  const td = document.createElement('td');
  td.className = mergeClass(TD_CLASSES, extraClass);
  td.textContent = text;
  return td;
}

export function createTableCaption(text: string, extraClass?: string): HTMLTableCaptionElement {
  const caption = document.createElement('caption');
  caption.className = mergeClass(CAPTION_CLASSES, extraClass);
  caption.textContent = text;
  return caption;
}

export const TABLE_TOKENS = {
  wrapper: WRAPPER_CLASSES,
  table: TABLE_CLASSES,
  thead: THEAD_CLASSES,
  tbody: TBODY_CLASSES,
  tfoot: TFOOT_CLASSES,
  tr: TR_CLASSES,
  th: TH_CLASSES,
  td: TD_CLASSES,
  caption: CAPTION_CLASSES,
} as const;
