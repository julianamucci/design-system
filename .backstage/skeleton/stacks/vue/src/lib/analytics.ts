/**
 * Camada de analytics para o Design System.
 * Envia eventos para o Google Analytics 4 (Measurement ID: G-K0BQWVR1RG).
 *
 * Uso:
 *   import { track } from '@/lib/analytics';
 *   track('language_switched', { previous_language: 'pt-BR', new_language: 'en' });
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
  /** Disparado quando o usuário troca o idioma da documentação. */
  language_switched: {
    previous_language: Locale;
    new_language: Locale;
    /** Componente cujos docs estavam abertos no momento da troca. */
    component_name?: string;
  };

  /** Disparado quando uma nova seção da doc entra no viewport. */
  docs_section_viewed: {
    section_id: string;
    component_name: string;
    locale: Locale;
  };

  /** Disparado na montagem de cada página de documentação. */
  docs_page_view: {
    component_name: string;
    locale: Locale;
    page_title: string;
  };

  /** Disparado quando o usuário aciona um botão rastreado. */
  button_click: {
    component: string;
    variant?: string;
    label?: string;
    location?: string;
  };

  /** Disparado quando o usuário abre um item do Accordion. */
  accordion_expand: {
    component: string;
    label?: string;
    location?: string;
  };

  /** Disparado quando o usuário fecha um item do Accordion. */
  accordion_collapse: {
    component: string;
    label?: string;
    location?: string;
  };
}

// ─── Função pública ───────────────────────────────────────────────────────────

/**
 * Envia um evento GA4 tipado.
 * No-op silencioso se `window.gtag` não estiver disponível (ex: SSR, bloqueador de ads).
 */
export function track<T extends keyof AnalyticsEvents>(
  event: T,
  params: AnalyticsEvents[T],
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params as Record<string, unknown>);
}
