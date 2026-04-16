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

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Locale = 'pt-BR' | 'en' | 'es';

interface SeoProps {
  /** Título do componente, sem o sufixo "· Design System". */
  title: string;
  /** Descrição para meta description e og:description. */
  description: string;
  /** Locale ativo. */
  locale: Locale;
  /** Slug único do componente (ex: "button", "alert-dialog"). Usado na URL canônica. */
  componentSlug: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];

/** Atributo sentinela para identificar os <link hreflang> injetados por este hook. */
const HREFLANG_ATTR = 'data-ds-hreflang';

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

export function useSeoEffect({ title, description, locale, componentSlug }: SeoProps): void {
  useEffect(() => {
    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    const fullTitle = `${title} · Design System`;
    const canonicalBase = `${targetWin.location.origin}${targetWin.location.pathname}${targetWin.location.search.replace(/[?&]lang=[^&]*/g, '').replace(/^&/, '?')}`;

    // ── Salva estado anterior para cleanup ────────────────────────────────
    const prevTitle = targetDoc.title;
    const prevLang = targetDoc.documentElement.lang;

    // ── Title + lang ──────────────────────────────────────────────────────
    targetDoc.title = fullTitle;
    targetDoc.documentElement.lang = locale;

    // ── Meta tags ─────────────────────────────────────────────────────────
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
    };
  }, [title, description, locale, componentSlug]);
}
