// ─── Tooltip — Vanilla factory standalone ───────────────────────────────────
//
// Visual: classe .nds-tooltip-content (standalone).
// Render via portal (body) com posicionamento absoluto via JS.
//
// ─── Acessibilidade: a decisão, medida nas cinco stacks em 2026-09-02 ────────
//
// Tooltip é dos componentes mais fáceis de errar, então a decisão fica ESCRITA
// e não herdada. Este é o texto canônico; as outras quatro stacks trazem a
// versão curta e apontam para cá, que é onde o comportamento é definido.
//
// 1. ABRE POR FOCO, além de ponteiro, e o foco abre SEM ESPERA. Conteúdo que só
//    aparece no :hover não existe para quem navega por teclado (WCAG 2.1.1). A
//    espera existe para separar o ponteiro que atravessa do que para; no Tab não
//    há equivalente a "parar em cima". Aqui: `aoFocar`.
//
// 2. DISPENSÁVEL sem mover o ponteiro: Escape fecha, e o foco NÃO é tocado —
//    mexer nele faria o Escape parecer um Tab (WCAG 1.4.13, Dismissible). Aqui:
//    `onKeyDown`, ouvinte de documento que vive só enquanto o balão existe.
//
// 3. PAIRÁVEL e PERSISTENTE, por COORDENADA e não por hover no nó. A folha
//    compartilhada dá `pointer-events: none` ao balão — ele não é interativo, e
//    isso é decisão de produto, não acidente —, então o ponteiro nunca "entra"
//    no elemento e um `mouseenter` nele jamais dispararia. Quem segura a
//    abertura é a caixa que une gatilho e balão, lida em coordenada. Aqui:
//    `toleranciaInside` + `GRACE_MS`. As outras quatro chegam ao mesmo por
//    polígono de segurança da lib, pela mesma razão.
//
// 4. O gatilho é DESCRITO pelo balão, nunca NOMEADO por ele: `aria-describedby`,
//    e só enquanto o balão EXISTE. `aria-labelledby` faria o balão substituir o
//    nome do gatilho, e o leitor de tela anunciaria o texto no lugar da ação em
//    vez de depois dela. Em gatilho icon-only o nome tem de ser um `aria-label`
//    PRÓPRIO do botão: em touch não há hover, e sem ele o botão fica anônimo.
//    Escrever o describedby na montagem, antes de haver balão, é
//    `aria-valid-attr-value` no axe — por isso ele nasce em `show()`.
//
// 5. NADA de região viva: nem `aria-live`, nem `role="status"`, nem
//    `role="alert"`. O balão é `role="tooltip"` e ponto; o anúncio chega pela
//    descrição do gatilho, no momento do foco. Região viva aqui faria o leitor
//    de tela interromper a leitura a cada balão que abre.
//

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { positionFloating, type FloatingSide } from '@/lib/floating';

export type TooltipSide = FloatingSide;

export type TooltipOptions = {
  trigger: HTMLElement;
  /**
   * Texto do balão, ou um elemento quando o texto tem marcação.
   *
   * String vira `textContent` — o caminho seguro para dado de fora. Marcação
   * (`<kbd>Ctrl</kbd>` num atalho, `<strong>` numa palavra) entra como
   * ELEMENTO já montado, e não como HTML em string: é a mesma decisão da
   * guideline 09 em todas as fábricas desta stack.
   */
  content: string | HTMLElement;
  side?: TooltipSide;
  /**
   * Espera em ms entre o ponteiro entrar no gatilho e o balão aparecer.
   *
   * Era constante de módulo: todo balão da página tinha de usar 300ms. Num
   * grupo, o padrão vem do Provider; aqui se ajusta um balão em particular.
   */
  delayDuration?: number;
  // PATCH: api — callback de exibição real para analytics (ver PATCHES.md#vanilla-tooltip-onshow)
  /** Chamado quando o tooltip é de fato exibido (após o delay interno). */
  onShow?: () => void;
  class?: string;
};

export type TooltipProviderOptions = {
  /** Espera padrão de todos os balões do grupo. */
  delayDuration?: number;
  /**
   * Janela em que o PRÓXIMO balão do grupo abre na hora, sem esperar de novo.
   *
   * É o que faz percorrer uma barra de ícones parecer um movimento só: a espera
   * separa quem atravessa de quem para, e quem já parou uma vez não precisa
   * provar de novo a cada ícone. `0` desliga.
   */
  skipDelayDuration?: number;
};

