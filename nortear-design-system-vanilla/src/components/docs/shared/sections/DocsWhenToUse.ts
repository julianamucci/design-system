import DOMPurify from 'dompurify';
import { createCard } from '@/components/ui/card';
import { createTable, createTableHeader, createTableBody, createTableRow, createTableHead, createTableCell } from '@/components/ui/table';

export interface DocsWhenToUseScenario { s: string; u: string; a: string }
export interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

/**
 * `guidelines.title` e o bloco `scenarios` são obrigatórios — e voltaram a ser.
 *
 * Ficaram opcionais por um dia, para acomodar o conteúdo do editor, que trazia
 * `usage.guidelines` como parágrafo e `usage.scenarios.itemN` como frases
 * soltas, sem rótulo de coluna e sem título de bloco. A opcionalidade custa
 * mais do que resolve: com ela, a seção "quando usar" de uma página podia
 * perder a tabela de cenários inteira sem que nada reprovasse. O conteúdo do
 * editor foi corrigido na raiz — `usage.guidelines.title` e
 * `usage.scenarios.cols` existem —, então a exceção não tem mais quem a use.
 *
 * `scenarios.title` segue opcional, e sempre foi: a tabela se explica pelos
 * rótulos das colunas.
 */
export interface DocsWhenToUseProps {
  title: string;
  guidelines: { title: string; items: string[] };
  scenarios: { title?: string; cols: { scenario: string; use: string; alternative: string }; items: DocsWhenToUseScenario[] };
  uxWriting?: { title: string; cols: { element: string; do: string; dont: string; rules?: string }; items: DocsWhenToUseUXRow[] };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}

