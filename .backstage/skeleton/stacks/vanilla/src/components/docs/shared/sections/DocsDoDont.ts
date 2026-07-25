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
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const card = createCard({ className: 'flex items-center justify-center p-4 mt-2 shadow-sm' });

  const inner = document.createElement('div');
  inner.className = 'space-y-8 w-full';

  for (const pair of props.pairs) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

    // DO column
    const doCol = document.createElement('div');
    doCol.className = 'space-y-3';
    doCol.innerHTML = `
      <div class="flex items-center gap-2 text-green-600">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
        <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(pair.doLabel)}</span>
      </div>`;
    const doBox = createCard({ className: 'border-green-200 p-4 bg-green-50/50 shadow-none rounded-xl' });
    doBox.appendChild(pair.doPreviewFactory());
    const doCaption = document.createElement('p');
    doCaption.className = 'text-sm text-muted-foreground italic px-1';
    doCaption.textContent = pair.doCaption;
    doCol.append(doBox, doCaption);

    // DON'T column
    const dontCol = document.createElement('div');
    dontCol.className = 'space-y-3';
    dontCol.innerHTML = `
      <div class="flex items-center gap-2 text-red-600">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
        <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(pair.dontLabel)}</span>
      </div>`;
    const dontBox = createCard({ className: 'border-red-200 p-4 bg-red-50/50 shadow-none rounded-xl' });
    dontBox.appendChild(pair.dontPreviewFactory());
    const dontCaption = document.createElement('p');
    dontCaption.className = 'text-sm text-muted-foreground italic px-1';
    dontCaption.textContent = pair.dontCaption;
    dontCol.append(dontBox, dontCaption);

    grid.append(doCol, dontCol);
    inner.appendChild(grid);
  }

  card.appendChild(inner);
  section.append(h2, card);
  return section;
}
