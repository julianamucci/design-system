/**
 * FoundationPage — renderer genérico para páginas Foundations.
 *
 * Lê o dicionário do locale ativo e renderiza recursivamente seções no padrão
 * do projeto: header (badges + título + descrição + LanguageSwitcher) seguido
 * de seções iteradas a partir das chaves top-level do JSON, excluindo metadados
 * (`title`, `category`, `type`, `description`, `seo`, `nav`).
 *
 * Cada seção pode ter: `title`, `subtitle`, `body`, `audience`, `note`,
 * `items` (objeto/array), `rows` (objeto/array), `cols` (cabeçalho de tabela),
 * `rules` (objeto/array), `keys` (objeto/array). Strings com HTML inline
 * (<code>, <strong>, <em>, <kbd>) são renderizadas via sanitizeHtml.
 *
 * Páginas com renderização visual adicional (tipografia, spacing, elevação,
 * motion) passam `extraSection` para acrescentar specimens ao topo.
 */

import { useEffect, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FoundationPageProps {
  /** Slug usado em translations.json e analytics/SEO. */
  slug: string;
  /** Dicionário trilíngue importado do shared content. */
  translations: Record<string, unknown>;
  /** Specimens visuais opcionais inseridos antes das seções genéricas. */
  extraSection?: ReactNode;
}

// Chaves top-level que não viram seção visível.
const META_KEYS = new Set([
  'title',
  'category',
  'type',
  'description',
  'seo',
  'nav',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Renderiza string que pode conter HTML inline tokenizado. */
function HtmlText({
  as: As = 'span',
  html,
  className,
}: {
  as?: 'span' | 'p' | 'div' | 'li';
  html: string;
  className?: string;
}) {
  return (
    <As
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

// ─── Renderers de partes ──────────────────────────────────────────────────────

/** Renderiza tabela genérica para `{ cols, rows }`. */
function SectionTable({
  cols,
  rows,
}: {
  cols: Record<string, string> | string[];
  rows: unknown;
}) {
  const colKeys = Array.isArray(cols) ? cols.map((_, i) => String(i)) : Object.keys(cols);
  const colLabels = Array.isArray(cols) ? cols : Object.values(cols);

  // rows pode ser:
  //  - objeto { key: { col1: ..., col2: ... } }
  //  - objeto { key: [v1, v2, ...] }
  //  - array de arrays [[v1, v2], [v3, v4]]
  const rowEntries: Array<[string, unknown]> = Array.isArray(rows)
    ? rows.map((r, i) => [String(i), r])
    : isPlainObject(rows)
    ? Object.entries(rows)
    : [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {colLabels.map((label, i) => (
            <TableHead key={i}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowEntries.map(([rowKey, row]) => {
          const cells = Array.isArray(row)
            ? row
            : isPlainObject(row)
            ? colKeys.map((k) => (row as Record<string, unknown>)[k] ?? '')
            : [String(row)];
          return (
            <TableRow key={rowKey}>
              {cells.map((cell, i) => (
                <TableCell key={i}>
                  <HtmlText html={String(cell ?? '')} />
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Renderiza objeto/array de items com `title`+`body` ou strings simples. */
function SectionItems({ items }: { items: unknown }) {
  const entries: Array<[string, unknown]> = Array.isArray(items)
    ? items.map((v, i) => [String(i), v])
    : isPlainObject(items)
    ? Object.entries(items)
    : [];

  return (
    <ul className="space-y-3 list-none p-0 m-0">
      {entries.map(([key, item]) => {
        if (typeof item === 'string') {
          return (
            <li
              key={key}
              className="text-sm text-foreground leading-relaxed pl-4 border-l-2 border-border/60"
            >
              <HtmlText html={item} />
            </li>
          );
        }
        if (isPlainObject(item)) {
          const title = (item.title as string) ?? (item.name as string) ?? '';
          const body =
            (item.body as string) ?? (item.description as string) ?? (item.usage as string) ?? '';
          return (
            <li
              key={key}
              className="rounded-lg border border-border/50 p-4 space-y-1.5"
            >
              {title && (
                <h4 className="text-sm font-semibold text-foreground m-0">
                  <HtmlText html={title} />
                </h4>
              )}
              {body && (
                <HtmlText
                  as="p"
                  html={body}
                  className="text-sm text-muted-foreground leading-relaxed m-0"
                />
              )}
            </li>
          );
        }
        return null;
      })}
    </ul>
  );
}

/** Renderiza uma única seção a partir do objeto top-level. */
function GenericSection({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const subtitle = data.subtitle as string | undefined;
  const body = data.body as string | undefined;
  const audience = data.audience as string | undefined;
  const note = data.note as string | undefined;
  const cols = data.cols as Record<string, string> | string[] | undefined;
  const rows = data.rows;
  const items = data.items;
  const rules = data.rules;
  const keys = data.keys;

  // Casos especiais que viram lista de items:
  // - `levels` (densidades), `divergences` (cross-stack), `languages` (i18n),
  //   `scripts` (start), `metaTags` (seo), etc. — qualquer objeto com sub-objetos
  //   `{ title, body }` é tratado como items quando rows/items não existem.
  const fallbackItems = !items && !rows && !cols
    ? (() => {
        const candidates = Object.entries(data).filter(
          ([k, v]) =>
            !['title', 'subtitle', 'body', 'audience', 'note', 'rules', 'keys'].includes(k) &&
            isPlainObject(v) &&
            ('title' in v || 'name' in v || 'body' in v || 'description' in v),
        );
        if (candidates.length === 0) return undefined;
        return Object.fromEntries(candidates);
      })()
    : undefined;

  return (
    <section className="space-y-4 border-t border-border/50 pt-8">
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-xl font-semibold text-foreground m-0">
              <HtmlText html={title} />
            </h2>
          )}
          {subtitle && (
            <HtmlText
              as="p"
              html={subtitle}
              className="text-sm text-muted-foreground leading-relaxed m-0"
            />
          )}
        </div>
      )}

      {body && (
        <HtmlText
          as="p"
          html={body}
          className="text-sm text-foreground leading-relaxed m-0"
        />
      )}

      {audience && (
        <HtmlText
          as="p"
          html={audience}
          className="text-sm text-muted-foreground leading-relaxed m-0"
        />
      )}

      {cols && rows !== undefined && <SectionTable cols={cols} rows={rows} />}

      {items !== undefined && <SectionItems items={items} />}

      {fallbackItems && <SectionItems items={fallbackItems} />}

      {keys !== undefined && <SectionItems items={keys} />}

      {rules !== undefined && <SectionItems items={rules} />}

      {note && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <HtmlText
            as="p"
            html={note}
            className="text-xs text-muted-foreground leading-relaxed m-0"
          />
        </div>
      )}
    </section>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function FoundationPage({ slug, translations, extraSection }: FoundationPageProps) {
  const { t, locale } = useTranslation(translations);

  useSeoEffect({
    title: t('seo.title', t('title')),
    description: t('seo.description', t('description')),
    locale,
    componentSlug: slug,
    aiSummary: t('seo.aiSummary', ''),
    aiEntities: t('seo.aiEntities', ''),
    aiIntent: t('seo.aiIntent', ''),
  });

  useEffect(() => {
    track('docs_page_view', {
      component_name: slug,
      locale,
      page_title: `${t('title')} · Design System`,
    });
  }, [locale, slug, t]);

  const dict = (translations[locale] ??
    translations['pt-BR'] ??
    {}) as Record<string, unknown>;

  const sectionKeys = Object.keys(dict).filter(
    (k) => !META_KEYS.has(k) && isPlainObject(dict[k]),
  );

  return (
    <div className="sb-unstyled flex-1 h-full overflow-auto ds-docs">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="space-y-4 pb-4">
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

          <h1 className="text-4xl font-bold tracking-tight text-foreground m-0">
            {t('title')}
          </h1>

          <HtmlText
            as="p"
            html={t('description')}
            className="text-muted-foreground max-w-3xl leading-relaxed m-0"
          />
        </header>

        {extraSection}

        {sectionKeys.map((key) => (
          <GenericSection key={key} data={dict[key] as Record<string, unknown>} />
        ))}
      </div>
    </div>
  );
}
