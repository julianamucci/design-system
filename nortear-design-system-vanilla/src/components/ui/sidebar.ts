// ─── Sidebar — Vanilla factory standalone ───────────────────────────────────
// Visual: classes .nds-sidebar-* (standalone).
// Shortcut: Ctrl/Cmd+B alterna expanded/collapsed.
//
// A família tem duas camadas, e as duas são API pública:
//
//   • As PEÇAS (`createSidebarMenu`, `createSidebarMenuButton`, …) são
//     recipientes vazios que devolvem o elemento com a classe e os atributos do
//     design system. É a forma que as outras stacks expõem, e é o que permite
//     montar qualquer arranjo — sub-menu, ação por item, esqueleto de carga.
//   • Os ATALHOS (`createSidebarGroup`, `createSidebarMenuItem`) recebem dados e
//     montam um arranjo comum de uma vez. Eles são compostos a partir das
//     peças, nunca em paralelo a elas: o contrato de markup é escrito num lugar
//     só.
//
// `data-slot` acompanha `data-sidebar` em toda peça. Os dois têm donos
// diferentes: `data-sidebar` é o que o CSS compartilhado lê, `data-slot` é o
// contrato de markup que as cinco stacks compartilham e que a auditoria
// compara. Este arquivo emitia só o primeiro.

import { cn } from '@/lib/utils';
import { createButton } from './button';
import { createInput, type InputOptions } from './input';
import { createSkeleton } from './skeleton';

const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

export type SidebarState = 'expanded' | 'collapsed';
export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarMenuButtonSize = 'default' | 'sm' | 'lg';
export type SidebarMenuButtonVariant = 'default' | 'outline';
export type SidebarMenuSubButtonSize = 'sm' | 'md';

export type SidebarOptions = {
  defaultOpen?: boolean;
  side?: SidebarSide;
  variant?: SidebarVariant;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export type SidebarMenuItemOptions = {
  icon?: SVGElement | HTMLElement;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  badge?: string;
};

export type SidebarGroupOptions = {
  label?: string;
  items: SidebarMenuItemOptions[];
};

export type SidebarInstance = {
  element: HTMLElement;
  toggle: () => void;
  open: () => void;
  close: () => void;
  getState: () => SidebarState;
};

export function createSidebarProvider(
  options: { children?: HTMLElement } = {}
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-sidebar-wrapper';
  wrapper.dataset.slot = 'sidebar-wrapper';
  if (options.children) wrapper.appendChild(options.children);
  return wrapper;
}

export function createSidebar(options: SidebarOptions = {}): SidebarInstance {
  const { defaultOpen = true, side = 'left', variant = 'sidebar', onOpenChange } = options;
  let isOpen = defaultOpen;

  const root = document.createElement('div');
  root.className = cn('nds-sidebar-root', options.class);
  root.dataset.slot = 'sidebar';
  root.dataset.state = isOpen ? 'expanded' : 'collapsed';
  root.dataset.side = side;
  root.dataset.variant = variant;

  const gap = document.createElement('div');
  gap.className = 'nds-sidebar-gap';
  gap.dataset.slot = 'sidebar-gap';
  gap.dataset.state = isOpen ? 'expanded' : 'collapsed';

  const gapInner = document.createElement('div');
  gapInner.className = 'nds-sidebar-gap-inner';
  gap.appendChild(gapInner);

  const panel = document.createElement('div');
  panel.className = 'nds-sidebar-panel';
  panel.dataset.slot = 'sidebar-container';

  const inner = document.createElement('div');
  inner.className = 'nds-sidebar-inner';
  inner.dataset.slot = 'sidebar-inner';
  inner.setAttribute('data-sidebar', 'sidebar');
  panel.appendChild(inner);
  root.append(gap, panel);

  function setState(open: boolean) {
    isOpen = open;
    const state = open ? 'expanded' : 'collapsed';
    root.dataset.state = state;
    gap.dataset.state = state;
    onOpenChange?.(open);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setState(!isOpen);
    }
  }
  document.addEventListener('keydown', handleKeydown);

  return {
    element: root,
    toggle: () => setState(!isOpen),
    open: () => setState(true),
    close: () => setState(false),
    getState: () => (isOpen ? 'expanded' : 'collapsed'),
  };
}

/** Ícone PanelLeft, montado com createElementNS (sem innerHTML). */
function panelLeftIcon(): SVGElement {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', '18');
  rect.setAttribute('height', '18');
  rect.setAttribute('x', '3');
  rect.setAttribute('y', '3');
  rect.setAttribute('rx', '2');
  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', 'M9 3v18');
  svg.append(rect, line);
  return svg;
}

