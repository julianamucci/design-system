// ─── HoverCard — Vanilla factory standalone ─────────────────────────────────
// Visual: classe .nds-hover-card-content (standalone).
// Mostra ao hover do trigger; mantém aberto enquanto mouse está sobre o painel.
//
// ─── Acessibilidade: o que separa este cartão do tooltip e do popover ───────
//
// Bloco canônico do sistema. As outras quatro stacks carregam a versão curta
// mais o mecanismo da lib delas; a decisão é esta, e foi medida na FONTE das
// quatro libs, não na documentação.
//
// Os três abrem uma caixa flutuante. A diferença é QUEM chega até ela:
//
//  · **tooltip DESCREVE.** Não recebe foco, não tem conteúdo próprio, e a
//    persistência da 1.4.13 é resolvida por COORDENADA — a folha dá
//    `pointer-events: none` ao balão, então o ponteiro nunca o "perde".
//  · **popover RECEBE FOCO.** Tem conteúdo interativo, abre por clique, e por
//    isso ganhou `modal`: há para onde levar o foco e de onde devolvê-lo.
//  · **hover-card abre por PONTEIRO.** Nenhuma das cinco stacks move o foco
//    para o painel, e as cinco fecham no `blur` do gatilho. Some as duas
//    coisas: um Tab a partir do gatilho FECHA o cartão antes de alcançar o que
//    houver dentro. Conteúdo interativo no painel é inalcançável por teclado, e
//    isso não é defeito de uma stack — é a forma do gesto.
//
// Daí saem três regras do COMPONENTE, não do exemplo:
//
//  1. o painel nunca carrega ação, link ou campo. Medido: nenhuma composição
//     das cinco stacks põe elemento focável dentro do painel;
//  2. o cartão é ENRIQUECIMENTO. O gatilho continua sendo o caminho — `<a>`
//     quando navega, `<button>` quando só explica —, e a informação tem sempre
//     uma via alternativa (a página de perfil, o glossário);
//  3. abrir por FOCO é obrigatório, e as cinco abrem. Sem isso o conteúdo
//     simplesmente não existiria para quem não usa ponteiro.
//
// WCAG 1.4.13, as três condições e onde cada uma é cumprida:
//
//  · **dispensável** — Escape fecha, e o clique fora também (D13). Os dois
//    ouvintes são do DOCUMENTO porque o foco fica no gatilho, nunca dentro do
//    painel;
//  · **pairável** — o ponteiro entra no painel sem fechá-lo;
//  · **persistente** — só some por Escape, por clique fora, pelo ponteiro sair
//    ou pelo blur.
//
// E abrir por FOCO tem um filtro (D12): só o foco VISÍVEL abre. Tab abre; foco
// movido por script, não — ver `handleFocus`.
//
// **Descrição sim, papel não** — decisão de 2026-09-02, e ela INVERTE a
// anterior, que está registrada aqui porque o argumento dela continua correto.
//
// Antes: o painel era `role="dialog"` com nome tirado do gatilho, e o gatilho
// não apontava para ele. A razão escrita era que `aria-describedby` faria o
// leitor anunciar o link e em seguida descrevê-lo com um diálogo de nome
// idêntico — a mesma coisa duas vezes. Isso é verdade, e resolve o problema
// errado: a duplicação só existia porque o painel era um diálogo HOMÔNIMO, e
// ser diálogo foi escolha nossa, não do gesto.
//
// O defeito real, medido: com o cartão ABERTO na tela, quem usa leitor de tela
// ouvia só o gatilho. Nada move o foco para o painel, ele não é focalizável, e
// o `blur` do gatilho agenda o fecho — então o Tab seguinte fecha o cartão
// antes de alcançá-lo. O conteúdo nunca era dito.
//
// Agora: o painel não tem papel nenhum, e o gatilho o aponta por
// `aria-describedby` — o padrão para conteúdo revelado por gatilho e não
// navegável, o mesmo do tooltip.
//
//  · o que se GANHA: o CONTEÚDO é anunciado, no foco do gatilho, que é o único
//    momento em que a pessoa está lá;
//  · o que se PERDE: o painel deixa de ter papel próprio na árvore de
//    acessibilidade. Não há mais um "diálogo" para o leitor listar ou navegar;
//    ele passa a ser texto que descreve o gatilho. Para conteúdo suplementar de
//    duas linhas, esse nó nunca serviu para nada — e o preço dele era o
//    silêncio acima.
//
// A alternativa foi considerada e RECUSADA: tornar o painel alcançável de
// verdade (o foco entra, o Escape devolve, o `blur` não fecha) faria sentido se
// ele pudesse conter link ou botão. A regra 1 acima diz que não pode, e foi
// medido que nenhuma composição das cinco stacks põe elemento focável ali —
// seria custo sem uso.
//
// Consequências de markup, e as cinco emitem igual:
//
//  · o painel não tem `role`, e por isso não tem nome PRÓPRIO: `aria-label` em
//    elemento sem papel é `aria-prohibited-attr` no axe. O atributo saiu junto
//    com o papel, em vez de sobrar apontando para nada;
//  · `aria-describedby` só existe enquanto o painel existe. Escrevê-lo na
//    montagem, antes de haver painel, é `aria-valid-attr-value` no axe — é a
//    mesma razão pela qual o tooltip o cria dentro de `show()`;
//  · `aria-labelledby` continua fora: trocaria o nome do link pelo do cartão;
//  · `aria-expanded`/`aria-haspopup` continuam fora: o cartão é conteúdo
//    suplementar, não um menu que o leitor comanda.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type Destroyable } from '@/lib/destroy';
import { autoUpdateFloating, positionFloating } from '@/lib/floating';

