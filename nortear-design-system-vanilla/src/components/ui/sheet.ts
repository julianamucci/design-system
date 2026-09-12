// ─── Sheet — Vanilla factory standalone ─────────────────────────────────────
// Visual: classes .nds-sheet-* (standalone). Render via portal.
// Comportamento: overlay click + Escape fecham; focus-trap.
//
// ─── Decisão de acessibilidade ───────────────────────────────────────────────
//
// Bloco canônico da família: as outras quatro stacks carregam a versão curta
// mais o mecanismo da própria lib. Medido na FONTE das quatro libs headless
// (base-ui, reka-ui, bits-ui, radix-ng) e neste arquivo, em 2026-09-02 — não na
// documentação delas.
//
// O Sheet é PAINEL MODAL que entra pela borda. É isso que o separa do resto da
// família de sobreposição, e cada item abaixo é consequência disso:
//
//  1. PAPEL E NOME. role="dialog" no painel nas cinco, com aria-labelledby e
//     aria-describedby apontando para os ids REAIS do título e da descrição.
//     Painel sem título é diálogo anônimo — o leitor anuncia "diálogo" e nada
//     mais. Aqui os ids nascem de um contador; nas outras quatro, das diretivas
//     de título e descrição, que registram o próprio id no contexto da raiz.
//
//  2. aria-modal="true" NAS CINCO, por caminhos diferentes. bits-ui e radix-ng
//     escrevem sozinhos (radix-ng só quando modal === true); base-ui e reka-ui
//     NÃO escrevem, e quem escreve é o wrapper do design system, lendo o estado
//     modal da raiz; aqui é literal. Painel NÃO-modal não recebe o atributo —
//     nem "false", que anunciaria a existência de um modo que não existe.
//
//  3. PRENDE O FOCO — e é o que o separa do Popover, que só o recebe. base-ui
//     por FloatingFocusManager com modal !== false; reka-ui pelo
//     DialogContentModal, com trap-focus ligado a open; bits-ui pelo FocusScope
//     trapFocus, cujo padrão é TRUE; radix-ng por gerenciador próprio; aqui
//     pelo laço de Tab e Shift+Tab do handleKeydown.
//
//  4. O FOCO VOLTA AO GATILHO NO FECHO, nas cinco. Aqui é previousFocus.focus()
//     em closeWithReason, e de propósito NÃO em desmontarPanel: quem desmonta
//     pode ter tirado o próprio gatilho do documento.
//
//  5. ESCAPE FECHA e CLIQUE NO VÉU FECHA, nas cinco, e só no diálogo do topo.
//     O ouvinte de Escape mora no DOCUMENTO, não no painel: o foco pode estar no
//     corpo que rola, e um ouvinte preso ao painel dependeria de onde ele está.
//
//  6. ROLAGEM DA PÁGINA TRAVADA enquanto modal. Sem isso o aria-modal mente: o
//     leitor de tela não alcança o fundo, mas a roda do mouse alcança. A
//     contagem vive em @/lib/scroll-lock, compartilhada com o Drawer.
//
//  7. O CORPO QUE ROLA TEM PAPEL E NOME, e o nome NÃO tem padrão. O
//     .nds-sheet-body leva tabindex="0" porque rola (WCAG 2.1.1, a regra
//     scrollable-region-focusable), e parada de teclado precisa de papel:
//     role="group" — não region, que poluiria a lista de marcos dentro de um
//     diálogo já nomeado. O papel só é emitido QUANDO existe aria-label, porque
//     nome em elemento sem papel é atributo proibido e o leitor o descarta
//     (aria-prohibited-attr).
//
//  8. ORDEM DE LEITURA. O painel entra pela borda, mas quem lê de ouvido não
//     segue a geometria: o foco entra no painel na abertura e a ordem é a do
//     DOM — cabeçalho, corpo, rodapé e o X do canto por ÚLTIMO. O X é saída, não
//     entrada; ele primeiro faria a primeira parada de teclado ser "fechar".
//
//  9. NENHUMA REGIÃO VIVA. A abertura já move o foco e o papel de diálogo já é
//     anunciado; uma região viva aqui diria a mesma coisa duas vezes.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';

