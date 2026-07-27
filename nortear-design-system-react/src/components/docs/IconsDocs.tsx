import { useState, useMemo, useEffect, useRef, useCallback, type ComponentType, type CSSProperties } from 'react';
import * as LucideIcons from 'lucide-react';
import { Check, Package, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { mountDocsTracking } from '@/lib/docs-tracking';
import DOMPurify from 'dompurify';
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
    kind: 'guide',
  });

  // ─── Analytics — page view ───────────────────────────────────────────────
  useEffect(() => {
    track('docs_page_view', {
      component_name: 'icons',
      locale,
      page_title: `${t('title')} · Design System`,
    });
  }, [locale, t]);

  // ─── Analytics — cliques (observer data-track*) ──────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return mountDocsTracking(rootRef.current, { componentSlug: 'icons' });
  }, []);

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
    <div
      ref={rootRef}
      className="sb-unstyled nds-flex-1 nds-w-full ds-docs"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        className="nds-p-8 nds-stack"
        data-spacing="xl"
        style={{ maxWidth: '72rem', marginInline: 'auto' }}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header
          className="nds-stack nds-border-b-soft nds-pb-8"
          style={{ paddingBottom: '2rem' }}
        >
          <div className="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
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
            <div className="nds-spacer-start">
              <LanguageSwitcher />
            </div>
          </div>

          <h1 className="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
            {t('title')}
          </h1>

          <p className="nds-text-muted-foreground nds-leading-relaxed" style={{ maxWidth: '48rem' }}>
            {t('description')}
          </p>

          <div
            className="nds-cluster"
            data-spacing="sm"
            data-align="center"
            style={{ paddingTop: '0.25rem' }}
          >
            <span className="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default">
              <Package aria-hidden="true" />
              lucide-react
            </span>
            <span className="nds-text-body nds-text-muted-foreground" style={{ opacity: 0.7 }}>
              {iconsAvailableText}
            </span>
          </div>
        </header>

        {/* ── Como usar ────────────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
          <h2 className="nds-text-h2 nds-text-foreground">{t('howToUse.title')}</h2>
          <div className="nds-grid" data-spacing="md" data-min="18rem">
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-body nds-font-medium">{t('howToUse.individual.title')}</p>
              <pre className="nds-docs-code">
                <code>{`import { Search, Settings, User } from 'lucide-react';\n\n<Search className="nds-icon" aria-hidden="true" />`}</code>
              </pre>
            </div>
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-body nds-font-medium">{t('howToUse.sizes.title')}</p>
              <pre className="nds-docs-code">
                <code>{`h-3 w-3   // 12px — badges, captions\nh-4 w-4   // 16px — padrão em texto e botões\nh-5 w-5   // 20px — destaque em headers\nh-6 w-6   // 24px — standalone / ilustrativo`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* ── Acessibilidade ───────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="md">
          <h2 className="nds-text-h2 nds-text-foreground">{t('accessibility.title')}</h2>
          <div className="nds-grid" data-spacing="sm" data-min="18rem">
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-body nds-font-medium">
                {t('accessibility.decorative.title')}
              </p>
              <pre className="nds-docs-code">
                <code>{`<Button>\n  <Save className="nds-icon" aria-hidden="true" />\n  Salvar\n</Button>`}</code>
              </pre>
            </div>
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-body nds-font-medium">
                {t('accessibility.functional.title')}
              </p>
              <pre className="nds-docs-code">
                <code>{`<Button\n  size="icon"\n  aria-label="Excluir produto"\n>\n  <Trash2 className="nds-icon" aria-hidden="true" />\n</Button>`}</code>
              </pre>
            </div>
          </div>
          <ul
            className="nds-stack nds-text-body nds-text-muted-foreground nds-list-none nds-p-0 nds-m-0"
            data-spacing="xs"
          >
            {(['rule1', 'rule2', 'rule3', 'rule4'] as const).map((rule) => (
              <li key={rule} className="nds-cluster nds-list-none" data-spacing="sm" data-align="start">
                <span className="nds-text-primary nds-shrink-0 nds-mt-0-5">✓</span>
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t(`accessibility.${rule}`)) }} />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Busca ────────────────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="sm">
          <div className="nds-stack" data-spacing="xs">
            <h2 className="nds-text-h2 nds-text-foreground">{t('search.title')}</h2>
            <p className="nds-text-body">{t('search.subtitle')}</p>
          </div>
          <div className="nds-icon-search-wrap">
            <Search className="nds-icon-search-svg" aria-hidden="true" />
            <Input
              type="search"
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingInlineStart: '2.25rem' }}
              aria-label={t('search.placeholder')}
            />
          </div>
          <p
            className="nds-text-body"
            aria-live="polite"
            aria-atomic="true"
          >
            {searchCountText}
          </p>
        </section>

        {/* ── Galeria ──────────────────────────────────────────────────────── */}
        {filteredNames.length === 0 ? (
          <div className="nds-icon-empty-state is-visible" role="status">
            <Search className="nds-icon-empty-state-svg" aria-hidden="true" />
            <p className="nds-font-medium">{t('search.noResults')}</p>
            <p className="nds-text-body" style={{ opacity: 0.7 }}>{t('search.noResultsSub')}</p>
          </div>
        ) : (
          <ul className="nds-icon-grid" aria-label={iconsAvailableText}>
            {filteredNames.map((name) => {
              const IconComponent = (
                LucideIcons as unknown as Record<string, ComponentType<{ className?: string; style?: CSSProperties; 'aria-hidden'?: boolean | 'true' | 'false' }>>
              )[name];
              const isCopied = copied === name;

              return (
                <li key={name} className="nds-icon-grid-item">
                  <button
                    type="button"
                    onClick={() => handleCopy(name)}
                    aria-label={`${t('copy.tooltip')} ${name}`}
                    className="nds-icon-tile"
                  >
                    <span className="nds-icon-tile-svg" style={{ position: 'relative' }}>
                      <Check
                        className="nds-icon-lg nds-text-primary"
                        style={{
                          position: 'absolute',
                          opacity: isCopied ? 1 : 0,
                          transition: 'opacity var(--duration-fast)',
                        }}
                        aria-hidden="true"
                      />
                      <IconComponent
                        className="nds-icon-lg"
                        style={{
                          opacity: isCopied ? 0 : 1,
                          transition: 'opacity var(--duration-fast)',
                        }}
                        aria-hidden={true}
                      />
                    </span>
                    <span className="nds-icon-tile-name">
                      {name}
                    </span>
                    <span
                      className="nds-icon-tile-tooltip"
                      style={{ opacity: isCopied ? 1 : 0 }}
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
