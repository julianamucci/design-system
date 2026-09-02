// ─── Popover — Vanilla factory standalone ───────────────────────────────────
// Visual: classe .nds-popover-content (standalone).
// Render via portal (body), posicionado pelo JS. Click-outside + Escape fecham.

/**
 * MODAL OU NÃO-MODAL — bloco canônico das cinco stacks.
 *
 * Medido em 2026-09-02 na FONTE de cada lib, não na documentação delas. As
 * outras quatro trazem a versão curta com o mecanismo da própria stack.
 *
 * O Popover é o único da família de overlay que não é menu nem dica: ele RECEBE
 * foco e guarda conteúdo interativo. Isso obriga a escolher entre dois
 * contratos, e é escolher METADE de cada um que produz o defeito clássico —
 * painel que o leitor de tela anuncia como diálogo modal e que o Tab atravessa
 * como se não fosse.
 *
 * O PADRÃO do design system é NÃO-MODAL, e ele é literal nas cinco:
 *
 * - O foco ENTRA no painel ao abrir: primeiro elemento focável, ou o próprio
 *   painel quando não há nenhum. É o que separa o popover do tooltip, e é o que
 *   o conteúdo compartilhado promete em três seções (acessibilidade, estados e
 *   critérios de teste).
 * - O foco NÃO fica PRESO: `Tab` sai do painel e segue a ordem da página.
 *   Nenhuma das cinco instala laço de tabulação no estado padrão.
 * - Por isso o painel NUNCA recebe `aria-modal`. O atributo manda o leitor de
 *   tela esconder tudo o que está fora do diálogo, e essa promessa só se cumpre
 *   com o foco preso: sem a prisão ele MENTE — o resto da página fica
 *   inalcançável para quem ouve sem estar inalcançável para quem tabula. É o
 *   contrário do véu do Dialog, e é de propósito: um popover é conteúdo AO
 *   LADO, não no lugar.
 * - `Escape` fecha e DEVOLVE o foco ao gatilho. Clique fora fecha.
 * - O gatilho declara `aria-expanded` e `aria-haspopup="dialog"`, e
 *   `aria-controls` apontando para o painel SÓ enquanto ele existe — apontar
 *   para um id ausente reprova em `aria-valid-attr-value`.
 * - Nenhuma região viva. O painel não é anúncio: ele é alcançado.
 *
 * ─── A prop `modal`, ENTREGUE nas cinco em 2026-09-02 ───────────────────────
 *
 * `modal` estava na tabela de props do conteúdo compartilhado e existia em três
 * das cinco stacks, com semântica diferente em duas. A dona escolheu ENTREGAR
 * (regra 2e6 — entregar ou remover). O que `modal: true` passa a significar,
 * igual nas cinco e exatamente o que a tabela promete:
 *
 *   1. o foco fica PRESO no painel — `Tab` no último focável volta ao primeiro,
 *      e `Shift+Tab` no primeiro vai ao último;
 *   2. a rolagem da página fica travada;
 *   3. o painel anuncia `aria-modal="true"`;
 *   4. `Escape` fecha e devolve o foco ao gatilho, como no modo padrão.
 *
 * `aria-modal` SÓ existe no modo modal, e é o item 1 que lhe dá direito: o
 * atributo manda o leitor de tela esconder o resto da página, e sem foco preso
 * ele MENTE — o resto da página fica inalcançável para quem ouve sem estar
 * inalcançável para quem tabula. Esta casa já pagou por atributo que anuncia o
 * que não existe (o `aria-label` DESCARTADO em `drawer` e `sheet`, por estar num
 * `div` sem papel). Por isso não-modal não recebe `aria-modal` nem
 * `aria-modal="false"`: recebe atributo NENHUM.
 *
 * O mecanismo de cada lib, medido na FONTE — e é ele que decide quem entrega
 * `modal` pela lib e quem o escreve à mão:
 *
 *   base-ui   — `PopoverRoot` nasce com `modal = false`; `role="dialog"` no
 *               `Popup`. O `FloatingFocusManager` só trapeia quando
 *               `modal !== false && hasClosePart` (`popup/PopoverPopup.js`), e
 *               `hasClosePart` conta os `Popover.Close` REGISTRADOS dentro do
 *               painel (`utils/closePart.js`, via `useClosePartRegistration`).
 *               A trava de rolagem, essa sim, cai de `modal === true` sozinho:
 *               `positioner/PopoverPositioner.js` liga
 *               `useAnchoredPopupScrollLock` com `modal === true && !hover`.
 *               Ou seja: a lib dá a TRAVA, não dá o TRAP.
 *   reka-ui   — `PopoverRoot` nasce com `modal: false`. Não-modal é
 *               `PopoverContentNonModal`, com `trap-focus: false`; modal é
 *               `PopoverContentModal`, que traz `trap-focus` ligado,
 *               `useBodyScrollLock` e `useHideOthers` (este último esconde os
 *               irmãos por `aria-hidden`, que é mais forte que `aria-modal`).
 *               A lib dá as DUAS coisas — por isso aquela stack é a REFERÊNCIA
 *               desta decisão.
 *   bits-ui   — NÃO tem `modal` nenhum. Tem `trapFocus` (padrão da LIB `true`) e
 *               `preventScroll` (padrão `false`), os dois no Content. São eles
 *               que passam a ser o mecanismo de `modal` naquela stack.
 *   radix-ng  — `modal` NÃO é booleano: `transformModal` aceita a string
 *               `'trap-focus'` além do booleano. Trapeia com
 *               `'trap-focus' || (modal === true && hasPopupClose())` e isola o
 *               lado de fora (`inert`) só com `modal === true && hasPopupClose()`.
 *               A trava de rolagem, como no base-ui, cai de `modal === true`
 *               sozinho (`useAnchoredScrollLock`). O `aria-modal` do Radix NG
 *               está no DIALOG, não no popover.
 *   vanilla   — esta fábrica. Não tem lib: o laço de tabulação, a trava contada
 *               e o `aria-modal` estão escritos aqui embaixo, e são a definição
 *               à qual as outras quatro se alinham.
 *
 * O buraco do `Close`, e por que ele NÃO foi contornado: em base-ui e em
 * radix-ng, `modal === true` só prende o foco se houver um botão de fechar
 * REGISTRADO dentro do painel. Isso faria `modal` continuar mentindo para quem
 * não renderizasse um. Nenhuma das duas stacks passou a injetar um botão que o
 * desenho não pede; as duas escrevem o laço de tabulação por conta própria — o
 * mesmo laço daqui — e deixam a lib com o que ela entrega sem condição, que é a
 * trava de rolagem. É a segunda saída que a dona autorizou: a stack implementa o
 * trap por outro caminho.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
import {
  positionFloating,
  type FloatingAlign,
  type FloatingSide,
} from '@/lib/floating';

export type PopoverSide = FloatingSide;
export type PopoverAlign = FloatingAlign;

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Vão entre gatilho e painel, em px. Mesmo nome e mesmo padrão das outras stacks. */
  sideOffset?: number;
  /**
   * Estado CONTROLADO. Definido, quem manda no painel é quem chama: o clique no
   * gatilho, o Escape e o clique fora passam a apenas ANUNCIAR a intenção por
   * `onOpenChange`, e o painel só se move quando `setOpen()` for chamado.
   *
   * Sem esta opção o popover se governa (não-controlado), que é o modo em que
   * ele nasceu e continua sendo o padrão.
   */
  open?: boolean;
  /** Estado inicial no modo não-controlado. */
  defaultOpen?: boolean;
  /**
   * Modo MODAL. Padrão `false`, que é o popover normal desta casa.
   *
   * `true` prende o foco no painel, trava a rolagem da página e faz o painel
   * anunciar `aria-modal="true"`. Os três andam juntos de propósito — ver o
   * bloco no cabeçalho deste arquivo para por que anunciar sem prender é
   * mentir para quem usa leitor de tela.
   */
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

