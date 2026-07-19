import type { CSSProperties } from 'react';
import { FoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

const ELEVATIONS = [
  { token: '--elevation-sm', label: '1 — Card' },
  { token: '--elevation-md', label: '2 — Dropdown' },
  { token: '--elevation-lg', label: '3 — Dialog' },
  { token: '--elevation-xl', label: '4 — Tooltip' },
];

const RADII = [
  { token: '--radius-sm', label: 'sm' },
  { token: '--radius-md', label: 'md' },
  { token: '--radius-lg', label: 'lg' },
  { token: '--radius-xl', label: 'xl' },
];

function ElevationSpecimens() {
  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h3 nds-font-semibold nds-text-foreground">Specimens</h2>
        <p className="nds-text-body nds-text-muted-foreground">
          Cards com cada nível de sombra e cada token de radius aplicado.
        </p>
      </div>

      <div className="nds-stack" data-spacing="sm">
        <h3 className="nds-text-body nds-font-medium nds-text-foreground">Sombras</h3>
        <div
          className="nds-grid nds-p-6 nds-rounded-lg"
          data-spacing="lg"
          style={{ '--grid-min': '8rem', backgroundColor: 'hsl(var(--muted) / 0.2)' } as CSSProperties}
        >
          {ELEVATIONS.map((el) => (
            <div
              key={el.token}
              className="nds-bg-card nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground"
              style={{ boxShadow: `var(${el.token})`, textAlign: 'center' }}
            >
              <div className="nds-font-medium nds-text-foreground nds-mb-1">{el.label}</div>
              <code style={{ fontSize: '10px' }}>{el.token}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="nds-stack" data-spacing="sm">
        <h3 className="nds-text-body nds-font-medium nds-text-foreground">Radius</h3>
        <div
          className="nds-grid"
          data-spacing="md"
          style={{ '--grid-min': '8rem' } as CSSProperties}
        >
          {RADII.map((r) => (
            <div
              key={r.token}
              className="nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground"
              style={{ borderRadius: `var(${r.token})`, textAlign: 'center' }}
            >
              <code>{r.token}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ElevationDocs() {
  return (
    <FoundationPage
      slug="elevacao-bordas-sombras"
      translations={translations}
      extraSection={<ElevationSpecimens />}
    />
  );
}
