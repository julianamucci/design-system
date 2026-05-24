/**
 * useSeoEffect — hook compartilhado para meta tags SEO das páginas de documentação.
 *
 * Gerencia dinamicamente por idioma:
 *  - <title> e <html lang>
 *  - <meta name="description"> e <meta name="ai:summary">
 *  - Open Graph: og:title, og:description, og:locale, og:url (canônica com ?lang=)
 *  - <link rel="alternate" hreflang="..."> para pt-BR, en, es e x-default
 *
 * Limpa todos os elementos adicionados no cleanup do efeito.
 */

import { useEffect } from 'react';
import { track } from './analytics';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Locale = 'pt-BR' | 'en' | 'es';

/** Entrada do breadcrumb para JSON-LD Schema.org BreadcrumbList.
 *  Item atual (página visível): omitir `item`. Itens anteriores: `name` + `item` (URL absoluta). */
export interface BreadcrumbEntry {
  name: string;
  item?: string;
}

interface SeoProps {
  /** Título do componente, sem o sufixo "· Design System". */
  title: string;
  /** Descrição para meta description e og:description. */
  description: string;
  /** Locale ativo. */
  locale: Locale;
  /** Slug único do componente (ex: "button", "alert-dialog"). Usado na URL canônica. */
  componentSlug: string;
  /** Caminho navegacional para JSON-LD BreadcrumbList (rich snippets). */
  breadcrumb?: BreadcrumbEntry[];
  /** Resumo para LLMs (GEO). Se ausente, faz fallback para `description`. */
  aiSummary?: string;
  /** Entidades nomeadas (lista CSV) para LLMs (GEO). */
  aiEntities?: string;
  /** Intenção/uso primário para LLMs (GEO). */
  aiIntent?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];

/** Atributo sentinela para identificar os <link hreflang> injetados por este hook. */
const HREFLANG_ATTR = 'data-ds-hreflang';

/** Atributo sentinela para identificar o <script> JSON-LD BreadcrumbList injetado. */
const BREADCRUMB_JSONLD_ATTR = 'data-ds-breadcrumb-jsonld';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Constrói a URL canônica para um idioma, adicionando ?lang= ao href atual. */
function buildLangUrl(base: string, lang: string): string {
  try {
    const url = new URL(base);
    url.searchParams.set('lang', lang);
    return url.toString();
  } catch {
    return `${base}?lang=${lang}`;
  }
}

