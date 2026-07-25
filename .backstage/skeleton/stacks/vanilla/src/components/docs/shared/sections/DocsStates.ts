import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsStateItem { label: string; trigger: string; behavior: string }

export interface DocsStatesProps {
  title: string;
  cols: { state: string; trigger: string; behavior: string };
  items: DocsStateItem[];
}

export function createDocsStates(props: DocsStatesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'estados';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const wrapper = createCard({ className: 'rounded-lg p-4' });

  const { wrapper: tableWrapper, table } = createTable('w-full text-sm');

  const thead = createTableHeader();
  const headerRow = createTableRow('border-b border-border bg-muted/50 text-left');
  headerRow.appendChild(createTableHead(props.cols.state, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.trigger, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.behavior, 'p-3 font-semibold'));
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  props.items.forEach(item => {
    const row = createTableRow('border-b border-border last:border-0 hover:bg-muted/5');
    row.appendChild(createTableCell(item.label, 'p-3 border-r border-border font-medium'));
    row.appendChild(createTableCell(item.trigger, 'p-3 border-r border-border text-muted-foreground'));
    row.appendChild(createTableCell(item.behavior, 'p-3 text-muted-foreground'));
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(tableWrapper);

  section.append(h2, wrapper);
  return section;
}