export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

// PATCH: api — motivo do fechamento exposto para analytics (ver PATCHES.md#vanilla-sheet-onclose-reason)
//
// `api` é o quarto motivo, e ele entrou em 2026-09-11. O vocabulário da família
// é `escape | overlay | close-button | api` (18-overlay.md §Analytics), o
// `DialogCloseReason` e o `DrawerCloseReason` desta stack já tinham os quatro, o
// Sheet do Angular também — e o PRD (§9) e este patch pedem por escrito paridade
// de assinatura com o Dialog. Faltando o motivo, a docs page o SINTETIZAVA por
// fora: o rodapé fingia um clique no véu e a página trocava o motivo relatado
// depois. Na stack que é a referência de contrato, o motivo tem de nascer na
// fábrica.
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * O que a fábrica devolve.
 *
 * `close()` é o caminho público para fechar por decisão de dentro — a ação
 * primária do rodapé que aplica e sai, um fluxo que terminou, uma rota que
 * mudou. Ele informa `'api'`, que é o que separa, no analytics, o painel que a
 * pessoa dispensou do que o programa recolheu. Mesma forma de `DrawerElement`.
 *
 * Só `close()`: `open()` e `toggle()` do Drawer não entram aqui porque a
 * abertura comandada desta fábrica ainda passa pelo gatilho interno (é o que a
 * story `Controlled` e o snippet dela documentam), e API nova sem consumidor é
 * superfície para manter de graça.
 */
export type SheetElement = DestroyableElement & {
  /** Fecha o painel informando `'api'`. Sem efeito se já estiver fechado. */
  close: () => void;
};

export type SheetOptions = {
  trigger: HTMLElement;
  side?: SheetSide;
  title?: string;
  /**
   * Nível do cabeçalho do título, de 1 a 6. Padrão `2`.
   *
   * `heading-order` do axe reprova salto de nível, e o painel não sabe de que
   * profundidade da página foi aberto: um diálogo disparado de dentro de uma
   * seção que já está em `h3` precisa sair em `h4`. As quatro stacks com lib
   * já trocavam o nível pelo mecanismo da própria lib — `render` no base-ui,
   * `as` na reka, `level` no bits, seletor por elemento no radix-ng —, e esta
   * era a única sem a opção. Mesma forma de `createPopoverTitle` e de
   * `createCardTitle`, que já a tinham.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  /**
   * Nome acessível do CORPO que rola. Sem padrão, de propósito.
   *
   * O corpo entra na ordem de tabulação porque rola (WCAG 2.1.1), e uma parada
   * de teclado precisa de papel e nome — a regra 6 da §8. O conteúdo é o que
   * quem monta pôs lá dentro, e só ali se sabe o que é; padrão genérico
   * ("Conteúdo") anunciaria sem informar.
   *
   * Não herdamos o título do painel: ele já foi anunciado na abertura, e
   * repeti-lo aqui informaria pouco pelo que custa. Sem nome NÃO emitimos papel
   * nenhum — `aria-label` em elemento sem papel é atributo proibido, e o axe
   * acusa `aria-prohibited-attr`.
   *
   * `group` e não `region`: o corpo já vive dentro de um diálogo nomeado, e um
   * marco aninhado num diálogo não acrescenta navegação, só entrada na lista.
   */
  bodyLabel?: string;

  /**
   * Botão X no canto superior direito do painel.
   *
   * Entregue aqui porque o conteúdo compartilhado o documenta como prop do
   * Content, com padrão `true`, e as outras quatro stacks o expõem: a factory
   * era a única em que a promessa não se cumpria. Desligar só faz sentido com
   * o rodapé oferecendo uma saída explícita — Escape e o clique no véu
   * continuam fechando de qualquer forma.
   */
  showCloseButton?: boolean;

  /**
   * Nome acessível do botão de fechar.
   *
   * Era a string `Fechar` cravada aqui dentro, e essa era a única string de
   * interface desta família presa a um idioma: numa página em inglês ou
   * espanhol o leitor de tela ouvia português, sem que nada na chamada
   * pudesse mudar isso. Espelha `closeLabel` das outras stacks.
   */
  closeLabel?: string;
  onOpenChange?: (open: boolean) => void;
  /** Chamado no fechamento com o caminho que o causou (espelha o Dialog). */
  onClose?: (reason: SheetCloseReason) => void;
  class?: string;
};

