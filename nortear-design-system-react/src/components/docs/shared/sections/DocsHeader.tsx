import type * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';

/**
 * Id determinístico do `<h1>` da docs page. O `<main>` do DocsPageLayout o
 * referencia via `aria-labelledby` — assim o leitor de tela anuncia
 * "principal, <título da página>" ao chegar no conteúdo. A docs page é única
 * por iframe, então não há colisão.
 */
export const DOCS_PAGE_TITLE_ID = 'docs-page-title';

export interface DocsHeaderProps {
  title: string;
  description: string;
  category: string;
  type: string;
  installNote?: string;
  languageSwitcher?: React.ReactNode;
}

export function DocsHeader({ title, description, category, type, installNote, languageSwitcher }: DocsHeaderProps) {
  return (
    <header className="ds-docs nds-stack nds-border-b-soft" data-spacing="md" style={{ paddingBottom: 'var(--spacing-6)' }}>
      <div className="nds-cluster" data-spacing="sm">
        <Badge
          variant="secondary"
          className="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
        >
          {category}
        </Badge>
        <Badge variant="outline" className="nds-text-muted-foreground nds-font-normal">
          {type}
        </Badge>
        <div className="nds-spacer-start">{languageSwitcher ?? <LanguageSwitcher />}</div>
      </div>

      <div className="nds-stack" data-spacing="sm">
        <h1 id={DOCS_PAGE_TITLE_ID} className="nds-text-h1 nds-text-foreground">{title}</h1>
        <p className="nds-text-lead nds-text-muted-foreground nds-max-w-prose">{description}</p>
      </div>

      {installNote && (
        <div className="nds-cluster nds-text-body nds-text-muted-foreground" data-spacing="sm">
          <span className="nds-cluster" data-spacing="xs">
            <code className="nds-code-inline">{installNote}</code>
          </span>
        </div>
      )}
    </header>
  );
}
