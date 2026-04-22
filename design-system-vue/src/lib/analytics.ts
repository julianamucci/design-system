/**
 * Camada de analytics para o Design System.
 * Envia eventos para o Google Analytics 4 (Measurement ID: G-K0BQWVR1RG).
 *
 * Arquitetura:
 *   - GA4 é carregado no manager do Storybook (manager-head.html), não no iframe.
 *   - Docs pages rodam em um iframe — `track()` encaminha eventos para `window.top.gtag`.
 *   - `page_location` e `page_title` usam a URL/título do manager para que cada story
 *     apareça como uma página distinta no GA4.
 */

// ─── Extensão do tipo Window ──────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ─── Tipos de evento ──────────────────────────────────────────────────────────

type Locale = 'pt-BR' | 'en' | 'es';

interface AnalyticsEvents {
  page_view: {
    page_location: string;
    page_title: string;
    component_name?: string;
    locale?: Locale;
  };

  language_switched: {
    previous_language: Locale;
    new_language: Locale;
    component_name?: string;
  };

  docs_section_viewed: {
    section_id: string;
    component_name: string;
    locale: Locale;
  };

  docs_page_view: {
    component_name: string;
    locale: Locale;
    page_title: string;
  };

  button_click: {
    component: string;
    variant?: string;
    label?: string;
    location?: string;
  };

  accordion_expand: {
    component: string;
    label?: string;
    location?: string;
  };

  accordion_collapse: {
    component: string;
    label?: string;
    location?: string;
  };

  navigation_click: {
    component: 'breadcrumb' | 'navigation_menu';
    label: string;
    destination: string;
    location?: string;
  };

  breadcrumb_ellipsis_open: {
    component: 'breadcrumb';
    hidden_count: number;
    location?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getManagerGtag(): Window['gtag'] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const managerWin = window.self !== window.top ? window.top : window;
    return managerWin?.gtag;
  } catch {
    return window.gtag;
  }
}

export function getManagerLocation(): string {
  if (typeof window === 'undefined') return '';
  try {
    const managerWin = window.self !== window.top ? window.top : window;
    return managerWin?.location.href ?? '';
  } catch {
    return window.location.href;
  }
}

// ─── Função pública ───────────────────────────────────────────────────────────

export function track<T extends keyof AnalyticsEvents>(
  event: T,
  params: AnalyticsEvents[T],
): void {
  const gtag = getManagerGtag();
  if (typeof gtag !== 'function') return;
  gtag('event', event, params as Record<string, unknown>);
}
