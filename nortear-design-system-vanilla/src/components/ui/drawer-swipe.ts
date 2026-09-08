/**
 * ─── Arraste para dispensar do Drawer — a metade que TOCA no elemento ────────
 *
 * Este arquivo mora na stack, ao lado do componente que o usa, e não em
 * `docs/shared/primitives/`. A régua é a do `@nortear/ds-core`: **se precisa de
 * um `HTMLElement` para funcionar, não é regra — é implementação.** O corte fica
 * entre `resolveX(dados)`, que decide, e `attachX(elemento)`, que age.
 *
 * O que decide continua compartilhado e é importado logo abaixo: os limiares, a
 * curva de resistência, o sinal de cada direção, a ordem das perguntas da guarda
 * de rolagem e a decisão ao soltar. Isso é regra do design system, o Flutter
 * pode querer ler, e é onde uma divergência com a lib de gaveta reprova.
 *
 * O que AGE — instalar os cinco ouvintes, capturar o ponteiro, escrever
 * `transform` e `data-swiping` no painel — é comportamento de componente, e
 * comportamento de componente é o que cada stack existe para implementar no
 * idioma dela. Consumir um motor pronto tirava desta stack, que não monta sobre
 * lib de gaveta, justamente essa prova; e fazia o gesto sumir das buscas de quem
 * procurava por `drawer` aqui dentro.
 *
 * O algoritmo é o mesmo de sempre, sem uma linha reescrita — mudou de arquivo,
 * não de comportamento. A leitura na fonte da lib, o que foi reproduzido, o que
 * ficou de fora e a nota de acessibilidade (WCAG 2.5.7) continuam no cabeçalho
 * de `@shared/primitives/drawer-swipe`, junto das constantes que descrevem.
 */

import {
  DRAWER_SWIPE_OPEN_GRACE,
  DRAWER_SWIPE_SCROLL_LOCK_TIMEOUT,
  drawerDismissSign,
  drawerSwipeTranslate,
  isVerticalDrawerSwipe,
  resolveDrawerRelease,
  resolveDrawerDragGuard,
  type DrawerSwipeDirection,
} from '@shared/primitives/drawer-swipe';

/**
 * Decide se o gesto pode COMEÇAR, a partir do alvo do ponteiro.
 *
 * Mora aqui, e não no compartilhado, por caminhar na árvore: pela régua do
 * CLAUDE.md, o que precisa de um `HTMLElement` é implementação. A DECISÃO
 * continua vindo de `resolveDrawerDragGuard`, que recebe só bandeiras — é ela
 * que os testes de unidade cobrem, e é ela que o pacote publica.
 */
function shouldStartDrawerSwipe(options: {
  target: Element | null;
  panel: HTMLElement;
  direction: DrawerSwipeDirection;
  /** Movimento no sentido de ABRIR mais — nesse sentido, rolar tem prioridade. */
  openingWards: boolean;
  /** Já existe texto selecionado? Então o gesto é de seleção, não de arraste. */
  hasSelection: boolean;
}): boolean {
  const { target, panel, direction, openingWards, hasSelection } = options;
  if (!target) return false;

  // `<select>` nativo abre a própria lista de opções ao arrastar; a lib recusa
  // pelo mesmo motivo, e `[data-no-drag]` é a saída explícita de quem compõe.
  const optedOut = target.tagName === 'SELECT' || target.closest('[data-no-drag]') !== null;

  let scrollOwnsIt = false;
  let el: Element | null = target;
  while (el) {
    if (el.scrollHeight > el.clientHeight && el.scrollTop !== 0) {
      scrollOwnsIt = true;
      break;
    }
    if (el === panel) break;
    el = el.parentElement;
  }

  return resolveDrawerDragGuard({
    optedOut,
    sideways: direction === 'left' || direction === 'right',
    hasSelection,
    openingWards,
    scrollOwnsIt,
  });
}


export type DrawerSwipeOptions = {
  /** O painel. O transform, o `data-swiping` e os ouvintes vão nele. */
  panel: HTMLElement;
  /** Lido a cada gesto: a direção pode mudar entre aberturas. */
  direction: () => DrawerSwipeDirection;
  /** Lido a cada gesto: painel não dispensável não arrasta, como na lib. */
  dismissible: () => boolean;
  /** Chamado quando soltar resolve por dispensar. */
  onDismiss: () => void;
  /** Injetável para teste; por padrão, o relógio monotônico do documento. */
  now?: () => number;
};

/** O que `attachDrawerSwipe` devolve — só o desligamento. */
export type DrawerSwipeHandle = {
  /** Solta ouvintes e limpa o que o gesto tiver escrito no painel. */
  destroy: () => void;
};

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Instala o gesto no painel e devolve o desligamento.
 *
 * Os ouvintes vão no PRÓPRIO painel, e não no documento: o painel é um nó novo a
 * cada abertura nesta stack, então nada se acumula entre aberturas. A captura de
 * ponteiro é o que mantém o gesto vivo quando o dedo sai do painel no meio do
 * arraste — sem ela, o `pointerup` chegaria a outro elemento e o painel ficaria
 * travado na posição em que o dedo o deixou.
 */
