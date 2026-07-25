import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { Swatch } from '@/components/docs/shared/Swatch';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import themeColorsTranslations from '@shared/content/theme-colors/translations.json';

// ─── Definições estáticas ──────────────────────────────────────────────────────

/** Grupos da paleta semântica e seus tokens (sem o prefixo `--`). */
const PALETTE_GROUPS: Array<{ key: string; tokens: string[] }> = [
  {
    key: 'surface',
    tokens: [
      'background', 'foreground', 'card', 'card-foreground', 'popover',
      'popover-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
    ],
  },
  {
    key: 'brand',
    tokens: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'],
  },
  {
    key: 'feedback',
    tokens: [
      'destructive', 'destructive-foreground', 'success', 'success-foreground',
      'warning', 'warning-foreground', 'info', 'info-foreground',
    ],
  },
  {
    key: 'structure',
    tokens: ['border', 'input', 'input-background', 'ring'],
  },
  {
    key: 'chart',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
];

/** Tokens exibidos como mini-swatches nos cards de tema/modo. */
const MINI_TOKENS = ['primary', 'secondary', 'accent', 'muted', 'destructive', 'success'];

const BRAND_THEMES: Array<{ key: string; className: string }> = [
  { key: 'default', className: 'tema-default' },
  { key: 'warm', className: 'tema-warm' },
  { key: 'cold', className: 'tema-cold' },
];

const MODES: Array<{ key: string; className: string }> = [
  { key: 'light', className: '' },
  { key: 'dark', className: 'dark' },
];

const DENSITY_ITEMS: Array<{ key: string; className: string }> = [
  { key: 'condensado', className: 'densidade-condensado' },
  { key: 'default', className: 'densidade-default' },
  { key: 'confortavel', className: 'densidade-confortavel' },
];

const FONT_ITEMS: Array<{ key: string; className: string }> = [
  { key: 'default', className: 'fonte-default' },
  { key: 'lexend', className: 'fonte-lexend' },
  { key: 'pt-serif', className: 'fonte-pt-serif' },
  { key: 'lxgw-wenkai', className: 'fonte-lxgw-wenkai' },
];

// ─── Componente ──────────────────────────────────────────────────────────────

export function ThemeColorsDocs() {
  const { t, locale } = useTranslation(themeColorsTranslations);
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
  const [temaAtivo, setTemaAtivo] = useState<string>('tema-default');
  const [paginaDark, setPaginaDark] = useState<boolean>(false);

  // ─── SEO ────────────────────────────────────────────────────────────────
  useSeoEffect({
    title: `${t('title')} — ${t('category')}`,
    description: t('description'),
    locale,
    componentSlug: 'theme-colors',
  });

  // ─── Analytics — page view ───────────────────────────────────────────────
  useEffect(() => {
    track('docs_page_view', {
      component_name: 'theme-colors',
      locale,
      page_title: `${t('title')} · Design System`,
    });
  }, [locale, t]);

  // ─── Detecta tema/modo + relê valores HSL no <html> (reage à toolbar) ──────
  useEffect(() => {
    const read = () => {
      const cl = document.documentElement.classList;
      const tema = ['tema-default', 'tema-warm', 'tema-cold'].find((c) => cl.contains(c))
        ?? 'tema-default';
      setTemaAtivo(tema);
      setPaginaDark(cl.contains('dark'));

      // Relê os valores HSL resolvidos a cada mudança de classe do <html>.
      const styles = getComputedStyle(document.documentElement);
      const values: Record<string, string> = {};
      PALETTE_GROUPS.forEach((group) => {
        group.tokens.forEach((token) => {
          values[token] = styles.getPropertyValue(`--${token}`).trim();
        });
      });
      setTokenValues(values);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ─── Fileira de mini-swatches (variante vertical) ─────────────────────────
  const miniRow = (
    <div className="nds-miniswatch-row">
      {MINI_TOKENS.map((token) => (
        <Swatch key={token} token={token} orientation="vertical" />
      ))}
    </div>
  );

  return (
    <div className="sb-unstyled nds-flex-1 nds-w-full ds-docs" style={{ height: '100%', overflow: 'auto' }}>
      <div className="nds-p-8 nds-stack" data-spacing="xl" style={{ maxWidth: '72rem', marginInline: 'auto' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="nds-stack nds-pb-8" style={{ paddingBottom: '2rem' }}>
          <div className="nds-cluster" data-justify="between">
            <div className="nds-cluster" data-spacing="sm" data-align="center">
              <Badge
                variant="secondary"
                className="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
              >
                {t('category')}
              </Badge>
              <Badge
                variant="outline"
                className="nds-text-muted-foreground nds-font-normal"
              >
                {t('type')}
              </Badge>
            </div>
            <LanguageSwitcher />
          </div>

          <h1 className="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
            {t('title')}
          </h1>

          <p className="nds-text-muted-foreground nds-leading-relaxed" style={{ maxWidth: '48rem' }}>
            {t('description')}
          </p>
        </header>

        {/* ── Paleta semântica ─────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
          <div className="nds-stack" data-spacing="xs">
            <h2 className="nds-text-h2 nds-text-foreground">{t('palette.title')}</h2>
            <p className="nds-text-body">{t('palette.subtitle')}</p>
          </div>

          {PALETTE_GROUPS.map((group) => (
            <div key={group.key} className="nds-swatch-group">
              <h3 className="nds-swatch-group-title">{t(`palette.groups.${group.key}`)}</h3>
              <ul className="nds-swatch-grid">
                {group.tokens.map((token) => (
                  <li key={token} className="nds-swatch-grid-item">
                    <Swatch
                      token={token}
                      orientation="horizontal"
                      value={tokenValues[token]}
                      copyLabel={t('copy.tooltip')}
                      copiedLabel={t('copy.copied')}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* ── Temas de marca ───────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="md">
          <div className="nds-stack" data-spacing="xs">
            <h2 className="nds-text-h2 nds-text-foreground">{t('brand.title')}</h2>
            <p className="nds-text-body">{t('brand.subtitle')}</p>
          </div>
          <div className="nds-theme-card-grid">
            {BRAND_THEMES.map((theme) => (
              <div key={theme.key} className="nds-theme-card">
                <div className={`nds-theme-card-scope ${theme.className}${paginaDark ? ' dark' : ''}`}>
                  <span className="nds-theme-card-label">
                    {t(`brand.themes.${theme.key}`)}
                  </span>
                  {miniRow}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Light e Dark ─────────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="md">
          <div className="nds-stack" data-spacing="xs">
            <h2 className="nds-text-h2 nds-text-foreground">{t('modes.title')}</h2>
            <p className="nds-text-body">{t('modes.subtitle')}</p>
          </div>
          <div className="nds-theme-card-grid">
            {MODES.map((mode) => (
              <div key={mode.key} className="nds-theme-card">
                <div className={`nds-theme-card-scope ${temaAtivo}${mode.className ? ` ${mode.className}` : ''}`}>
                  <span className="nds-theme-card-label">
                    {t(`modes.${mode.key}`)}
                  </span>
                  {miniRow}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Densidade e Fontes ───────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
          <div className="nds-stack" data-spacing="xs">
            <h2 className="nds-text-h2 nds-text-foreground">{t('axes.title')}</h2>
            <p className="nds-text-body">{t('axes.subtitle')}</p>
          </div>

          {/* Densidade — tabela 3×3 dentro de cada escopo densidade-*. Os
              paddings/alturas tokenizados da Table escalam com --spacing-base,
              demonstrando o eixo sem a ambiguidade de "tamanho de botão". */}
          <div className="nds-stack" data-spacing="md">
            <div className="nds-stack" data-spacing="xs">
              <h3 className="nds-text-body nds-font-medium">{t('axes.density.title')}</h3>
              <p className="nds-text-body">{t('axes.density.subtitle')}</p>
            </div>
            <div className="nds-axis-grid">
              {DENSITY_ITEMS.map((item) => {
                const dData = (themeColorsTranslations as Record<string, unknown>)[locale] as {
                  axes: { density: { tableCols: string[]; tableRows: string[][] } };
                };
                const densityData = dData.axes.density;
                return (
                  <div key={item.key} className="nds-axis-sample">
                    <span className="nds-axis-sample-label">
                      {t(`axes.density.items.${item.key}`)}
                    </span>
                    <div className={`nds-axis-scope ${item.className}`}>
                      <Table className="nds-axis-density-table">
                        <TableHeader>
                          <TableRow>
                            {densityData.tableCols.map((col, i) => <TableHead key={i}>{col}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {densityData.tableRows.map((row, r) => (
                            <TableRow key={r}>
                              {row.map((val, c) => <TableCell key={c}>{val}</TableCell>)}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fontes */}
          <div className="nds-stack" data-spacing="md">
            <div className="nds-stack" data-spacing="xs">
              <h3 className="nds-text-body nds-font-medium">{t('axes.fonts.title')}</h3>
              <p className="nds-text-body">{t('axes.fonts.subtitle')}</p>
            </div>
            <div className="nds-axis-grid" data-cols="4">
              {FONT_ITEMS.map((item) => (
                <div key={item.key} className="nds-axis-sample">
                  <span className="nds-axis-sample-label">
                    {t(`axes.fonts.items.${item.key}`)}
                  </span>
                  <div className={item.className}>
                    <span className="nds-font-sample">Aa Bb Cc 123</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
