import React from 'react';
import { DocsNav, type DocsNavGroup } from '../DocsNav';
import { DOCS_PAGE_TITLE_ID } from './DocsHeader';
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
    // slug omitido → derivado do ?id= do iframe (mountDocsTracking)
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

        {/*
          Landmark de conteúdo: é o alvo do "Ir para o conteúdo" e o que o
          leitor de tela anuncia como "principal, <título da página>"
          (aria-labelledby → h1 do DocsHeader). tabindex=-1 permite foco
          programático sem entrar na ordem de tabulação. Mesmas classes e
          mesma posição na árvore do <div> anterior — zero mudança visual.
        */}
        <main
          tabIndex={-1}
          aria-labelledby={DOCS_PAGE_TITLE_ID}
          className="ds-docs nds-stack"
          data-spacing="2xl"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
