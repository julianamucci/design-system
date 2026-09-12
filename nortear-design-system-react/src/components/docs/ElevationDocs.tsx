import { useMemo, type CSSProperties } from 'react';
import { FoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

/**
 * A escada de elevação do mostruário é DERIVADA de `elevation.rows` do conteúdo
 * compartilhado — nunca recravada aqui. A lista cravada tinha quatro degraus e o
 * conteúdo passou a seis em 2026-09-12 (entrou `--elevation-xs`, relevo de
 * controle): a tabela mostrava o degrau novo e o mostruário não, e a página se
 * contradizia. Ordem, rótulo e token saem todos da mesma fonte.
 *
 * O `token` do nível plano é o travessão (`—`) no conteúdo; aqui ele vira
 * `null`, que é o que distingue "sem sombra" de "sombra deste token".
 */
interface ElevationStep {
  /** Chave da linha no conteúdo — `plano`, `controle`, `card`, … */
  key: string;
  /** Rótulo traduzido (`elevation.rows.<key>.level`). */
  label: string;
  /** Custom property da sombra, ou `null` no nível plano. */
  token: string | null;
}

/** Classe utilitária que pinta o degrau: `--elevation-md` → `.nds-shadow-md`. */
function shadowClass(token: string | null): string {
  return token ? `nds-shadow-${token.replace('--elevation-', '')}` : 'nds-shadow-none';
}

function useElevationSteps(t: (key: string) => string, locale: string): ElevationStep[] {
  // A ORDEM e o conjunto de degraus vêm das chaves do dicionário; os textos vêm
  // do `t()`, que já resolve locale e overrides.
  return useMemo(() => {
    const dict = translations as Record<
      string,
      { elevation?: { rows?: Record<string, unknown> } } | undefined
    >;
    const rows = (dict[locale] ?? dict['pt-BR'])?.elevation?.rows ?? {};
    return Object.keys(rows).map((key) => {
      const token = t(`elevation.rows.${key}.token`);
      return {
        key,
        label: t(`elevation.rows.${key}.level`),
        token: token.startsWith('--') ? token : null,
      };
    });
  }, [t, locale]);
}

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
  const { t, locale } = useTranslation(translations);
  const elevations = useElevationSteps(t, locale);

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
          {elevations.map((el) => (
            <div
              key={el.key}
              data-elevation-step={el.key}
              className={`nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center ${shadowClass(el.token)}`}
            >
              <div className="nds-font-medium nds-text-foreground nds-mb-1">{el.label}</div>
              <code className="nds-text-code">{el.token ?? '—'}</code>
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
