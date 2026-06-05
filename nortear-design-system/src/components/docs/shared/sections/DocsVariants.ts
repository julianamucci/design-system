import { sanitizeHtml } from '@/lib/sanitize-html';
import { createCard } from '@/components/ui/card';
import { createButton } from '@/components/ui/button';

export interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
  previewFactory: () => HTMLElement;
}

export interface DocsVariantsProps {
  title: string;
  description?: string;
  items: DocsVariantItem[];
  id?: string;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, o
   * botão "Ver código / Ocultar código" de cada variant recebe
   * `data-track="code"` + `data-track-id="{slug}:code:{variant.name}"` +
   * `data-track-label="Copiar código"`. Se ausente, `data-track-id` é omitido.
   */
  componentSlug?: string;
}

export function createDocsVariants(props: DocsVariantsProps): HTMLElement {
  const section = document.createElement('section');
  section.id = props.id ?? 'variantes';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  if (props.description) {
    const p = document.createElement('p');
    p.className = 'nds-text-muted-foreground nds-mb-4';
    p.innerHTML = sanitizeHtml(props.description);
    section.appendChild(p);
  }

  const container = document.createElement('div');
  container.className = 'nds-stack';
  container.dataset.spacing = 'md';

  props.items.forEach(item => {
    const card = createCard({ className: 'nds-p-4' });

    const info = document.createElement('div');
    info.innerHTML = `
      <h3 class="nds-text-body nds-font-semibold nds-m-0">${sanitizeHtml(item.name)}</h3>
      <p class="nds-text-body nds-text-muted-foreground nds-mt-1 nds-leading-relaxed">${sanitizeHtml(item.description)}</p>`;

    const previewWrap = document.createElement('div');
    previewWrap.className = 'nds-cluster';
    previewWrap.dataset.justify = 'center';
    previewWrap.appendChild(item.previewFactory());

    card.append(info, previewWrap);

    if (item.code) {
      const toggleWrap = document.createElement('div');
      let codeVisible = false;

      const toggle = createButton({
        variant: 'link',
        label: 'Ver código',
        class: 'nds-px-0',
        onClick: () => {
          codeVisible = !codeVisible;
          toggle.textContent = codeVisible ? 'Ocultar código' : 'Ver código';
          codeBlock.classList.toggle('nds-hidden', !codeVisible);
        },
      });
      toggle.setAttribute('data-track', 'code');
      if (props.componentSlug) {
        toggle.setAttribute('data-track-id', `${props.componentSlug}:code:${item.name}`);
      }
      toggle.setAttribute('data-track-label', 'Copiar código');

      const codeBlock = document.createElement('pre');
      codeBlock.className = 'nds-code-block nds-mt-2 nds-hidden';
      const codeEl = document.createElement('code');
      codeEl.textContent = item.code;
      codeBlock.appendChild(codeEl);

      toggleWrap.append(toggle, codeBlock);
      card.appendChild(toggleWrap);
    }

    container.appendChild(card);
  });

  section.appendChild(container);
  return section;
}
