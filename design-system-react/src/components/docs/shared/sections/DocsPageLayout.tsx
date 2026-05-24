import React from 'react';
import { DocsNav, type DocsNavGroup } from '../DocsNav';
import { mountDocsTracking } from '@/lib/docs-tracking';

export interface DocsPageLayoutProps {
  navGroups: DocsNavGroup[];
  activeSection?: string;
  header: React.ReactNode;
  children: React.ReactNode;
  /** Slug do componente — habilita tracking automático via `data-track*`. */
  componentSlug?: string;
}

export function DocsPageLayout({ navGroups, activeSection, header, children, componentSlug }: DocsPageLayoutProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!componentSlug) return;
    return mountDocsTracking(rootRef.current, { componentSlug });
  }, [componentSlug]);

  return (
    // sb-unstyled é a escape hatch oficial do Storybook (@storybook/blocks):
    // todas as regras prose emotion (.css-XXXX :where(p|h1|table|...)) usam
    // :not(.sb-unstyled, .sb-unstyled <tag>), então marcar o root com essa
    // classe desliga 100% do prose-style injetado pelo emotion na subárvore.
    <div ref={rootRef} className="sb-unstyled ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {header}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
        <nav
          aria-label="Navegação das seções do componente"
          className="w-full lg:sticky lg:top-8 lg:w-52 lg:shrink-0 self-start space-y-5"
        >
          <DocsNav groups={navGroups} activeSection={activeSection} componentSlug={componentSlug} />
        </nav>

        <div className="ds-docs flex-1 min-w-0 w-full space-y-12">
          {children}
        </div>
      </div>
    </div>
  );
}
