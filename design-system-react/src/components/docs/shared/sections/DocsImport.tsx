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
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
      <Card className="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none">
        <code className="whitespace-pre">{code}</code>
      </Card>
      {secondaryCode && (
        <>
          {secondaryDescription && (
            <p className="text-sm text-muted-foreground mt-4 mb-3">{secondaryDescription}</p>
          )}
          <Card className="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none mt-3">
            <code className="whitespace-pre">{secondaryCode}</code>
          </Card>
        </>
      )}
      {tertiaryCode && (
        <>
          {tertiaryDescription && (
            <p className="text-sm text-muted-foreground mt-4 mb-3">{tertiaryDescription}</p>
          )}
          <Card className="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none mt-3">
            <code className="whitespace-pre">{tertiaryCode}</code>
          </Card>
        </>
      )}
    </section>
  );
}
