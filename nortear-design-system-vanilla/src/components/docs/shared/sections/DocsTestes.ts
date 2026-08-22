import { createCard } from '@/components/ui/card';
import { createBadge } from '@/components/ui/badge';
import { createKbd } from '@/components/ui/kbd';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';
import { prioridadeVariant } from '@shared/primitives/badge-priority';

export interface DocsTestItem { action: string; result: string; priority: string }
export interface DocsA11yTestItem { criterion: string; level: string; how: string }
export interface DocsVisualTestItem { story: string; priority: string }

export interface DocsTestesProps {
  title: string;
  /** `description` é opcional em cada sub-seção; quando presente é renderizada
   *  logo abaixo do `<h3>` correspondente. */
  functional: { title: string; description?: string; cols: { action: string; result: string; priority: string }; items: DocsTestItem[] };
  accessibility: { title: string; description?: string; cols: { criterion: string; level: string; how: string }; items: DocsA11yTestItem[] };
  visual: { title: string; description?: string; cols: { story: string; priority: string }; items: DocsVisualTestItem[] };
}

/** `<p>` de apoio de cada sub-seção. Texto puro: nada de HTML a preservar. */
function createSubsectionDescription(text: string): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = 'nds-text-body nds-text-muted-foreground';
  p.textContent = text;
  return p;
}

// A prioridade escolhe uma VARIANTE do badge — alta é destructive, média é
// warning, baixa é info. O mapa antigo listava só português e inglês, então em
// espanhol "Media" e "Baja" caíam no outline e a prioridade sumia da tabela.

export function createDocsTestes(props: DocsTestesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'testes';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'nds-stack';
  container.dataset.spacing = 'xl';

  // ── Functional ──────────────────────────────────────────────────────────────
  const funcBlock = document.createElement('div');
  funcBlock.className = 'nds-stack';
  funcBlock.dataset.spacing = 'sm';

  const funcTitle = document.createElement('h3');
  funcTitle.className = 'nds-text-base nds-font-semibold';
  funcTitle.textContent = props.functional.title;
  funcBlock.appendChild(funcTitle);
  if (props.functional.description) {
    funcBlock.appendChild(createSubsectionDescription(props.functional.description));
  }

  const funcWrapper = createCard({ className: 'nds-p-4 nds-overflow-x' });
  const { wrapper: funcTableWrapper, table: funcTable } = createTable('nds-w-full nds-text-body');

  const funcThead = createTableHeader();
  const funcHeaderRow = createTableRow('nds-border-b nds-bg-muted-soft');
  funcHeaderRow.appendChild(createTableHead(props.functional.cols.action, 'nds-p-2 nds-font-semibold'));
  funcHeaderRow.appendChild(createTableHead(props.functional.cols.result, 'nds-p-2 nds-font-semibold'));
  funcHeaderRow.appendChild(createTableHead(props.functional.cols.priority, 'nds-p-2 nds-font-semibold'));
  funcThead.appendChild(funcHeaderRow);

  const funcTbody = createTableBody();
  props.functional.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.action, 'nds-p-2'));
    row.appendChild(createTableCell(item.result, 'nds-p-2 nds-text-muted-foreground'));
    const priorityCell = createTableCell('', 'nds-p-2 nds-font-medium');
    priorityCell.appendChild(createBadge({ text: item.priority, variant: prioridadeVariant(item.priority) }));
    row.appendChild(priorityCell);
    funcTbody.appendChild(row);
  });

  funcTable.append(funcThead, funcTbody);
  funcWrapper.appendChild(funcTableWrapper);
  funcBlock.appendChild(funcWrapper);

  // ── Accessibility ────────────────────────────────────────────────────────────
  const a11yBlock = document.createElement('div');
  a11yBlock.className = 'nds-stack';
  a11yBlock.dataset.spacing = 'sm';

  const a11yTitle = document.createElement('h3');
  a11yTitle.className = 'nds-text-base nds-font-semibold';
  a11yTitle.textContent = props.accessibility.title;
  a11yBlock.appendChild(a11yTitle);
  if (props.accessibility.description) {
    a11yBlock.appendChild(createSubsectionDescription(props.accessibility.description));
  }

  const a11yGrid = document.createElement('div');
  a11yGrid.className = 'nds-grid';
  a11yGrid.dataset.cols = '2';
  a11yGrid.dataset.spacing = 'sm';
  props.accessibility.items.forEach(item => {
    const card = createCard({ className: 'nds-bg-muted-soft nds-border-none nds-shadow-none nds-p-2 nds-stack' });
    card.dataset.spacing = 'xs';
    const top = document.createElement('div');
    top.className = 'nds-row';
    top.dataset.spacing = 'sm';
    top.dataset.align = 'center';
    const levelKbd = createKbd({ text: item.level });
    const criterionSpan = document.createElement('span');
    criterionSpan.className = 'nds-text-body nds-font-medium';
    criterionSpan.textContent = item.criterion;
    top.append(levelKbd, criterionSpan);
    const howP = document.createElement('p');
    howP.className = 'nds-text-body';
    howP.textContent = item.how;
    card.append(top, howP);
    a11yGrid.appendChild(card);
  });
  a11yBlock.appendChild(a11yGrid);

  // ── Visual ───────────────────────────────────────────────────────────────────
  const visualBlock = document.createElement('div');
  visualBlock.className = 'nds-stack';
  visualBlock.dataset.spacing = 'sm';

  const visualTitle = document.createElement('h3');
  visualTitle.className = 'nds-text-base nds-font-semibold';
  visualTitle.textContent = props.visual.title;
  visualBlock.appendChild(visualTitle);
  if (props.visual.description) {
    visualBlock.appendChild(createSubsectionDescription(props.visual.description));
  }

  const visualWrapper = createCard({ className: 'nds-p-4 nds-overflow-x' });
  const { wrapper: visualTableWrapper, table: visualTable } = createTable('nds-w-full nds-text-body');

  const visualThead = createTableHeader();
  const visualHeaderRow = createTableRow('nds-border-b nds-bg-muted-soft');
  visualHeaderRow.appendChild(createTableHead(props.visual.cols.story, 'nds-p-2 nds-font-semibold'));
  visualHeaderRow.appendChild(createTableHead(props.visual.cols.priority, 'nds-p-2 nds-font-semibold'));
  visualThead.appendChild(visualHeaderRow);

  const visualTbody = createTableBody();
  props.visual.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.story, 'nds-p-2'));
    const priorityCell = createTableCell('', 'nds-p-2 nds-font-medium');
    priorityCell.appendChild(createBadge({ text: item.priority, variant: prioridadeVariant(item.priority) }));
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
