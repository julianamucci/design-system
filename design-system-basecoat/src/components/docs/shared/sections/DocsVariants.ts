import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';

export interface DocsVariantItem {
  name: string;
  description: string;
  previewFactory: () => HTMLElement;
}

export interface DocsVariantsProps {
  title: string;
  items: DocsVariantItem[];
}

export function createDocsVariants(props: DocsVariantsProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'variantes';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  props.items.forEach(item => {
    const card = createCard({ className: 'p-5 space-y-3' });

    const previewWrap = document.createElement('div');
    previewWrap.className = 'flex items-center justify-center min-h-[60px]';
    previewWrap.appendChild(item.previewFactory());

    const info = document.createElement('div');
    info.innerHTML = `
      <p class="text-sm font-semibold">${sanitizeHtml(item.name)}</p>
      <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">${sanitizeHtml(item.description)}</p>`;

    card.append(previewWrap, info);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}