/** Garante que um <meta> exista no documento e retorna os dados para cleanup. */
function upsertMeta(
  doc: Document,
  attrs: { name?: string; property?: string },
  content: string,
): { el: HTMLMetaElement; prevContent: string | null; isNew: boolean } {
  const selector = attrs.name
    ? `meta[name="${attrs.name}"]`
    : `meta[property="${attrs.property}"]`;

  let el = doc.querySelector<HTMLMetaElement>(selector);
  let isNew = false;

  if (!el) {
    el = doc.createElement('meta');
    if (attrs.name) el.setAttribute('name', attrs.name);
    if (attrs.property) el.setAttribute('property', attrs.property);
    doc.head.appendChild(el);
    isNew = true;
  }

  const prevContent = el.getAttribute('content');
  el.setAttribute('content', content);
  return { el, prevContent, isNew };
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSeoEffect({ title, description, locale, componentSlug, breadcrumb, aiSummary, aiEntities, aiIntent }: SeoProps): void {
  useEffect(() => {
    // Defensive: algumas docs pages importam objetos `locale` de libs externas
    // (ex: ptBR de react-day-picker). Normaliza para string BCP 47.
    const localeStr: string = typeof locale === 'string'
      ? locale
      : (locale as { code?: string } | undefined)?.code ?? 'pt-BR';
    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    const fullTitle = `${title} · Design System`;

    // ── Salva estado anterior para cleanup ────────────────────────────────
    const prevTitle = targetDoc.title;
    const prevLang = targetDoc.documentElement.lang;

    // ── Title + lang ──────────────────────────────────────────────────────
    targetDoc.title = fullTitle;
    targetDoc.documentElement.lang = localeStr;

    // ── Meta tags ─────────────────────────────────────────────────────────
    const managedMeta = [
      upsertMeta(targetDoc, { name: 'description' }, description),
      upsertMeta(targetDoc, { name: 'ai:summary' }, aiSummary ?? description),
      upsertMeta(targetDoc, { property: 'og:title' }, fullTitle),
      upsertMeta(targetDoc, { property: 'og:description' }, description),
      upsertMeta(targetDoc, { property: 'og:locale' }, localeStr.replace('-', '_')),
      upsertMeta(
        targetDoc,
        { property: 'og:url' },
        buildLangUrl(
          `${targetWin.location.origin}${targetWin.location.pathname}?component=${componentSlug}`,
          localeStr,
        ),
      ),
    ];

    if (aiEntities) {
      managedMeta.push(upsertMeta(targetDoc, { name: 'ai:entities' }, aiEntities));
    }
    if (aiIntent) {
      managedMeta.push(upsertMeta(targetDoc, { name: 'ai:intent' }, aiIntent));
    }

    // ── Hreflang links ────────────────────────────────────────────────────
    // Remove links anteriores deste hook para evitar duplicatas entre idiomas.
    targetDoc.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach((el) => el.remove());

    const hreflangLinks: HTMLLinkElement[] = [];

    const addHreflang = (lang: string, href: string) => {
      const link = targetDoc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', href);
      link.setAttribute(HREFLANG_ATTR, 'true');
      targetDoc.head.appendChild(link);
      hreflangLinks.push(link);
    };

    const base = `${targetWin.location.origin}${targetWin.location.pathname}?component=${componentSlug}`;
    SUPPORTED_LOCALES.forEach((lang) => addHreflang(lang, buildLangUrl(base, lang)));
    addHreflang('x-default', base); // x-default aponta para a URL sem lang (pt-BR padrão)

    // ── JSON-LD BreadcrumbList (Schema.org) ───────────────────────────────
    // Gera rich snippets de trilha navegacional no Google. Item sem `item` = página atual.
    targetDoc.querySelectorAll(`script[${BREADCRUMB_JSONLD_ATTR}]`).forEach((el) => el.remove());
    let breadcrumbScript: HTMLScriptElement | null = null;
    if (breadcrumb && breadcrumb.length > 0) {
      const itemListElement = breadcrumb.map((entry, i) => {
        const node: Record<string, unknown> = {
          '@type': 'ListItem',
          position: i + 1,
          name: entry.name,
        };
        if (entry.item) node.item = entry.item;
        return node;
      });
      breadcrumbScript = targetDoc.createElement('script');
      breadcrumbScript.setAttribute('type', 'application/ld+json');
      breadcrumbScript.setAttribute(BREADCRUMB_JSONLD_ATTR, 'true');
      breadcrumbScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      });
      targetDoc.head.appendChild(breadcrumbScript);
    }

    // ── GA4 page_view ─────────────────────────────────────────────────────
    // Dispara um page_view no GA4 do manager a cada troca de título/locale.
    // Sem isso, o GA4 só vê a URL inicial do manager e nada das stories.
    track('page_view', {
      page_location: targetWin.location.href,
      page_title: fullTitle,
      component_name: componentSlug,
      locale: localeStr as 'pt-BR' | 'en' | 'es',
    });

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      targetDoc.title = prevTitle;
      targetDoc.documentElement.lang = prevLang;
      managedMeta.forEach(({ el, prevContent, isNew }) => {
        if (isNew) {
          el.remove();
        } else if (prevContent !== null) {
          el.setAttribute('content', prevContent);
        }
      });
      hreflangLinks.forEach((el) => el.remove());
      if (breadcrumbScript) breadcrumbScript.remove();
    };
  }, [title, description, locale, componentSlug, breadcrumb, aiSummary, aiEntities, aiIntent]);
}