export function createSidebarTrigger(
  toggleFn: () => void,
  options: { class?: string } = {}
): HTMLButtonElement {
  const btn = createButton({ variant: 'ghost', size: 'icon', class: options.class });
  btn.dataset.slot = 'sidebar-trigger';
  btn.setAttribute('data-sidebar', 'trigger');
  btn.setAttribute('aria-label', 'Toggle sidebar');
  btn.appendChild(panelLeftIcon());
  btn.addEventListener('click', toggleFn);
  return btn;
}

/**
 * Faixa clicável na borda do painel.
 *
 * `tabindex="-1"` e `aria-hidden` de propósito, e é o que as outras quatro
 * implementações emitem: a faixa faz o MESMO que o gatilho, que já está na
 * ordem de tabulação. Duas paradas de teclado para uma ação só é ruído para
 * quem navega sem mouse, e sem o `aria-hidden` o leitor de tela listaria dois
 * controles com o mesmo nome — um deles inalcançável. O `title` fica: é a dica
 * de ponteiro, para quem a faixa existe.
 *
 * Vai DENTRO do painel (irmã de header/content/footer): o posicionamento é
 * absoluto e o bloco que o contém é `.nds-sidebar-panel`, que é fixo.
 */
export function createSidebarRail(
  toggleFn: () => void,
  options: { class?: string; title?: string } = {}
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cn('nds-sidebar-rail', options.class);
  btn.dataset.slot = 'sidebar-rail';
  btn.setAttribute('data-sidebar', 'rail');
  btn.setAttribute('aria-hidden', 'true');
  btn.tabIndex = -1;
  btn.title = options.title ?? 'Toggle sidebar';
  btn.addEventListener('click', toggleFn);
  return btn;
}

/**
 * Área de conteúdo ao lado da barra.
 *
 * `<main>` por padrão: é o marco da página, e entregá-lo aqui evita que quem
 * compõe esqueça o landmark. Quando a página já tem o próprio `<main>` dentro
 * da área, passe `as: 'div'` — dois `<main>` na mesma página é violação de
 * marco único, não redundância inofensiva.
 */
export function createSidebarInset(
  options: { as?: 'main' | 'div'; class?: string } = {}
): HTMLElement {
  const el = document.createElement(options.as ?? 'main');
  el.className = cn('nds-sidebar-inset', options.class);
  el.dataset.slot = 'sidebar-inset';
  return el;
}

export function createSidebarContent(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-content', options.class);
  el.dataset.slot = 'sidebar-content';
  el.setAttribute('data-sidebar', 'content');
  return el;
}

export function createSidebarHeader(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-header', options.class);
  el.dataset.slot = 'sidebar-header';
  el.setAttribute('data-sidebar', 'header');
  return el;
}

export function createSidebarFooter(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-footer', options.class);
  el.dataset.slot = 'sidebar-footer';
  el.setAttribute('data-sidebar', 'footer');
  return el;
}

/**
 * Campo de busca dentro da barra.
 *
 * `label` é obrigatório e vira o nome acessível: o `placeholder` some no
 * primeiro caractere digitado, e um campo que perde o nome ao ser usado é um
 * campo sem nome. Nenhuma das outras implementações força isso — lá o nome é
 * responsabilidade de quem compõe, e por isso falta.
 */
export function createSidebarInput(
  options: InputOptions & { label: string }
): HTMLInputElement {
  const { label, ...rest } = options;
  const input = createInput({ type: 'search', ...rest, class: cn('nds-sidebar-input', rest.class) });
  input.dataset.slot = 'sidebar-input';
  input.setAttribute('data-sidebar', 'input');
  input.setAttribute('aria-label', label);
  return input;
}

// ─── Grupo ──────────────────────────────────────────────────────────────────

/**
 * Rótulo do grupo.
 *
 * Some da tela no modo de ícones (o CSS zera a opacidade) mas continua no DOM —
 * é ele que dá nome ao grupo para quem usa leitor de tela, e recolher a coluna
 * não deveria apagar essa informação. O `id` existe para que a lista do grupo
 * possa apontar para ele com `aria-labelledby`: sem isso o rótulo é só pintura,
 * e a `<ul>` que ele encabeça fica sem nome.
 */
