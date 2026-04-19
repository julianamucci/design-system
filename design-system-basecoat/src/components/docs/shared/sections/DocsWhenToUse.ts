import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsWhenToUseScenario { s: string; u: string; a: string }
export interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

export interface DocsWhenToUseProps {
  title: string;
  guidelines: { title: string; items: string[] };
  scenarios: { title?: string; cols: { scenario: string; use: string; alternative: string }; items: DocsWhenToUseScenario[] };
  uxWriting: { title: string; cols: { element: string; do: string; dont: string; rules?: string }; items: DocsWhenToUseUXRow[] };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}

export function createDocsWhenToUse(props: DocsWhenToUseProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'quando-usar';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const card = createCard({ className: 'p-4 space-y-6' });

  // ── Guidelines ───────────────────────────────────────────────────────────────
  const guidelinesBlock = createCard({ className: 'bg-muted/50 border border-border/40 shadow-none rounded-lg p-4 space-y-3' });
  const guidelinesTitle = document.createElement('h3');
  guidelinesTitle.className = 'font-medium text-sm';
  guidelinesTitle.textContent = props.guidelines.title;
  guidelinesBlock.appendChild(guidelinesTitle);

  const guidelinesList = document.createElement('ul');
  guidelinesList.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground';
  props.guidelines.items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = sanitizeHtml(item);
    guidelinesList.appendChild(li);
  });
  guidelinesBlock.appendChild(guidelinesList);

  // ── Scenarios table ───────────────────────────────────────────────────────────
  const scenariosBlock = document.createElement('div');
  scenariosBlock.className = 'overflow-x-auto';

  const { wrapper: scenariosTableWrapper, table: scenariosTable } = createTable('w-full border-collapse text-sm');

  const scenariosThead = createTableHeader();
  const scenariosHeaderRow = createTableRow('border-b border-border text-left bg-muted/50 font-medium');
  scenariosHeaderRow.appendChild(createTableHead(props.scenarios.cols.scenario, 'p-3 border-r border-border'));
  scenariosHeaderRow.appendChild(createTableHead(props.scenarios.cols.use, 'p-3 border-r border-border'));
  scenariosHeaderRow.appendChild(createTableHead(props.scenarios.cols.alternative, 'p-3'));
  scenariosThead.appendChild(scenariosHeaderRow);

  const scenariosTbody = createTableBody();
  props.scenarios.items.forEach(item => {
    const row = createTableRow('border-b border-border hover:bg-muted/5');
    row.appendChild(createTableCell(item.s, 'p-3 border-r border-border'));
    row.appendChild(createTableCell(item.u, 'p-3 border-r border-border font-medium text-primary'));
    row.appendChild(createTableCell(item.a, 'p-3 text-muted-foreground'));
    scenariosTbody.appendChild(row);
  });

  scenariosTable.append(scenariosThead, scenariosTbody);
  scenariosBlock.appendChild(scenariosTableWrapper);

  // ── UX Writing table ──────────────────────────────────────────────────────────
  const uxBlock = document.createElement('div');
  uxBlock.className = 'space-y-3';

  const uxTitle = document.createElement('h3');
  uxTitle.className = 'font-medium text-sm';
  uxTitle.textContent = props.uxWriting.title;
  uxBlock.appendChild(uxTitle);

  const uxTableWrap = document.createElement('div');
  uxTableWrap.className = 'overflow-x-auto';

  const { wrapper: uxInnerTableWrapper, table: uxTable } = createTable('w-full border-collapse text-sm');

  const uxThead = createTableHeader();
  const uxHeaderRow = createTableRow('border-b border-border bg-muted/70 text-left');
  uxHeaderRow.appendChild(createTableHead(props.uxWriting.cols.element, 'p-3 border-r border-border font-semibold'));
  if (props.uxWriting.cols.rules) {
    uxHeaderRow.appendChild(createTableHead(props.uxWriting.cols.rules, 'p-3 border-r border-border font-semibold'));
  }

  const doHead = document.createElement('th');
  doHead.className = 'text-muted-foreground p-3 border-r border-border font-semibold text-green-700';
  doHead.innerHTML = `<span class="flex items-center gap-1.5"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 text-xs font-bold flex-shrink-0">✓</span>${sanitizeHtml(props.uxWriting.cols.do)}</span>`;
  uxHeaderRow.appendChild(doHead);

  const dontHead = document.createElement('th');
  dontHead.className = 'text-muted-foreground p-3 font-semibold text-red-700';
  dontHead.innerHTML = `<span class="flex items-center gap-1.5"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 text-xs font-bold flex-shrink-0">✗</span>${sanitizeHtml(props.uxWriting.cols.dont)}</span>`;
  uxHeaderRow.appendChild(dontHead);

  uxThead.appendChild(uxHeaderRow);

  const uxTbody = createTableBody();
  props.uxWriting.items.forEach(row => {
    const tr = createTableRow('border-b border-border last:border-0 hover:bg-muted/5');
    tr.appendChild(createTableCell(row.element, 'p-3 border-r border-border font-medium'));
    if (props.uxWriting.cols.rules) {
      tr.appendChild(createTableCell(row.rules ?? '', 'p-3 border-r border-border text-muted-foreground'));
    }
    tr.appendChild(createTableCell(row.do, 'p-3 border-r border-border font-medium text-green-600'));
    tr.appendChild(createTableCell(row.dont, 'p-3 font-medium text-red-600'));
    uxTbody.appendChild(tr);
  });

  uxTable.append(uxThead, uxTbody);
  uxTableWrap.appendChild(uxInnerTableWrapper);
  uxBlock.appendChild(uxTableWrap);

  // ── Do / Don't cards ──────────────────────────────────────────────────────────
  const doBlock = document.createElement('div');
  doBlock.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

  const doCard = createCard({ className: 'p-4 shadow-sm' });
  const doTitle = document.createElement('h3');
  doTitle.className = 'mb-3 text-sm font-semibold text-green-600 flex items-center gap-2';
  doTitle.innerHTML = `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 text-xs font-bold flex-shrink-0">✓</span>${sanitizeHtml(props.do.title)}`;
  const doList = document.createElement('ul');
  doList.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed';
  props.do.items.forEach(i => {
    const li = document.createElement('li');
    li.innerHTML = sanitizeHtml(i);
    doList.appendChild(li);
  });
  doCard.append(doTitle, doList);

  const dontCard = createCard({ className: 'p-4 shadow-sm' });
  const dontTitle = document.createElement('h3');
  dontTitle.className = 'mb-3 text-sm font-semibold text-red-600 flex items-center gap-2';
  dontTitle.innerHTML = `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 text-xs font-bold flex-shrink-0">✗</span>${sanitizeHtml(props.dont.title)}`;
  const dontList = document.createElement('ul');
  dontList.className = 'list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed';
  props.dont.items.forEach(i => {
    const li = document.createElement('li');
    li.innerHTML = sanitizeHtml(i);
    dontList.appendChild(li);
  });
  dontCard.append(dontTitle, dontList);

  doBlock.append(doCard, dontCard);

  card.append(guidelinesBlock, scenariosBlock, uxBlock, doBlock);
  section.append(h2, card);
  return section;
}