/**
 * Grupo de balões que compartilham espera.
 *
 * As outras quatro stacks têm um `TooltipProvider` de contexto; sem framework o
 * equivalente é uma fábrica que já vem com o padrão do grupo amarrado, e um
 * estado comum onde o último fechamento fica anotado.
 */
export type TooltipProvider = {
  createTooltip: (options: TooltipOptions) => DestroyableElement;
};

type GroupState = {
  delayDuration: number;
  skipDelayDuration: number;
  /** Quando o último balão do grupo saiu da tela. */
  closedIn: number;
};

let _tooltipCounter = 0;
const SHOW_DELAY = 300;
const SKIP_DELAY = 300;

/**
 * Janela em que o balão sobrevive ao ponteiro que saiu do gatilho.
 *
 * É a "área de tolerância" que a WCAG 1.4.13 (Hoverable) exige: o ponteiro
 * precisa poder atravessar o vão entre gatilho e balão sem que o balão suma no
 * caminho. O balão é `pointer-events: none` na folha compartilhada — igual nas
 * cinco stacks —, então quem segura a abertura não é o hover NELE, e sim a
 * coordenada do ponteiro dentro da caixa que une os dois.
 */
const GRACE_MS = 200;

/**
 * Vão entre gatilho e balão, em px.
 *
 * A conta de posição saiu daqui para `@/lib/floating`, onde popover e dropdown
 * também a usam — era a mesma aritmética escrita três vezes, e o balão sempre
 * centrado é o `align: 'center'` de lá.
 */
const GAP = 6;

/**
 * Cria um grupo com o padrão do próprio balão avulso.
 *
 * Sem Provider não há espera compartilhada: `skipDelayDuration` fica zerado,
 * porque dois balões sem grupo não têm por que saber um do outro.
 */
function groupAvulso(delayDuration: number): GroupState {
  return { delayDuration, skipDelayDuration: 0, closedIn: 0 };
}

export function createTooltipProvider(options: TooltipProviderOptions = {}): TooltipProvider {
  const group: GroupState = {
    delayDuration: options.delayDuration ?? SHOW_DELAY,
    skipDelayDuration: options.skipDelayDuration ?? SKIP_DELAY,
    closedIn: 0,
  };

  return {
    createTooltip: (options: TooltipOptions) => mountTooltip(options, group),
  };
}

export function createTooltip(options: TooltipOptions): DestroyableElement {
  return mountTooltip(options, groupAvulso(options.delayDuration ?? SHOW_DELAY));
}

