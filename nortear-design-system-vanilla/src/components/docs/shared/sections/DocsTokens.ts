import { createCard } from '@/components/ui/card';
import { createCodeBlock } from '@/components/ui/code-block';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsTokenItem { token: string; value: string; description: string }
export interface DocsTokensProps {
  title: string;
  cols: { token: string; value: string; description: string };
  items: DocsTokenItem[];
  customizationTitle?: string;
  customizationCode?: string;
  /** Linguagem do snippet de customização, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function createDocsTokens(props: DocsTokensProps): HTMLElement {
  const { language = 'css', copyLabel, copiedLabel } = props;

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
    // 'en': token e seletor são identificadores CSS.
    row.appendChild(createTableCell(item.token, 'nds-p-2 nds-font-mono nds-text-primary', 'en'));
    row.appendChild(createTableCell(item.value, 'nds-p-2 nds-font-mono nds-text-muted-foreground', 'en'));
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
      customBlock.appendChild(createCodeBlock({
        code: props.customizationCode,
        language,
        showLineNumbers: false,
        copyLabel,
        copiedLabel,
      }));
    }
    container.appendChild(customBlock);
  }

  section.appendChild(container);
  return section;
}
