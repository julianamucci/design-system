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
  h2.className = 'nds-section-title';
  h2.textContent = props.title;

  const wrapper = createCard({ className: 'nds-p-4 nds-overflow-x' });

  const { wrapper: tableWrapper, table } = createTable('nds-w-full nds-text-body');

  const thead = createTableHeader();
  const headerRow = createTableRow('nds-border-b nds-bg-muted-soft');
  headerRow.appendChild(createTableHead(props.cols.state, 'nds-p-2 nds-font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.trigger, 'nds-p-2 nds-font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.behavior, 'nds-p-2 nds-font-semibold'));
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  props.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.label, 'nds-p-2 nds-font-medium'));
    row.appendChild(createTableCell(item.trigger, 'nds-p-2 nds-text-muted-foreground'));
    row.appendChild(createTableCell(item.behavior, 'nds-p-2 nds-text-muted-foreground'));
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(tableWrapper);

  section.append(h2, wrapper);
  return section;
}
