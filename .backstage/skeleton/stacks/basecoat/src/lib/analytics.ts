/**
 * Camada de analytics para o Design System.
 * Envia eventos para o Google Analytics 4 (Measurement ID: G-K0BQWVR1RG).
 */

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type Locale = 'pt-BR' | 'en' | 'es';

interface AnalyticsEvents {
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
  toast_demo_triggered: {
    toast_type: string;
    locale: Locale;
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

  button_click: {
    component: string;
    variant?: string;
    label?: string;
    location?: string;
  };
}

export function track<T extends keyof AnalyticsEvents>(
  event: T,
  params: AnalyticsEvents[T],
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params as Record<string, unknown>);
}