/**
 * O que a fábrica devolve.
 *
 * Os três verbos em INGLÊS, como no Sidebar desta stack — que é a forma que o
 * repositório passou a adotar. (`createHoverCard` ainda expõe `open`/`close`;
 * renomear ali é mudança de API pública e tem dono.)
 */
export type PopoverElement = DestroyableElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Move o painel para o estado pedido. É por aqui que o modo controlado anda. */
  setOpen: (open: boolean) => void;
};

// ─── Sub-fábricas de conteúdo ────────────────────────────────────────────────
//
// Cabeçalho, título e descrição existem no CSS compartilhado
// (`.nds-popover-header`, `.nds-popover-title`, `.nds-popover-description`) e
// nas outras quatro stacks como componentes. Aqui não existiam: quem compunha
// montava a `<div>` e escrevia a classe à mão — e o `data-slot` documentado não
// saía em lugar nenhum.

export type PopoverPartOptions = {
  text?: string;
  class?: string;
};

function createParte(
  tag: keyof HTMLElementTagNameMap,
  slot: string,
  className: string,
  options: PopoverPartOptions,
): HTMLElement {
  const el = document.createElement(tag);
  el.dataset.slot = slot;
  el.className = cn(className, options.class);
  if (options.text) el.textContent = options.text;
  return el;
}

export function createPopoverHeader(options: PopoverPartOptions = {}): HTMLElement {
  return createParte('div', 'popover-header', 'nds-popover-header', options);
}