export function createSidebarGroupLabel(
  options: { text?: string; id?: string; class?: string } = {}
): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-group-label', options.class);
  el.dataset.slot = 'sidebar-group-label';
  el.setAttribute('data-sidebar', 'group-label');
  if (options.id) el.id = options.id;
  if (options.text !== undefined) el.textContent = options.text;
  return el;
}

export function createSidebarGroupContent(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-group-content', options.class);
  el.dataset.slot = 'sidebar-group-content';
  el.setAttribute('data-sidebar', 'group-content');
  return el;
}

/**
 * Ação no canto do grupo (adicionar, filtrar).
 *
 * `label` é obrigatório: o botão carrega só um ícone, e ícone é `aria-hidden`.
 * Sem o rótulo o controle entra na ordem de tabulação sem nome nenhum. As
 * outras implementações não exigem — o nome fica por conta de quem compõe.
 */
export function createSidebarGroupAction(
  options: { label: string; icon?: SVGElement | HTMLElement; onClick?: () => void; class?: string }
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cn('nds-sidebar-group-action', options.class);
  btn.dataset.slot = 'sidebar-group-action';
  btn.setAttribute('data-sidebar', 'group-action');
  btn.setAttribute('aria-label', options.label);
  if (options.icon) btn.appendChild(options.icon);
  if (options.onClick) btn.addEventListener('click', options.onClick);
  return btn;
}

// ─── Menu ───────────────────────────────────────────────────────────────────

/**
 * A lista de itens.
 *
 * `labelledBy` aponta para o `id` do rótulo do grupo. Uma `<ul>` sem nome é
 * anunciada como "lista, 4 itens" e nada mais; com o rótulo ligado, ela é "Conta,
 * lista, 4 itens".
 */
export function createSidebarMenu(
  options: { labelledBy?: string; class?: string } = {}
): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = cn('nds-sidebar-menu', options.class);
  ul.dataset.slot = 'sidebar-menu';
  ul.setAttribute('data-sidebar', 'menu');
  if (options.labelledBy) ul.setAttribute('aria-labelledby', options.labelledBy);
  return ul;
}

export type SidebarMenuButtonOptions = {
  /** Rótulo visível. Vira o `<span>` que o CSS trunca no modo de ícones. */
  label?: string;
  /** Nome acessível. Use quando o rótulo visível some (modo de ícones) ou não basta. */
  ariaLabel?: string;
  icon?: SVGElement | HTMLElement;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  size?: SidebarMenuButtonSize;
  variant?: SidebarMenuButtonVariant;
  onClick?: () => void;
  class?: string;
};

/**
 * O item de navegação.
 *
 * Vira `<a>` quando há destino e `<button>` quando não: quem navega para outra
 * rota merece um link de verdade, que abre em nova aba e entra no histórico.
 *
 * `aria-current="page"` acompanha `data-active`. O atributo de dado é para o
 * CSS; o ARIA é o que faz o leitor de tela anunciar "página atual", e é ele que
 * o critério de acessibilidade do componente cobra.
 */
export function createSidebarMenuButton(
  options: SidebarMenuButtonOptions = {}
): HTMLButtonElement | HTMLAnchorElement {
  const { size = 'default', variant = 'default' } = options;
  const isLink = Boolean(options.href);

  const el = document.createElement(isLink ? 'a' : 'button') as
    | HTMLButtonElement
    | HTMLAnchorElement;

  el.className = cn(
    'nds-sidebar-menu-button',
    variant === 'outline' && 'nds-sidebar-menu-button-outline',
    options.class,
  );
  el.dataset.slot = 'sidebar-menu-button';
  el.setAttribute('data-sidebar', 'menu-button');
  el.dataset.size = size;

  if (isLink) (el as HTMLAnchorElement).href = options.href!;
  else (el as HTMLButtonElement).type = 'button';

  if (options.active) {
    el.dataset.active = 'true';
    el.setAttribute('aria-current', 'page');
  }

  if (options.disabled) {
    // `disabled` só existe em <button>. Num link a desativação é anunciada por
    // `aria-disabled` e o destino sai, senão o Enter continua navegando.
    if (isLink) {
      el.setAttribute('aria-disabled', 'true');
      el.removeAttribute('href');
    } else {
      (el as HTMLButtonElement).disabled = true;
    }
  }

  const nome = options.ariaLabel ?? options.label;
  if (nome) el.setAttribute('aria-label', nome);

  if (options.onClick) el.addEventListener('click', options.onClick);
  if (options.icon) el.appendChild(options.icon);

  if (options.label !== undefined) {
    const span = document.createElement('span');
    span.textContent = options.label;
    el.appendChild(span);
  }

  return el;
}

