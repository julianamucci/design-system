import { FoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/tipografia/translations.json';
import DOMPurify from 'dompurify';

// Specimens visuais usando os elementos HTML padrão — `@layer base` em
// globals.css aplica os tokens `--text-*`, `--font-weight-*` e `--line-height-*`
// automaticamente. Textos vêm de translations.json (specimens.*); os nds-m-0
// zeram as margens NATIVAS dos elementos base (h1..h4/p) dentro do nds-stack.
function TypographySpecimens() {
  const { t } = useTranslation(translations);

  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h2 nds-text-foreground">{t('specimens.title')}</h2>
        <p className="nds-text-body">{t('specimens.subtitle')}</p>
      </div>

      <div className="nds-type-specimen nds-stack nds-rounded-lg nds-border-default nds-p-6 nds-bg-card" data-spacing="md">
        <h1 className="nds-m-0">{t('specimens.h1')}</h1>
        <h2 className="nds-m-0">{t('specimens.h2')}</h2>
        <h3 className="nds-m-0">{t('specimens.h3')}</h3>
        <h4 className="nds-m-0">{t('specimens.h4')}</h4>
        <p
          className="nds-m-0 nds-text-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('specimens.body')) }}
        />
        <label className="nds-block nds-text-foreground">{t('specimens.label')}</label>
      </div>
    </section>
  );
}

export function TypographyDocs() {
  return (
    <FoundationPage
      slug="tipografia"
      translations={translations}
      extraSection={<TypographySpecimens />}
    />
  );
}
