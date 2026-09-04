import { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';
import type * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';

/**
 * Id do `<h1>`, reexportado de `@shared/primitives/docs-page-landmarks`.
 *
 * A constante já foi declarada aqui. Passou a ser compartilhada porque o
 * mesmo id vivia em cinco lugares e as duas pontas — este `<h1>` e o
 * `aria-labelledby` do `<main>` — só funcionam se concordarem. A reexportação
 * mantém quem já importava daqui.
 */
export { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';

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
          variant="default"
          className="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
        >
          {category}
        </Badge>
        <Badge variant="info" className="nds-text-muted-foreground nds-font-normal">
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
