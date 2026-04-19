import { sanitizeHtml } from '@/lib/sanitize-html';
import { createButton } from '@/components/ui/button';

export interface DocsRelatedItem { name: string; description: string; path: string }
export interface DocsRelatedProps { title: string; items: DocsRelatedItem[] }

export function createDocsRelated(props: DocsRelatedProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'relacionados';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  props.items.forEach(item => {
    const btn = createButton({
      variant: 'outline',
      class: 'text-left rounded-xl p-4 shadow-sm bg-card hover:bg-muted/50 transition-colors space-y-1 cursor-pointer h-auto flex-col items-start whitespace-normal w-full',
      onClick: () => { (window.top ?? window).location.href = item.path; },
    });
    btn.innerHTML = `
      <p class="text-sm font-semibold text-primary">${sanitizeHtml(item.name)}</p>
      <p class="text-xs text-muted-foreground leading-relaxed">${sanitizeHtml(item.description)}</p>`;
    grid.appendChild(btn);
  });

  section.appendChild(grid);
  return section;
}
