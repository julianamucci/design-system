import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsPropItem {
  name: string; type: string; defaultValue: string; required: string; description: string;
}
export interface DocsPropsTableDef {
  title?: string;
  cols: { prop: string; type: string; default: string; required: string; description: string };
  items: DocsPropItem[];
}
export interface DocsPropsProps {
  title: string;
  tables: DocsPropsTableDef[];
  interfaceCode?: string;
  extensibilityTitle?: string;
  extensibilityNotes?: string;
}

function buildTable(def: DocsPropsTableDef): DocumentFragment {
  const frag = document.createDocumentFragment();

  if (def.title) {
    const h3 = document.createElement('h3');
    h3.className = 'text-base font-semibold';
    h3.textContent = def.title;
    frag.appendChild(h3);
  }

  const wrapper = createCard({ className: 'rounded-lg p-4' });

  const { wrapper: tableWrapper, table } = createTable('w-full text-sm');

  const thead = createTableHeader();
  const headerRow = createTableRow('border-b border-border bg-muted/50 text-left');
  headerRow.appendChild(createTableHead(def.cols.prop, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(def.cols.type, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(def.cols.default, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(def.cols.required, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(def.cols.description, 'p-3 font-semibold'));
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  def.items.forEach(item => {
    const row = createTableRow('border-b border-border last:border-0 hover:bg-muted/5');
    row.appendChild(createTableCell(item.name, 'p-3 border-r border-border font-mono font-bold text-primary'));
    row.appendChild(createTableCell(item.type, 'p-3 border-r border-border font-mono text-muted-foreground'));
    row.appendChild(createTableCell(item.defaultValue, 'p-3 border-r border-border text-muted-foreground'));
    row.appendChild(createTableCell(item.required, 'p-3 border-r border-border text-muted-foreground'));
    row.appendChild(createTableCell(item.description, 'p-3 text-muted-foreground'));
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(tableWrapper);
  frag.appendChild(wrapper);

  return frag;
}

export function createDocsProps(props: DocsPropsProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'propriedades';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-8';

  props.tables.forEach(def => container.appendChild(buildTable(def)));

  if (props.interfaceCode) {
    const codeBlock = document.createElement('div');
    codeBlock.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto';
    codeBlock.innerHTML = `<code class="whitespace-pre">${sanitizeHtml(props.interfaceCode)}</code>`;
    container.appendChild(codeBlock);
  }

  if (props.extensibilityTitle) {
    const extBlock = document.createElement('div');
    extBlock.className = 'space-y-2';
    const extH3 = document.createElement('h3');
    extH3.className = 'text-base font-semibold';
    extH3.textContent = props.extensibilityTitle;
    extBlock.appendChild(extH3);
    if (props.extensibilityNotes) {
      const extNotes = document.createElement('div');
      extNotes.className = 'text-sm text-muted-foreground leading-relaxed';
      extNotes.innerHTML = sanitizeHtml(props.extensibilityNotes);
      extBlock.appendChild(extNotes);
    }
    container.appendChild(extBlock);
  }

  section.appendChild(container);
  return section;
}
