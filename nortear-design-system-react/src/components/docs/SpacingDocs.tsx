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
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h2 nds-text-foreground">Escala visual</h2>
        <p className="nds-text-body">
          Cada barra tem largura igual ao token. A escala acompanha a densidade
          ativa do tema.
        </p>
      </div>
      <div className="nds-stack nds-bg-card nds-border-soft nds-rounded-lg nds-p-6" data-spacing="sm">
        {SPACING_TOKENS.map((tok) => (
          <div key={tok.name} className="nds-row" data-align="center" data-spacing="md">
            <code className="nds-text-caption nds-text-muted-foreground nds-shrink-0" style={{ width: '8rem' }}>
              {tok.name}
            </code>
            <div
              className="nds-bg-primary nds-rounded-sm nds-shrink-0"
              style={{ width: `var(${tok.varName})`, height: 'var(--spacing-4)' }}
              aria-hidden="true"
            />
            <span className="nds-text-caption nds-text-muted-foreground">{tok.px}</span>
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
