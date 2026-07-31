import { CodeBlock } from '@/components/ui/code-block';

export interface DocsImportProps {
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
  tertiaryCode?: string;
  tertiaryDescription?: string;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, a raiz
   * dos blocos primário e secundário recebe `data-track="code"` +
   * `data-track-id="{slug}:code:import-primary"` (ou `import-secondary`) +
   * `data-track-label="Copiar import"`. O observer garante que só o clique no
   * botão de copiar do CodeBlock conta como `docs_code_copy`.
   */
  componentSlug?: string;
  /** Linguagem dos snippets, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function DocsImport({
  title,
  description,
  code,
  secondaryCode,
  secondaryDescription,
  tertiaryCode,
  tertiaryDescription,
  componentSlug,
  language = 'tsx',
  copyLabel,
  copiedLabel,
}: DocsImportProps) {
  const track = (id: string) =>
    componentSlug
      ? {
          'data-track': 'code',
          'data-track-id': `${componentSlug}:code:${id}`,
          'data-track-label': 'Copiar import',
        }
      : {};
  return (
    <section id="importacao">
      <h2 className="nds-section-title">{title}</h2>
      {description && <p className="nds-text-body nds-mb-4">{description}</p>}
      <CodeBlock
        code={code}
        language={language}
        showLineNumbers={false}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
        {...track('import-primary')}
      />
      {secondaryCode && (
        <>
          {secondaryDescription && (
            <p className="nds-text-body nds-mt-4 nds-mb-4">{secondaryDescription}</p>
          )}
          <CodeBlock
            code={secondaryCode}
            language={language}
            showLineNumbers={false}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            className="nds-mt-2"
            {...track('import-secondary')}
          />
        </>
      )}
      {tertiaryCode && (
        <>
          {tertiaryDescription && (
            <p className="nds-text-body nds-mt-4 nds-mb-4">{tertiaryDescription}</p>
          )}
          <CodeBlock
            code={tertiaryCode}
            language={language}
            showLineNumbers={false}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            className="nds-mt-2"
          />
        </>
      )}
    </section>
  );
}
