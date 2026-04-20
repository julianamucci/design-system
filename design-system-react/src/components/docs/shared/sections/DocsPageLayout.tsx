import React from 'react';
import { DocsNav, type DocsNavGroup } from '../DocsNav';

export interface DocsPageLayoutProps {
  navGroups: DocsNavGroup[];
  activeSection?: string;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function DocsPageLayout({ navGroups, activeSection, header, children }: DocsPageLayoutProps) {
  return (
    <div className="ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {header}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
        <nav
          aria-label="Navegação das seções do componente"
          className="w-full lg:sticky lg:top-8 lg:w-52 lg:shrink-0 self-start space-y-5"
        >
          <DocsNav groups={navGroups} activeSection={activeSection} />
        </nav>

        <div className="ds-docs flex-1 min-w-0 w-full space-y-12">
          {children}
        </div>
      </div>
    </div>
  );
}
