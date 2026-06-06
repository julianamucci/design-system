import { FoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/tipografia/translations.json';

// Specimens visuais usando os elementos HTML padrão — `@layer base` em
// globals.css aplica os tokens `--text-*`, `--font-weight-*` e `--line-height-*`
// automaticamente. Não precisamos repetir classes Tailwind aqui.
function TypographySpecimens() {
  return (
    <section className="space-y-6 border-t border-border/50 pt-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground m-0">Specimens</h2>
        <p className="text-sm text-muted-foreground m-0">
          Hierarquia renderizada com os elementos HTML padrão do tema ativo.
        </p>
      </div>

      <div className="rounded-lg border border-border/50 p-6 space-y-4 bg-card">
        <h1 className="m-0">Heading 1 — título de página</h1>
        <h2 className="m-0">Heading 2 — seção principal</h2>
        <h3 className="m-0">Heading 3 — subseção</h3>
        <h4 className="m-0">Heading 4 — agrupamento menor</h4>
        <p className="m-0 text-foreground">
          Parágrafo de corpo. The quick brown fox jumps over the lazy dog. Texto
          corrido usa <code>--text-p</code> (14px) com <code>--line-height-normal</code>
          (1.5) — base WCAG 1.4.12.
        </p>
        <label className="block text-foreground">
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
