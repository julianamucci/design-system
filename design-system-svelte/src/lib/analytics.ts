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
    component: 'breadcrumb' | 'navigation_menu' | 'sidebar';
    label: string;
    destination: string;
    location?: string;
  };

  /** Disparado ao alternar a sidebar via SidebarTrigger, SidebarRail ou atalho Ctrl+B. */
  sidebar_toggle: {
    action: 'open' | 'close';
    trigger: 'button' | 'rail' | 'keyboard';
  };

  breadcrumb_ellipsis_open: {
    component: 'breadcrumb';
    hidden_count: number;
    location?: string;
  };

  field_change: {
    component: string;
    field_name: string;
    value?: string;
    location?: string;
  };

  dialog_open: {
    component: string;
    label?: string;
    location?: string;
  };

  /** Disparado quando o Dialog fecha (Escape, overlay, close-button ou ação). */
  dialog_close: {
    component: string;
    label?: string;
    reason?: 'escape' | 'overlay' | 'close-button' | 'action';
    location?: string;
  };

  /** Disparado ao clicar na ação primária do DialogFooter. */
  dialog_action: {
    component: string;
    action_label: string;
    location?: string;
  };

  card_click: {
    component: "card";
    label: string;
    destination?: string;
    location?: string;
  };

  /** Clique em link do DocsNav (sidebar da docs page). */
  docs_nav_click: {
    component: string;
    section_id: string;
    label: string;
  };

  /** Clique em botão/trigger dentro de DocsDemonstration. */
  docs_demo_click: {
    component: string;
    element_id: string;
    label?: string;
  };

  /** Clique em card/botão dentro de DocsVariants. */
  docs_variant_click: {
    component: string;
    variant_name: string;
    label?: string;
  };

  /** Clique em botão copy de blocos de código. */
  docs_code_copy: {
    component: string;
    snippet_id: string;
  };

  /** Clique em card do DocsRelated. */
  docs_related_click: {
    component: string;
    target_slug: string;
    label?: string;
  };

  /** Clique em link externo em notas, UX writing ou qualquer texto. */
  docs_link_click: {
    component: string;
    section_id: string;
    href: string;
  };

  /** Disparado quando o usuário abre ou fecha um Collapsible. */
  collapsible_toggle: {
    label: string;
    value: 'open' | 'closed';
    location?: string;
  };

  /** Disparado quando o slide ativo do Carousel muda (botão, teclado, swipe). */
  slide_change: {
    component: 'carousel';
    index: number;
    total: number;
    trigger: 'button' | 'swipe' | 'keyboard';
    location?: string;
  };

  /** Disparado quando o autoplay do Carousel pausa por interação do usuário. */
  autoplay_paused: {
    component: 'carousel';
    index: number;
    location?: string;
  };

  /** Disparado ao selecionar um item do Command via clique ou Enter. */
  command_item_select: {
    label: string;
    group: string;
    pattern: 'inline' | 'combobox' | 'palette';
  };

  /** Disparado ao abrir o command palette (botão ou atalho Cmd+K). */
  command_palette_open: {
    trigger: 'keyboard' | 'button';
  };

  /** Disparado quando o usuário abre o Context Menu via right-click. */
  menu_open: {
    component: string;
    location?: string;
    menu?: string;
  };

  /** Disparado quando o usuário seleciona um item do Context Menu. */
  menu_item_click: {
    label: string;
    menu: string;
    location?: string;
  };

  /** Disparado ao focar um campo de formulário (apenas funis críticos). */
  field_focus: {
    component: string;
    field_name: string;
    location?: string;
  };

  /** Disparado ao sair de um campo de formulário com valor preenchido. */
  field_blur: {
    component: string;
    field_name: string;
    location?: string;
  };

  /** Disparado ao exibir mensagem de erro em um campo de formulário. */
  field_error: {
    component: string;
    field_name: string;
    error_message?: string;
    location?: string;
  };

  /** Disparado ao clicar no botão de ação interno de um toast (ex: Desfazer). */
  toast_action_click: {
    label: string;
    component: 'toast';
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