export type HoverCardSide = 'top' | 'bottom' | 'left' | 'right';
export type HoverCardAlign = 'start' | 'center' | 'end';

/**
 * Por qual caminho o cartão fechou, no vocabulário do DESIGN SYSTEM.
 *
 * As mesmas palavras do popover e da família do dialog — `overlay` é o nome que
 * esta casa dá ao clique FORA, e não ao véu, que este componente não tem. Sem
 * um vocabulário declarado cada fábrica inventaria o seu, que foi como o mesmo
 * campo acabou com três nomes no GA4 (D7).
 *
 * Fechar por PONTEIRO (o cursor saiu) e por BLUR não tem palavra, de propósito:
 * é o caminho passivo, não um gesto de dispensa, e nomeá-lo obrigaria a
 * inventar uma quinta palavra fora do vocabulário da casa. Nesses casos o
 * motivo chega como `undefined` — e é por isso que ele é opcional na assinatura.
 */
export type HoverCardCloseReason = 'escape' | 'overlay' | 'api';

export type HoverCardOptions = {
  trigger: HTMLElement;
  content: HTMLElement;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  /** Vão entre gatilho e painel, em px. O `sideOffset` das outras quatro. */
  sideOffset?: number;
  /** Deslocamento no eixo CRUZADO, em px. O `alignOffset` das outras quatro. */
  alignOffset?: number;
  /** Espera em ms antes de abrir, depois que o ponteiro entra no gatilho. */
  openDelay?: number;
  /** Espera em ms antes de fechar, depois que o ponteiro sai. */
  closeDelay?: number;
  /** Abre já na montagem — o equivalente não-controlado das outras stacks. */
  defaultOpen?: boolean;
  /**
   * Cada abertura e cada fechamento. No fechamento vem também o MOTIVO, quando
   * houve um gesto de dispensa — ver `HoverCardCloseReason`.
   */
  onOpenChange?: (open: boolean, reason?: HoverCardCloseReason) => void;
  class?: string;
};

/**
 * Raiz do cartão com os dois comandos imperativos.
 *
 * É a forma que o modo CONTROLADO tem numa factory: não há prop reativa para
 * observar, então quem controla chama `open()`/`close()` e recebe cada
 * mudança de volta por `onOpenChange`. Antes disso, a única maneira de abrir
 * por fora era despachar um `mouseenter` falso no gatilho — o que testava o
 * evento, não o estado.
 */
export type HoverCardElement = HTMLElement & Destroyable & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _hoverCardCounter = 0;

