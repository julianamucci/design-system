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
    <div ref={rootRef} className="sb-unstyled ds-docs nds-page" data-width="wide">
      {header}

      <div className="nds-sidebar-layout" data-sidebar-sticky="true">
        <nav
          aria-label="Navegação das seções do componente"
          className="nds-stack"
          data-spacing="md"
        >
          <DocsNav groups={navGroups} activeSection={activeSection} componentSlug={componentSlug} />
        </nav>

        <div className="ds-docs nds-stack" data-spacing="2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
