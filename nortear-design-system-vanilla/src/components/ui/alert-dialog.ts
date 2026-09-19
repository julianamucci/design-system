import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
// ─── Alert Dialog — Vanilla factory (portal manual) ──────────────────────────
//
// Visual: classes .nds-alert-dialog-* (standalone .nds-*).
//
// ─── O que o separa do Dialog, e por quê ────────────────────────────────────
//
// Bloco canônico da divergência. O bloco canônico da acessibilidade COMUM aos
// dois (foco preso, aria-modal, nome e descrição, foco de volta ao gatilho,
// trava de rolagem) está no cabeçalho de dialog.ts, e vale igual aqui.
//
// Este é o modal que NÃO pode ser dispensado por engano. Três coisas o separam
// do diálogo comum, e nenhuma é estética:
//
//   1. PAPEL: role="alertdialog", e não role="dialog". O leitor de tela
//      anuncia com urgência e lê a descrição JUNTO do título, em vez de
//      esperar a pessoa navegar até ela — por isso a descrição, opcional na
//      assinatura, é o que diz o que a confirmação custa.
//   2. CLIQUE NO VÉU NÃO FECHA — nas cinco, medido na fonte de cada lib.
//      base-ui: useRenderDialogRoot liga disablePointerDismissal quando o modo
//      é 'alert-dialog'. reka-ui: AlertDialogContent previne
//      pointerDownOutside e interactOutside. bits-ui: interactOutsideBehavior
//      nasce em "ignore". radix-ng: provideRdxDialogVariant com
//      forcePointerDismissalDisabled. Aqui: o overlay simplesmente não tem
//      ouvinte de clique — e é por isso que ele não pode ganhar um.
//      Em nenhuma das cinco isso é configuração de quem consome: é o perfil do
//      componente, fixado na construção.
//   3. ESCAPE FECHA, e equivale a cancelar — nas cinco. A WAI-ARIA manda o
//      alertdialog seguir o teclado do dialog: tirar a única saída de teclado
//      seria pior que o risco de dispensa acidental, que é justamente o que o
//      clique-fora bloqueado já cobre. Havia aqui um comentário chamando a
//      ausência de "decisão deliberada"; era divergência silenciosa.
//
// Corolário das três: a saída visível é o par Cancel + Action do rodapé, e por
// isso o rodapé é obrigatório aqui — o Dialog tem um X próprio no canto e este
// não tem nenhum.
//
// O foco entra no CANCEL, não no primeiro tabbable: num diálogo de destruição,
// o Enter apertado por reflexo tem de cair na saída segura.
//
// ─── Os outros comportamentos ───────────────────────────────────────────────
//   - Focus trap (Tab/Shift+Tab) entre cancel e action.
//   - Restaura foco no elemento anterior ao fechar.
//   - Diz POR ONDE fechou (`onClose(reason)`), no vocabulário da família:
//     `escape`, `close-button` para o Cancel, `api` para a Action e para a
//     destruição com o painel aberto. As libs das outras quatro stacks
//     entregam o mesmo motivo para Cancel e Action, e por isso a demonstração
//     delas marca a confirmação antes de fechar; aqui a fábrica sabe qual botão
//     foi, e o motivo já sai certo.
//   - Trava a rolagem da página enquanto aberto — as outras quatro caem da
//     lib (base-ui useScrollLock, reka-ui useBodyScrollLock, bits-ui
//     ScrollLock, radix-ng useScrollLock), e a contagem daqui vive em
//     @/lib/scroll-lock, compartilhada com Dialog, Sheet, Drawer e Popover.
//   - Anima a SAÍDA e só então remove: é o único da família nesta stack que
//     faz isso (Dialog, Sheet e Drawer removem no mesmo quadro).
//   - MutationObserver fecha o dialog quando o wrapper é removido do DOM
//     (Storybook remount entre stories).

/** `--duration-base` (200ms, a saída em alert-dialog.css) + folga. */
const EXIT_FALLBACK_MS = 300;

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Por onde o diálogo fechou. É o vocabulário do `DialogCloseReason` sem
 * `'overlay'`: o véu deste componente não fecha (D1 do PRD).
 */
export type AlertDialogCloseReason = 'escape' | 'close-button' | 'api';