/**
 * Espera padrão do design system, igual nas cinco stacks.
 *
 * 600ms respeita a diretriz de uso (≥300ms) sem fazer o cartão abrir a cada
 * passada de cursor; 300ms para fechar dá tempo de o ponteiro atravessar o vão
 * entre o gatilho e o painel.
 */
const WAIT_DEFAULT_OPEN = 600;
const WAIT_DEFAULT_CLOSE = 300;

/**
 * Vão padrão entre gatilho e painel, igual nas cinco stacks.
 *
 * Era 8 aqui e no Angular contra 4 nas outras três — a mesma divergência que o
 * popover carregava, e fechada do mesmo jeito e pelo mesmo motivo: o vão é
 * decisão do design system, não da lib de cada stack, e três quintos já diziam
 * 4. Quem quiser outro passa `sideOffset`.
 */
const SIDE_OFFSET_DEFAULT = 4;

/**
 * Deslocamento no eixo CRUZADO, e ele é ZERO nas cinco stacks (D11, 2026-09-17).
 *
 * Declarado, e não omitido: o react carregava 4 aqui enquanto as outras quatro
 * valiam 0, e a divergência sobreviveu meses porque três das cinco não diziam
 * número nenhum — o valor era o que a lib de cada uma tinha por padrão, e ausência
 * de declaração não é comparável com nada. A D9 fixou o vão do eixo PRINCIPAL
 * (`sideOffset`) e passou a impressão de ter tratado os dois.
 *
 * Zero porque o cartão é CENTRADO no gatilho: `align` é `center` em todas as
 * stories das cinco, e o painel cresce a partir da peça que o pediu.
 */
const ALIGN_OFFSET_DEFAULT = 0;

/**
 * Posiciona o painel com a conta COMPARTILHADA, não com uma cópia.
 *
 * Havia aqui uma quarta cópia da geometria — as três que `lib/floating.ts`
 * consolidou mais esta, que ficou de fora da consolidação e por isso nunca
 * ganhou o que as outras ganharam desde então: limite de viewport, troca de
 * lado quando o pedido não cabe, e o `sideOffset` como parâmetro em vez de um
 * `gap` cravado. O cartão pedido para cima numa menção perto do topo da tela
 * saía da tela em silêncio, porque nada aqui olhava para a janela.
 *
 * `flip: true` faz o `positionFloating` escrever o `data-side` FINAL — que é o
 * que a folha e as stories leem. Com o lado cravado, o atributo continuaria
 * dizendo `top` depois de o painel ter descido, e atributo que contradiz a
 * coordenada é pior que atributo nenhum.
 */
function positionHoverCard(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: HoverCardSide,
  align: HoverCardAlign,
  sideOffset: number,
  alignOffset: number
): void {
  positionFloating(anchor, panel, side, align, sideOffset, { flip: true, alignOffset });
  // O `align` não muda com o flip, então continua sendo escrito aqui; o `side`
  // é do `positionFloating`, que conhece o lado final.
  panel.dataset.align = align;
}

// ─── createHoverCard ──────────────────────────────────────────────────────────

