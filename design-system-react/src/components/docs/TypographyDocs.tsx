import { FoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/tipografia/translations.json';

// Specimens visuais usando os elementos HTML padrão — `@layer base` em
// globals.css aplica os tokens `--text-*`, `--font-weight-*` e `--line-height-*`
// automaticamente. Não precisamos repetir classes Tailwind aqui.
function TypographySpecimens() {
  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h3 nds-font-semibold nds-text-foreground">Specimens</h2>
        <p className="nds-text-body nds-text-muted-foreground">
          Hierarquia renderizada com os elementos HTML padrão do tema ativo.
        </p>
      </div>

      <div className="nds-stack nds-rounded-lg nds-border-default nds-p-6 nds-bg-card" data-spacing="md">
        <h1 className="nds-m-0">Heading 1 — título de página</h1>
        <h2 className="nds-m-0">Heading 2 — seção principal</h2>
        <h3 className="nds-m-0">Heading 3 — subseção</h3>
        <h4 className="nds-m-0">Heading 4 — agrupamento menor</h4>
        <p className="nds-m-0 nds-text-foreground">
          Parágrafo de corpo. The quick brown fox jumps over the lazy dog. Texto
          corrido usa <code>--text-p</code> (14px) com <code>--line-height-normal</code>
          (1.5) — base WCAG 1.4.12.
        </p>
        <label className="nds-block nds-text-foreground">
          Label — rótulo de formulário
        </label>
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
