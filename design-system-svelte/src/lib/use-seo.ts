/**
 * useSeo — action/helper para meta tags SEO das páginas de documentação.
 * Versão Svelte: expõe uma função imperativa para ser chamada em $effect.
 */

type Locale = 'pt-BR' | 'en' | 'es';

interface SeoProps {
  title: string;
  description: string;
  locale: Locale;
  componentSlug: string;
}

const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const HREFLANG_ATTR = 'data-ds-hreflang';

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
export function applySeo({ title, description, locale, componentSlug }: SeoProps): () => void {
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
    upsertMeta(targetDoc, { name: 'ai:summary' }, description),
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

  const xDefault = targetDoc.createElement('link');
  xDefault.setAttribute('rel', 'alternate');
  xDefault.setAttribute('hreflang', 'x-default');
  xDefault.setAttribute('href', base);
  xDefault.setAttribute(HREFLANG_ATTR, 'true');
  targetDoc.head.appendChild(xDefault);
  hreflangLinks.push(xDefault);

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
  };
}
