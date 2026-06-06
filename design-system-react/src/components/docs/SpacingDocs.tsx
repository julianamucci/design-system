import { FoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/espacamento/translations.json';

// Barras coloridas com largura igual a cada token de spacing — visualiza a
// escala em pixels concretos. Width aplicado via var(--spacing-*) reage à
// densidade ativa (condensado / default / confortável).
const SPACING_TOKENS: Array<{ name: string; varName: string; px: string }> = [
  { name: 'spacing-px', varName: '--spacing-px', px: '1px' },
  { name: 'spacing-0-5', varName: '--spacing-0-5', px: '2px' },
  { name: 'spacing-1', varName: '--spacing-1', px: '4px' },
  { name: 'spacing-2', varName: '--spacing-2', px: '8px' },
  { name: 'spacing-4', varName: '--spacing-4', px: '16px' },
  { name: 'spacing-6', varName: '--spacing-6', px: '24px' },
  { name: 'spacing-8', varName: '--spacing-8', px: '32px' },
  { name: 'spacing-10', varName: '--spacing-10', px: '40px' },
  { name: 'spacing-12', varName: '--spacing-12', px: '48px' },
  { name: 'spacing-16', varName: '--spacing-16', px: '64px' },
  { name: 'spacing-20', varName: '--spacing-20', px: '80px' },
  { name: 'spacing-24', varName: '--spacing-24', px: '96px' },
];

function SpacingSpecimens() {
  return (
    <section className="space-y-4 border-t border-border/50 pt-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground m-0">Escala visual</h2>
        <p className="text-sm text-muted-foreground m-0">
          Cada barra tem largura igual ao token. A escala acompanha a densidade
          ativa do tema.
        </p>
      </div>
      <div className="rounded-lg border border-border/50 p-6 space-y-2 bg-card">
        {SPACING_TOKENS.map((tok) => (
          <div key={tok.name} className="flex items-center gap-4">
            <code className="text-xs text-muted-foreground w-32 shrink-0">
              {tok.name}
            </code>
            <div
              className="h-4 bg-primary rounded-sm"
              style={{ width: `var(${tok.varName})` }}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">{tok.px}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SpacingDocs() {
  return (
    <FoundationPage
      slug="espacamento"
      translations={translations}
      extraSection={<SpacingSpecimens />}
    />
  );
}
