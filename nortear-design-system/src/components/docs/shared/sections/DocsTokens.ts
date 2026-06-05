import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsTokenItem { token: string; value: string; description: string }
export interface DocsTokensProps {
  title: string;
  cols: { token: string; value: string; description: string };
  items: DocsTokenItem[];
  customizationTitle?: string;
  customizationCode?: string;
}

export function createDocsTokens(props: DocsTokensProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'tokens';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'nds-stack';
  container.dataset.spacing = 'lg';

  const tableWrapper = createCard({ className: 'nds-p-4 nds-overflow-x' });

  const { wrapper: innerTableWrapper, table } = createTable('nds-w-full nds-text-body');

  const thead = createTableHeader();
  const headerRow = createTableRow('nds-border-b nds-bg-muted-soft');
  headerRow.appendChild(createTableHead(props.cols.token, 'nds-p-2 nds-font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.value, 'nds-p-2 nds-font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.description, 'nds-p-2 nds-font-semibold'));
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  props.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.token, 'nds-p-2 nds-font-mono nds-text-primary'));
    row.appendChild(createTableCell(item.value, 'nds-p-2 nds-font-mono nds-text-muted-foreground'));
    row.appendChild(createTableCell(item.description, 'nds-p-2 nds-text-muted-foreground'));
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  tableWrapper.appendChild(innerTableWrapper);
  container.appendChild(tableWrapper);

  if (props.customizationTitle) {
    const customBlock = document.createElement('div');
    customBlock.className = 'nds-stack';
    customBlock.dataset.spacing = 'sm';
    const customH3 = document.createElement('h3');
    customH3.className = 'nds-text-base nds-font-semibold';
    customH3.textContent = props.customizationTitle;
    customBlock.appendChild(customH3);
    if (props.customizationCode) {
      const codeBlock = document.createElement('pre');
      codeBlock.className = 'nds-code-block';
      const codeEl = document.createElement('code');
      codeEl.textContent = props.customizationCode;
      codeBlock.appendChild(codeEl);
      customBlock.appendChild(codeBlock);
    }
    container.appendChild(customBlock);
  }

  section.appendChild(container);
  return section;
}
