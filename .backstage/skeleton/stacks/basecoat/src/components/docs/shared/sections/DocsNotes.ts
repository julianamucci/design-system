import { sanitizeHtml } from '@/lib/sanitize-html';
import { createAlert, createAlertTitle, createAlertDescription } from '@/components/ui/alert';

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
    const alert = createAlert({ variant: 'default' });
    if (item.title) {
      alert.appendChild(createAlertTitle({ text: item.title }));
    }
    const alertDescription = createAlertDescription();
    const p = document.createElement('p');
    p.innerHTML = sanitizeHtml(item.content);
    alertDescription.appendChild(p);
    alert.appendChild(alertDescription);
    container.appendChild(alert);
  });

  section.appendChild(container);
  return section;
}
