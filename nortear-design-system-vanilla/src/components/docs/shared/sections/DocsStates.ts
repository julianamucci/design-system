import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsStateItem { label: string; trigger?: string; behavior?: string }

/**
 * `trigger` e `behavior` são opcionais porque nem todo conteúdo compartilhado
 * declara as três colunas: o do editor descreve o estado em UMA coluna
 * (`states.cols` traz só `state` e `description`). Com as três obrigatórias, a
 * página renderizava um cabeçalho vazio — cabeçalho sem texto é violação de
 * `empty-table-header` no axe, e inventar rótulo aqui deixaria a tabela em
 * português nos três idiomas. A coluna sai da tabela quando não há rótulo para
 * ela; com os três rótulos presentes, nada muda para as páginas existentes.
 */
export interface DocsStatesProps {
  title: string;
  cols: { state: string; trigger?: string; behavior?: string };
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
  if (props.cols.trigger) {
    headerRow.appendChild(createTableHead(props.cols.trigger, 'nds-p-2 nds-font-semibold'));
  }
  if (props.cols.behavior) {
    headerRow.appendChild(createTableHead(props.cols.behavior, 'nds-p-2 nds-font-semibold'));
  }
  thead.appendChild(headerRow);

  const tbody = createTableBody();
  props.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.label, 'nds-p-2 nds-font-medium'));
    if (props.cols.trigger) {
      row.appendChild(createTableCell(item.trigger ?? '', 'nds-p-2 nds-text-muted-foreground'));
    }
    if (props.cols.behavior) {
      row.appendChild(createTableCell(item.behavior ?? '', 'nds-p-2 nds-text-muted-foreground'));
    }
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  wrapper.appendChild(tableWrapper);

  section.append(h2, wrapper);
  return section;
}