function mountTooltip(options: TooltipOptions, group: GroupState): DestroyableElement {
  const { trigger, content, side = 'top' } = options;
  const delayDuration = options.delayDuration ?? group.delayDuration;

  const id = ++_tooltipCounter;
  const tooltipId = `tooltip-${id}`;

  let panelEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let pointerPressionado = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'tooltip';
  wrapper.style.display = 'contents';
  // O gatilho se NOMEIA, como nas outras quatro stacks: lá o `data-slot` do
  // TooltipTrigger é espalhado por último sobre o elemento recebido e vence o
  // do componente interno. Aqui o wrapper se nomeava e o gatilho não, então
  // `[data-slot="tooltip-trigger"]` não existia no DOM desta stack — a peça
  // ficava inatingível por seletor.
  trigger.dataset.slot = 'tooltip-trigger';
  wrapper.appendChild(trigger);

  /** O ponteiro está dentro da caixa que une gatilho e balão? */
  function toleranciaInside(x: number, y: number): boolean {
    if (!panelEl) return false;
    const a = trigger.getBoundingClientRect();
    const b = panelEl.getBoundingClientRect();
    const margem = 8;
    return (
      x >= Math.min(a.left, b.left) - margem &&
      x <= Math.max(a.right, b.right) + margem &&
      y >= Math.min(a.top, b.top) - margem &&
      y <= Math.max(a.bottom, b.bottom) + margem
    );
  }

  function aoMover(event: MouseEvent): void {
    if (!panelEl) return;
    if (toleranciaInside(event.clientX, event.clientY)) cancelarFechamento();
    else scheduleFechamento();
  }

  function onKeyDown(event: KeyboardEvent): void {
    // Escape fecha sem tirar o foco do gatilho — WCAG 1.4.13 (Dismissible).
    // O foco não é tocado aqui de propósito: `blur` é que fecha por saída, e
    // mexer nele faria o Escape parecer um Tab.
    if (event.key === 'Escape') hide();
  }

  function show(): void {
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.id = tooltipId;
    panelEl.setAttribute('role', 'tooltip');
    panelEl.className = cn('nds-tooltip-content', options.class);
    panelEl.dataset.slot = 'tooltip-content';
    panelEl.dataset.state = 'open';
    panelEl.dataset.side = side;
    if (typeof content === 'string') panelEl.textContent = content;
    else panelEl.appendChild(content);

    document.body.appendChild(panelEl);
    positionFloating(trigger, panelEl, side, 'center', GAP);

    // `aria-describedby` só enquanto o balão EXISTE. Escrevê-lo na montagem
    // deixa o gatilho apontando para um id ausente o tempo todo — violação de
    // `aria-valid-attr-value` no axe, e uma descrição que o leitor de tela
    // procura e não acha.
    trigger.setAttribute('aria-describedby', tooltipId);

    document.addEventListener('mousemove', aoMover);
    document.addEventListener('keydown', onKeyDown);

    // PATCH: api — callback de exibição real para analytics (ver PATCHES.md#vanilla-tooltip-onshow)
    options.onShow?.();
  }

  function hide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    document.removeEventListener('mousemove', aoMover);
    document.removeEventListener('keydown', onKeyDown);
    // O grupo só é avisado quando havia mesmo um balão na tela: `hide()` também
    // é chamado por caminhos que nunca chegaram a exibir nada, e anotar ali
    // daria ao balão seguinte uma abertura instantânea que ninguém mereceu.
    if (panelEl) group.closedIn = Date.now();
    panelEl?.remove();
    panelEl = null;
    trigger.removeAttribute('aria-describedby');
  }

  function scheduleShow(): void {
    cancelarFechamento();
    if (panelEl || showTimer) return;
    // Dentro da janela do grupo a espera é dispensada: quem já parou uma vez
    // não precisa provar de novo no ícone vizinho.
    const wait =
      group.skipDelayDuration > 0 && Date.now() - group.closedIn < group.skipDelayDuration
        ? 0
        : delayDuration;
    // Arrow literal explícito — clarifica pro SAST que setTimeout recebe
    // função, não string evaluada. Comportamento idêntico a setTimeout(show, …).
    showTimer = setTimeout(() => { showTimer = null; show(); }, wait);
  }

  function cancelarFechamento(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  function scheduleFechamento(): void {
    if (hideTimer) return;
    hideTimer = setTimeout(() => { hideTimer = null; hide(); }, GRACE_MS);
  }

  /** Saída pelo ponteiro respeita a tolerância; saída pelo foco fecha na hora. */
  function onPointerLeave(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (panelEl) scheduleFechamento();
  }

  /**
   * O foco abre NA HORA, sem a espera do hover.
   *
   * Quem chega por teclado não tem como "parar em cima" — a espera existe para
   * separar o ponteiro que atravessa do que para, e não tem equivalente no Tab.
   * As outras quatro stacks fazem o mesmo, e é o que o conteúdo compartilhado
   * documenta.
   *
   * `pointerPressionado` evita que o foco vindo de um clique abra o balão duas
   * vezes: nesse caminho quem manda é o hover, com a espera dele.
   */
  function aoFocar(): void {
    if (pointerPressionado) return;
    cancelarFechamento();
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    show();
  }

  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', onPointerLeave);
  /**
   * Solta o `pointerup` de `{ once: true }` que ainda não disparou.
   *
   * `once` remove sozinho AO DISPARAR — não ao sair da página. Quem removia o
   * gatilho com o ponteiro ainda pressionado (arrastar para fora e soltar lá
   * fora, tela trocada por um clique) deixava o ouvinte esperando um evento que
   * podia nunca chegar.
   */
  let soltarPointer: (() => void) | null = null;

  trigger.addEventListener('pointerdown', () => {
    pointerPressionado = true;
    const aoSoltar = () => {
      pointerPressionado = false;
      soltarPointer = null;
    };
    soltarPointer = () => {
      document.removeEventListener('pointerup', aoSoltar);
      soltarPointer = null;
    };
    document.addEventListener('pointerup', aoSoltar, { once: true });
  });
  trigger.addEventListener('focus', aoFocar);
  trigger.addEventListener('blur', hide);

  /*
   * `mousemove` e `keydown` no `document` vivem só enquanto o balão está na
   * tela, e `hide()` solta os dois junto com os temporizadores. Quem removia o
   * wrapper com o balão ABERTO não passava por `hide()`: sobravam o balão órfão
   * no `body` e dois ouvintes presos a um nó desanexado — e o `mousemove` é o
   * mais caro do conjunto, porque roda a cada pixel do ponteiro.
   */
  return tornarDestruivel(wrapper, wrapper, () => {
    hide();
    soltarPointer?.();
  });
}
