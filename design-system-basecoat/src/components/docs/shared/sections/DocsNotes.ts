import { sanitizeHtml } from '@/lib/sanitize-html';
import { createAlert, createAlertTitle, createAlertDescription } from '@/components/ui/alert';

export interface DocsNoteItem { title: string; content: string }
export interface DocsNotesProps {
  title: string;
  items: DocsNoteItem[];
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, cada
   * nota recebe um wrapper `<div>` com `data-track="link"` +
   * `data-track-id="{slug}:link:notes-{idx}"` (idx = índice 1-based). Como o
   * conteúdo é injetado via `innerHTML`, não marcamos cada `<a>` individualmente
   * — o observer global usa `.closest('[data-track]')` para capturar clicks em
   * qualquer link descendente.
   */
  componentSlug?: string;
}

export function createDocsNotes(props: DocsNotesProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'notas';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'nds-stack';
  container.dataset.spacing = 'md';

  props.items.forEach((item, i) => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-track', 'link');
    if (props.componentSlug) {
      wrapper.setAttribute('data-track-id', `${props.componentSlug}:link:notes-${i + 1}`);
    }

    const alert = createAlert({ variant: 'default' });
    if (item.title) {
      alert.appendChild(createAlertTitle({ text: item.title }));
    }
    const alertDescription = createAlertDescription();
    const p = document.createElement('p');
    p.innerHTML = sanitizeHtml(item.content);
    alertDescription.appendChild(p);
    alert.appendChild(alertDescription);

    wrapper.appendChild(alert);
    container.appendChild(wrapper);
  });

  section.appendChild(container);
  return section;
}
