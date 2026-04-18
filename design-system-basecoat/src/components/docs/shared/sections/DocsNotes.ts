import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard, createCardContent } from '@/components/ui/card';

export interface DocsNoteItem { title: string; content: string }
export interface DocsNotesProps { title: string; items: DocsNoteItem[] }

export function createDocsNotes(props: DocsNotesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'notas';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-4';

  props.items.forEach(item => {
    const card = createCard({ className: 'bg-muted/30 border-l-4 border-primary/40 shadow-none rounded-lg' });
    const content = createCardContent({ className: 'p-4' });
    content.innerHTML = `
      <p class="text-sm font-semibold mb-1">${sanitizeHtml(item.title)}</p>
      <div class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(item.content)}</div>`;
    card.appendChild(content);
    container.appendChild(card);
  });

  section.appendChild(container);
  return section;
}
