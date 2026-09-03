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

export type AlertDialogOptions = {
  trigger: HTMLElement;
  title: string;
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
  class?: string;
};

export interface AlertDialogMediaOptions {
  className?: string;
}

/**
 * Container do ícone destacado do header. Recebe o svg por appendChild — o CSS
 * dimensiona qualquer `svg` filho em 24px (`--spacing-6`).
 */
export function createAlertDialogMedia(options: AlertDialogMediaOptions = {}): HTMLElement {
  const { className } = options;
  const el = document.createElement('div');
  el.dataset.slot = 'alert-dialog-media';
  el.className = cn('nds-alert-dialog-media', className);
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
  const { trigger, title, description, media, cancelButton, actionButton, onOpenChange } = options;

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
  // acompanha a abertura, como base-ui, reka-ui e bits-ui fazem sozinhas.
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
    // headless das outras 3 stacks emitem esse atributo sozinhas; aqui a
    // factory precisa emitir. Sem ele o overlay/painel aparecia e sumia seco.
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

    // A mídia vem ANTES do título: o seletor `:has(.nds-alert-dialog-media)`
    // centraliza o header, e a ordem de leitura é ícone → título → descrição.
    if (media) headerEl.appendChild(media);

    const titleEl = document.createElement('h2');
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

  function close(): void {
    const saindo = [overlayEl, panelEl].filter((el): el is HTMLElement => el !== null);
    // Solta as referências já: um segundo close() (ESC durante a saída, por
    // exemplo) não deve reagendar a remoção nem chamar onOpenChange de novo.
    overlayEl = null;
    panelEl = null;

    // Só destrava se HAVIA o que fechar: a contagem é do documento, e um
    // segundo close() (ESC durante a saída) soltaria a trava de outro painel
    // empilhado por cima. O contador ignora solta sem trava, mas não sabe
    // distinguir de quem ela é.
    if (saindo.length > 0) unlockBodyScroll();
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleKeydown);
    previousFocus?.focus();
    onOpenChange?.(false);

    /* v8 ignore next -- guarda de dupla finalização: close() já zerou as
       referências, então o segundo close (ESC durante a saída) não tem o que
       remover. Sem story: exercitar exige encadear dois fechamentos no mesmo
       quadro. */
    if (saindo.length === 0) return;
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
      return;
    }

    // Remove só depois da animação de saída. NUNCA depender só do
    // animationend: com prefers-reduced-motion a animação não existe e o
    // evento nunca dispara; e se o nó for escondido (display/visibility, aba
    // em background) antes de completar, ela também não. O timeout garante a
    // remoção.
    let removido = false;
    const remover = (event?: Event) => {
      /* v8 ignore next 2 -- filtros de reentrância do animationend: evento de
         um filho animado e segunda chamada depois do timeout. Nenhum dos dois
         acontece com overlay e painel animando juntos, que é o caso da suíte. */
      if (event && !saindo.includes(event.target as HTMLElement)) return;
      /* v8 ignore next */
      if (removido) return;
      removido = true;
      window.clearTimeout(timer);
      saindo.forEach((el) => {
        el.removeEventListener('animationend', remover);
        el.remove();
      });
    };
    saindo.forEach((el) => el.addEventListener('animationend', remover));
    const timer = window.setTimeout(remover, EXIT_FALLBACK_MS);
  }

  function handleKeydown(e: KeyboardEvent): void {
    // Escape fecha sem executar a ação. É o que a docs page documenta em
    // accessibility.keyboard.escape, o que as outras três stacks fazem (as libs
    // implementam) e o que o padrão alertdialog do WAI-ARIA APG especifica.
    // Havia aqui um comentário chamando a ausência de "decisão deliberada" —
    // era divergência silenciosa: nada além deste arquivo a sustentava.
    if (e.key === 'Escape' && panelEl) {
      e.preventDefault();
      close();
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

  cancelButton.addEventListener('click', close);
  actionButton.addEventListener('click', close);

  trigger.addEventListener('click', open);

  // Limpeza ao remover o wrapper (troca de story, desmonte de página).
  //
  // O observador anterior morava aqui e se desligava na PRIMEIRA mutação vista
  // com o wrapper ainda solto — `disconnect()` ficava fora do `if (panelEl)`.
  // Bastava o consumidor mexer no `body` entre criar e inserir para a guarda
  // deixar de existir, e aí o painel portalado sobrevivia com o `keydown`
  // preso. A forma compartilhada só conta a saída depois de ter visto a entrada.
  const destruivel = tornarDestruivel(wrapper, wrapper, () => {
    if (panelEl) close();
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
