/**
 * ─── Arraste para dispensar do Drawer ────────────────────────────────────────
 *
 * Motor de ponteiro sem framework, consumido pelas duas stacks que não montam
 * sobre uma lib de gaveta. Onde há lib, o gesto vem dela; aqui ele é escrito à
 * mão com `pointerdown` / `pointermove` / `pointerup` e captura de ponteiro, que
 * é exatamente o que a lib faz por dentro.
 *
 * ─── O que foi LIDO na lib, e o que está reproduzido ─────────────────────────
 *
 * A leitura foi na fonte publicada em `node_modules` da stack de React, no
 * componente de gaveta que as três stacks com lib usam. O gesto de lá tem três
 * momentos, e são estes três:
 *
 *   · ao pressionar — mede o painel, marca o instante, captura o ponteiro no
 *     alvo (para continuar recebendo movimento mesmo com o dedo fora do painel)
 *     e guarda a coordenada inicial do eixo da direção;
 *   · ao mover — converte o deslocamento em translação na direção de dispensa,
 *     com resistência logarítmica quando o movimento vai para ALÉM do aberto,
 *     e suprime a transição enquanto durar;
 *   · ao soltar — decide entre dispensar e voltar ao repouso por VELOCIDADE
 *     (0,4 px/ms) ou por DISTÂNCIA (25% do tamanho do painel no eixo).
 *
 * Os dois limiares e a fórmula da resistência são os da lib, com os mesmos
 * valores: `VELOCITY_THRESHOLD = 0.4`, `CLOSE_THRESHOLD = 0.25`,
 * `dampenValue(v) = 8 * (ln(v + 1) − 2)`. A guarda de rolagem também: o gesto
 * não começa se o movimento estiver descendo para dentro de uma região que rola
 * e que não está no topo, e há uma janela de silêncio de 100 ms depois de uma
 * rolagem recusada, mais uma carência de 500 ms depois da abertura (o painel
 * ainda está entrando; ali todo movimento é rolagem, não arraste).
 *
 * ─── O que NÃO foi reproduzido, e por quê ───────────────────────────────────
 *
 *   · Pontos de parada intermediários (snap points). Nenhuma das cinco stacks
 *     os expõe — nem as três que os teriam de graça pela lib. Reproduzi-los
 *     aqui criaria capacidade que só existe em duas stacks, e capacidade nova
 *     de arraste é justamente o que a WCAG 2.5.7 obriga a ter caminho
 *     alternativo. Sem eles, o gesto não faz NADA que fechar não faça.
 *   · Escala do fundo da página e o véu clareando junto com o arraste. São
 *     enfeites que a lib só liga sob opção, e nenhuma stack liga.
 *   · `user-select: none` permanente no painel. A folha suprime a seleção só
 *     durante o gesto (`[data-swiping]`); a guarda de texto já selecionado, que
 *     é o que a lib usa junto, está reproduzida aqui.
 *   · A coordenada lida. A lib usa `pageY`/`pageX`; aqui é `clientY`/`clientX`.
 *     Os dois diferem pelo deslocamento de rolagem da página, que é constante
 *     durante o gesto sempre que o painel é modal — e modal trava a rolagem. No
 *     painel NÃO modal, em que a página pode rolar no meio do arraste, a
 *     diferença deixa de ser constante e `page*` somaria a rolagem ao gesto: o
 *     painel andaria sem o dedo ter andado. É correção deliberada, não descuido.
 *
 * ─── Acessibilidade ──────────────────────────────────────────────────────────
 *
 * O gesto é EXTRA de ponteiro, nunca caminho único (WCAG 2.5.7). Tudo o que ele
 * faz é dispensar o painel, e dispensar já tem três caminhos sem trajeto:
 * Escape, clique no véu e o botão de saída do rodapé. Não há redimensionar, não
 * há parada intermediária, não há nada que só o arraste alcance — foi por isso
 * que os pontos de parada ficaram de fora.
 *
 * A alça continua `aria-hidden` e sem foco: ela não é o gancho do gesto (o
 * arraste vale no painel inteiro, como na lib), então dar-lhe foco criaria uma
 * parada de tabulação que não faz nada.
 */

/** Borda por onde o painel entra — e, portanto, o eixo da dispensa. */
export type DrawerSwipeDirection = 'bottom' | 'top' | 'left' | 'right';

/** Velocidade a partir da qual soltar dispensa, em px/ms. Valor da lib. */
export const DRAWER_SWIPE_VELOCITY_THRESHOLD = 0.4;

/** Fração do tamanho do painel a partir da qual soltar dispensa. Valor da lib. */
export const DRAWER_SWIPE_CLOSE_THRESHOLD = 0.25;

/** Silêncio depois de uma rolagem que recusou o arraste, em ms. Valor da lib. */
export const DRAWER_SWIPE_SCROLL_LOCK_TIMEOUT = 100;

/** Carência depois da abertura, em ms — o painel ainda está entrando. Valor da lib. */
export const DRAWER_SWIPE_OPEN_GRACE = 500;

/** Eixo vertical? Decide se o gesto lê `clientY` ou `clientX`. */
export function isVerticalDrawerSwipe(direction: DrawerSwipeDirection): boolean {
  return direction === 'bottom' || direction === 'top';
}

/**
 * Sinal que leva o painel PARA FORA da tela, no eixo da direção.
 *
 * Um painel de baixo sai descendo (+1); um de cima sai subindo (−1). O mesmo
 * para direita (+1) e esquerda (−1).
 */
