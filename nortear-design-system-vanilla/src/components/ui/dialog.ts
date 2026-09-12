// ─── Dialog — Vanilla factory standalone ────────────────────────────────────
//
// Visual: classes .nds-dialog-* (standalone). Render via portal (body).
//
// ─── A decisão de acessibilidade, medida nas cinco stacks ───────────────────
//
// Bloco canônico da família: as outras quatro trazem a versão curta mais o
// mecanismo da própria lib. Medido na FONTE de cada lib, não na documentação.
//
//   1. PRENDE O FOCO — as cinco. base-ui: FloatingFocusManager com
//      modal !== false. reka-ui: DialogContentModal com trap-focus ligado ao
//      open. bits-ui: FocusScope com trapFocus padrão true. radix-ng:
//      gerenciador próprio, dono do alvo de retorno. Aqui: laço de Tab e
//      Shift+Tab no handleKeydown.
//   2. role="dialog" + aria-modal="true" — as cinco. base-ui e reka-ui NÃO
//      emitem aria-modal (conferido em node_modules): quem cumpre o contrato
//      de markup ali é o wrapper do design system, lendo o modo real. bits-ui
//      e radix-ng emitem sozinhas. Aqui é escrito à mão.
//   3. NOME E DESCRIÇÃO — aria-labelledby aponta para o título, sempre;
//      aria-describedby só existe quando existe descrição. Apontar para um id
//      ausente o axe reprova em aria-valid-attr-value.
//   4. ESCAPE FECHA — as cinco. O keydown é do DOCUMENTO, e não do painel,
//      porque o foco pode estar no corpo que rola.
//   5. CLIQUE NO VÉU FECHA — as cinco. É a diferença que mais importa em
//      relação ao AlertDialog: ali o clique fora NÃO fecha (ver o docblock de
//      alert-dialog.ts). Diálogo comum se dispensa por engano sem
//      consequência; decisão crítica não.
//   6. TRAVA A ROLAGEM DA PÁGINA — as cinco. base-ui: useScrollLock(open &&
//      modal === true). reka-ui: useBodyScrollLock no overlay. bits-ui:
//      ScrollLock com preventScroll padrão true. radix-ng: useScrollLock preso
//      ao modal. Aqui: lockBodyScroll de @/lib/scroll-lock, com a contagem
//      compartilhada com Sheet, Drawer e Popover. Faltava, e o conteúdo
//      compartilhado a prometia por escrito em states.open.
//   7. O GATILHO SE ANUNCIA — aria-haspopup="dialog" nas cinco (base-ui
//      DialogTrigger, reka-ui DialogTrigger, bits-ui dialog.svelte.js e
//      radix-ng RdxDialogTrigger emitem sozinhas), com aria-expanded
//      acompanhando a abertura. Aqui era o único ponto da família sem os dois
//      — o AlertDialog desta mesma stack já os escrevia.
//   8. O FOCO VOLTA AO GATILHO ao fechar — as cinco.
//   9. CORPO QUE ROLA — quando o conteúdo é mais alto que o painel, quem
//      compõe pendura .nds-dialog-body-scroll no elemento do corpo, junto de
//      tabindex="0" (WCAG 2.1.1) e de role="group" com nome. group e não
//      region: marco aninhado num diálogo já nomeado não acrescenta navegação.
//      É a ÚNICA saída para conteúdo alto — ver o bloco logo abaixo.
//  10. REGIÃO VIVA: nenhuma. A abertura já move o foco, e o papel de diálogo
//      já é anunciado.
//
// ─── Conteúdo mais alto que a janela: UMA saída ─────────────────────────────
//
// CORPO ROLÁVEL. O painel fica parado e centralizado, o cabeçalho e o rodapé
// não saem da tela, e a rolagem acontece dentro do corpo. Nada muda na fábrica:
// quem compõe pendura .nds-dialog-body-scroll no elemento que passa em
// `content`, com tabindex="0", role="group" e nome (item 9 acima).
//
// Houve uma SEGUNDA rota, retirada em 2026-09-08 por decisão de produto (PRD
// D7): o painel inteiro entrava no fluxo do véu, virava FILHO dele, e a PÁGINA
// é que rolava. Duas razões — um modal que rola junto com a página desfaz a
// própria promessa de interromper, e duas saídas opostas para o mesmo problema
// obrigam cada tela a escolher sem critério. Saíram a opção `scroll`, o par de
// classes -overlay-scroll/-content-scroll (que dialog.css não declara mais), a
// anexação do painel dentro do overlay e o pouso de foco próprio que ela
// exigia. O painel é sempre IRMÃO do overlay.
//
// ─── O que esta stack NÃO faz, e é decisão de família ───────────────────────
//
// Não anima a SAÍDA: desmontarPanel marca data-state="closed" e remove no
// mesmo quadro, então as keyframes de saída de dialog.css não chegam a rodar.
// É como Sheet e Drawer se comportam nesta stack; o único que espera a
// animação é o AlertDialog, que tem o par animationend + timeout escrito.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';

