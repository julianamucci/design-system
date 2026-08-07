/**
 * applySeo — função imperativa para meta tags SEO das páginas de documentação.
 * Versão Vanilla JS: retorna cleanup, deve ser chamada com re-invoke manual em locale change.
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
  /** Resumo denso (GEO) — vira `abstract` do JSON-LD TechArticle. */
  aiSummary?: string;
  /** Entidades nomeadas em CSV (GEO) — viram `about` do JSON-LD TechArticle. */
  aiEntities?: string;
  /** Tipo da página: componente (emite SoftwareSourceCode) ou guia. Default: 'component'. */
  kind?: 'component' | 'guide';
}

const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const HREFLANG_ATTR = 'data-ds-hreflang';
const BREADCRUMB_JSONLD_ATTR = 'data-ds-breadcrumb-jsonld';
const DOCS_JSONLD_ATTR = 'data-ds-docs-jsonld';

const ORG_NAME = 'Nortear';
const REPO_URL = 'https://github.com/julianamucci/design-system';
const RUNTIME_PLATFORM = 'Web (Vanilla TS)';

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

export function applySeo({ title, description, locale, componentSlug, breadcrumb, aiSummary, aiEntities, kind = 'component' }: SeoProps): () => void {
  const isIframe = window.self !== window.top;
  const targetDoc = isIframe ? window.parent.document : document;
  const targetWin = isIframe ? window.parent : window;

  const fullTitle = `${title} · Design System`;
  const prevTitle = targetDoc.title;
  // ── Idioma: nos DOIS documentos ───────────────────────────────────────
  // Metatag descreve a página hospedeira e fica no pai. O lang descreve o
  // documento em que o texto está, e quem o lê é o leitor de tela — dentro
  // do Storybook, o iframe, que o template serve como lang="en". Escrever só
  // no pai deixava a prosa em português com pronúncia inglesa (WCAG 3.1.1).
  const langDocs = isIframe ? [targetDoc, document] : [document];
  const prevLangs = langDocs.map((doc) => doc.documentElement.lang);

  targetDoc.title = fullTitle;
  langDocs.forEach((doc) => { doc.documentElement.lang = locale; });

  const managedMeta = [
    upsertMeta(targetDoc, { name: 'description' }, description),
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

  // ── JSON-LD TechArticle + SoftwareSourceCode (Schema.org) ───────────────
  // aiSummary vira `abstract`; aiEntities vira `about`. SoftwareSourceCode
  // só em páginas de componente.
  targetDoc.querySelectorAll(`script[${DOCS_JSONLD_ATTR}]`).forEach((el) => el.remove());
  const canonicalUrl = buildLangUrl(base, locale);
  const article: Record<string, unknown> = {
    '@type': 'TechArticle',
    headline: fullTitle,
    description,
    inLanguage: locale,
    mainEntityOfPage: canonicalUrl,
    author: { '@type': 'Organization', name: ORG_NAME },
    publisher: { '@type': 'Organization', name: ORG_NAME },
  };
  if (aiSummary) article.abstract = aiSummary;
  if (aiEntities) article.about = aiEntities.split(',').map((e) => e.trim()).filter(Boolean);
  const graph: Array<Record<string, unknown>> = [article];
  if (kind === 'component') {
    graph.push({
      '@type': 'SoftwareSourceCode',
      name: fullTitle,
      description,
      programmingLanguage: 'TypeScript',
      runtimePlatform: RUNTIME_PLATFORM,
      codeRepository: REPO_URL,
      url: canonicalUrl,
    });
  }
  const docsJsonldScript = targetDoc.createElement('script');
  docsJsonldScript.setAttribute('type', 'application/ld+json');
  docsJsonldScript.setAttribute(DOCS_JSONLD_ATTR, 'true');
  docsJsonldScript.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  targetDoc.head.appendChild(docsJsonldScript);

  // ── GA4 page_view ───────────────────────────────────────────────────────
  track('page_view', {
    page_location: targetWin.location.href,
    page_title: fullTitle,
    component_name: componentSlug,
    locale,
  });

  return () => {
    targetDoc.title = prevTitle;
    langDocs.forEach((doc, i) => { doc.documentElement.lang = prevLangs[i]; });
    managedMeta.forEach(({ el, prevContent, isNew }) => {
      if (isNew) el.remove();
      else if (prevContent !== null) el.setAttribute('content', prevContent);
    });
    hreflangLinks.forEach((el) => el.remove());
    if (breadcrumbScript) breadcrumbScript.remove();
    docsJsonldScript.remove();
  };
}
