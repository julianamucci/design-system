import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsRelatedItem { name: string; description: string; path: string }
export interface DocsRelatedProps {
  title: string;
  items: DocsRelatedItem[];
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, cada
   * card recebe `data-track="related"` +
   * `data-track-id="{slug}:related:{item.name.slug}"` +
   * `data-track-label={item.name}`. Se ausente, omite `data-track-id`.
   */
  componentSlug?: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-');
}

export function createDocsRelated(props: DocsRelatedProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'relacionados';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  const grid = document.createElement('div');
  grid.className = 'nds-grid';
  grid.dataset.cols = '2';
  grid.dataset.spacing = 'md';

  props.items.forEach(item => {
    const a = document.createElement('a');
    a.href = item.path;
    a.target = '_top';
    // Card clicável com aparência do button outline (border + bg + hover accent).
    // Implementado como classe própria .nds-related-card em vez de usar
    // .nds-button-outline porque o layout difere (vertical, multi-linha,
    // padding maior, sem white-space:nowrap nem inline-flex centralizado).
    a.className = 'nds-related-card';
    a.setAttribute('data-track', 'related');
    if (props.componentSlug) {
      a.setAttribute('data-track-id', `${props.componentSlug}:related:${slugify(item.name)}`);
    }
    a.setAttribute('data-track-label', item.name);
    a.innerHTML = `
      <span class="nds-related-card-title">${sanitizeHtml(item.name)}</span>
      <span class="nds-related-card-description">${sanitizeHtml(item.description)}</span>`;
    grid.appendChild(a);
  });

  section.appendChild(grid);
  return section;
}