// ─── Close icon helper ────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const p1 = document.createElementNS(SVG_NS, 'path');
  p1.setAttribute('d', 'M18 6 6 18');
  const p2 = document.createElementNS(SVG_NS, 'path');
  p2.setAttribute('d', 'm6 6 12 12');
  svg.appendChild(p1);
  svg.appendChild(p2);
  return svg;
}

let _sheetCounter = 0;

/**
 * Painéis abertos. O Sheet é modal: um de cada vez, e o mais novo manda.
 *
 * O painel vive em `document.body`, FORA do wrapper — quem tira o wrapper do
 * documento não leva o painel junto. Sobravam no `body` diálogos órfãos
 * empilhados, cada um com o seu listener de `keydown` ainda ativo; as asserções
 * tinham aprendido a pegar "o último `dialog` do body" para conviver com a
 * pilha, o que é o mesmo que documentar o defeito.
 *
 * Fechar os outros na ABERTURA é a guarda determinística: não depende de quando
 * a remoção do wrapper é notificada, e descreve o estado que o componente
 * promete — dois painéis modais ao mesmo tempo deixam um deles inalcançável.
 * O `MutationObserver` de cada instância cobre o caso oposto: o wrapper sai e
 * ninguém mais abre nada.
 */
const abertos = new Set<{ close: () => void }>();

