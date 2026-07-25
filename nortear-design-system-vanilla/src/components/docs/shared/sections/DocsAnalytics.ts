import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsAnalyticsEventItem { event: string; trigger: string; payload: string }
export interface DocsAnalyticsProps {
  title: string;
  cols: { event: string; trigger: string; payload: string };
  items: DocsAnalyticsEventItem[];
}

export function createDocsAnalytics(props: DocsAnalyticsProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'analytics';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;

  const wrapper = createCard({ className: 'nds-p-4 nds-overflow-x' });

  const { wrapper: tableWrapper, table } = createTable('nds-w-full nds-text-body');

  const thead = createTableHeader();
  const headerRow = createTableRow('nds-border-b nds-bg-muted-soft');
  headerRow.appendChild(createTableHead(props.cols.event, 'nds-p-2 nds-font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.trigger, 'nds-p-2 nds-font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.payload, 'nds-p-2 nds-font-semibold'));
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  props.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.event, 'nds-p-2 nds-font-mono nds-text-primary'));
    row.appendChild(createTableCell(item.trigger, 'nds-p-2 nds-text-muted-foreground'));
    row.appendChild(createTableCell(item.payload, 'nds-p-2 nds-font-mono nds-text-caption nds-text-muted-foreground'));
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(tableWrapper);

  section.append(h2, wrapper);
  return section;
}