export type AlertDialogOptions = {
  trigger: HTMLElement;
  title: string;
  /**
   * Nível do cabeçalho do título, de 1 a 6. Padrão `2`.
   *
   * `heading-order` do axe reprova salto de nível, e o painel não sabe de que
   * profundidade da página foi aberto: um diálogo disparado de dentro de uma
   * seção que já está em `h3` precisa sair em `h4`. As quatro stacks com lib
   * já trocavam o nível pelo mecanismo da própria lib — `render` no base-ui,
   * `as` na reka, snippet `child` com `level` no bits (o `level` sozinho só
   * muda o `aria-level`), seletor por elemento no radix-ng —, e esta era a
   * única sem a opção. O nome é o das fábricas que montam o componente
   * inteiro (`createDialog`, `createSheet`, `createDrawer`); a que monta só o
   * título chama a opção de `level` (`createPopoverTitle`, `createCardTitle`).
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  description?: string;
  /**
   * Bloco de ícone no topo do header (`.nds-alert-dialog-media`). Opcional —
   * acompanha o alinhamento do header: centralizado abaixo de 40rem, à
   * esquerda acima. Use `createAlertDialogMedia()` para montá-lo.
   */
  media?: HTMLElement;
  cancelButton: HTMLElement;
  actionButton: HTMLElement;
  /**
   * Abre o diálogo assim que o wrapper entra no DOM, sem clique no trigger.
   * Equivale ao `defaultOpen` das outras stacks — é o estado inicial em modo
   * não controlado, usado por capturas visuais e pelas composições.
   */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Motivo do fechamento: `'escape'`, `'close-button'` (Cancel) ou `'api'`
   * (Action, ou o wrapper saindo da página com o painel aberto). Dispara uma
   * vez por fechamento, ANTES do `onOpenChange(false)` — mesma ordem do
   * `createDialog`. É o que alimenta o `reason` do `dialog_close`.
   */
  onClose?: (reason: AlertDialogCloseReason) => void;
  class?: string;
};

export interface AlertDialogMediaOptions {
  /**
   * Classes extras na caixa do ícone. `class`, como a opção de `createAlertDialog`
   * e da maioria das fábricas desta stack — era `className` até 2026-09-10, a
   * única da dupla com o nome do react.
   */
  class?: string;
}

/**
 * Container do ícone destacado do header. Recebe o svg por appendChild — o CSS
 * dimensiona qualquer `svg` filho em 24px (`--spacing-6`).
 */
