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
    <div ref={rootRef} className="ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
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
