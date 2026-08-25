import { useState, useMemo, useEffect, useRef, useCallback, createElement } from 'react';
import { Package, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { mountDocsTracking } from '@/lib/docs-tracking';
import { DOCS_PAGE_TITLE_ID } from '@/components/docs/shared/sections/DocsHeader';
import DOMPurify from 'dompurify';
import iconsTranslations from '@shared/content/icons/translations.json';
import { CATALOGO_LUCIDE, ICON_NAMES } from '@shared/primitives/lucide-catalog';

// ─── Catálogo de ícones ──────────────────────────────────────────────────────
//
// A geometria vem do catálogo compartilhado, não de `import * as` do
// `lucide-react`: a galeria usa TODOS os ícones, então nada ali é removível e o
// bundle carregava 2003 componentes React (1 263 KB) para desenhar 2003 SVGs
// (595 KB). A medição que embasa a troca está no docblock do catálogo.
//
// O `lucide-react` continua sendo a lib documentada para quem CONSOME o design
// system em React — é dele que saem os dois ícones da própria página.

const ALL_ICON_NAMES = ICON_NAMES;

// ─── Componente ──────────────────────────────────────────────────────────────

export function IconsDocs() {
  const { t, locale } = useTranslation(iconsTranslations);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // ─── SEO ────────────────────────────────────────────────────────────────
  useSeoEffect({
    title: `${t('title')} — ${t('category')}`,
    description: t('description'),
    aiSummary: t('seo.aiSummary'),
    aiEntities: t('seo.aiEntities'),
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
  //
  // A grade nasce inteira e o filtro só liga `is-hidden` — é o que o Vanilla
  // faz, e o Vanilla é a referência de markup. Recriar a lista faria cada tecla
  // digitada destruir e remontar dois mil nós.
  const visibleNames = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/[\s\-_]+/g, '');
    if (!q) return null; // null = nenhum filtro ativo, todos visíveis
    return new Set(
      ALL_ICON_NAMES.filter((name) =>
        name.toLowerCase().replace(/[\s\-_]+/g, '').includes(q)
      )
    );
  }, [search]);

  const visibleCount = visibleNames ? visibleNames.size : ALL_ICON_NAMES.length;
  const hasResults = visibleCount > 0;

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
        .replace('{count}', String(visibleCount))
        .replace('{plural}', visibleCount !== 1 ? 's' : '')
        .replace('{query}', search)
    : t('search.count').replace('{count}', String(visibleCount));

  return (
    <div
      ref={rootRef}
      className="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs"
    >
      {/*
        Landmark de conteúdo: esta página monta layout próprio (não passa pelo
        DocsPageLayout), então ficava sem <main>. Mesmas classes e mesma posição
        na árvore do <div> anterior — zero mudança visual.
      */}
      <main
        tabIndex={-1}
        aria-labelledby={DOCS_PAGE_TITLE_ID}
        className="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
        data-spacing="xl"
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="nds-stack nds-border-b-soft nds-pb-8">
          <div className="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
            <Badge
              variant="default"
              className="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
            >
              {t('category')}
            </Badge>
            <Badge
              variant="info"
              className="nds-text-muted-foreground nds-font-normal"
            >
              {t('type')}
            </Badge>
            <div className="nds-spacer-start">
              <LanguageSwitcher />
            </div>
          </div>

          <h1
            id={DOCS_PAGE_TITLE_ID}
            className="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground"
          >
            {t('title')}
          </h1>

          <p className="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose">
            {t('description')}
          </p>

          <div className="nds-cluster" data-spacing="sm" data-align="center">
            <span className="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default">
              <Package aria-hidden="true" />
              lucide-react
            </span>
            {/* Sem opacity extra: --muted-foreground já é o tom secundário, e o
                0.7 derrubava o contraste para 3.03:1 (axe: color-contrast). */}
            <span className="nds-text-body nds-text-muted-foreground">
              {iconsAvailableText}
            </span>
          </div>
        </header>

        {/* ── Como usar ────────────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="lg">
          <h2 className="nds-text-h2 nds-text-foreground">{t('howToUse.title')}</h2>
          {/* data-cols="2" no lugar de `--grid-min: 18rem` inline: o atributo
              existe na folha e produz a mesma coluna mínima, sem style inline
              e com o mesmo resultado nas cinco stacks. */}
          <div className="nds-grid" data-spacing="md" data-cols="2">
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-body nds-font-medium">{t('howToUse.individual.title')}</p>
              <pre className="nds-docs-code">
                <code>{`import { Search, Settings, User } from 'lucide-react';\n\n<Search className="nds-icon" aria-hidden="true" />`}</code>
              </pre>
            </div>
            <div className="nds-stack" data-spacing="sm">
              <p className="nds-text-body nds-font-medium">{t('howToUse.sizes.title')}</p>
              <pre className="nds-docs-code">
                <code>{`nds-icon-sm   // 14px — badges, captions\nnds-icon      // 16px — padrão em texto e botões\nnds-icon-lg   // 20px — destaque em headers`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* ── Acessibilidade ───────────────────────────────────────────────── */}
        <section className="nds-stack nds-docs-section-divider" data-spacing="md">
          <h2 className="nds-text-h2 nds-text-foreground">{t('accessibility.title')}</h2>
          <div className="nds-grid" data-spacing="sm" data-cols="2">
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
                <span className="nds-text-primary nds-shrink-0 nds-mt-0-5" aria-hidden="true">✓</span>
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
            {/* `nds-input` + modificador, o mesmo markup das outras stacks: o
                recuo do ícone é da folha, não de style inline. */}
            <input
              type="search"
              className="nds-input nds-icon-search-input"
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        <div
          className={`nds-icon-empty-state${hasResults ? '' : ' is-visible'}`}
          role="status"
        >
          <Search className="nds-icon-empty-state-svg" aria-hidden="true" />
          <p className="nds-font-medium">{t('search.noResults')}</p>
          <p className="nds-text-body nds-text-muted-foreground">{t('search.noResultsSub')}</p>
        </div>

        <ul
          className={`nds-icon-grid${hasResults ? '' : ' is-hidden'}`}
          aria-label={iconsAvailableText}
        >
          {ALL_ICON_NAMES.map((name) => {
            const isCopied = copied === name;
            const isHidden = visibleNames !== null && !visibleNames.has(name);

            return (
              <li
                key={name}
                className={`nds-icon-grid-item${isHidden ? ' is-hidden' : ''}`}
                data-icon-name={name}
              >
                <button
                  type="button"
                  onClick={() => handleCopy(name)}
                  aria-label={`${t('copy.tooltip')} ${name}`}
                  className="nds-icon-tile"
                >
                  <span className="nds-icon-tile-svg">
                    {/* Elementos React a partir da geometria — sem innerHTML e
                        sem componente por ícone. As tags e atributos do lucide
                        são um conjunto fechado (path, circle, line…; d, cx, r…)
                        e nenhum deles precisa de camelCase. */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="nds-icon-lg"
                      aria-hidden="true"
                    >
                      {CATALOGO_LUCIDE[name].map(([tag, attrs], i) =>
                        createElement(tag, { ...attrs, key: `${tag}-${i}` })
                      )}
                    </svg>
                  </span>
                  <span className="nds-icon-tile-name">
                    {name}
                  </span>
                  <span
                    className={`nds-icon-tile-tooltip${isCopied ? ' is-visible' : ''}`}
                    aria-hidden="true"
                  >
                    {isCopied ? t('copy.copied') : t('copy.tooltip')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

      </main>
    </div>
  );
}