export function createDocsWhenToUse(props: DocsWhenToUseProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'quando-usar';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;

  const card = createCard({ className: 'nds-p-4 nds-stack' });
  card.dataset.spacing = 'lg';

  // ── Guidelines ───────────────────────────────────────────────────────────────
  const guidelinesBlock = createCard({ className: 'nds-bg-muted-soft nds-border-soft nds-p-4 nds-stack nds-card-nested' });
  guidelinesBlock.dataset.spacing = 'sm';
  const guidelinesTitle = document.createElement('h3');
  guidelinesTitle.className = 'nds-font-medium nds-text-body';
  guidelinesTitle.textContent = props.guidelines.title;
  guidelinesBlock.appendChild(guidelinesTitle);

  const guidelinesList = document.createElement('ul');
  guidelinesList.className = 'nds-list-disc nds-stack nds-text-body nds-text-muted-foreground';
  guidelinesList.dataset.spacing = 'sm';
  props.guidelines.items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = DOMPurify.sanitize(item);
    guidelinesList.appendChild(li);
  });
  guidelinesBlock.appendChild(guidelinesList);

  // ── Scenarios table ───────────────────────────────────────────────────────────
  const scenariosBlock = createCard({ className: 'nds-overflow-x nds-p-4 nds-card-nested' });

  const { wrapper: scenariosTableWrapper, table: scenariosTable } = createTable('nds-w-full nds-border-collapse nds-text-body');

  const scenariosThead = createTableHeader();
  const scenariosHeaderRow = createTableRow('nds-border-b nds-bg-muted-soft nds-font-medium');
  scenariosHeaderRow.appendChild(createTableHead(props.scenarios.cols.scenario, 'nds-p-2'));
  scenariosHeaderRow.appendChild(createTableHead(props.scenarios.cols.use, 'nds-p-2'));
  scenariosHeaderRow.appendChild(createTableHead(props.scenarios.cols.alternative, 'nds-p-2'));
  scenariosThead.appendChild(scenariosHeaderRow);

  const scenariosTbody = createTableBody();
  props.scenarios.items.forEach(item => {
    const row = createTableRow('nds-border-b nds-hover-bg-muted-faint');
    row.appendChild(createTableCell(item.s, 'nds-p-2'));
    row.appendChild(createTableCell(item.u, 'nds-p-2 nds-font-medium nds-text-primary'));
    row.appendChild(createTableCell(item.a, 'nds-p-2 nds-text-muted-foreground'));
    scenariosTbody.appendChild(row);
  });

  scenariosTable.append(scenariosThead, scenariosTbody);
  scenariosBlock.appendChild(scenariosTableWrapper);

  // ── UX Writing table (optional) ───────────────────────────────────────────────
  let uxBlock: HTMLElement | null = null;
  if (props.uxWriting) {
    const ux = props.uxWriting;
    uxBlock = document.createElement('div');
    uxBlock.className = 'nds-stack';
    uxBlock.dataset.spacing = 'sm';

    const uxTitle = document.createElement('h3');
    uxTitle.className = 'nds-font-medium nds-text-body';
    uxTitle.textContent = ux.title;
    uxBlock.appendChild(uxTitle);

    const uxTableWrap = createCard({ className: 'nds-overflow-x nds-p-4 nds-card-nested' });

    const { wrapper: uxInnerTableWrapper, table: uxTable } = createTable('nds-w-full nds-border-collapse nds-text-body');

    const uxThead = createTableHeader();
    const uxHeaderRow = createTableRow('nds-border-b nds-bg-muted-soft');
    uxHeaderRow.appendChild(createTableHead(ux.cols.element, 'nds-p-2 nds-font-semibold'));
    if (ux.cols.rules) {
      uxHeaderRow.appendChild(createTableHead(ux.cols.rules, 'nds-p-2 nds-font-semibold'));
    }

    const doHead = document.createElement('th');
    doHead.className = 'nds-p-2 nds-font-semibold nds-text-success';
    doHead.innerHTML = `<span class="nds-cluster" data-spacing="xs"><span class="nds-pill" data-tone="success">✓</span>${DOMPurify.sanitize(ux.cols.do)}</span>`;
    uxHeaderRow.appendChild(doHead);

    const dontHead = document.createElement('th');
    dontHead.className = 'nds-p-2 nds-font-semibold nds-text-destructive';
    dontHead.innerHTML = `<span class="nds-cluster" data-spacing="xs"><span class="nds-pill" data-tone="destructive">✗</span>${DOMPurify.sanitize(ux.cols.dont)}</span>`;
    uxHeaderRow.appendChild(dontHead);

    uxThead.appendChild(uxHeaderRow);

    const uxTbody = createTableBody();
    ux.items.forEach(row => {
      const tr = createTableRow('nds-border-b nds-hover-bg-muted-faint');
      tr.appendChild(createTableCell(row.element, 'nds-p-2 nds-font-medium'));
      if (ux.cols.rules) {
        tr.appendChild(createTableCell(row.rules ?? '', 'nds-p-2 nds-text-muted-foreground'));
      }
      tr.appendChild(createTableCell(row.do, 'nds-p-2 nds-font-medium nds-text-success'));
      tr.appendChild(createTableCell(row.dont, 'nds-p-2 nds-font-medium nds-text-destructive'));
      uxTbody.appendChild(tr);
    });

    uxTable.append(uxThead, uxTbody);
    uxTableWrap.appendChild(uxInnerTableWrapper);
    uxBlock.appendChild(uxTableWrap);
  }

  // ── Do / Don't cards ──────────────────────────────────────────────────────────
  const doBlock = document.createElement('div');
  doBlock.className = 'nds-grid';
  doBlock.dataset.cols = '2';
  doBlock.dataset.spacing = 'md';

  const doCard = createCard({ className: 'nds-p-4 nds-card-nested' });
  const doTitle = document.createElement('h3');
  doTitle.className = 'nds-mb-4 nds-text-body nds-font-semibold nds-text-success nds-cluster';
  doTitle.dataset.spacing = 'sm';
  doTitle.innerHTML = `<span class="nds-pill" data-tone="success">✓</span>${DOMPurify.sanitize(props.do.title)}`;
  const doList = document.createElement('ul');
  doList.className = 'nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed';
  doList.dataset.spacing = 'sm';
  props.do.items.forEach(i => {
    const li = document.createElement('li');
    li.innerHTML = DOMPurify.sanitize(i);
    doList.appendChild(li);
  });
  doCard.append(doTitle, doList);

  const dontCard = createCard({ className: 'nds-p-4 nds-card-nested' });
  const dontTitle = document.createElement('h3');
  dontTitle.className = 'nds-mb-4 nds-text-body nds-font-semibold nds-text-destructive nds-cluster';
  dontTitle.dataset.spacing = 'sm';
  dontTitle.innerHTML = `<span class="nds-pill" data-tone="destructive">✗</span>${DOMPurify.sanitize(props.dont.title)}`;
  const dontList = document.createElement('ul');
  dontList.className = 'nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed';
  dontList.dataset.spacing = 'sm';
  props.dont.items.forEach(i => {
    const li = document.createElement('li');
    li.innerHTML = DOMPurify.sanitize(i);
    dontList.appendChild(li);
  });
  dontCard.append(dontTitle, dontList);

  doBlock.append(doCard, dontCard);

  card.append(guidelinesBlock, scenariosBlock);
  if (uxBlock) card.append(uxBlock);
  card.append(doBlock);
  section.append(h2, card);
  return section;
}
