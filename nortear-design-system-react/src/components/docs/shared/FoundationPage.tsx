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
 * (<code>, <strong>, <em>, <kbd>) são renderizadas via DOMPurify.sanitize.
 *
 * Páginas com renderização visual adicional (tipografia, spacing, elevação,
 * motion) passam `extraSection` para acrescentar specimens ao topo.
 */

import { useEffect, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
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
import DOMPurify from 'dompurify';

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
// `specimens` é renderizado pela própria página via `extraSection` (visual custom).
const META_KEYS = new Set([
  'title',
  'category',
  'type',
  'description',
  'seo',
  'nav',
  'specimens',
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
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
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

// Chaves candidatas a título e a corpo de um card (na ordem de preferência).
const TITLE_KEYS = ['title', 'name', 'label'] as const;
const BODY_KEYS = ['body', 'description', 'usage', 'use', 'text'] as const;

/** Extrai título, corpo e campos extras de um item objeto para montar um Card. */
function cardParts(item: Record<string, unknown>) {
  const titleKey = TITLE_KEYS.find((k) => typeof item[k] === 'string');
  const bodyKey = BODY_KEYS.find((k) => typeof item[k] === 'string');
  const extras = Object.entries(item).filter(
    ([k, v]) => typeof v === 'string' && k !== titleKey && k !== bodyKey,
  ) as Array<[string, string]>;
  return {
    title: titleKey ? (item[titleKey] as string) : '',
    body: bodyKey ? (item[bodyKey] as string) : '',
    extras,
  };
}

/**
 * Renderiza objeto/array de items.
 * - Itens objeto → grid fixo de 2 colunas de <Card> (título + descrição + extras).
 * - Itens string → lista vertical simples.
 */
function SectionItems({ items }: { items: unknown }) {
  const entries: Array<[string, unknown]> = Array.isArray(items)
    ? items.map((v, i) => [String(i), v])
    : isPlainObject(items)
    ? Object.entries(items)
    : [];

  const hasCards = entries.some(([, v]) => isPlainObject(v));

  if (!hasCards) {
    return (
      <ul className="nds-stack nds-list-none" data-spacing="md">
        {entries.map(([key, item]) => (
          <li
            key={key}
            className="nds-text-body nds-leading-relaxed nds-accent-start"
          >
            <HtmlText html={String(item)} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="nds-grid" data-cols="2" data-fixed="true" data-spacing="md">
      {entries.map(([key, item]) => {
        const { title, body, extras } = isPlainObject(item)
          ? cardParts(item)
          : { title: '', body: String(item), extras: [] as Array<[string, string]> };
        return (
          <Card key={key}>
            <CardHeader>
              {title && (
                <CardTitle
                  as="h3"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
                />
              )}
              {body && (
                <CardDescription
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
                />
              )}
            </CardHeader>
            {extras.length > 0 && (
              <CardContent className="nds-stack" data-spacing="xs">
                {extras.map(([k, v]) => (
                  <p
                    key={k}
                    className="nds-text-caption nds-text-muted-foreground nds-m-0"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v) }}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
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

  // Chaves string soltas (ex.: passos de instalação `cloneTitle`/`cloneCode`/
  // `installNote`): `*Title` → h3, `*Code` → bloco de código, resto → parágrafo.
  const looseStrings = Object.entries(data).filter(
    ([k, v]) =>
      typeof v === 'string' &&
      !['title', 'subtitle', 'body', 'audience', 'note'].includes(k),
  ) as Array<[string, string]>;

  return (
    <section className="nds-stack nds-docs-section-divider" data-spacing="md">
      {(title || subtitle) && (
        <div className="nds-stack" data-spacing="xs">
          {title && (
            <h2 className="nds-text-h2 nds-text-foreground">
              <HtmlText html={title} />
            </h2>
          )}
          {subtitle && (
            <HtmlText
              as="p"
              html={subtitle}
              className="nds-text-body nds-leading-relaxed"
            />
          )}
        </div>
      )}

      {body && (
        <HtmlText
          as="p"
          html={body}
          className="nds-text-body nds-leading-relaxed"
        />
      )}

      {audience && (
        <HtmlText
          as="p"
          html={audience}
          className="nds-text-body nds-leading-relaxed"
        />
      )}

      {looseStrings.map(([k, v]) =>
        k.endsWith('Title') ? (
          <h3 key={k} className="nds-text-h3 nds-text-foreground">
            <HtmlText html={v} />
          </h3>
        ) : k.endsWith('Code') ? (
          <div key={k} className="nds-docs-code">
            <HtmlText html={v} className="nds-whitespace-pre" />
          </div>
        ) : (
          <HtmlText
            key={k}
            as="p"
            html={v}
            className="nds-text-body nds-leading-relaxed"
          />
        ),
      )}

      {cols && rows !== undefined && <SectionTable cols={cols} rows={rows} />}

      {items !== undefined && <SectionItems items={items} />}

      {fallbackItems && <SectionItems items={fallbackItems} />}

      {keys !== undefined && <SectionItems items={keys} />}

      {rules !== undefined && <SectionItems items={rules} />}

      {note && (
        <div className="nds-rounded-md nds-border-soft nds-bg-muted-30 nds-p-4">
          <HtmlText
            as="p"
            html={note}
            className="nds-text-caption nds-text-muted-foreground nds-leading-relaxed"
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
    <div className="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
      <div className="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto" data-spacing="xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="nds-stack nds-pb-8">
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

          <h1 className="nds-text-h1 nds-text-foreground">
            {t('title')}
          </h1>

          <HtmlText
            as="p"
            html={t('description')}
            className="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose"
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
