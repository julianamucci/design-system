import { useState, useMemo, useEffect, useCallback, type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import { Check, Package, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import iconsTranslations from '@shared/content/icons/translations.json';

// ─── Catálogo de ícones ──────────────────────────────────────────────────────

const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter((name) => {
  const value = (LucideIcons as Record<string, unknown>)[name];
  const type = typeof value;
  return (
    (type === 'function' || type === 'object') &&
    value !== null &&
    /^[A-Z]/.test(name) &&
    !name.endsWith('Icon')
  );
});

// ─── Componente ──────────────────────────────────────────────────────────────

export function IconsDocs() {
  const { t, locale } = useTranslation(iconsTranslations);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // ─── SEO ────────────────────────────────────────────────────────────────
  useSeoEffect({
    title: `${t('title')} — ${t('category')}`,
    description: t('description'),
    locale,
    componentSlug: 'icons',
  });

  // ─── Analytics — page view ───────────────────────────────────────────────
  useEffect(() => {
    track('docs_page_view', {
      component_name: 'icons',
      locale,
      page_title: `${t('title')} · Design System`,
    });
  }, [locale, t]);

  // ─── Filtro ──────────────────────────────────────────────────────────────
  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/[\s\-_]+/g, '');
    if (!q) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((name) =>
      name.toLowerCase().replace(/[\s\-_]+/g, '').includes(q)
    );
  }, [search]);

  // ─── Copiar ──────────────────────────────────────────────────────────────
  const handleCopy = useCallback((name: string) => {
    navigator.clipboard
      .writeText(name)
      .then(() => {
        setCopied(name);
        setTimeout(() => setCopied(null), 1500);
      })
      .catch(() => {});
  }, []);

  // ─── Texto interpolado ───────────────────────────────────────────────────
  const iconsAvailableText = t('iconsAvailable').replace('{count}', String(ALL_ICON_NAMES.length));
  const searchCountText = search.trim()
    ? t('search.results')
        .replace('{count}', String(filteredNames.length))
        .replace('{plural}', filteredNames.length !== 1 ? 's' : '')
        .replace('{query}', search)
    : t('search.count').replace('{count}', String(filteredNames.length));

  return (
    <div className="sb-unstyled flex-1 h-full overflow-auto ds-docs">
      <div className="p-8 max-w-6xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="space-y-4 border-b border-border/50 pb-8">
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

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs font-mono border border-border/50 text-muted-foreground">
              <Package className="h-3 w-3" aria-hidden="true" />
              lucide-react
            </span>
            <span className="text-sm text-muted-foreground/70">
              {iconsAvailableText}
            </span>
          </div>
        </header>

        {/* ── Como usar ────────────────────────────────────────────────────── */}
        <section className="space-y-6 border-t border-border/50 pt-8">
          <h2 className="text-xl font-semibold text-foreground">{t('howToUse.title')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('howToUse.individual.title')}</p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed">
                <code>{`import { Search, Settings, User } from 'lucide-react';\n\n<Search className="h-4 w-4" aria-hidden="true" />`}</code>
              </pre>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('howToUse.sizes.title')}</p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed">
                <code>{`h-3 w-3   // 12px — badges, captions\nh-4 w-4   // 16px — padrão em texto e botões\nh-5 w-5   // 20px — destaque em headers\nh-6 w-6   // 24px — standalone / ilustrativo`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* ── Acessibilidade ───────────────────────────────────────────────── */}
        <section className="space-y-4 border-t border-border/50 pt-8">
          <h2 className="text-xl font-semibold text-foreground">{t('accessibility.title')}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t('accessibility.decorative.title')}
              </p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed">
                <code>{`<Button>\n  <Save className="h-4 w-4" aria-hidden="true" />\n  Salvar\n</Button>`}</code>
              </pre>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t('accessibility.functional.title')}
              </p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed">
                <code>{`<Button\n  size="icon"\n  aria-label="Excluir produto"\n>\n  <Trash2 className="h-4 w-4" aria-hidden="true" />\n</Button>`}</code>
              </pre>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-none p-0 m-0">
            {(['rule1', 'rule2', 'rule3', 'rule4'] as const).map((rule) => (
              <li key={rule} className="flex gap-2 items-start list-none">
                <span className="text-primary mt-0.5 shrink-0">✓</span>
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(t(`accessibility.${rule}`)) }} />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Busca ────────────────────────────────────────────────────────── */}
        <section className="space-y-3 border-t border-border/50 pt-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{t('search.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('search.subtitle')}</p>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input border-input"
              aria-label={t('search.placeholder')}
            />
          </div>
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {searchCountText}
          </p>
        </section>

        {/* ── Galeria ──────────────────────────────────────────────────────── */}
        {filteredNames.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
            role="status"
          >
            <Search className="h-10 w-10 opacity-25" aria-hidden="true" />
            <p className="font-medium">{t('search.noResults')}</p>
            <p className="text-sm opacity-70">{t('search.noResultsSub')}</p>
          </div>
        ) : (
          <ul
            className="grid gap-1 list-none p-0 m-0"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
            aria-label={iconsAvailableText}
          >
            {filteredNames.map((name) => {
              const IconComponent = (
                LucideIcons as unknown as Record<string, ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>>
              )[name];
              const isCopied = copied === name;

              return (
                <li key={name} className="list-none">
                  <button
                    type="button"
                    onClick={() => handleCopy(name)}
                    aria-label={`${t('copy.tooltip')} ${name}`}
                    className="group relative w-full flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors overflow-visible"
                  >
                    <span className="h-6 w-6 flex items-center justify-center relative">
                      <Check
                        className={`absolute h-5 w-5 text-primary transition-opacity ${isCopied ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden="true"
                      />
                      <IconComponent
                        className={`h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors transition-opacity ${isCopied ? 'opacity-0' : 'opacity-100'}`}
                        aria-hidden={true}
                      />
                    </span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight break-all font-mono w-full line-clamp-2">
                      {name}
                    </span>
                    <span
                      className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    >
                      {isCopied ? t('copy.copied') : t('copy.tooltip')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

      </div>
    </div>
  );
}
