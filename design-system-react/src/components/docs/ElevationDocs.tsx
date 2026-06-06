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
    <section className="space-y-6 border-t border-border/50 pt-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground m-0">Specimens</h2>
        <p className="text-sm text-muted-foreground m-0">
          Cards com cada nível de sombra e cada token de radius aplicado.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground m-0">Sombras</h3>
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4 p-6 bg-muted/20 rounded-lg">
          {ELEVATIONS.map((el) => (
            <div
              key={el.token}
              className="bg-card rounded-lg p-4 text-center text-xs text-muted-foreground"
              style={{ boxShadow: `var(${el.token})` }}
            >
              <div className="font-medium text-foreground mb-1">{el.label}</div>
              <code className="text-[10px]">{el.token}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground m-0">Radius</h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {RADII.map((r) => (
            <div
              key={r.token}
              className="bg-primary/10 border border-primary/20 p-6 text-center text-xs text-muted-foreground"
              style={{ borderRadius: `var(${r.token})` }}
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
