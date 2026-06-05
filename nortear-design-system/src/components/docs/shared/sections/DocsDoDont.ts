import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';

export interface DocsDoDontPair {
  doLabel: string;
  dontLabel: string;
  doCaption: string;
  dontCaption: string;
  doPreviewFactory: () => HTMLElement;
  dontPreviewFactory: () => HTMLElement;
}

export interface DocsDoDontProps {
  title: string;
  pairs: DocsDoDontPair[];
}

export function createDocsDoDont(props: DocsDoDontProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'do-dont';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;

  const card = createCard({ className: 'nds-cluster nds-p-4 nds-mt-2' });

  const inner = document.createElement('div');
  inner.className = 'nds-stack nds-w-full';
  inner.dataset.spacing = 'xl';

  for (const pair of props.pairs) {
    const grid = document.createElement('div');
    grid.className = 'nds-grid';
    grid.dataset.cols = '2';
    grid.dataset.spacing = 'lg';

    // DO column
    const doCol = document.createElement('div');
    doCol.className = 'nds-stack';
    doCol.dataset.spacing = 'sm';
    doCol.innerHTML = `
      <div class="nds-cluster nds-text-success" data-spacing="sm">
        <span class="nds-pill" data-tone="success">✓</span>
        <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">${sanitizeHtml(pair.doLabel)}</span>
      </div>`;
    const doBox = createCard({ className: 'nds-border-success-soft nds-bg-success-soft nds-shadow-none nds-p-4' });
    doBox.appendChild(pair.doPreviewFactory());
    const doCaption = document.createElement('p');
    doCaption.className = 'nds-text-body nds-text-muted-foreground nds-italic nds-px-1';
    doCaption.textContent = pair.doCaption;
    doCol.append(doBox, doCaption);

    // DON'T column
    const dontCol = document.createElement('div');
    dontCol.className = 'nds-stack';
    dontCol.dataset.spacing = 'sm';
    dontCol.innerHTML = `
      <div class="nds-cluster nds-text-destructive" data-spacing="sm">
        <span class="nds-pill" data-tone="destructive">✗</span>
        <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">${sanitizeHtml(pair.dontLabel)}</span>
      </div>`;
    const dontBox = createCard({ className: 'nds-border-destructive-soft nds-bg-destructive-soft nds-shadow-none nds-p-4' });
    dontBox.appendChild(pair.dontPreviewFactory());
    const dontCaption = document.createElement('p');
    dontCaption.className = 'nds-text-body nds-text-muted-foreground nds-italic nds-px-1';
    dontCaption.textContent = pair.dontCaption;
    dontCol.append(dontBox, dontCaption);

    grid.append(doCol, dontCol);
    inner.appendChild(grid);
  }

  card.appendChild(inner);
  section.append(h2, card);
  return section;
}
