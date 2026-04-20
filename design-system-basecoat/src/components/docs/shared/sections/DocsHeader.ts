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
  header.className = 'ds-docs mb-8 sm:mb-12 border-b pb-6 sm:pb-8 border-border/50';

  const top = document.createElement('div');
  top.className = 'flex flex-wrap items-center justify-between gap-3 mb-4';

  const badges = document.createElement('div');
  badges.className = 'flex items-center gap-2 flex-wrap';
  badges.appendChild(createBadge({ text: props.category, variant: 'secondary', className: 'bg-primary/5 text-primary border-primary/10 font-medium px-2 py-0' }));
  badges.appendChild(createBadge({ text: props.type, variant: 'outline', className: 'text-muted-foreground font-normal px-2 py-0' }));
  top.appendChild(badges);
  top.appendChild(createLanguageSwitcher());
  header.appendChild(top);

  const content = document.createElement('div');
  content.className = 'space-y-3 sm:space-y-4';

  const h1 = document.createElement('h1');
  h1.className = 'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground';
  h1.textContent = props.title;

  const desc = document.createElement('p');
  desc.className = 'text-muted-foreground text-base sm:text-lg max-w-3xl leading-relaxed';
  desc.textContent = props.description;

  content.append(h1, desc);
  header.appendChild(content);

  if (props.installNote) {
    const installRow = document.createElement('div');
    installRow.className = 'mt-6 flex items-center gap-3 text-sm text-muted-foreground/80';
    installRow.innerHTML = `<span class="flex items-center gap-1.5"><code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">${sanitizeHtml(props.installNote)}</code></span>`;
    header.appendChild(installRow);
  }

  return header;
}
