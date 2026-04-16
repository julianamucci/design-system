import { watchEffect, type Ref, type ComputedRef } from 'vue';

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

/**
 * Accepts either a plain SeoProps object or a ComputedRef/Ref wrapping SeoProps.
 * watchEffect re-runs automatically whenever any reactive dependency changes.
 */
export function useSeoEffect(propsOrRef: SeoProps | ComputedRef<SeoProps> | Ref<SeoProps>): void {
  watchEffect((onCleanup) => {
    // Unwrap reactive ref if needed
    const props = 'value' in propsOrRef ? propsOrRef.value : propsOrRef;
    const { title, description, locale, componentSlug } = props;

    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    const fullTitle = `${title} · Design System`;

    const prevTitle = targetDoc.title;
    const prevLang = targetDoc.documentElement.lang;

    targetDoc.title = fullTitle;
    targetDoc.documentElement.lang = locale;

    // Meta tags
    const metas = [
      { name: 'description', content: description },
      { name: 'ai:summary',  content: description },
      { property: 'og:title',       content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:locale',      content: locale.replace('-', '_') },
    ];

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

    onCleanup(() => {
      targetDoc.title = prevTitle;
      targetDoc.documentElement.lang = prevLang;
      managed.forEach(({ el, prev, isNew }) => {
        if (isNew) el.remove(); else if (prev !== null) el.setAttribute('content', prev);
      });
      hreflangLinks.forEach(el => el.remove());
    });
  });
}
