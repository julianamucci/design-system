/**
 * Camada de analytics para o Design System.
 * Envia eventos para o Google Analytics 4 (Measurement ID: G-K0BQWVR1RG).
 *
 * Arquitetura:
 *   - GA4 é carregado no manager do Storybook (manager-head.html), não no iframe.
 *   - Docs pages rodam em um iframe — `track()` encaminha eventos para `window.top.gtag`.
 *   - `page_location` e `page_title` usam a URL/título do manager para que cada story
 *     apareça como uma página distinta no GA4.
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
  /** Enviado a cada navegação entre stories/docs. Emitido pelo useSeoEffect. */
  page_view: {
    page_location: string;
    page_title: string;
    component_name?: string;
    locale?: Locale;
  };

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

  /** Disparado quando o usuário clica em um link de navegação (Breadcrumb, NavigationMenu, Sidebar). */
  navigation_click: {
    component: 'breadcrumb' | 'navigation_menu' | 'sidebar';
    label: string;
    destination: string;
    location?: string;
  };

  /** Disparado quando o usuário abre ou fecha a Sidebar via trigger, rail ou atalho de teclado. */
  sidebar_toggle: {
    action: 'open' | 'close';
    trigger: 'button' | 'rail' | 'keyboard';
  };

  /** Disparado quando o usuário abre o DropdownMenu do BreadcrumbEllipsis. */
  breadcrumb_ellipsis_open: {
    component: 'breadcrumb';
    hidden_count: number;
    location?: string;
  };

  /** Disparado quando o valor de um campo de seleção muda (Checkbox, Switch, Select, Calendar, RadioGroup, Slider, Toggle). */
  field_change: {
    component: string;
    field_name: string;
    value?: string;
    location?: string;
  };

  /** Disparado quando um Dialog/Popover/Sheet é aberto (inclui DatePicker composto com Calendar). */
  dialog_open: {
    component: string;
    label?: string;
    trigger_label?: string;
    location?: string;
  };

  /** Disparado quando um Dialog é fechado (qualquer caminho: escape, overlay, close-button, action). */
  dialog_close: {
    component: string;
    label?: string;
    reason?: "escape" | "overlay" | "close-button" | "action" | "user" | "unknown";
    location?: string;
  };

  /** Clique na ação primária do Footer de um Dialog. */
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

  /** Disparado quando o usuário foca um campo de input (apenas funis críticos). */
  field_focus: {
    component: string;
    location?: string;
    field_name?: string;
  };

  /** Disparado quando o usuário sai de um campo de input com valor preenchido. */
  field_blur: {
    component: string;
    location?: string;
    field_name?: string;
  };

  /** Disparado quando uma mensagem de erro é exibida em um campo de input. */
  field_error: {
    component: string;
    location?: string;
    field_name?: string;
    error_message?: string;
  };

  /** Disparado quando o usuário abre ou fecha um Collapsible rastreado. */
  collapsible_toggle: {
    label: string;
    value: 'open' | 'closed';
    location?: string;
  };

  /** Disparado quando o usuário seleciona um item do Command via clique ou Enter. */
  command_item_select: {
    label: string;
    group: string;
    pattern: 'inline' | 'combobox' | 'palette';
  };

  /** Disparado quando o usuário abre o command palette (botão ou atalho Cmd+K). */
  command_palette_open: {
    trigger: 'keyboard' | 'button';
  };

  /** Disparado quando o usuário clica no botão de ação interno de um toast (ex: "Desfazer"). */
  toast_action_click: {
    label: string;
    component: "toast";
    location: string;
  };

  /** Disparado quando o usuário abre um ContextMenu via right-click. */
  menu_open: {
    component: string;
    location?: string;
    menu?: string;
  };

  /** Disparado quando o usuário seleciona um item de um menu (ContextMenu, DropdownMenu, Menubar). */
  menu_item_click: {
    label: string;
    menu: string;
    location?: string;
  };

  /** Disparado quando o usuário confirma a ação primária de um Dialog/Sheet/Drawer. */
  dialog_confirm: {
    component: string;
    trigger_label?: string;
    action?: string;
    label?: string;
    location?: string;
  };

  /** Disparado quando o usuário muda de página em Pagination. */
  page_change: {
    component?: string;
    trigger_label?: string;
    page?: number;
    total_pages?: number;
    location?: string;
  };

  /** Disparado quando o usuário muda de aba em Tabs. */
  tab_change: {
    component?: string;
    value?: string;
    label?: string;
    index?: number;
    total?: number;
    location?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retorna o `gtag` do manager (janela pai quando em iframe) ou da janela atual.
 * GA4 é configurado no manager-head.html — eventos disparados dentro do iframe
 * precisam ser encaminhados para lá para que o `page_location` seja registrado
 * com a URL real do Storybook (ex: `/?path=/docs/ui-accordion--docs`).
 */
function getManagerGtag(): Window['gtag'] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const managerWin = window.self !== window.top ? window.top : window;
    return managerWin?.gtag;
  } catch {
    // Acesso ao parent pode falhar por cross-origin — fallback silencioso.
    return window.gtag;
  }
}

/** Retorna a URL atual do manager (não do iframe). */
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

/**
 * Envia um evento GA4 tipado. Sempre dispara no manager (janela pai) quando
 * rodando dentro de iframe. No-op silencioso se `gtag` não estiver disponível
 * (SSR, bloqueador de ads, GA4 ainda carregando).
 */
export function track<T extends keyof AnalyticsEvents>(
  event: T,
  params: AnalyticsEvents[T],
): void {
  const gtag = getManagerGtag();
  if (typeof gtag !== 'function') return;
  gtag('event', event, params as Record<string, unknown>);
}