export function drawerDismissSign(direction: DrawerSwipeDirection): 1 | -1 {
  return direction === 'bottom' || direction === 'right' ? 1 : -1;
}

/**
 * Resistência ao puxar o painel para além do aberto.
 *
 * A curva é a da lib, sem ajuste: o deslocamento vira logaritmo, então os
 * primeiros pixels quase não andam e o painel para de responder rápido. Só é
 * chamada no sentido de ABRIR mais, nunca no de dispensar.
 */
export function dampenDrawerSwipe(distance: number): number {
  return 8 * (Math.log(distance + 1) - 2);
}

/**
 * Translação a aplicar no painel, em px no eixo da direção, com sinal.
 *
 * `travel` é o quanto o ponteiro andou NO SENTIDO DE DISPENSAR (positivo) ou no
 * sentido de abrir mais (negativo). O retorno já é o valor para `translate3d`.
 *
 * `reducedMotion` desliga a elasticidade do sentido de abrir: puxar além do
 * aberto passa a não mover nada. É movimento que não corresponde a intenção
 * nenhuma — o painel já está aberto —, e é o único pedaço do gesto que a
 * preferência alcança. Seguir o dedo no sentido de dispensar continua, porque
 * ali o movimento É a intenção.
 */
export function drawerSwipeTranslate(
  travel: number,
  direction: DrawerSwipeDirection,
  reducedMotion = false,
): number {
  const sign = drawerDismissSign(direction);
  if (travel >= 0) return travel * sign;
  if (reducedMotion) return 0;
  // A lib trava em zero pelo lado de fora: enquanto a curva não passa de zero
  // (os primeiros ~6px), o painel não anda nada. Mesma trava, mesma fórmula.
  return Math.min(dampenDrawerSwipe(-travel) * -1, 0) * sign;
}

/** O que soltar o ponteiro resolve. */
export type DrawerSwipeRelease = 'dismiss' | 'reset';

export type DrawerReleaseInput = {
  /** Quanto o ponteiro andou no sentido de dispensar, em px (pode ser negativo). */
  travel: number;
  /** Duração do gesto, em ms. */
  elapsed: number;
  /** Tamanho do painel no eixo da direção, em px. */
  size: number;
};

/**
 * Dispensar ou voltar ao repouso?
 *
 * A ordem das três perguntas é a da lib, e a ordem importa: movimento no sentido
 * de ABRIR volta ao repouso sem olhar velocidade nenhuma (senão um puxão para
 * cima num painel de baixo fecharia o painel), depois vem a velocidade, e a
 * distância fica por último.
 *
 * `elapsed` zero não é hipótese de teste — é o gesto de um quadro só. Dividir
 * por ele daria `Infinity`, que passaria pelo limiar de velocidade e fecharia o
 * painel com um toque parado; por isso a velocidade só é consultada com tempo
 * positivo.
 */
export function resolveDrawerRelease({ travel, elapsed, size }: DrawerReleaseInput): DrawerSwipeRelease {
  if (travel <= 0) return 'reset';
  if (elapsed > 0 && travel / elapsed > DRAWER_SWIPE_VELOCITY_THRESHOLD) return 'dismiss';
  if (size > 0 && travel >= size * DRAWER_SWIPE_CLOSE_THRESHOLD) return 'dismiss';
  return 'reset';
}

/**
 * As cinco perguntas que decidem se o movimento vira arraste.
 *
 * Separadas do DOM de propósito: a ORDEM é o que a lib define, e ordem é o que
 * se prende num teste sem navegador. Quem lê a árvore é
 * `shouldStartDrawerSwipe`, logo abaixo.
 */
export type DrawerDragGuardFlags = {
  /** O alvo se declarou fora do arraste (`<select>` nativo, `[data-no-drag]`). */
  optedOut: boolean;
  /** Painel lateral: o eixo do arraste não é o da rolagem, então não há disputa. */
  sideways: boolean;
  /** Já existe texto selecionado — o gesto é de seleção, não de arraste. */
  hasSelection: boolean;
  /** Movimento no sentido de ABRIR mais; ali rolar tem prioridade. */
  openingWards: boolean;
  /** Há região rolável entre o alvo e o painel que não está no topo. */
  scrollOwnsIt: boolean;
};

/** Ordem das perguntas — a mesma da lib, e é a ordem que importa. */
export function resolveDrawerDragGuard(flags: DrawerDragGuardFlags): boolean {
  if (flags.optedOut) return false;
  if (flags.sideways) return true;
  if (flags.hasSelection) return false;
  if (flags.openingWards) return false;
  return !flags.scrollOwnsIt;
}

/**
 * O movimento pode virar arraste, ou é rolagem de alguém?
 *
 * Sobe a árvore a partir do alvo procurando região que rola. Se achar uma que
 * NÃO está no topo, o movimento pertence a ela. A busca para no painel, que é
 * onde a lib também para (lá o critério é `role="dialog"`; aqui é o próprio
 * elemento em que o motor foi instalado, que é o mesmo nó).
 */
export function shouldStartDrawerSwipe(options: {
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
 * cada abertura nas duas stacks que usam isto, então nada se acumula entre
 * aberturas. A captura de ponteiro é o que mantém o gesto vivo quando o dedo sai
 * do painel no meio do arraste — sem ela, o `pointerup` chegaria a outro
 * elemento e o painel ficaria travado na posição em que o dedo o deixou.
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
