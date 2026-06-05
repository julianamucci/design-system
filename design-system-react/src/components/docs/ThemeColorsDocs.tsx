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
    <div className="flex flex-wrap gap-3">
      {MINI_TOKENS.map((token) => (
        <Swatch key={token} token={token} orientation="vertical" />
      ))}
    </div>
  );

  return (
    <div className="sb-unstyled flex-1 h-full overflow-auto ds-docs">
      <div className="p-8 max-w-6xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0"
              >
                {t('category')}
              </Badge>
              <Badge
                variant="outline"
                className="text-muted-foreground font-normal px-2 py-0"
              >
                {t('type')}
              </Badge>
            </div>
            <LanguageSwitcher />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h1>

          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            {t('description')}
          </p>
        </header>

        {/* ── Paleta semântica ─────────────────────────────────────────────── */}
        <section className="space-y-6 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{t('palette.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('palette.subtitle')}</p>
          </div>

          {PALETTE_GROUPS.map((group) => (
            <div key={group.key} className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">{t(`palette.groups.${group.key}`)}</h3>
              <ul
                className="grid gap-2 list-none p-0 m-0"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
              >
                {group.tokens.map((token) => (
                  <li key={token} className="list-none">
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
        <section className="space-y-4 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{t('brand.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('brand.subtitle')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {BRAND_THEMES.map((theme) => (
              <div
                key={theme.key}
                className={`${theme.className}${paginaDark ? ' dark' : ''} bg-background text-foreground rounded-lg border border-border/50 p-4`}
              >
                <span className="block text-sm font-medium text-foreground mb-3">
                  {t(`brand.themes.${theme.key}`)}
                </span>
                {miniRow}
              </div>
            ))}
          </div>
        </section>

        {/* ── Light e Dark ─────────────────────────────────────────────────── */}
        <section className="space-y-4 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{t('modes.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('modes.subtitle')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {MODES.map((mode) => (
              <div
                key={mode.key}
                className={`${temaAtivo}${mode.className ? ` ${mode.className}` : ''} bg-background text-foreground rounded-lg border border-border/50 p-4`}
              >
                <span className="block text-sm font-medium text-foreground mb-3">
                  {t(`modes.${mode.key}`)}
                </span>
                {miniRow}
              </div>
            ))}
          </div>
        </section>

        {/* ── Densidade e Fontes ───────────────────────────────────────────── */}
        <section className="space-y-6 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{t('axes.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('axes.subtitle')}</p>
          </div>

          {/* Densidade — tabela 3×3 dentro de cada escopo densidade-*. Os
              paddings/alturas tokenizados da Table escalam com --spacing-base,
              demonstrando o eixo sem a ambiguidade de "tamanho de botão". */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">{t('axes.density.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('axes.density.subtitle')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {DENSITY_ITEMS.map((item) => {
                const dData = (themeColorsTranslations as Record<string, any>)[locale].axes.density as {
                  tableCols: string[]; tableRows: string[][];
                };
                return (
                  <div key={item.key} className="rounded-lg border border-border/50 p-4 space-y-3">
                    <span className="block text-xs text-muted-foreground">
                      {t(`axes.density.items.${item.key}`)}
                    </span>
                    <div className={item.className}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {dData.tableCols.map((col, i) => <TableHead key={i}>{col}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dData.tableRows.map((row, r) => (
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
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">{t('axes.fonts.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('axes.fonts.subtitle')}</p>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {FONT_ITEMS.map((item) => (
                <div key={item.key} className="rounded-lg border border-border/50 p-4 space-y-3">
                  <span className="block text-xs text-muted-foreground">
                    {t(`axes.fonts.items.${item.key}`)}
                  </span>
                  <div className={item.className}>
                    {/* font-family inline: o span precisa USAR var(--font-family-active)
                        para o escopo .fonte-* deste card valer (caso contrário
                        herda a fonte já resolvida do <body>). */}
                    <span className="text-2xl text-foreground" style={{ fontFamily: 'var(--font-family-active)' }}>
                      Aa Bb Cc 123
                    </span>
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
