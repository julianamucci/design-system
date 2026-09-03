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
//      É a ROTA A das duas descritas logo abaixo.
//  10. REGIÃO VIVA: nenhuma. A abertura já move o foco, e o papel de diálogo
//      já é anunciado.
//
// ─── Conteúdo mais alto que a janela: as DUAS rotas ─────────────────────────
//
// ROTA A — CORPO ROLÁVEL. O painel fica parado e centralizado, o cabeçalho e o
// rodapé não saem da tela, e a rolagem acontece dentro do corpo. Nada muda na
// factory: quem compõe pendura .nds-dialog-body-scroll no elemento que passa em
// `content`, com tabindex="0", role="group" e nome (item 9 acima).
//
// ROTA B — OVERLAY ROLANDO. O painel entra no FLUXO do overlay, e quem rola é o
// overlay: o cabeçalho sobe junto com o conteúdo e sai da tela. Serve para
// conteúdo que se lê de ponta a ponta (um contrato, um artigo), em que fixar o
// cabeçalho rouba altura útil. Liga-se com a opção `scroll`, que põe
// .nds-dialog-overlay-scroll e .nds-dialog-content-scroll — o par que
// dialog.css declara para as cinco stacks.
//
// A FORMA da rota B diverge por stack, e isso é divergência de API de
// framework: não há fonte de verdade e não se "alinha". Aqui é uma opção da
// factory, na mesma família de `showCloseButton` e `headerHidden`.
//
// Duas consequências de montagem, e as duas são da rota B:
//
//   · o painel deixa de ser IRMÃO do overlay e passa a ser FILHO dele —
//     rolagem de um elemento só alcança o que está dentro dele;
//   · o clique no painel agora borbulha até o overlay, e o ouvinte que dispensa
//     passa a exigir `event.target === overlayEl`. Junto vem a conta da BARRA
//     DE ROLAGEM: o ponteiro que cai além da caixa de conteúdo do overlay não é
//     clique fora, e sem essa guarda arrastar a barra fecharia o diálogo.
//
// ─── O que esta stack NÃO faz, e é decisão de família ───────────────────────
//
// Não anima a SAÍDA: closeWithReason marca data-state="closed" e remove no
// mesmo quadro, então as keyframes de saída de dialog.css não chegam a rodar.
// É como Sheet e Drawer se comportam nesta stack; o único que espera a
// animação é o AlertDialog, que tem o par animationend + timeout escrito.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';

export type DialogCloseReason = 'escape' | 'overlay' | 'close-button' | 'action';

export type DialogOptions = {
  trigger: HTMLElement;
  title: string;
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
  /**
   * Rota B — o painel sai do centro fixo e entra no fluxo do overlay, que passa
   * a ser quem rola. O cabeçalho sobe junto com o conteúdo.
   *
   * Para manter cabeçalho e rodapé parados (rota A), deixe fora e pendure
   * `.nds-dialog-body-scroll` no elemento que vai em `content`. As duas rotas
   * estão descritas no cabeçalho deste arquivo.
   */
  scroll?: boolean;
  showCloseButton?: boolean;
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

// PATCH: bugfix — antes o close button era construído via assignment de string
// SVG (atribuição direta a innerHTML), o que viola a regra de "nenhum innerHTML
// com SVG hardcoded" do auditor de segurança. Construir nodes SVG via
// createElementNS deixa o lint feliz e elimina qualquer rota futura de injeção
// se o ícone passar a vir de translation.
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

export function createDialog(options: DialogOptions): DestroyableElement {
  const { trigger, title, description, content, footer, onOpenChange, onClose } = options;
  const showCloseButton = options.showCloseButton !== false;

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
  trigger.dataset.slot = 'dialog-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  wrapper.appendChild(trigger);

  function open(): void {
    // Já aberto: um segundo open() montaria um painel novo, perderia a
    // referência do anterior — que ficaria órfão no body — e travaria a
    // rolagem uma segunda vez, sem o destravar correspondente. Mesma guarda
    // que o AlertDialog desta stack já tinha.
    if (panelEl) return;

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = cn(
      'nds-dialog-overlay',
      options.scroll && 'nds-dialog-overlay-scroll',
    );
    overlayEl.dataset.slot = 'dialog-overlay';
    overlayEl.dataset.state = 'open';
    // `target === overlayEl` e não "qualquer clique no véu": na rota B o painel
    // é filho do overlay, então o clique dentro dele borbulha até aqui. E a
    // conta de `offsetX`/`offsetY` separa a BARRA DE ROLAGEM do véu — o ponteiro
    // que cai além da caixa de conteúdo não é clique fora, e sem isto arrastar
    // a barra fecharia o diálogo.
    overlayEl.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target !== overlayEl) return;
      if (event.offsetX > target.clientWidth || event.offsetY > target.clientHeight) return;
      closeWithReason('overlay');
    });

    panelEl = document.createElement('div');
    panelEl.className = cn(
      'nds-dialog-content',
      options.scroll && 'nds-dialog-content-scroll',
      options.class,
    );
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'dialog-content';
    panelEl.dataset.state = 'open';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = options.headerHidden
      ? 'nds-dialog-header nds-sr-only'
      : 'nds-dialog-header';
    headerEl.dataset.slot = 'dialog-header';

    const titleEl = document.createElement('h2');
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
      closeBtn.setAttribute('aria-label', 'Fechar');
      closeBtn.appendChild(createCloseIcon());
      const srOnly = document.createElement('span');
      srOnly.className = 'nds-sr-only';
      srOnly.textContent = 'Fechar';
      closeBtn.appendChild(srOnly);
      closeBtn.addEventListener('click', () => closeWithReason('close-button'));
      panelEl.appendChild(closeBtn);
    }

    document.body.appendChild(overlayEl);
    // Rota B: o painel é FILHO do overlay, porque a rolagem de um elemento só
    // alcança o que está dentro dele. Rota A: irmãos, e o painel se posiciona
    // sozinho no centro sem depender do overlay.
    if (options.scroll) overlayEl.appendChild(panelEl);
    else document.body.appendChild(panelEl);

    const focusable = getFocusable(panelEl);
    focusable[0]?.focus();

    // A página atrás do véu não rola enquanto o diálogo está aberto — sem
    // isto, a roda do mouse sobre o véu rolava o documento inteiro por baixo.
    // A contagem vive em @/lib/scroll-lock, compartilhada com Sheet, Drawer e
    // Popover, e é ela que faz diálogos empilhados destravarem só no último.
    lockBodyScroll();

    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  function closeWithReason(reason: DialogCloseReason): void {
    // Já fechado: um segundo close (Escape depois do clique no véu, ou o
    // destruir chegando em cima do fechamento) não pode destravar a rolagem
    // duas vezes — a contagem ficaria negativa e a página seguinte abriria
    // travada.
    if (!panelEl && !overlayEl) return;
    unlockBodyScroll();
    trigger.setAttribute('aria-expanded', 'false');
    if (overlayEl) overlayEl.dataset.state = 'closed';
    if (panelEl) panelEl.dataset.state = 'closed';
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
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

  // Limpeza quando o wrapper sai do DOM (troca de story, desmonte de página).
  // Forma compartilhada: `destroy()` público, idempotente e disparado sozinho.
  // O observador anterior se desligava na primeira mutação vista com o wrapper
  // ainda solto, e a guarda deixava de existir antes de servir para algo.
  return tornarDestruivel(wrapper, wrapper, () => {
    if (panelEl) closeWithReason('action');
  });
}