/**
 * Ação flutuante à direita do item (menu de contexto, remover).
 *
 * `label` obrigatório pelo mesmo motivo da ação de grupo: é um botão só de
 * ícone. `showOnHover` só esconde a partir de 48rem, e o `:focus-within` do
 * item o traz de volta para quem chega por teclado.
 */
export function createSidebarMenuAction(
  options: {
    label: string;
    icon?: SVGElement | HTMLElement;
    showOnHover?: boolean;
    onClick?: () => void;
    class?: string;
  }
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cn(
    'nds-sidebar-menu-action',
    options.showOnHover && 'nds-sidebar-menu-action-hover',
    options.class,
  );
  btn.dataset.slot = 'sidebar-menu-action';
  btn.setAttribute('data-sidebar', 'menu-action');
  btn.setAttribute('aria-label', options.label);
  if (options.icon) btn.appendChild(options.icon);
  if (options.onClick) btn.addEventListener('click', options.onClick);
  return btn;
}

/**
 * Contador ancorado à direita do item.
 *
 * `aria-hidden` de fábrica: o número mora FORA do botão (o CSS o posiciona por
 * cima, com `pointer-events: none`), então lido como conteúdo ele vira um "12"
 * solto depois do rótulo, sem dizer de quê. A contagem entra no nome acessível
 * do item — `ariaLabel: 'Notificações, 12 não lidas'`. É o que a implementação
 * do Angular já faz; as outras três deixam o número solto.
 */
export function createSidebarMenuBadge(
  options: { text: string; class?: string }
): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-menu-badge', options.class);
  el.dataset.slot = 'sidebar-menu-badge';
  el.setAttribute('data-sidebar', 'menu-badge');
  el.setAttribute('aria-hidden', 'true');
  el.textContent = options.text;
  return el;
}

/**
 * Espaço reservado enquanto o menu carrega.
 *
 * As duas caixas internas são `createSkeleton()` — a pulsação e o fundo moram
 * em `.nds-skeleton`, e as classes `.nds-sidebar-menu-skeleton-*` só dão a
 * medida. Sem a peça de esqueleto por baixo, o placeholder não pinta nada.
 *
 * Sem `label` a linha inteira é `aria-hidden`: um bloco cinza pulsando não é
 * conteúdo, e quem anuncia o carregamento é a região que contém a lista. Com
 * `label`, a linha vira `role="status"` e se anuncia sozinha — use no caso de
 * uma linha só, senão cada linha vira uma região viva repetindo o mesmo aviso.
 */
export function createSidebarMenuSkeleton(
  options: { showIcon?: boolean; label?: string; width?: string; class?: string } = {}
): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-menu-skeleton', options.class);
  el.dataset.slot = 'sidebar-menu-skeleton';
  el.setAttribute('data-sidebar', 'menu-skeleton');

  if (options.label) {
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', options.label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }

  if (options.showIcon) {
    const icon = createSkeleton({ className: 'nds-sidebar-menu-skeleton-icon' });
    icon.setAttribute('data-sidebar', 'menu-skeleton-icon');
    el.appendChild(icon);
  }

  const text = createSkeleton({ className: 'nds-sidebar-menu-skeleton-text' });
  text.setAttribute('data-sidebar', 'menu-skeleton-text');
  // A largura é o único ponto de variação que a folha compartilhada abre
  // (`var(--skeleton-width, 70%)`). Sem valor, vale o padrão da folha — as
  // outras implementações sorteiam uma largura a cada render, o que faz a
  // captura de regressão visual divergir de si mesma.
  if (options.width) text.style.setProperty('--skeleton-width', options.width);
  el.appendChild(text);

  return el;
}

// ─── Sub-menu ───────────────────────────────────────────────────────────────

export function createSidebarMenuSub(options: { class?: string } = {}): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = cn('nds-sidebar-menu-sub', options.class);
  ul.dataset.slot = 'sidebar-menu-sub';
  ul.setAttribute('data-sidebar', 'menu-sub');
  return ul;
}

export function createSidebarMenuSubItem(options: { class?: string } = {}): HTMLLIElement {
  const li = document.createElement('li');
  li.className = cn('nds-sidebar-menu-sub-item', options.class);
  li.dataset.slot = 'sidebar-menu-sub-item';
  li.setAttribute('data-sidebar', 'menu-sub-item');
  return li;
}

export type SidebarMenuSubButtonOptions = {
  label?: string;
  ariaLabel?: string;
  icon?: SVGElement | HTMLElement;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  size?: SidebarMenuSubButtonSize;
  onClick?: () => void;
  class?: string;
};

