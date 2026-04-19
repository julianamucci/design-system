import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';
import { createBadge } from '@/components/ui/badge';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsTestItem { action: string; result: string; priority: string }
export interface DocsA11yTestItem { criterion: string; level: string; how: string }
export interface DocsVisualTestItem { story: string; priority: string }

export interface DocsTestesProps {
  title: string;
  functional: { title: string; cols: { action: string; result: string; priority: string }; items: DocsTestItem[] };
  accessibility: { title: string; cols: { criterion: string; level: string; how: string }; items: DocsA11yTestItem[] };
  visual: { title: string; cols: { story: string; priority: string }; items: DocsVisualTestItem[] };
}

const priorityBadgeClass = (p: string): string =>
  ({ Alta: 'bg-red-100 text-red-700 border-red-200', Média: 'bg-yellow-100 text-yellow-700 border-yellow-200', Baixa: 'bg-green-100 text-green-700 border-green-200', High: 'bg-red-100 text-red-700 border-red-200', Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', Low: 'bg-green-100 text-green-700 border-green-200' } as Record<string, string>)[p] ?? '';

export function createDocsTestes(props: DocsTestesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'testes';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-8';

  // ── Functional ──────────────────────────────────────────────────────────────
  const funcBlock = document.createElement('div');
  funcBlock.className = 'space-y-3';

  const funcTitle = document.createElement('h3');
  funcTitle.className = 'text-base font-semibold';
  funcTitle.textContent = props.functional.title;
  funcBlock.appendChild(funcTitle);

  const funcWrapper = createCard({ className: 'rounded-lg p-4' });
  const { wrapper: funcTableWrapper, table: funcTable } = createTable('w-full text-sm');

  const funcThead = createTableHeader();
  const funcHeaderRow = createTableRow('border-b border-border bg-muted/50 text-left');
  funcHeaderRow.appendChild(createTableHead(props.functional.cols.action, 'p-3 border-r border-border font-semibold'));
  funcHeaderRow.appendChild(createTableHead(props.functional.cols.result, 'p-3 border-r border-border font-semibold'));
  funcHeaderRow.appendChild(createTableHead(props.functional.cols.priority, 'p-3 font-semibold'));
  funcThead.appendChild(funcHeaderRow);

  const funcTbody = createTableBody();
  props.functional.items.forEach(item => {
    const row = createTableRow('border-b border-border last:border-0 hover:bg-muted/5');
    row.appendChild(createTableCell(item.action, 'p-3 border-r border-border'));
    row.appendChild(createTableCell(item.result, 'p-3 border-r border-border text-muted-foreground'));
    const priorityCell = createTableCell('', 'p-3 font-medium');
    priorityCell.appendChild(createBadge({ text: item.priority, className: priorityBadgeClass(item.priority) }));
    row.appendChild(priorityCell);
    funcTbody.appendChild(row);
  });

  funcTable.append(funcThead, funcTbody);
  funcWrapper.appendChild(funcTableWrapper);
  funcBlock.appendChild(funcWrapper);

  // ── Accessibility ────────────────────────────────────────────────────────────
  const a11yBlock = document.createElement('div');
  a11yBlock.className = 'space-y-3';

  const a11yTitle = document.createElement('h3');
  a11yTitle.className = 'text-base font-semibold';
  a11yTitle.textContent = props.accessibility.title;
  a11yBlock.appendChild(a11yTitle);

  const a11yGrid = document.createElement('div');
  a11yGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  props.accessibility.items.forEach(item => {
    const card = createCard({ className: 'bg-muted/30 border-0 shadow-none p-3 space-y-1' });
    const top = document.createElement('div');
    top.className = 'flex items-center gap-2';
    const levelBadge = createBadge({ text: item.level, className: 'text-xs font-mono font-bold text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5' });
    const criterionSpan = document.createElement('span');
    criterionSpan.className = 'text-sm font-medium';
    criterionSpan.textContent = item.criterion;
    top.append(levelBadge, criterionSpan);
    const howP = document.createElement('p');
    howP.className = 'text-xs text-muted-foreground pl-0.5';
    howP.textContent = item.how;
    card.append(top, howP);
    a11yGrid.appendChild(card);
  });
  a11yBlock.appendChild(a11yGrid);

  // ── Visual ───────────────────────────────────────────────────────────────────
  const visualBlock = document.createElement('div');
  visualBlock.className = 'space-y-3';

  const visualTitle = document.createElement('h3');
  visualTitle.className = 'text-base font-semibold';
  visualTitle.textContent = props.visual.title;
  visualBlock.appendChild(visualTitle);

  const visualWrapper = createCard({ className: 'rounded-lg p-4' });
  const { wrapper: visualTableWrapper, table: visualTable } = createTable('w-full text-sm');

  const visualThead = createTableHeader();
  const visualHeaderRow = createTableRow('border-b border-border bg-muted/50 text-left');
  visualHeaderRow.appendChild(createTableHead(props.visual.cols.story, 'p-3 border-r border-border font-semibold'));
  visualHeaderRow.appendChild(createTableHead(props.visual.cols.priority, 'p-3 font-semibold'));
  visualThead.appendChild(visualHeaderRow);

  const visualTbody = createTableBody();
  props.visual.items.forEach(item => {
    const row = createTableRow('border-b border-border last:border-0 hover:bg-muted/5');
    row.appendChild(createTableCell(item.story, 'p-3 border-r border-border font-mono text-xs'));
    const priorityCell = createTableCell('', 'p-3 font-medium');
    priorityCell.appendChild(createBadge({ text: item.priority, className: priorityBadgeClass(item.priority) }));
    row.appendChild(priorityCell);
    visualTbody.appendChild(row);
  });

  visualTable.append(visualThead, visualTbody);
  visualWrapper.appendChild(visualTableWrapper);
  visualBlock.appendChild(visualWrapper);

  container.append(funcBlock, a11yBlock, visualBlock);
  section.appendChild(container);
  return section;
}