/**
 * Título do painel.
 *
 * Sai como `<h4>` por padrão: o painel é um `role="dialog"`, e é este elemento
 * que o `aria-labelledby` do painel encontra sozinho — a fábrica procura um
 * cabeçalho antes de cair no nome do gatilho. `level` troca a profundidade para
 * quem precisa encaixar na hierarquia da página.
 */
export type PopoverTitleOptions = PopoverPartOptions & { level?: 1 | 2 | 3 | 4 | 5 | 6 };

export function createPopoverTitle(options: PopoverTitleOptions = {}): HTMLElement {
  const { level = 4 } = options;
  return createParte(`h${level}` as keyof HTMLElementTagNameMap, 'popover-title', 'nds-popover-title', options);
}

export function createPopoverDescription(options: PopoverPartOptions = {}): HTMLElement {
  return createParte('p', 'popover-description', 'nds-popover-description', options);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _popoverCounter = 0;

/**
 * O que conta como "primeiro elemento focável" dentro do painel.
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((el) => !el.closest('[hidden]'));
}

// ─── createPopover ────────────────────────────────────────────────────────────

export function createPopover(options: PopoverOptions): PopoverElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    sideOffset = 8,
    modal = false,
    onOpenChange,
  } = options;

  const controlled = options.open !== undefined;

  const id = ++_popoverCounter;
  const contentId = `popover-content-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;
  // Espelha a trava PEDIDA por esta instância, e não o contador global de
  // `scroll-lock`. Sem esta bandeira, um `close()` que chegasse duas vezes
  // soltaria duas travas — e a segunda seria a de outro painel.
  let scrollLocked = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'popover';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  // O gatilho passa a declarar o próprio papel no markup, como nas demais
  // stacks — a peça que compõe vence o `data-slot` de quem foi composto.
  trigger.dataset.slot = 'popover-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  // `data-state` é o contrato de estado que a tabela de Estados do conteúdo
  // compartilhado descreve e que as demais stacks emitem pela lib headless.
  // Aqui não há lib: sem esta linha o atributo documentado não existiria em
  // lugar nenhum do stack de referência.
  trigger.dataset.state = 'closed';
  // aria-controls is set only when the popover is open (otherwise it
  // references a non-existent element, which fails axe aria-valid-attr-value).

  function open(): void {
    if (isOpen) return;

    panelEl = document.createElement('div');
    panelEl.id = contentId;
    panelEl.className = cn('nds-popover-content', options.class);
    panelEl.dataset.slot = 'popover-content';
    panelEl.dataset.state = 'open';
    // O lado e o encosto escolhidos ficam legíveis no markup, como nas outras
    // stacks — é o que permite a uma story provar que a opção chegou ao painel.
    panelEl.dataset.side = side;
    panelEl.dataset.align = align;
    panelEl.setAttribute('role', 'dialog');
    // `aria-modal` SÓ no modo modal, e nunca `"false"` no modo padrão: o
    // atributo ausente e o atributo negado dizem a mesma coisa ao leitor de
    // tela, e o ausente não corre o risco de sobreviver a uma troca de modo.
    if (modal) panelEl.setAttribute('aria-modal', 'true');
    // O painel recebe foco quando não há nada focável dentro: é o que faz o
    // leitor de tela anunciar o diálogo mesmo num painel só de texto.
    panelEl.tabIndex = -1;
    panelEl.style.position = 'absolute';

    if (typeof content === 'string') {
      panelEl.textContent = content;
    } else {
      panelEl.appendChild(content);
    }

    // Accessible name (axe rule: aria-dialog-name). Prefer an existing heading
    // inside the content via aria-labelledby; otherwise fall back to a string
    // aria-label derived from the trigger's accessible text.
    const heading = panelEl.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (heading) {
      if (!heading.id) heading.id = `${contentId}-title`;
      panelEl.setAttribute('aria-labelledby', heading.id);
    } else {
      const triggerName =
        trigger.getAttribute('aria-label') ||
        trigger.textContent?.trim() ||
        'Popover';
      panelEl.setAttribute('aria-label', triggerName);
    }

    document.body.appendChild(panelEl);
    positionFloating(trigger, panelEl, side, align, sideOffset);

    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', contentId);
    trigger.dataset.state = 'open';
    isOpen = true;

    // Trava CONTADA, e não `body.style.overflow` local: dois painéis abertos ao
    // mesmo tempo fariam o segundo guardar `hidden` como "valor anterior" e a
    // página nunca mais rolaria. O porquê inteiro está em `@/lib/scroll-lock`.
    if (modal) {
      lockBodyScroll();
      scrollLocked = true;
    }

    // O foco entra no painel — é o que separa o popover do tooltip. O conteúdo
    // é interativo (formulário, filtro, botões), e sem isto quem navega por
    // teclado teria de atravessar o resto da página para alcançá-lo. É a
    // promessa que o conteúdo compartilhado faz em três seções: acessibilidade,
    // estados e critérios de teste.
    (getFocusable(panelEl)[0] ?? panelEl).focus();

    document.addEventListener('keydown', handleKeydown);
    // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
    // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
    // registrado DEPOIS da limpeza e ficava para sempre.
    timerClickOutside = setTimeout(() => {
      timerClickOutside = null;
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    notificar(true);
  }

  function close(): void {
    if (!isOpen) return;

    // Se o foco estava dentro do painel — ou já se perdeu para o <body> —, ele
    // volta ao gatilho. Fechar removendo o elemento focado sem devolver o foco
    // manda quem navega por teclado de volta ao início da página (WCAG 2.4.3).
    // Quando a dispensa levou o foco a OUTRO controle da página, o foco fica
    // onde a pessoa o pôs: puxá-lo de volta seria roubá-lo.
    const focusEstavaInside =
      !!panelEl &&
      (panelEl.contains(document.activeElement) || document.activeElement === document.body);

    panelEl?.remove();
    panelEl = null;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-controls');
    trigger.dataset.state = 'closed';
    isOpen = false;

    if (timerClickOutside !== null) {
      clearTimeout(timerClickOutside);
      timerClickOutside = null;
    }
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);

    if (scrollLocked) {
      unlockBodyScroll();
      scrollLocked = false;
    }

    if (focusEstavaInside) trigger.focus();

    notificar(false);
  }

  function setOpen(next: boolean): void {
    if (next) open();
    else close();
  }

  /**
   * Anuncia a mudança de estado.
   *
   * Controlado, o painel não anuncia o que ele próprio aplicou: quem pediu foi
   * quem chama, e o aviso já saiu na intenção. Sem esta cerca, um
   * `onOpenChange` que responde com `setOpen()` receberia o evento duas vezes.
   */
  function notificar(isOpen: boolean): void {
    if (!controlled) onOpenChange?.(isOpen);
  }

  /**
   * Intenção de mudança vinda de uma INTERAÇÃO (clique, Escape, clique fora).
   *
   * Controlado, ela só é anunciada: quem manda no estado é quem chama. Não
   * controlado, ela é executada — e `open`/`close` anunciam por conta própria.
   */
  function pedirChange(next: boolean): void {
    if (controlled) {
      onOpenChange?.(next);
      return;
    }
    setOpen(next);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      // `close()` já devolve o foco ao gatilho quando ele estava dentro do
      // painel, que é sempre o caso vindo do Escape.
      pedirChange(false);
      return;
    }

    // Laço de tabulação — SÓ no modo modal. Mesma forma do `dialog.ts` desta
    // stack, de propósito: é o mesmo problema, e duas escritas diferentes do
    // mesmo laço divergiriam na primeira correção.
    //
    // Fora do modo modal não há ramo nenhum aqui: o `Tab` segue a ordem da
    // página e SAI do painel, que é o contrato padrão do popover.
    if (modal && e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      // Sem nada focável dentro, o foco não tem para onde ir e ficar preso é
      // literal: o painel já tem `tabindex="-1"` e segura o foco.
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (!panelEl?.contains(target) && !trigger.contains(target)) {
      pedirChange(false);
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    pedirChange(!isOpen);
  });

  // O painel mora em portal no body: quando o wrapper sai do DOM — troca de
  // story no Storybook, desmonte de página — nada removeria o painel, e ele
  // sobreviveria por cima do conteúdo seguinte junto com o `keydown` e o
  // `click` de fora. Mesma forma do dialog e do sheet.
  // `Object.assign` e não um `as`: os verbos entram no tipo do próprio alvo, e
  // `tornarDestruivel` devolve exatamente `PopoverElement` sem conversão. Uma
  // asserção aqui teria de passar por `unknown` — o wrapper é `HTMLDivElement` e
  // o tipo declarado parte de `HTMLElement`, e nenhum dos dois cobre o outro.
  const instancia = tornarDestruivel(
    wrapper,
    Object.assign(wrapper, {
      open,
      close,
      toggle: () => setOpen(!isOpen),
      setOpen,
    }),
    () => {
      if (isOpen) close();
    },
  );

  // Estado inicial. No modo controlado quem manda é `open`; fora dele,
  // `defaultOpen`. Adiado uma volta do laço de eventos, e não um microtique: a
  // raiz ainda não entrou no documento quando a fábrica retorna, e posicionar o
  // painel exige medir um gatilho já no layout.
  const startsOpen = controlled ? options.open === true : options.defaultOpen === true;
  if (startsOpen) {
    setTimeout(() => {
      // A raiz pode ter sido descartada antes deste tique. Abrir aqui portaria
      // um painel para o `body` sem ninguém com referência para fechá-lo.
      if (wrapper.isConnected) open();
    }, 0);
  }

  return instancia;
}