export type DialogCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * O que a fábrica devolve.
 *
 * `close()` é o caminho público para fechar por decisão de dentro — a ação que
 * concluiu, o fluxo que terminou. Informa `'api'`, o motivo que separa no
 * analytics o painel dispensado pela pessoa do recolhido pelo programa. Até
 * 2026-09-11 só havia `destroy()`, que encerra a INSTÂNCIA: quem só queria
 * fechar tinha de fingir um clique no véu, e as stories diziam isso por
 * extenso.
 *
 * `open()` e `isOpen()` entraram em 2026-09-12, pela mesma medição que os levou
 * ao `SheetElement`: sem eles, abrir por código exigia um GATILHO ESCONDIDO
 * (`.nds-sr-only` + `tabindex="-1"` + `aria-hidden="true"`) só para ter em quem
 * clicar. Eram QUATRO consumidores nesta stack — a `Controlled` do Sheet e a do
 * Dialog, e o Ctrl+K das duas paletas de comando, que disparavam um
 * `MouseEvent` sintético no gatilho. `isOpen()` tem consumidor próprio: a
 * paleta da docs page atribui a abertura a `button` ou `keyboard`, e precisa
 * saber se a abertura de fato vai acontecer antes de marcar a atribuição.
 *
 * `toggle()` do `DrawerElement` fica FORA, aqui e no Sheet: zero consumidores,
 * e num painel modal o gesto que ele serviria — atalho de teclado fechando o
 * painel — já é o Escape, que informa `'escape'`. Ver o docblock de
 * `SheetElement` para a medição inteira.
 */
export type DialogElement = DestroyableElement & {
  /** Abre o painel. Sem efeito se já estiver aberto. */
  open: () => void;
  /** Fecha o painel informando `'api'`. Sem efeito se já estiver fechado. */
  close: () => void;
  /** O painel está na tela agora? */
  isOpen: () => boolean;
};

export type DialogOptions = {
  /**
   * Elemento que abre o diálogo ao ser clicado. OPCIONAL desde 2026-09-12.
   *
   * Era obrigatório, e a obrigação é o que fabricava o gatilho escondido: quem
   * comandava o diálogo de fora não queria gatilho, queria abrir por código.
   * Com `open()` público, diálogo sem gatilho é caso legítimo.
   *
   * Quando existe, ele recebe `aria-haspopup="dialog"` e o `aria-expanded` que
   * acompanha a abertura. Quando não existe, o anúncio do controle é de quem
   * chama `open()`.
   */
  trigger?: HTMLElement;
  title: string;
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
  /**
   * Ações do rodapé.
   *
   * Aceita uma lista porque `.nds-dialog-footer` é quem faz o arranjo — empilha
   * ao contrário no estreito, alinha à direita no largo — e para isso os botões
   * precisam ser filhos DIRETOS dele. Envolvê-los num `<div>` extra deixava o
   * rodapé com um único filho e o arranjo não acontecia; era o que as stories
   * disfarçavam com classes `flex` do Tailwind, que não existem mais.
   */
  footer?: HTMLElement | HTMLElement[];
  /**
   * Deixa o cabeçalho (título + descrição) só para leitor de tela.
   *
   * O diálogo PRECISA de nome — `aria-labelledby` aponta para o título, e um
   * diálogo anônimo o axe reprova. Há arranjos em que desenhá-lo seria
   * redundância pura: na paleta de comandos, "Command Palette" escrito em cima
   * do campo de busca repete o que a busca já diz para quem enxerga. Aqui o
   * cabeçalho recebe `.nds-sr-only` — sai da tela e FICA na árvore de
   * acessibilidade, ao contrário de `display: none`, que apagaria o nome.
   *
   * Aditivo: sem a opção, nada muda para quem já usa a factory.
   */
  headerHidden?: boolean;
  showCloseButton?: boolean;
  /**
   * Rótulo acessível do botão de fechar do canto.
   *
   * Espelha o `closeLabel` das outras quatro stacks e o do `sheet.ts` desta.
   * Ficou de fora quando a prop foi regularizada nas outras: o literal
   * sobrevivia aqui em DOIS pontos — o `aria-label` do botão e o `.nds-sr-only`
   * dentro dele —, na stack que é a referência de contrato do projeto.
   *
   * O nome vai num `.nds-sr-only`, NÃO num `aria-label` — mesma decisão das
   * outras quatro, e pelo mesmo motivo documentado lá: texto real sobrevive à
   * tradução automática do navegador, que ignora atributo ARIA.
   *
   * Esta stack tinha os DOIS até 2026-09-08, e a sobreposição não era inócua:
   * com `aria-label` presente o nome sai dele e o span não é lido, então o
   * vanilla perdia justamente a propriedade que motivou a escolha. Medido no
   * repositório inteiro — 429 ocorrências de `.nds-sr-only`, e este era o único
   * ponto real de sobreposição.
   *
   * O `sheet.ts` desta stack usa só `aria-label`, e continua assim: lá não há
   * span, então o atributo é o único portador do nome. A divergência entre os
   * dois componentes está registrada, não resolvida.
   */
  closeLabel?: string;
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: DialogCloseReason) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _dialogCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// O ícone de fechar é montado NÓ A NÓ, e não por `innerHTML` com a string do
// SVG. Não é patch — não há lib por trás desta fábrica, e nada aqui muda a cada
// bump: é a regra de XSS da casa, em `docs/shared/guidelines/09-seguranca-xss.md`
// e no portão do `audit.mjs` que varre `.innerHTML =` no vanilla. O ganho é
// ficar imune ao dia em que o ícone vier do conteúdo traduzido, e não de um
// literal daqui.
function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
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

