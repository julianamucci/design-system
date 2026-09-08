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
 * se prende num teste sem navegador — os casos de unidade cobrem esta função,
 * e não a caminhada que a alimenta.
 *
 * Quem LÊ a árvore para computar estas bandeiras é `shouldStartDrawerSwipe`,
 * que mora em cada stack (`ui/drawer-swipe.ts` no vanilla, dentro da diretiva
 * `NdsDrawerSwipe` no angular). A separação já estava escrita aqui antes de a
 * régua existir; o que mudou é que agora as duas metades moram em lugares
 * diferentes, e não só em funções diferentes.
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

/*
 * ─── Onde está a outra metade, e por quê ─────────────────────────────────────
 *
 * Até 2026-09-08 este arquivo trazia também a FIAÇÃO do gesto — ouvir o
 * ponteiro, capturá-lo, escrever `data-swiping` e o transform no painel — e a
 * adaptadora que caminha na árvore para decidir se o arraste pode começar.
 * As duas foram para dentro das stacks que as usam.
 *
 * A régua está no CLAUDE.md da raiz: **se precisa de um `HTMLElement` para
 * funcionar, não é regra — é implementação.** Aqui ficou só `resolveX(dados)`.
 *
 * O que isso corrigiu, medido: nos 51 arquivos desta pasta, este era o ÚNICO a
 * anexar ouvinte de interação a elemento de componente. Vanilla e Angular
 * CONSUMIAM o gesto em vez de implementá-lo, o que tirava das duas a prova que
 * cinco stacks existem para dar — e a capacidade sumia das buscas, porque o
 * gesto não morava onde o componente mora.
 *
 * Onde a fiação está agora:
 *   · vanilla — `src/components/ui/drawer-swipe.ts`
 *   · angular — a diretiva `NdsDrawerSwipe`, em `src/components/ui/drawer.ts`
 *
 * As outras três recebem o gesto da lib que carregam. Os limiares desta folha
 * são os mesmos da lib, lidos da fonte publicada — é isso que mantém as cinco
 * decidindo igual, e é o motivo de eles ficarem AQUI.
 */
