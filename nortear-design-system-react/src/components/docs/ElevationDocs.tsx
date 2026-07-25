import type { CSSProperties } from 'react';
import { FoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

const ELEVATIONS: Array<{ token: string | null; label: string }> = [
  { token: null, label: '0 — Plano' },
  { token: '--elevation-sm', label: '1 — Card' },
  { token: '--elevation-md', label: '2 — Dropdown' },
  { token: '--elevation-lg', label: '3 — Dialog' },
  { token: '--elevation-xl', label: '4 — Tooltip' },
];

const RADII: Array<{ token: string | null; label: string }> = [
  { token: '--radius-none', label: 'none' },
  { token: '--radius-xs', label: 'xs' },
  { token: '--radius-sm', label: 'sm' },
  { token: '--radius-md', label: 'md' },
  { token: '--radius-lg', label: 'lg' },
  { token: '--radius-xl', label: 'xl' },
  { token: '--radius-full', label: 'full' },
];

function ElevationSpecimens() {
  const { t } = useTranslation(translations);

  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      <div className="nds-stack" data-spacing="xs">
        <h2 className="nds-text-h2 nds-text-foreground">{t('specimens.title')}</h2>
        <p className="nds-text-body">{t('specimens.subtitle')}</p>
      </div>

      <div className="nds-stack" data-spacing="sm">
        <h3 className="nds-text-body nds-font-medium">{t('specimens.shadows')}</h3>
        <div
          className="nds-grid nds-p-6 nds-rounded-lg"
          data-spacing="lg"
          style={{ '--grid-min': '8rem', backgroundColor: 'hsl(var(--muted) / 0.2)' } as CSSProperties}
        >
          {ELEVATIONS.map((el) => (
            <div
              key={el.label}
              className="nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center"
              style={el.token ? { boxShadow: `var(${el.token})` } : undefined}
            >
              <div className="nds-font-medium nds-text-foreground nds-mb-1">{el.label}</div>
              <code style={{ fontSize: '10px' }}>{el.token ?? '—'}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="nds-stack" data-spacing="sm">
        <h3 className="nds-text-body nds-font-medium">{t('specimens.radius')}</h3>
        <div
          className="nds-grid"
          data-spacing="md"
          style={{ '--grid-min': '8rem' } as CSSProperties}
        >
          {RADII.map((r) => (
            <div
              key={r.label}
              className={`nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center${r.token ? '' : ' nds-rounded-full'}`}
              style={r.token ? { borderRadius: `var(${r.token})` } : undefined}
            >
              <code>{r.token ?? '.nds-rounded-full'}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="nds-stack" data-spacing="sm">
        <h3 className="nds-text-body nds-font-medium">{t('specimens.nested')}</h3>
        <div
          className="nds-grid"
          data-spacing="md"
          style={{ '--grid-min': '12rem' } as CSSProperties}
        >
          {/* Rᵢ = Rₑ − E: 14 → 10 → 6 com inset p-1 (4px) em cada nível */}
          <div className="nds-stack" data-spacing="xs">
            <div className="nds-bg-primary-soft nds-p-1" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="nds-bg-card nds-p-1" style={{ borderRadius: 'var(--radius)' }}>
                <div className="nds-bg-primary-soft nds-p-6" style={{ borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
            <span className="nds-text-caption nds-text-muted-foreground">{t('specimens.nestedOk')}</span>
          </div>
          {/* Errado: mesmo raio em todos os níveis */}
          <div className="nds-stack" data-spacing="xs">
            <div className="nds-bg-primary-soft nds-p-1" style={{ borderRadius: 'var(--radius-xl)' }}>
              <div className="nds-bg-card nds-p-1" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="nds-bg-primary-soft nds-p-6" style={{ borderRadius: 'var(--radius-xl)' }} />
              </div>
            </div>
            <span className="nds-text-caption nds-text-muted-foreground">{t('specimens.nestedBad')}</span>
          </div>
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