// ─── createDialog ─────────────────────────────────────────────────────────────

export function createDialog(options: DialogOptions): DialogElement {
  const { trigger, title, titleLevel = 2, description, content, footer, onOpenChange, onClose } = options;
  const showCloseButton = options.showCloseButton !== false;
  const closeLabel = options.closeLabel ?? 'Fechar';

  const id = ++_dialogCounter;
  const titleId = `dialog-title-${id}`;
  const descId = `dialog-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'dialog';
  // O gatilho abre um diálogo: anuncia isso ANTES do clique, e o aria-expanded
  // acompanha a abertura — é o que base-ui, reka-ui, bits-ui e radix-ng fazem
  // sozinhas, e o que o AlertDialog desta stack já escrevia à mão.
  if (trigger) {
    trigger.dataset.slot = 'dialog-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    wrapper.appendChild(trigger);
  }

  function isOpen(): boolean {
    return panelEl !== null;
  }

  function open(): void {
    // Já aberto: um segundo open() montaria um painel novo, perderia a
    // referência do anterior — que ficaria órfão no body — e travaria a
    // rolagem uma segunda vez, sem o destravar correspondente. Mesma guarda
    // que o AlertDialog desta stack já tinha.
    if (panelEl) return;

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-dialog-overlay';
    overlayEl.dataset.slot = 'dialog-overlay';
    overlayEl.dataset.state = 'open';
    // `target === overlayEl` e não "qualquer clique": o véu é o próprio alvo, e
    // a guarda deixa explícito que só ele dispensa. A conta de `offsetX`/
    // `offsetY` que morava aqui existia para a rota do overlay rolando, em que
    // arrastar a barra de rolagem do véu fechava o diálogo; sem aquela rota o
    // véu não rola e não tem barra.
    overlayEl.addEventListener('click', (event) => {
      if (event.target !== overlayEl) return;
      closeWithReason('overlay');
    });

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-dialog-content', options.class);
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'dialog-content';
    panelEl.dataset.state = 'open';

    /*
     * Todo `[data-slot="dialog-close"]` DENTRO do painel fecha, com
     * `close-button`.
     *
     * Delegação, e não um ouvinte por botão: o rodapé é de quem compõe e chega
     * pela opção `footer` (ou dentro do `content`, quando é um formulário) — um
     * ouvinte por elemento só alcançaria o X que a própria fábrica cria. A docs
     * page ENSINAVA marcar o Cancelar do rodapé com este slot desde sempre, e
     * nada escutava: o painel renderizava um Cancelar inerte, e cada story
     * contornava fingindo um clique no véu.
     *
     * `closest` e não `target`: o clique cai no ícone ou no `.nds-sr-only` de
     * dentro do botão, e a comparação direta erraria os dois.
     */
    panelEl.addEventListener('click', (event) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-slot="dialog-close"]')) closeWithReason('close-button');
    });

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = options.headerHidden
      ? 'nds-dialog-header nds-sr-only'
      : 'nds-dialog-header';
    headerEl.dataset.slot = 'dialog-header';

    const titleEl = document.createElement(`h${titleLevel}`);
    titleEl.id = titleId;
    titleEl.className = 'nds-dialog-title';
    titleEl.textContent = title;
    headerEl.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.id = descId;
      descEl.className = 'nds-dialog-description';
      descEl.textContent = description;
      headerEl.appendChild(descEl);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-dialog-body';
    bodyEl.dataset.slot = 'dialog-body';
    bodyEl.appendChild(content);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-dialog-footer';
      footerEl.dataset.slot = 'dialog-footer';
      for (const acao of Array.isArray(footer) ? footer : [footer]) {
        footerEl.appendChild(acao);
      }
      panelEl.appendChild(footerEl);
    }

    if (showCloseButton) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'nds-dialog-close';
      closeBtn.dataset.slot = 'dialog-close';
      // SEM `aria-label`: o nome vem do `.nds-sr-only` logo abaixo, que é a
      // decisão documentada nas outras quatro stacks — texto real sobrevive à
      // tradução automática do navegador, que ignora atributo ARIA. Com o
      // `aria-label` presente ele VENCIA o span, e o vanilla perdia justamente
      // a propriedade que motivou a escolha. O ícone é `aria-hidden`, então o
      // nome sai limpo do span.
      closeBtn.appendChild(createCloseIcon());
      const srOnly = document.createElement('span');
      srOnly.className = 'nds-sr-only';
      srOnly.textContent = closeLabel;
      closeBtn.appendChild(srOnly);
      // Sem ouvinte próprio: quem fecha é a delegação do painel, que já alcança
      // este botão pelo `data-slot`. Os dois juntos disparavam duas vezes.
      panelEl.appendChild(closeBtn);
    }

    document.body.appendChild(overlayEl);
    // Painel e overlay são IRMÃOS: o painel se posiciona sozinho no centro sem
    // depender do overlay. A rota que o fazia FILHO do véu — para que a rolagem
    // do véu o alcançasse — saiu em 2026-09-08 (ver o cabeçalho deste arquivo),
    // e com ela o pouso de foco próprio que ela exigia.
    document.body.appendChild(panelEl);

    const focusable = getFocusable(panelEl);
    focusable[0]?.focus();

    // A página atrás do véu não rola enquanto o diálogo está aberto — sem
    // isto, a roda do mouse sobre o véu rolava o documento inteiro por baixo.
    // A contagem vive em @/lib/scroll-lock, compartilhada com Sheet, Drawer e
    // Popover, e é ela que faz diálogos empilhados destravarem só no último.
    lockBodyScroll();

    trigger?.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  /**
   * Tira o painel do documento e solta o que ele prendeu.
   *
   * Separado do fechamento por vontade de quem usa, e é a mesma separação que
   * `sheet.ts` e `drawer.ts` já tinham: aqui NÃO se devolve foco (o elemento
   * anterior pode ter saído do DOM junto, que é exatamente o caso do desmonte)
   * nem se anuncia motivo.
   *
   * A guarda de "já fechado" mora aqui: um segundo fechamento — Escape depois
   * do clique no véu, ou o desmonte chegando em cima do fechamento — não pode
   * destravar a rolagem duas vezes, porque a contagem ficaria negativa e a
   * página seguinte abriria travada.
   */
  function desmontarPanel(): void {
    if (!panelEl && !overlayEl) return;
    unlockBodyScroll();
    trigger?.setAttribute('aria-expanded', 'false');
    if (overlayEl) overlayEl.dataset.state = 'closed';
    if (panelEl) panelEl.dataset.state = 'closed';
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
  }

  function closeWithReason(reason: DialogCloseReason): void {
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

  trigger?.addEventListener('click', open);

  // Limpeza quando o wrapper sai do DOM (troca de story, desmonte de página).
  // Forma compartilhada: `destroy()` público, idempotente e disparado sozinho.
  // O observador anterior se desligava na primeira mutação vista com o wrapper
  // ainda solto, e a guarda deixava de existir antes de servir para algo.
  // `Object.assign` e não um `as`: o verbo entra no tipo do próprio alvo, e
  // `tornarDestruivel` devolve exatamente `DialogElement` sem conversão.
  return tornarDestruivel(
    wrapper,
    Object.assign(wrapper, {
      open,
      close: () => closeWithReason('api'),
      isOpen,
    }),
    () => {
      /*
       * DESMONTE NÃO É FECHAMENTO, e por isso não chama `onClose`.
       *
       * Até 2026-09-11 esta saída chamava `closeWithReason('api')` — o MESMO
       * motivo do `close()` público logo acima —, então a série do GA4 não
       * separava "o programa fechou o painel" de "a página foi embora com ele
       * aberto": uma troca de idioma numa docs page com o painel aberto
       * produzia um `dialog_close` que ninguém provocou. Os três menus
       * perderam o mesmo disparo na mesma data, e `sheet.ts` e `drawer.ts` já
       * tinham esta forma.
       *
       * `onOpenChange(false)` FICA: quem espelha o estado do painel precisa
       * saber que ele não está mais na tela. O que sai é só o motivo, que é o
       * que alimenta o analytics.
       */
      const wasOpen = panelEl !== null || overlayEl !== null;
      desmontarPanel();
      if (wasOpen) onOpenChange?.(false);
    },
  );
}
