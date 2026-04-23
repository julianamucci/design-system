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
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;
  section.appendChild(h2);

  const container = document.createElement('div');
  container.className = 'space-y-4';

  props.items.forEach(item => {
    const card = createCard({ className: 'p-4 gap-2' });

    const info = document.createElement('div');
    info.innerHTML = `
      <p class="text-sm font-semibold">${sanitizeHtml(item.name)}</p>
      <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">${sanitizeHtml(item.description)}</p>`;

    const previewWrap = document.createElement('div');
    previewWrap.className = 'flex items-center justify-center';
    previewWrap.appendChild(item.previewFactory());

    card.append(info, previewWrap);

    if (item.code) {
      const toggleWrap = document.createElement('div');
      let codeVisible = false;

      const toggle = createButton({
        variant: 'link',
        label: 'Ver código',
        class: 'px-0 h-auto',
        onClick: () => {
          codeVisible = !codeVisible;
          toggle.textContent = codeVisible ? 'Ocultar código' : 'Ver código';
          codeBlock.classList.toggle('hidden', !codeVisible);
        },
      });
      toggle.setAttribute('data-track', 'code');
      if (props.componentSlug) {
        toggle.setAttribute('data-track-id', `${props.componentSlug}:code:${item.name}`);
      }
      toggle.setAttribute('data-track-label', 'Copiar código');

      const codeBlock = document.createElement('div');
      codeBlock.className = 'bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2 hidden';
      const codeEl = document.createElement('code');
      codeEl.className = 'whitespace-pre';
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