export function attachDrawerSwipe(options: DrawerSwipeOptions): DrawerSwipeHandle {
  const { panel, direction, dismissible, onDismiss } = options;
  const now = options.now ?? (() => performance.now());

  const openedAt = now();
  let pointerId: number | null = null;
  let startedAt = 0;
  let startCoord = 0;
  let size = 0;
  /**
   * Já decidimos que este gesto é arraste?
   *
   * Uma vez que a guarda de rolagem liberou, ela não é consultada de novo até
   * soltar — é o mesmo que a lib faz, e o motivo é que uma região que rola pode
   * chegar ao topo no meio do movimento e o arraste começaria no meio do gesto.
   */
  let dragging = false;
  let lastRefusedAt = 0;
  let travel = 0;

  function limpar(): void {
    panel.style.transform = '';
    delete panel.dataset.swiping;
    dragging = false;
    pointerId = null;
    travel = 0;
  }

  function onPointerDown(e: PointerEvent): void {
    if (!dismissible()) return;
    if (pointerId !== null) return;
    // Botão do meio e direito não arrastam nada.
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const dir = direction();
    const rect = panel.getBoundingClientRect();
    // Travado no viewport como na lib: um painel mais alto que a tela mediria um
    // limiar de 25% que o dedo nunca alcançaria.
    size = isVerticalDrawerSwipe(dir)
      ? Math.min(rect.height, window.innerHeight)
      : Math.min(rect.width, window.innerWidth);
    startedAt = now();
    startCoord = isVerticalDrawerSwipe(dir) ? e.clientY : e.clientX;
    pointerId = e.pointerId;
    travel = 0;

    // A captura vai no alvo, como na lib: é o elemento que continuará recebendo
    // o movimento. `try` porque um alvo removido do documento entre o evento e
    // esta linha faz o navegador lançar.
    try {
      (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
    } catch {
      /* alvo saiu do documento — o gesto segue pelos ouvintes do painel */
    }
  }

  function onPointerMove(e: PointerEvent): void {
    if (pointerId === null || e.pointerId !== pointerId) return;

    const dir = direction();
    const sign = drawerDismissSign(dir);
    const coord = isVerticalDrawerSwipe(dir) ? e.clientY : e.clientX;
    travel = (coord - startCoord) * sign;

    if (!dragging) {
      const agora = now();
      // Carência de abertura: o painel ainda está deslizando para dentro.
      if (agora - openedAt < DRAWER_SWIPE_OPEN_GRACE) return;
      if (lastRefusedAt && agora - lastRefusedAt < DRAWER_SWIPE_SCROLL_LOCK_TIMEOUT) return;
      const liberou = shouldStartDrawerSwipe({
        target: e.target as Element | null,
        panel,
        direction: dir,
        openingWards: travel < 0,
        hasSelection: (globalThis.getSelection?.()?.toString() ?? '').length > 0,
      });
      if (!liberou) {
        lastRefusedAt = agora;
        return;
      }
      dragging = true;
      panel.dataset.swiping = '';
    }

    const offset = drawerSwipeTranslate(travel, dir, prefereMenosMovimento());
    panel.style.transform = isVerticalDrawerSwipe(dir)
      ? `translate3d(0, ${offset}px, 0)`
      : `translate3d(${offset}px, 0, 0)`;
  }

  function onPointerUp(e: PointerEvent): void {
    if (pointerId === null || e.pointerId !== pointerId) return;
    const arrastou = dragging;
    const percorrido = travel;
    const decorrido = now() - startedAt;
    limpar();
    if (!arrastou) return;
    if (resolveDrawerRelease({ travel: percorrido, elapsed: decorrido, size }) === 'dismiss') {
      onDismiss();
    }
  }

  /**
   * `pointercancel` volta ao repouso sem decidir nada.
   *
   * O navegador cancela quando assume o gesto para si (rolagem, zoom, gesto do
   * sistema). Tratar isso como "soltou" fecharia o painel quando quem cancelou
   * foi o sistema operacional, e não a pessoa.
   */
  function onPointerCancel(e: PointerEvent): void {
    if (pointerId === null || e.pointerId !== pointerId) return;
    limpar();
  }

  panel.addEventListener('pointerdown', onPointerDown);
  panel.addEventListener('pointermove', onPointerMove);
  panel.addEventListener('pointerup', onPointerUp);
  panel.addEventListener('pointercancel', onPointerCancel);

  return {
    destroy(): void {
      panel.removeEventListener('pointerdown', onPointerDown);
      panel.removeEventListener('pointermove', onPointerMove);
      panel.removeEventListener('pointerup', onPointerUp);
      panel.removeEventListener('pointercancel', onPointerCancel);
      limpar();
    },
  };
}
