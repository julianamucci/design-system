/**
 * useSeo — action/helper para meta tags SEO das páginas de documentação.
 * Versão Svelte: expõe uma função imperativa para ser chamada em $effect.
 */

import { track } from './analytics';

type Locale = 'pt-BR' | 'en' | 'es';

export interface BreadcrumbEntry {
  name: string;
  item?: string;
}

interface SeoProps {
  title: string;
  description: string;
  locale: Locale;
  componentSlug: string;
  breadcrumb?: BreadcrumbEntry[];
  aiSummary?: string;
  aiEntities?: string;
  aiIntent?: string;
}

const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const HREFLANG_ATTR = 'data-ds-hreflang';
const BREADCRUMB_JSONLD_ATTR = 'data-ds-breadcrumb-jsonld';

function buildLangUrl(base: string, lang: string): string {
  try {
    const url = new URL(base);
    url.searchParams.set('lang', lang);
    return url.toString();
  } catch {
    return `${base}?lang=${lang}`;
  }
}

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

/**
 * Aplica SEO e retorna uma função de cleanup.
 * Usar dentro de $effect(() => { return applySeo({...}); })
 */
export function applySeo({ title, description, locale, componentSlug, breadcrumb, aiSummary, aiEntities, aiIntent }: SeoProps): () => void {
  const isIframe = window.self !== window.top;
  const targetDoc = isIframe ? window.parent.document : document;
  const targetWin = isIframe ? window.parent : window;

  const fullTitle = `${title} · Design System`;
  const prevTitle = targetDoc.title;
  const prevLang = targetDoc.documentElement.lang;

  targetDoc.title = fullTitle;
  targetDoc.documentElement.lang = locale;

  const managedMeta = [
    upsertMeta(targetDoc, { name: 'description' }, description),
    upsertMeta(targetDoc, { name: 'ai:summary' }, aiSummary ?? description),
    upsertMeta(targetDoc, { property: 'og:title' }, fullTitle),
    upsertMeta(targetDoc, { property: 'og:description' }, description),
    upsertMeta(targetDoc, { property: 'og:locale' }, locale.replace('-', '_')),
    upsertMeta(
      targetDoc,
      { property: 'og:url' },
      buildLangUrl(
        `${targetWin.location.origin}${targetWin.location.pathname}?component=${componentSlug}`,
        locale,
      ),
    ),
  ];

  if (aiEntities) {
    managedMeta.push(upsertMeta(targetDoc, { name: 'ai:entities' }, aiEntities));
  }
  if (aiIntent) {
    managedMeta.push(upsertMeta(targetDoc, { name: 'ai:intent' }, aiIntent));
  }

  targetDoc.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach((el) => el.remove());

  const hreflangLinks: HTMLLinkElement[] = [];
  const base = `${targetWin.location.origin}${targetWin.location.pathname}?component=${componentSlug}`;

  SUPPORTED_LOCALES.forEach((lang) => {
    const link = targetDoc.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', lang);
    link.setAttribute('href', buildLangUrl(base, lang));
    link.setAttribute(HREFLANG_ATTR, 'true');
    targetDoc.head.appendChild(link);
    hreflangLinks.push(link);
  });

  const xDefault = targetDoc.createElement('link');
  xDefault.setAttribute('rel', 'alternate');
  xDefault.setAttribute('hreflang', 'x-default');
  xDefault.setAttribute('href', base);
  xDefault.setAttribute(HREFLANG_ATTR, 'true');
  targetDoc.head.appendChild(xDefault);
  hreflangLinks.push(xDefault);

  // ── JSON-LD BreadcrumbList (Schema.org) ─────────────────────────────────
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

  // ── GA4 page_view ───────────────────────────────────────────────────────
  track('page_view', {
    page_location: targetWin.location.href,
    page_title: fullTitle,
    component_name: componentSlug,
    locale,
  });

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
}