/**
 * Item do sub-menu.
 *
 * Mesma regra do item de primeiro nível: `<a>` quando há destino, `<button>`
 * quando não. As outras três implementações de navegador nascem `<a>` sempre —
 * uma âncora sem `href` não recebe foco nem é anunciada como link, então o
 * subitem que executa uma ação em vez de navegar fica inalcançável por teclado.
 */
export function createSidebarMenuSubButton(
  options: SidebarMenuSubButtonOptions = {}
): HTMLButtonElement | HTMLAnchorElement {
  const { size = 'md' } = options;
  const isLink = Boolean(options.href);

  const el = document.createElement(isLink ? 'a' : 'button') as
    | HTMLButtonElement
    | HTMLAnchorElement;

  el.className = cn('nds-sidebar-menu-sub-button', options.class);
  el.dataset.slot = 'sidebar-menu-sub-button';
  el.setAttribute('data-sidebar', 'menu-sub-button');
  el.dataset.size = size;

  if (isLink) (el as HTMLAnchorElement).href = options.href!;
  else (el as HTMLButtonElement).type = 'button';

  if (options.active) {
    el.dataset.active = 'true';
    el.setAttribute('aria-current', 'page');
  }

  // Aqui a folha compartilhada TEM regra para `[aria-disabled="true"]`, então o
  // estado é visível nos dois elementos.
  if (options.disabled) {
    el.setAttribute('aria-disabled', 'true');
    if (isLink) el.removeAttribute('href');
    else (el as HTMLButtonElement).disabled = true;
  }

  const nome = options.ariaLabel ?? options.label;
  if (nome) el.setAttribute('aria-label', nome);

  if (options.onClick) el.addEventListener('click', options.onClick);
  if (options.icon) el.appendChild(options.icon);

  if (options.label !== undefined) {
    const span = document.createElement('span');
    span.textContent = options.label;
    el.appendChild(span);
  }

  return el;
}

// ─── Atalhos ────────────────────────────────────────────────────────────────

export function createSidebarGroup(options: SidebarGroupOptions): HTMLElement {
  const group = document.createElement('div');
  group.className = 'nds-sidebar-group';
  group.dataset.slot = 'sidebar-group';
  group.setAttribute('data-sidebar', 'group');

  if (options.label) {
    group.appendChild(createSidebarGroupLabel({ text: options.label }));
  }

  const menu = createSidebarMenu();
  options.items.forEach(item => menu.appendChild(createSidebarMenuItem(item)));
  group.appendChild(menu);
  return group;
}

/**
 * O item da lista.
 *
 * Sem `label` devolve o `<li>` vazio — é o recipiente que as outras stacks
 * expõem, e é onde entram botão, contador e ação lado a lado. Com `label`, monta
 * o arranjo comum de uma vez.
 */
export function createSidebarMenuItem(
  options: Partial<SidebarMenuItemOptions> & { class?: string } = {}
): HTMLElement {
  const li = document.createElement('li');
  li.className = cn('nds-sidebar-menu-item', options.class);
  li.dataset.slot = 'sidebar-menu-item';
  li.setAttribute('data-sidebar', 'menu-item');

  if (options.label === undefined) return li;

  const btn = createSidebarMenuButton({
    label: options.label,
    // O nome acessível é sempre declarado: no modo de ícones o `<span>` some, e
    // o item não pode sumir junto do leitor de tela.
    ariaLabel: options.label,
    icon: options.icon,
    href: options.href,
    active: options.active,
    disabled: options.disabled,
    onClick: options.onClick,
  });

  if (options.badge) {
    // Este contador mora DENTRO do botão (`.nds-sidebar-menu-button-badge`, que
    // só empurra para a direita com `margin-left: auto`). É outra peça que o
    // `.nds-sidebar-menu-badge` ancorado por cima do item — as duas existem na
    // folha compartilhada e resolvem casos diferentes.
    const badge = document.createElement('span');
    badge.className = 'nds-sidebar-menu-button-badge';
    badge.textContent = options.badge;
    btn.appendChild(badge);
  }

  li.appendChild(btn);
  return li;
}

export function createSidebarSeparator(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = cn('nds-sidebar-separator', options.class);
  el.dataset.slot = 'sidebar-separator';
  el.setAttribute('data-sidebar', 'separator');
  el.setAttribute('role', 'separator');
  el.setAttribute('aria-orientation', 'horizontal');
  return el;
}