function closeOutrosPanels(current: { close: () => void }): void {
  for (const registro of [...abertos]) {
    if (registro !== current) registro.close();
  }
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createSheet ──────────────────────────────────────────────────────────────

export function createSheet(options: SheetOptions): SheetElement {
  const {
    trigger,
    side = 'right',
    title,
    titleLevel = 2,
    description,
    content,
    footer,
    bodyLabel,
    showCloseButton = true,
    closeLabel = 'Fechar',
    onOpenChange,
    onClose,
  } = options;

  const sheetId = ++_sheetCounter;
  const titleId = `sheet-title-${sheetId}`;
  const descId = `sheet-desc-${sheetId}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  /**
   * Este painel está segurando a trava de rolagem?
   *
   * `aria-modal="true"` diz ao leitor de tela que o resto da página está fora de
   * alcance, e com a rolagem solta a promessa era falsa: o conteúdo atrás do
   * painel rolava. A contagem vive em `@/lib/scroll-lock`, compartilhada com o
   * Drawer — dois contadores separados voltariam a travar a página para sempre.
   */
  let scrollLocked = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'sheet';

  // O gatilho anuncia que existe um diálogo por trás dele. As libs headless das
  // outras stacks emitem os dois atributos; aqui não existia lib para emitir, e
  // o leitor de tela ouvia um botão comum — WAI-ARIA APG para diálogo modal.
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.dataset.slot = 'sheet-trigger';

  wrapper.appendChild(trigger);

  /*
   * O que a PILHA de painéis chama para tirar este daqui da tela.
   *
   * `closeWithReason('api')`, e não um desmonte silencioso: até 2026-09-11 este
   * caminho só desmontava e avisava `onOpenChange(false)`, então abrir o painel
   * B fechava o A sem NENHUM `dialog_close` — a série de abre/fecha da docs page
   * do Sheet não fechava a conta, e o painel que sumia da tela sumia também do
   * analytics.
   *
   * `api` é a palavra certa entre as quatro do vocabulário da família: ninguém
   * dispensou o painel A — Escape, véu e botão são os três gestos da pessoa, e
   * nenhum deles aconteceu. Foi uma decisão tomada DENTRO do sistema (a
   * modalidade do Sheet: um de cada vez, o mais novo manda), que é exatamente o
   * que `api` nomeia. Não há palavra para "substituído" e o portão
   * `reason_entre_stacks_divergente` cobra as quatro; inventar uma quinta aqui
   * dividiria a série em todas as stacks.
   */
  const registro = {
    close: () => closeWithReason('api'),
  };

  function open(): void {
    // O foco anterior é lido ANTES de fechar os outros, e a ordem passou a
    // importar: fechar o painel A devolve o foco ao gatilho DELE, e lendo
    // depois este painel adotaria aquele gatilho como alvo de retorno — B
    // fecharia devolvendo o foco para o gatilho de A.
    previousFocus = document.activeElement as HTMLElement;

    // Antes de pôr mais um painel na tela, tire da tela o que já estava lá.
    closeOutrosPanels(registro);

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-sheet-overlay';
    overlayEl.dataset.slot = 'sheet-overlay';
    overlayEl.addEventListener('click', () => closeWithReason('overlay'));

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-sheet-content', options.class);
    panelEl.dataset.side = side;
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    if (title) panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'sheet-content';

    /*
     * Todo `[data-slot="sheet-close"]` DENTRO do painel fecha, e fecha com
     * `close-button`.
     *
     * Delegação, e não um ouvinte por botão: o rodapé é de quem compõe, chega
     * pela opção `footer` e a fábrica não o monta — um ouvinte por elemento só
     * alcançaria o X que ela mesma cria. Era essa a lacuna que fazia toda
     * demonstração de "Cancelar" desta família ter de fingir um clique no véu,
     * relatando `overlay` para um caminho que é de botão.
     *
     * `closest` e não `target`: o clique costuma cair no ícone ou no
     * `.nds-sr-only` dentro do botão, e a comparação direta erraria os dois.
     */
    panelEl.addEventListener('click', (event) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-slot="sheet-close"]')) closeWithReason('close-button');
    });

    // Close button
    let closeBtn: HTMLButtonElement | null = null;
    if (showCloseButton) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'nds-sheet-close';
      // O X é UM controle de fechamento entre os possíveis, e passa a se nomear
      // como tal: `data-slot="sheet-close"` é o contrato que React e Angular já
      // escreviam e que esta stack — a referência — não tinha. Quem fecha é a
      // delegação do painel, logo abaixo; um ouvinte próprio aqui disparava o
      // fechamento duas vezes.
      closeBtn.dataset.slot = 'sheet-close';
      closeBtn.setAttribute('aria-label', closeLabel);
      closeBtn.appendChild(createCloseIcon());
    }

    // Header
    if (title || description) {
      const headerEl = document.createElement('div');
      headerEl.className = 'nds-sheet-header';
      headerEl.dataset.slot = 'sheet-header';

      if (title) {
        const titleEl = document.createElement(`h${titleLevel}`);
        titleEl.id = titleId;
        titleEl.className = 'nds-sheet-title';
        titleEl.textContent = title;
        headerEl.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.id = descId;
        descEl.className = 'nds-sheet-description';
        descEl.textContent = description;
        headerEl.appendChild(descEl);
      }

      panelEl.appendChild(headerEl);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-sheet-body';
    bodyEl.dataset.slot = 'sheet-body';
    bodyEl.setAttribute('tabindex', '0');
    if (bodyLabel) {
      bodyEl.setAttribute('role', 'group');
      bodyEl.setAttribute('aria-label', bodyLabel);
    }
    bodyEl.appendChild(content);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-sheet-footer';
      footerEl.dataset.slot = 'sheet-footer';
      footerEl.appendChild(footer);
      panelEl.appendChild(footerEl);
    }

    // Por ÚLTIMO no painel, de propósito: o X é a saída, não a entrada, e a
    // ordem de leitura do diálogo é cabeçalho, corpo, rodapé e só então ela.
    if (closeBtn) panelEl.appendChild(closeBtn);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    lockBodyScroll();
    scrollLocked = true;

    const focusable = getFocusable(panelEl);
    focusable[0]?.focus();

    document.addEventListener('keydown', handleKeydown);
    abertos.add(registro);
    onOpenChange?.(true);
  }

  /**
   * Tira o painel do documento e solta o que ele prendeu.
   *
   * Separado do fechamento por vontade de quem usa: aqui não se devolve foco
   * (o elemento anterior pode ter saído do DOM junto) nem se anuncia motivo.
   */
  function desmontarPanel(): void {
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
    // Só solta o que ESTE painel travou: `destroy()` chama `close()` mesmo sem
    // nada montado, e uma solta a mais liberaria a trava de um painel vizinho.
    if (scrollLocked) {
      unlockBodyScroll();
      scrollLocked = false;
    }
    abertos.delete(registro);
  }

  // PATCH: api — motivo do fechamento exposto para analytics (ver PATCHES.md#vanilla-sheet-onclose-reason)
  function closeWithReason(reason: SheetCloseReason): void {
    // Já fechado: não se fecha duas vezes. Sem a guarda, um `close()` público
    // sobre painel desmontado devolveria o foco a um elemento que já não é o
    // alvo e mandaria um `dialog_close` que ninguém provocou — fechamento falso
    // no GA4. O Dialog desta stack já tinha a guarda; o Sheet não.
    if (!panelEl && !overlayEl) return;
    desmontarPanel();
    previousFocus?.focus();
    onClose?.(reason);
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeWithReason('escape');
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
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

  trigger.addEventListener('click', open);

  /*
   * O painel mora em `document.body`, não dentro do wrapper: quem tira o
   * wrapper do documento não leva o painel junto, e sobravam no `body` um
   * diálogo órfão e um listener de `keydown` — vivos até a página recarregar.
   *
   * Dava para ver na suíte: as stories abriam painéis que nunca saíam, e as
   * asserções tinham aprendido a pegar "o último `dialog` do body" para
   * conviver com a pilha. O `dialog.ts` já tinha esta guarda; o `sheet.ts`
   * ficou sem ela.
   */
  // A guarda de "ainda não entrou" mora na forma compartilhada: a factory
  // devolve o wrapper e quem chama o insere DEPOIS, e quem abre o painel no
  // mesmo tique da criação (as stories que nascem abertas fazem isso) dispara a
  // primeira mutação com o wrapper ainda solto.
  // `Object.assign` e não um `as`: o verbo entra no tipo do próprio alvo, e
  // `tornarDestruivel` devolve exatamente `SheetElement` sem conversão. Mesma
  // forma do `drawer.ts`.
  return tornarDestruivel(
    wrapper,
    Object.assign(wrapper, {
      // Fechar por código informa `'api'`: quem escuta `onClose` separa o
      // painel que a pessoa dispensou do que o programa recolheu.
      close: () => closeWithReason('api'),
    }),
    () => {
      // DESMONTE NÃO É FECHAMENTO: sai o painel e sai o estado, não sai motivo.
      // Era `registro.close()`, que fazia as duas coisas de uma vez — e agora
      // que aquele registro informa `api` (a pilha de painéis o usa), reusá-lo
      // aqui transformaria toda troca de story num `dialog_close` falso.
      const estavaOpen = panelEl !== null;
      desmontarPanel();
      if (estavaOpen) onOpenChange?.(false);
    },
  );
}
