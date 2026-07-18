import { Card } from '@/components/ui/card';

export interface DocsImportProps {
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
  tertiaryCode?: string;
  tertiaryDescription?: string;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Informativo — o snippet
   * renderizado atualmente é apenas um bloco `<code>` estático, sem botão de
   * "copiar". Caso uma futura iteração adicione um botão, ele deverá receber
   * `data-track="code"` + `data-track-id="{slug}:code:import-primary"` (ou
   * `import-secondary`) + `data-track-label="Copiar import"`.
   */
  componentSlug?: string;
}

export function DocsImport({ title, description, code, secondaryCode, secondaryDescription, tertiaryCode, tertiaryDescription }: DocsImportProps) {
  return (
    <section id="importacao">
      <h2 className="nds-section-title">{title}</h2>
      {description && <p className="nds-text-body nds-text-muted-foreground nds-mb-4">{description}</p>}
      <Card className="nds-code-block nds-shadow-none">
        <code className="nds-whitespace-pre">{code}</code>
      </Card>
      {secondaryCode && (
        <>
          {secondaryDescription && (
            <p className="nds-text-body nds-text-muted-foreground nds-mt-4 nds-mb-4">{secondaryDescription}</p>
          )}
          <Card className="nds-code-block nds-mt-2 nds-shadow-none">
            <code className="nds-whitespace-pre">{secondaryCode}</code>
          </Card>
        </>
      )}
      {tertiaryCode && (
        <>
          {tertiaryDescription && (
            <p className="nds-text-body nds-text-muted-foreground nds-mt-4 nds-mb-4">{tertiaryDescription}</p>
          )}
          <Card className="nds-code-block nds-mt-2 nds-shadow-none">
            <code className="nds-whitespace-pre">{tertiaryCode}</code>
          </Card>
        </>
      )}
    </section>
  );
}
