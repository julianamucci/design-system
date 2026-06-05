import { createBadge } from '@/components/ui/badge';
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsHeaderProps {
  title: string;
  description: string;
  category: string;
  type: string;
  installNote?: string;
}

export function createDocsHeader(props: DocsHeaderProps): HTMLElement {
  const header = document.createElement('header');
  // ds-docs (tipografia base) + nds-stack para ritmo interno + borda inferior soft
  header.className = 'ds-docs nds-stack nds-border-b-soft';
  header.dataset.spacing = 'md';
  // Padding-bottom via inline style — variável conforme viewport não é trivial em CSS puro
  header.style.paddingBottom = 'var(--spacing-6)';

  // Linha superior: badges à esquerda + language switcher à direita (spacer-start)
  const top = document.createElement('div');
  top.className = 'nds-cluster';
  top.dataset.spacing = 'sm';
  top.appendChild(createBadge({ text: props.category, variant: 'secondary', className: 'nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium' }));
  top.appendChild(createBadge({ text: props.type, variant: 'outline', className: 'nds-text-muted-foreground nds-font-normal' }));
  const switcher = createLanguageSwitcher();
  switcher.classList.add('nds-spacer-start');
  top.appendChild(switcher);
  header.appendChild(top);

  // Bloco de título + descrição
  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  const h1 = document.createElement('h1');
  h1.className = 'nds-text-h1 nds-text-foreground';
  h1.textContent = props.title;

  const desc = document.createElement('p');
  desc.className = 'nds-text-lead nds-text-muted-foreground nds-max-w-prose';
  desc.textContent = props.description;

  content.append(h1, desc);
  header.appendChild(content);

  if (props.installNote) {
    const installRow = document.createElement('div');
    installRow.className = 'nds-cluster nds-text-body nds-text-muted-foreground';
    installRow.dataset.spacing = 'sm';
    installRow.innerHTML = `<span class="nds-cluster" data-spacing="xs"><code class="nds-code-inline">${sanitizeHtml(props.installNote)}</code></span>`;
    header.appendChild(installRow);
  }

  return header;
}
