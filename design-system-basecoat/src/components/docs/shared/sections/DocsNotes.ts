import { sanitizeHtml } from '@/lib/sanitize-html';

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
    const note = document.createElement('div');
    note.className = 'bg-muted/30 rounded-lg border-l-4 border-primary/40 p-4';
    note.innerHTML = `
      <p class="text-sm font-semibold mb-1">${sanitizeHtml(item.title)}</p>
      <div class="text-sm text-muted-foreground leading-relaxed">${sanitizeHtml(item.content)}</div>`;
    container.appendChild(note);
  });

  section.appendChild(container);
  return section;
}