export function createAlertDialogMedia(options: AlertDialogMediaOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.dataset.slot = 'alert-dialog-media';
  el.className = cn('nds-alert-dialog-media', options.class);
  return el;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _alertDialogCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createAlertDialog ───────────────────────────────────────────────────────

export function createAlertDialog(options: AlertDialogOptions): DestroyableElement {
  const { trigger, title, titleLevel = 2, description, media, cancelButton, actionButton, onOpenChange, onClose } = options;

  const id = ++_alertDialogCounter;
  const titleId = `alert-dialog-title-${id}`;
  const descId = `alert-dialog-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'alert-dialog';
  // Identifica a instância: o painel é portalado para o body no open(), então
  // sem isto não há como ligar um trigger ao painel que ele comanda. Efeito
  // colateral útil: o renderer html do Storybook monta a caixa de código a
  // partir do outerHTML deste wrapper e só reemite quando ele muda — e o
  // wrapper só contém o trigger, então title/description/cancelLabel/actionLabel
  // não o alteravam e o snippet congelava nesses controls.
  wrapper.dataset.dialogId = String(id);
  // O trigger abre um diálogo: anuncia isso antes do clique. O aria-expanded
  // acompanha a abertura, como base-ui, reka-ui, bits-ui e radix-ng fazem
  // sozinhas.
  trigger.dataset.slot = 'alert-dialog-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  cancelButton.dataset.slot = 'alert-dialog-cancel';
  actionButton.dataset.slot = 'alert-dialog-action';
  wrapper.appendChild(trigger);

  function open(): void {
    // Já aberto: um segundo open() (clique no trigger com o diálogo em cima,
    // possível quando ele nasce aberto) montaria um painel novo e perderia a
    // referência do anterior, que ficaria órfão no body.
    if (panelEl) return;

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-alert-dialog-overlay';
    overlayEl.dataset.slot = 'alert-dialog-overlay';
    // data-state: é o gancho das animações em alert-dialog.css. As libs
    // headless das outras quatro stacks marcam o estado sozinhas (cada uma
    // com a sua convenção, todas cobertas pela folha); aqui a factory precisa
    // emitir. Sem ele o overlay/painel aparecia e sumia seco.
    overlayEl.dataset.state = 'open';

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-alert-dialog-content', options.class);
    panelEl.dataset.state = 'open';
    panelEl.setAttribute('role', 'alertdialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    // A descrição é opcional, e o atributo acompanha: sem ela, `aria-describedby`
    // simplesmente não é declarado. Declarar apontando para um id que não existe
    // seria pior que a ausência — o leitor de tela não anuncia nada e o axe
    // reprova em `aria-valid-attr-value`. Exercitado pela story WithoutDescription.
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'alert-dialog-content';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'nds-alert-dialog-header';
    headerEl.dataset.slot = 'alert-dialog-header';

    // A mídia vem ANTES do título: a ordem de leitura é ícone → título →
    // descrição, e o ícone fica no topo. O `:has(.nds-alert-dialog-media)` da
    // folha não depende da ordem — ele só centraliza a CAIXA do ícone no
    // mobile; o texto do cabeçalho já é centralizado pela regra do header.
    if (media) headerEl.appendChild(media);

    const titleEl = document.createElement(`h${titleLevel}`);
    titleEl.id = titleId;
    titleEl.dataset.slot = 'alert-dialog-title';
    titleEl.className = 'nds-alert-dialog-title';
    titleEl.textContent = title;
    headerEl.appendChild(titleEl);

    // Mesmo caminho opcional do aria-describedby acima: sem descrição, o header
    // fica só com o título (e a mídia, quando existe).
    if (description) {
      const descEl = document.createElement('p');
      descEl.id = descId;
      descEl.dataset.slot = 'alert-dialog-description';
      descEl.className = 'nds-alert-dialog-description';
      descEl.textContent = description;
      headerEl.appendChild(descEl);
    }

    // Footer
    const footerEl = document.createElement('div');
    footerEl.className = 'nds-alert-dialog-footer';
    footerEl.dataset.slot = 'alert-dialog-footer';
    footerEl.appendChild(cancelButton);
    footerEl.appendChild(actionButton);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(footerEl);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    cancelButton.focus();

    // A página atrás do véu não rola enquanto o painel está aberto. Num modal
    // que só sai por escolha explícita, deixar o fundo rolar é pior ainda: a
    // pergunta continua na tela e o contexto por trás dela some.
    lockBodyScroll();

    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  /**
   * Tira véu e painel da tela, e devolve se havia algo aberto.
   *
   * Desmontar não é fechar: daqui não sai `onClose`, nem devolução de foco, nem
   * `onOpenChange` — quem quer avisar é o `close(reason)`, logo abaixo. O
   * `animar` separa os dois usos: fechar espera a animação de saída; desmontar
   * (troca de story, desmonte de página) remove na hora, porque esperar deixaria
   * o painel de um exemplo sobrando por cima do seguinte.
   */
  function desmontarPanel(animar: boolean): boolean {
    const saindo = [overlayEl, panelEl].filter((el): el is HTMLElement => el !== null);

    // Já fechado: nada a fazer, e isso inclui NÃO avisar ninguém. Durante a
    // animação de saída o Cancel e a Action ainda estão na tela, e um segundo
    // clique chegava aqui. A guarda morava no MEIO da função, depois do
    // `onOpenChange(false)` e da devolução de foco — o docblock prometia que o
    // segundo close() não chamaria onOpenChange de novo, e ele chamava. Com o
    // `onClose`, seria também um segundo `dialog_close` no GA4. Destravar a
    // rolagem aqui soltaria ainda a trava de outro painel empilhado por cima:
    // a contagem é do documento e não sabe de quem é cada solta.
    /* v8 ignore next -- sem story: exercitar exige clicar num botão que está
       saindo, dentro dos 200ms da animação. */
    if (saindo.length === 0) return false;

    // Solta as referências já: é o que faz um segundo close() cair na guarda
    // acima em vez de reagendar a remoção.
    overlayEl = null;
    panelEl = null;

    unlockBodyScroll();
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleKeydown);

    if (!animar) {
      saindo.forEach((el) => el.remove());
      return true;
    }

    saindo.forEach((el) => { el.dataset.state = 'closed'; });

    // Sem animação de saída (prefers-reduced-motion, ou ambiente que não
    // anima), remove na hora: esperar um timeout que nunca vai ser encurtado
    // por animationend só atrasaria o fechamento para quem pediu menos
    // movimento. getComputedStyle força o recálculo antes de perguntar.
    void getComputedStyle(saindo[0]).animationName;
    /* v8 ignore next 4 -- caminho sem animação (prefers-reduced-motion ou
       ambiente que não anima). O browser dos testes roda COM animação, por
       decisão do projeto, então este ramo é inalcançável na suíte. */
    if (saindo.every((el) => el.getAnimations().length === 0)) {
      saindo.forEach((el) => el.remove());
      return true;
    }

    // Remove só depois da animação de saída. NUNCA depender só do
    // animationend: com prefers-reduced-motion a animação não existe e o
    // evento nunca dispara; e se o nó for escondido (display/visibility, aba
    // em background) antes de completar, ela também não. O timeout garante a
    // remoção.
    let removido = false;
    const removeExiting = (event?: Event) => {
      /* v8 ignore next 2 -- filtros de reentrância do animationend: evento de
         um filho animado e segunda chamada depois do timeout. Nenhum dos dois
         acontece com overlay e painel animando juntos, que é o caso da suíte. */
      if (event && !saindo.includes(event.target as HTMLElement)) return;
      /* v8 ignore next */
      if (removido) return;
      removido = true;
      window.clearTimeout(timer);
      saindo.forEach((el) => {
        el.removeEventListener('animationend', removeExiting);
        el.remove();
      });
    };
    saindo.forEach((el) => el.addEventListener('animationend', removeExiting));
    const timer = window.setTimeout(removeExiting, EXIT_FALLBACK_MS);
    return true;
  }

  function close(reason: AlertDialogCloseReason): void {
    if (!desmontarPanel(true)) return;
    previousFocus?.focus();
    onClose?.(reason);
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    // Escape fecha sem executar a ação. É o que a docs page documenta em
    // accessibility.keyboard.escape, o que as outras quatro stacks fazem (as
    // libs implementam) e o que o padrão alertdialog do WAI-ARIA APG especifica.
    // Havia aqui um comentário chamando a ausência de "decisão deliberada" —
    // era divergência silenciosa: nada além deste arquivo a sustentava.
    if (e.key === 'Escape' && panelEl) {
      e.preventDefault();
      close('escape');
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      /* v8 ignore next -- painel sem nada focável: o contrato exige Cancel e
         Action, então só um consumidor fora do padrão chegaria aqui. */
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

  // Os botões chegam prontos, então o `onClick` que quem consome passou ao
  // `createButton` já está registrado e roda ANTES destes: a confirmação
  // acontece antes do fechamento, e o `dialog_confirm` chega ao GA4 antes do
  // `dialog_close` que ele provoca.
  cancelButton.addEventListener('click', () => close('close-button'));
  actionButton.addEventListener('click', () => close('api'));

  trigger.addEventListener('click', open);

  // Limpeza ao remover o wrapper (troca de story, desmonte de página).
  //
  // O observador anterior morava aqui e se desligava na PRIMEIRA mutação vista
  // com o wrapper ainda solto — `disconnect()` ficava fora do `if (panelEl)`.
  // Bastava o consumidor mexer no `body` entre criar e inserir para a guarda
  // deixar de existir, e aí o painel portalado sobrevivia com o `keydown`
  // preso. A forma compartilhada só conta a saída depois de ter visto a entrada.
  const destruivel = tornarDestruivel(wrapper, wrapper, () => {
    // Sair da página com a pergunta na tela NÃO é resposta: o painel sai sem
    // devolver foco a um gatilho que está deixando o documento e sem `onClose`.
    // Até 2026-09-12 isto era `close('api')`, e cada troca de idioma da docs
    // page virava um `dialog_close` com a mesma palavra de quem confirmou —
    // indistinguíveis no GA4. O estado continua sendo avisado.
    const wasOpen = desmontarPanel(false);
    if (wasOpen) onOpenChange?.(false);
  });

  // O wrapper só entra na página depois que a factory retorna: o microtask
  // espera a montagem para o painel portalado e o foco encontrarem a árvore
  // pronta. Sem o isConnected, um wrapper descartado antes de montar abriria um
  // painel órfão no body.
  if (options.defaultOpen) {
    queueMicrotask(() => {
      if (wrapper.isConnected) open();
    });
  }

  return destruivel;
}
