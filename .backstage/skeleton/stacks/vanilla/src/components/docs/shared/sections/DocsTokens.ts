import { sanitizeHtml } from '@/lib/sanitize-html';
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
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-6';

  const tableWrapper = createCard({ className: 'rounded-lg p-4' });

  const { wrapper: innerTableWrapper, table } = createTable('w-full text-sm');

  const thead = createTableHeader();
  const headerRow = createTableRow('border-b border-border bg-muted/50 text-left');
  headerRow.appendChild(createTableHead(props.cols.token, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.value, 'p-3 border-r border-border font-semibold'));
  headerRow.appendChild(createTableHead(props.cols.description, 'p-3 font-semibold'));
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  props.items.forEach(item => {
    const row = createTableRow('border-b border-border last:border-0 hover:bg-muted/5');
    row.appendChild(createTableCell(item.token, 'p-3 border-r border-border font-mono text-primary'));
    row.appendChild(createTableCell(item.value, 'p-3 border-r border-border font-mono text-muted-foreground'));
    row.appendChild(createTableCell(item.description, 'p-3 text-muted-foreground'));
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  tableWrapper.appendChild(innerTableWrapper);
  container.appendChild(tableWrapper);

  if (props.customizationTitle) {
    const customBlock = document.createElement('div');
    customBlock.className = 'space-y-3';
    const customH3 = document.createElement('h3');
    customH3.className = 'text-base font-semibold';
    customH3.textContent = props.customizationTitle;
    customBlock.appendChild(customH3);
    if (props.customizationCode) {
      const codeBlock = document.createElement('div');
      codeBlock.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto';
      codeBlock.innerHTML = `<code class="whitespace-pre">${sanitizeHtml(props.customizationCode)}</code>`;
      customBlock.appendChild(codeBlock);
    }
    container.appendChild(customBlock);
  }

  section.appendChild(container);
  return section;
}
