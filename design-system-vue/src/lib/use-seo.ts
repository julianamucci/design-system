import { watchEffect, type Ref, type ComputedRef } from 'vue';
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

/**
 * Accepts either a plain SeoProps object or a ComputedRef/Ref wrapping SeoProps.
 * watchEffect re-runs automatically whenever any reactive dependency changes.
 */
export function useSeoEffect(propsOrRef: SeoProps | ComputedRef<SeoProps> | Ref<SeoProps>): void {
  watchEffect((onCleanup) => {
    // Unwrap reactive ref if needed
    const props = 'value' in propsOrRef ? propsOrRef.value : propsOrRef;
    const { title, description, locale, componentSlug, breadcrumb, aiSummary, aiEntities, aiIntent } = props;

    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    const fullTitle = `${title} · Design System`;

    const prevTitle = targetDoc.title;
    const prevLang = targetDoc.documentElement.lang;

    targetDoc.title = fullTitle;
    targetDoc.documentElement.lang = locale;

    // Meta tags
    const metas: Array<{ name?: string; property?: string; content: string }> = [
      { name: 'description', content: description },
      { name: 'ai:summary',  content: aiSummary ?? description },
      { property: 'og:title',       content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:locale',      content: locale.replace('-', '_') },
    ];
    if (aiEntities) metas.push({ name: 'ai:entities', content: aiEntities });
    if (aiIntent)   metas.push({ name: 'ai:intent',   content: aiIntent });

    const managed: Array<{ el: HTMLMetaElement; prev: string | null; isNew: boolean }> = [];
    for (const m of metas) {
      const sel = m.name ? `meta[name="${m.name}"]` : `meta[property="${m.property}"]`;
      let el = targetDoc.querySelector<HTMLMetaElement>(sel);
      let isNew = false;
      if (!el) { el = targetDoc.createElement('meta'); targetDoc.head.appendChild(el); isNew = true; }
      if (m.name) el.setAttribute('name', m.name);
      else el.setAttribute('property', m.property!);
      const prev = el.getAttribute('content');
      el.setAttribute('content', m.content);
      managed.push({ el, prev, isNew });
    }

    targetDoc.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach(el => (el as HTMLElement).remove());
    const base = `${targetWin.location.origin}${targetWin.location.pathname}?component=${componentSlug}`;
    const hreflangLinks: HTMLLinkElement[] = [];
    [...SUPPORTED_LOCALES, 'x-default'].forEach(lang => {
      const link = targetDoc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', lang === 'x-default' ? base : buildLangUrl(base, lang));
      link.setAttribute(HREFLANG_ATTR, 'true');
      targetDoc.head.appendChild(link);
      hreflangLinks.push(link);
    });

    // ── JSON-LD BreadcrumbList (Schema.org) ───────────────────────────────
    targetDoc.querySelectorAll(`script[${BREADCRUMB_JSONLD_ATTR}]`).forEach(el => (el as HTMLElement).remove());
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
    track('page_view', {
      page_location: targetWin.location.href,
      page_title: fullTitle,
      component_name: componentSlug,
      locale,
    });

    onCleanup(() => {
      targetDoc.title = prevTitle;
      targetDoc.documentElement.lang = prevLang;
      managed.forEach(({ el, prev, isNew }) => {
        if (isNew) el.remove(); else if (prev !== null) el.setAttribute('content', prev);
      });
      hreflangLinks.forEach(el => el.remove());
      if (breadcrumbScript) breadcrumbScript.remove();
    });
  });
}
