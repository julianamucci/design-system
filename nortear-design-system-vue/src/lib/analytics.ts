/**
 * Camada de analytics para o Design System.
 * Envia eventos para o Google Analytics 4 (Measurement ID definido em .env.development / .env.production).
 *
 * Arquitetura:
 *   - GA4 é carregado no manager do Storybook (manager-head.html), não no iframe.
 *   - Docs pages rodam em um iframe — `track()` encaminha eventos para `window.top.gtag`.
 *   - `page_location` e `page_title` usam a URL/título do manager para que cada story
 *     apareça como uma página distinta no GA4.
 */

import { registrarAction } from '@shared/primitives/faro';
import { logarEvento } from '@shared/primitives/analytics-debug';

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

  /** Disparado quando o usuário descarta um alerta (botão de fechar). */
  alert_dismiss: {
    component: string;
    label: string;
    location?: string;
  };

  /** Disparado quando o usuário clica em um Avatar para abrir um perfil.
   *  Nunca envie identificadores reais — use ids anônimos/hashed. */
  profile_click: {
    component: string;
    user_id?: string;
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
    component: 'breadcrumb' | 'navigation-menu' | 'sidebar';
    label: string;
    destination: string;
    location?: string;
  };

  /** Disparado quando o usuário abre ou fecha a Sidebar (trigger, rail ou Ctrl+B). */
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

  /**
   * Abertura de Dialog, AlertDialog e Sheet — a mesma pergunta de produto, e a
   * peça vai no `component`. O campo que diz QUEM abriu é `trigger_id` nos três
   * (e no Drawer): o id ESTÁVEL do gatilho (`default`, `destructive`,
   * `pair1-do`, no Sheet o lado…), nunca o texto dele, que partiria o mesmo
   * evento em um valor por idioma no GA4.
   *
   * Até 2026-09-10 o Dialog mandava `trigger_id` e AlertDialog, Sheet e Drawer
   * mandavam `label` com o mesmo tipo de valor — dois nomes para uma dimensão
   * só. A dona decidiu unificar em `trigger_id` (regra em
   * `docs/shared/guidelines/18-overlay.md` §Analytics). Antes disso os dois
   * campos já tinham sido opcionais, e o Dialog de quatro stacks mandava `label`
   * contra o PRD: o tipo aceitava tudo, e nenhum portão via.
   *
   * `label?: never` existe para o call site que voltar ao campo antigo reprovar
   * no build.
   */
  dialog_open: { component: 'dialog' | 'alert-dialog' | 'sheet'; trigger_id: string; location: string; label?: never };

  /** Fechamento, por qualquer caminho — mesmos campos da abertura, mais o `reason`. */
  dialog_close: { component: 'dialog' | 'alert-dialog' | 'sheet'; trigger_id: string; reason: 'escape' | 'overlay' | 'close-button' | 'api'; location: string; label?: never };

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

  /** Disparado quando o usuário abre ou fecha um Collapsible. */
  collapsible_toggle: {
    label: string;
    value: 'open' | 'closed';
    location?: string;
  };

  /**
   * Disparado ao selecionar um item do Command via clique ou Enter.
   *
   * `component` e `location` entraram em 2026-09-10, por decisão da dona: eram os
   * dois únicos eventos da categoria Overlay sem eles. `location` é obrigatório
   * para não virar amostra parcial — campo que parte das stacks preenche não
   * separa, no GA4, "sem seção" de "stack que não manda".
   */
  command_item_select: {
    component: 'command';
    label: string;
    group: string;
    /** `combobox` saiu: o Combobox é componente próprio e nenhuma stack o monta sobre o Command. */
    pattern: 'inline' | 'palette';
    location: string;
  };

  /** Disparado ao abrir o command palette (botão ou atalho Ctrl+K). */
  command_palette_open: {
    component: 'command';
    trigger: 'keyboard' | 'button';
    location: string;
  };

  /** Disparado quando um DropdownMenu abre. */
  dropdown_menu_open: {
    component: 'dropdown-menu';
    menu: string;
    location: string;
    label?: never;
  };

  /** Disparado quando um DropdownMenu fecha, por qualquer caminho. */
  dropdown_menu_close: {
    component: 'dropdown-menu';
    menu: string;
    reason: 'escape' | 'overlay' | 'close-button' | 'api';
    location: string;
    label?: never;
  };

  /**
   * Disparado ao escolher um item de um DropdownMenu.
   * `label` leva o VALOR do item, nunca o texto traduzido — o texto partiria o
   * mesmo evento em três no GA4, um por idioma.
   */
  dropdown_menu_item_select: {
    component: 'dropdown-menu';
    menu: string;
    label: string;
    location: string;
  };

  /**
   * Os três eventos do ContextMenu. Até 2026-09-10 eram `menu_open` e
   * `menu_item_click` — outro vocabulário que o do irmão DropdownMenu
   * (`dropdown_menu_*`), com o `component` dizendo `context-menu` e o evento de
   * item sem `component` nenhum; e o fechamento não era medido. Decisão da dona:
   * a família fala uma língua só no GA4 (a série `menu_*` para de crescer aí).
   *
   * `menu` é o id ESTÁVEL do menu (`demo`, `pair1-do`…), `label` o valor do
   * item — nunca texto traduzido. `location` é a seção da docs page (guideline 07).
   */
  context_menu_open: {
    component: 'context-menu';
    menu: string;
    location: string;
    label?: never;
  };

  context_menu_item_select: {
    component: 'context-menu';
    menu: string;
    label: string;
    location: string;
  };

  /**
   * `reason` no vocabulário da família (portão `reason_vocabulario_divergente`):
   * o ContextMenu fecha por `escape`, por clique fora ou Tab (`overlay`) ou pela escolha
   * de um item (`api`) — não tem botão de fechar, mas o tipo carrega as quatro.
   */
  context_menu_close: {
    component: 'context-menu';
    menu: string;
    reason: 'escape' | 'overlay' | 'close-button' | 'api';
    location: string;
    label?: never;
  };

  /**
   * Os três eventos do Menubar, no formato da família (DropdownMenu e
   * ContextMenu): `menu` é o id estável do menu — o da prévia, mais a chave do
   * gatilho quando a barra tem vários menus (`demo-file`, `pair1-do-edit`) —,
   * `label` o do item, e o fechamento diz o motivo. Até 2026-09-11 o Menubar
   * não disparava nada, e o conteúdo prometia três eventos que o tipo não tinha
   * — decisão da dona: rastrear, no formato da família.
   */
  menubar_open: {
    component: 'menubar';
    menu: string;
    location: string;
    label?: never;
  };

  menubar_close: {
    component: 'menubar';
    menu: string;
    reason: 'escape' | 'overlay' | 'close-button' | 'api';
    location: string;
    label?: never;
  };

  menubar_item_select: {
    component: 'menubar';
    menu: string;
    label: string;
    location: string;
  };

  /**
   * Disparado ao abrir o Drawer. Nome próprio, e não `dialog_open`, porque é o
   * que o conteúdo compartilhado do componente documenta na seção Analytics —
   * separar o painel arrastável do diálogo centrado é o que permite medir o
   * fluxo mobile sem diluí-lo no total de diálogos.
   *
   * Quem abriu vai em `trigger_id` — o id estável do gatilho (na demo, a
   * direção: `right`, `left`, `bottom`…), como na família `dialog_*`. Até
   * 2026-09-10 o campo era `label`; `label?: never` faz o call site antigo
   * reprovar no build.
   */
  drawer_open: { component: 'drawer'; trigger_id: string; location?: string; label?: never };

  /**
   * Disparado ao fechar o Drawer por qualquer caminho.
   *
   * O vocabulário de `reason` é o do design system, não o da lib de cada stack:
   * arrastar o painel para fora fecha por `overlay` (para quem usa, é a mesma
   * decisão de "saí sem decidir nada" do clique no véu) e o fechamento por
   * código é `api`. Motivo novo aqui vira dimensão nova no GA4.
   */
  drawer_close: { component: 'drawer'; trigger_id: string; reason: 'escape' | 'overlay' | 'close-button' | 'api'; location?: string; label?: never };

  /**
   * Disparado quando o usuário confirma a ação primária de um Dialog/Sheet/Drawer.
   * `trigger_id` é o mesmo id estável da abertura — até 2026-09-10 era
   * opcional e parte dos call sites mandava `label` no lugar.
   */
  dialog_confirm: { component: string; trigger_id: string; action?: string; location?: string; label?: never };

  /** Disparado quando o usuário muda de página em Pagination. */
  page_change: {
    component?: string;
    trigger_id?: string;
    page?: number;
    total_pages?: number;
    location?: string;
  };

  /** Disparado quando um campo Input recebe foco (onFocus) — apenas funis críticos. */
  field_focus: {
    component: string;
    field_name: string;
    location?: string;
  };

  /** Disparado ao sair de um campo Input com valor preenchido (onBlur). */
  field_blur: {
    component: string;
    field_name: string;
    location?: string;
  };

  /** Disparado quando uma mensagem de erro é exibida em um campo Input (FormMessage visível). */
  field_error: {
    component: string;
    field_name: string;
    error_message?: string;
    location?: string;
  };

  /** Disparado quando o usuário dispara um toast na demonstração do Sonner. */
  toast_demo_triggered: {
    toast_type: string;
    locale: Locale;
  };

  /** Clique no botão de ação interno do toast (ex: Desfazer). */
  toast_action_click: {
    label: string;
    component: 'sonner';
    location: string;
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
  /**
   * Selecao de etapa no Stepper. O payload carrega so valor estavel — numero da
   * etapa e total —, nunca o titulo traduzido, que dividiria um evento em tres
   * no GA4.
   */
  step_change: {
    component: 'stepper';
    step: number;
    total?: number;
    location?: string;
  };

  /** Disparado quando um Popover abre. */
  popover_open: {
    component: string;
    trigger_id?: string;
    location?: string;
  };

  /**
   * Disparado quando um HoverCard abre.
   *
   * `trigger_id` é id ESTÁVEL do gatilho, nunca o texto dele: o conteúdo
   * compartilhado documentava `label` com "texto do trigger", e texto traduzido
   * parte o mesmo evento em um valor por idioma no GA4.
   */
  hover_card_open: {
    component: string;
    trigger_id?: string;
    location?: string;
  };

  /** Disparado quando um HoverCard fecha. */
  hover_card_close: {
    component: string;
    location?: string;
  };

  /** Disparado quando um Popover fecha. */
  popover_close: {
    component: string;
    /**
     * Por qual caminho fechou, no vocabulário do DESIGN SYSTEM — as mesmas
     * quatro palavras do `drawer_close`. OBRIGATÓRIO: campo opcional preenchido
     * por parte das stacks é amostra enviesada com cara de completa, e no GA4
     * não separa "motivo desconhecido" de "stack que não reporta".
     * `api` é o fechamento por código — onde cai "salvou e fechou".
     */
    reason: 'escape' | 'overlay' | 'close-button' | 'api';
    location?: string;
  };

  /** Disparado quando uma tarefa acompanhada por Progress atinge um marco. */
  task_progress: {
    component: string;
    task: string;
    percent: number;
    location?: string;
  };

  /** Disparado quando uma tarefa acompanhada por Progress conclui. */
  task_complete: {
    component: string;
    task: string;
    duration_ms?: number;
    location?: string;
  };

  /** Disparado quando o usuário muda a opção de um RadioGroup. */
  radio_change: {
    component: string;
    name: string;
    value: string;
    previous_value?: string;
    location?: string;
  };

  /** Disparado ao final do redimensionamento de painéis (Resizable). */
  panel_resize: {
    component: string;
    group_id?: string;
    sizes?: string;
    location?: string;
  };

  /** Disparado quando o usuário rola um ScrollArea até um marco relevante. */
  content_scroll: {
    component: string;
    target_id?: string;
    percent_visible?: number;
    location?: string;
  };

  /** Disparado quando o usuário seleciona uma opção em Select/Combobox. */
  option_select: {
    component: string;
    field_name?: string;
    value?: string;
    label?: string;
    location?: string;
  };

  /** Disparado quando o valor do Slider é commitado (fim do drag ou teclado). */
  slider_change: {
    component: string;
    field_name?: string;
    value?: number | string;
    min?: number;
    max?: number;
    location?: string;
  };

  /** Disparado quando um Tooltip fica visível tempo suficiente para leitura. */
  tooltip_view: {
    component: string;
    trigger_id?: string;
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
  // Faro primeiro, e fora do early-return do gtag: sem GA4 configurado a
  // funcao voltava sem fazer nada, e a observabilidade morreria junto por um
  // motivo que nao tem a ver com ela.
  registrarAction(event, params as Record<string, unknown>);

  const gtag = getManagerGtag();
  const entregue = typeof gtag === 'function';

  // Antes do early-return: com GA4 desconfigurado o evento voltava sem
  // vestígio, e quem inspeciona não tinha como separar "o componente não
  // disparou" de "disparou e não havia para onde mandar".
  logarEvento(event, params as Record<string, unknown>, entregue);

  if (!entregue) return;
  gtag('event', event, params as Record<string, unknown>);
}