export function createHoverCard(options: HoverCardOptions): HoverCardElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    sideOffset = SIDE_OFFSET_DEFAULT,
    alignOffset = ALIGN_OFFSET_DEFAULT,
    openDelay = WAIT_DEFAULT_OPEN,
    closeDelay = WAIT_DEFAULT_CLOSE,
    defaultOpen = false,
    onOpenChange,
  } = options;

  const id = ++_hoverCardCounter;
  const cardId = `hover-card-${id}`;

  let panelEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  // A limpeza do acompanhamento de posição — só existe com o cartão aberto, e
  // `hide()` a chama. Ver `autoUpdateFloating` em `@/lib/floating`.
  let stopAutoUpdate: (() => void) | null = null;
  // O registro do ouvinte de clique fora é ADIADO um tique (ver `show()`), e o
  // timer fica guardado porque o fechamento pode chegar antes dele.
  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;

  // O elemento nasce sem os dois comandos e os recebe no fim desta função —
  // por isso a conversão passa por `unknown`: o `<div>` só vira `HoverCardElement`
  // depois de `open`/`close` existirem.
  const wrapper = document.createElement('div') as unknown as HoverCardElement;
  wrapper.dataset.slot = 'hover-card';
  wrapper.style.display = 'contents';
  // O gatilho se NOMEIA, como nas outras quatro stacks. Faltava só aqui, e a
  // ausência não aparecia porque nenhuma story consultava o gatilho por
  // `data-slot` — a primeira que consultou (a asserção de ancoragem) encontrou
  // zero pares no vanilla e quatro em todas as outras.
  trigger.dataset.slot = 'hover-card-trigger';
  wrapper.appendChild(trigger);

  // Escape fecha (WCAG 1.4.13, dismissable). O listener é do DOCUMENTO porque o
  // foco fica no gatilho — nunca dentro do painel — e só vive enquanto o cartão
  // está aberto: um listener por instância, permanente, vazaria em toda página
  // com muitas menções.
  function onKeyDown(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') hide('escape');
  }

  // Clique FORA fecha (D13, decisão da dona de 2026-09-17). As outras quatro
  // stacks já fechavam — cada uma pela dispensa da lib dela —, e esta não
  // fechava por não ter o ouvinte: não era contrato, era ausência.
  //
  // Sem ele, as duas saídas que havia não bastavam. Escape não é caminho no
  // toque, e "tirar o ponteiro" não acontece quando o ponteiro foi para outro
  // lugar CLICANDO — o cartão ficava na tela por cima do assunto seguinte.
  //
  // O gatilho conta como DENTRO: clicar na menção é seguir o link, não dispensar
  // o cartão.
  function handleOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (panelEl?.contains(target) || trigger.contains(target)) return;
    hide('overlay');
  }

  /**
   * Abrir por foco, mas só pelo foco VISÍVEL (D12, decisão da dona de 2026-09-17).
   *
   * O que sustenta a WCAG 1.4.13 para quem navega por teclado é o TAB, e ele
   * casa `:focus-visible` — continua abrindo. O que deixa de abrir é `.focus()`
   * por script: foco movido por código não é gesto de quem lê, é a página se
   * reorganizando, e um cartão que aparece aí é ruído sobre alguém que não pediu
   * nada.
   *
   * O filtro é o MESMO teste que o base-ui (react) e o bits-ui (svelte) já
   * faziam por dentro — as duas stacks que não abriam com foco cru. Aqui ele é
   * explícito porque não há lib para fazê-lo.
   */
  function handleFocus(): void {
    if (!trigger.matches(':focus-visible')) return;
    scheduleShow();
  }

  function show(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.id = cardId;
    panelEl.className = cn('nds-hover-card-content', options.class);
    panelEl.dataset.slot = 'hover-card-content';
    panelEl.appendChild(content);

    // `position: absolute` sai daqui e não da folha: nas outras quatro stacks o
    // painel fica em FLUXO dentro de um invólucro que a lib posiciona, e uma
    // declaração compartilhada colapsaria esse invólucro para 0×0. Quem escreve
    // é o `measurePanel` do `positionFloating`, antes de medir.
    document.body.appendChild(panelEl);
    // A conta roda de novo a cada rolagem, redimensionamento da janela ou
    // mudança de tamanho do gatilho ou do cartão, enquanto ele está aberto —
    // `positionHoverCard` inteira, porque é ela que reescreve o `data-side`
    // quando a rolagem faz o lado pedido deixar de caber. Só geometria: nada é
    // anunciado (`onOpenChange` fica de fora) e o foco não é tocado.
    const panel = panelEl;
    const place = (): void =>
      positionHoverCard(trigger, panel, side, align, sideOffset, alignOffset);
    place();
    stopAutoUpdate?.();
    stopAutoUpdate = autoUpdateFloating(trigger, panel, place);

    // O gatilho é DESCRITO pelo painel, e só enquanto o painel EXISTE — o
    // `id` acima é o alvo. Escrever o atributo na montagem, com o cartão ainda
    // fechado, apontaria para um nó que não está no documento: é
    // `aria-valid-attr-value` no axe, e é por isso que ele nasce aqui e morre
    // em `hide()`.
    trigger.setAttribute('aria-describedby', cardId);

    // Keep card open while hovering over it
    panelEl.addEventListener('mouseenter', () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    panelEl.addEventListener('mouseleave', scheduleHide);
    document.addEventListener('keydown', onKeyDown);
    // ADIADO um tique, e o motivo é o modo comandado: quem abre o cartão por
    // `open()` no `click` de um botão ainda está no meio desse clique, que
    // chegaria ao `document` DEPOIS de o ouvinte entrar — e o cartão fecharia no
    // mesmo gesto que o abriu. Mesma forma do `popover.ts` desta stack.
    //
    // O timer é guardado porque o fechamento pode chegar antes dele: sem
    // cancelar, o ouvinte era registrado DEPOIS da limpeza e ficava para sempre.
    timerClickOutside = setTimeout(() => {
      timerClickOutside = null;
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    onOpenChange?.(true);
  }

  function hide(reason?: HoverCardCloseReason): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (timerClickOutside !== null) { clearTimeout(timerClickOutside); timerClickOutside = null; }
    if (!panelEl) return;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('click', handleOutsideClick);
    // Antes de remover o painel: um quadro já agendado não pode medir um nó que
    // saiu do documento.
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    // A descrição sai junto com o painel: sobrando, apontaria para um nó que
    // não existe mais.
    trigger.removeAttribute('aria-describedby');
    panelEl.remove();
    panelEl = null;
    // O motivo só existe quando houve GESTO de dispensa. Ponteiro que saiu,
    // blur e desmonte chegam sem palavra — ver `HoverCardCloseReason`.
    onOpenChange?.(false, reason);
  }

  function scheduleShow(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    // Arrow literal — ver tooltip.ts pra justificativa.
    showTimer = setTimeout(() => { show(); }, openDelay);
  }

  function scheduleHide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(() => { hide(); }, closeDelay);
  }

  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', scheduleHide);

  // Abrir por FOCO, e não só por ponteiro: é o que sustenta a WCAG 1.4.13 para
  // quem navega por teclado, e é o comportamento que as outras quatro stacks
  // herdam da lib. Sem isto o cartão era inalcançável sem mouse. O filtro de
  // foco VISÍVEL está em `handleFocus` (D12).
  trigger.addEventListener('focus', handleFocus);
  trigger.addEventListener('blur', scheduleHide);

  // `panelEl` É o estado: o painel existe enquanto o cartão está aberto e é
  // removido ao fechar. Não há sinalizador paralelo a dessincronizar.
  //
  // Os comandos fecham com `api`: quem chama `close()` é código de quem consome,
  // e é essa a palavra da casa para fechamento decidido de dentro.
  wrapper.open = show;
  wrapper.close = () => { hide('api'); };
  wrapper.toggle = () => { if (panelEl) hide('api'); else show(); };
  wrapper.isOpen = () => panelEl !== null;

  /*
   * O painel mora no `document.body` e os dois ouvintes de dispensa — o
   * `keydown` de Escape e o `click` de fora — vivem no `document`, só enquanto o
   * cartão está EXIBIDO e todos soltos por `hide()`. Quem removia o wrapper com
   * o cartão aberto não passava por `hide()`: sobravam o painel órfão e os
   * ouvintes presos a um nó desanexado.
   *
   * `hide()` também derruba os TRÊS temporizadores (abrir, fechar e o tique que
   * arma o clique fora). Sem isso, um `show()` agendado dispararia DEPOIS da
   * remoção e poria um painel novo na página, junto com ouvintes novos —
   * vazamento criado pela própria saída.
   *
   * SEM motivo: desmontar não é fechar. A saída da raiz é troca de story, troca
   * de idioma ou desmonte de página, e anunciar um gesto ali poria no GA4 um
   * fechamento que ninguém fez.
   */
  tornarDestruivel(wrapper, wrapper, () => { hide(); });

  if (defaultOpen) {
    // `requestAnimationFrame` e não `queueMicrotask`: posicionar exige o
    // retângulo do gatilho, e ele só existe depois de o wrapper entrar no
    // documento e o navegador calcular o layout.
    requestAnimationFrame(() => { show(); });
  }

  return wrapper;
}
