// ─── Peças internas da família de menus ───────────────────────────────────────
//
// DropdownMenu, Menubar e ContextMenu montam o miolo do menu do mesmo jeito —
// um `<ng-template>` instanciado dentro do `rdxMenuPopup` — e herdavam, por isso,
// as mesmas lacunas de teclado: o foco não entrava no submenu, e o Tab não saía
// do menu para a página — e a mesma lacuna de leitor de tela: o sub-gatilho não
// dizia QUAL painel abria. O conserto é um só, e mora aqui para não existir em
// três cópias que envelhecem separadas.
//
// Arquivo próprio, e não dentro de um dos três: nenhum componente importa de
// outro. Não é API pública — nenhum barril reexporta estas peças, e as três
// diretivas não entram nos arrays `NDS_*` de quem compõe. Exportadas só porque o
// verificador de templates precisa importar a classe (NG3004), e os tokens
// porque os três menus os fornecem.

import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  computed,
  inject,
} from '@angular/core';
import { RdxMenuRoot, injectRdxMenuRootContext } from '@radix-ng/primitives/menu';
import { isPlainTab, tabExitTarget } from '@/lib/tabbable';

/**
 * De onde o Tab que sai do menu conta a página, quando não é do gatilho.
 *
 * O padrão é o gatilho do menu de TOPO (`RdxMenuRoot.trigger()`), e serve ao
 * DropdownMenu como está. Dois menus precisam de outra âncora e a fornecem por
 * este token: o Menubar, cuja âncora é a BARRA — uma parada só, então o Tab
 * parte do fim dela e o Shift+Tab do começo —, e o ContextMenu, que não
 * registra gatilho nenhum na lib (o menu nasce no ponto do ponteiro) e cuja
 * âncora é a ÁREA do clique direito.
 */
export interface NdsMenuTabAnchor {
  tabAnchor(): HTMLElement | null;
}

export const NDS_MENU_TAB_ANCHOR = new InjectionToken<NdsMenuTabAnchor>('NDS_MENU_TAB_ANCHOR');

/** Quadros que o Tab espera o painel desmontar antes de pôr o foco no destino. */
const TAB_EXIT_FRAMES = 60;

/**
 * O injetor do POPUP, entregue ao miolo do menu.
 *
 * ─── O defeito que isto fecha ─────────────────────────────────────────────────
 *
 * A view de um `<ng-template>` resolve injeção pela árvore de DECLARAÇÃO: os
 * itens procuravam as peças do menu a partir de onde o template foi escrito (a
 * raiz do menu, a raiz do submenu), e não do popup em que são inseridos. Duas
 * coisas que o primitivo pendura NO POPUP ficavam fora do alcance — lido na
 * fonte do `@radix-ng/primitives` 1.1.2:
 *
 *   · a lista composta (`RdxCompositeList`), com que cada item se registra. Sem
 *     ela o popup caía na varredura do DOM — setas e typeahead sobreviviam, mas o
 *     sub-gatilho não tinha índice no menu pai. No Menubar a subida era pior: ela
 *     chegava à lista da BARRA, a dos gatilhos, e só não registrava os itens lá
 *     porque a lib confere se o item mora dentro do elemento da lista;
 *   · o nó do popup na árvore flutuante (`RDX_FLOATING_REGISTRATION`). O painel
 *     do SUBMENU se registrava como raiz solta, e não como filho do painel que o
 *     abriu: para o primitivo, o foco que entrava nele saía do menu pai, e o
 *     Escape lá dentro não tinha nível mais fundo a quem ceder.
 *
 * É a causa registrada em 2026-09-02 para o submenu fora do teclado (WCAG
 * 2.1.1): a seta direita abria o painel e o foco não entrava, então a seta
 * esquerda e o Escape — que agem com o foco dentro dele — não tinham o que
 * fechar. A entrada do foco tem ainda uma segunda garantia, no sub-gatilho
 * (`NdsSubmenuKeyboardEntry`, abaixo).
 *
 * `ngTemplateOutletInjector` corrige a subida: token que a view do miolo não
 * resolve nos próprios nós é procurado no injetor do popup ANTES de voltar à
 * árvore de declaração — é a ordem do Angular para view embutida com injetor
 * próprio. O que a declaração dava continua igual, porque a cadeia do popup sobe
 * pela mesma raiz de menu até chegar a ela.
 *
 * Uso, no template de cada raiz de menu:
 *
 *   <div rdxMenuPopup ndsMenuPopupScope #scope="ndsMenuPopupScope">
 *     <ng-container [ngTemplateOutlet]="…" [ngTemplateOutletInjector]="scope.injector" />
 *
 * ─── E o Tab: o menu fecha INTEIRO e o foco segue a página ────────────────────
 *
 * C2 do PRD do dropdown-menu, com o destino do Vanilla: Tab fecha o menu e o
 * foco vai ao próximo ponto de tabulação depois do gatilho (Shift+Tab: ao
 * anterior); sem vizinho, volta ao gatilho — nunca ao `<body>`. Dentro de um
 * submenu, fecha a cadeia toda: o Tab sai do MENU, não de um nível dele.
 *
 * O primitivo fazia outra coisa (medido com teclado real em 2026-09-10): o
 * `handleKeydown` do `RdxMenuPopup` fecha só o nível em que o foco está e deixa
 * o foco voltar ao gatilho — Tab e Shift+Tab davam no mesmo lugar, e no submenu
 * o pai continuava aberto. Por isso a tecla é consumida AQUI, num ouvinte de
 * CAPTURA no próprio painel, antes do da lib (`preventDefault` e fim da
 * propagação), e o fechamento vai pela cadeia (`closeEntireMenu`) com o motivo
 * `focus-out` — o mesmo de quando o foco sai sozinho; para a docs page é
 * `overlay`, "saiu sem decidir".
 *
 * O foco vai ao destino DEPOIS de o painel de topo desmontar, e a conta do
 * destino é feita nesse momento, e não na tecla: com o menu aberto a lib marca
 * a página `inert` (no ContextMenu, que é modal) e pendura âncoras de foco em
 * volta do gatilho — nada disso é o percurso da página. Desmontado o painel, o
 * escopo de foco da lib já não prende nada, e o foco devolvido ao gatilho na
 * desmontagem não vence: a lib não devolve o foco quando ele já está num
 * elemento de verdade fora do painel.
 */
@Directive({
  selector: '[ndsMenuPopupScope]',
  standalone: true,
  exportAs: 'ndsMenuPopupScope',
})
export class NdsMenuPopupScope {
  // PATCH: a11y — o miolo em ng-template recebe o injetor do popup (ver PATCHES.md#angular-dropdown-menu-submenu-entry)
  readonly injector = inject(Injector);

  private readonly popup = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** A raiz DESTE painel — a do menu de topo ou a de um submenu. */
  private readonly menu = inject(RdxMenuRoot);

  private readonly anchorOverride = inject(NDS_MENU_TAB_ANCHOR, { optional: true });

  constructor() {
    const onKeydown = (event: KeyboardEvent) => this.leaveOnTab(event);
    this.popup.addEventListener('keydown', onKeydown, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      this.popup.removeEventListener('keydown', onKeydown, { capture: true }),
    );
  }

  // PATCH: a11y — Tab fecha o menu inteiro e o foco segue a página (ver PATCHES.md#angular-dropdown-menu-tab-exit)
  private leaveOnTab(event: KeyboardEvent): void {
    if (!isPlainTab(event) || event.defaultPrevented) return;

    let top = this.menu;
    while (top.parentRoot) top = top.parentRoot;
    const anchor = this.anchorOverride?.tabAnchor() ?? top.trigger() ?? null;
    // Sem âncora não há percurso de onde contar: a tecla fica com a lib.
    if (!anchor) return;
    // Sem vizinho, o foco volta a quem abriu o menu: o gatilho, ou a própria
    // âncora quando ela é focável (a área do ContextMenu). A BARRA do Menubar
    // não é — ela é âncora da conta, e o gatilho do menu é o destino.
    const fallback = top.trigger() ?? anchor;

    event.preventDefault();
    event.stopImmediatePropagation();

    const topPopup = top.popupElement() ?? this.popup;
    this.menu.closeEntireMenu('focus-out', event);
    focusWhenGone(topPopup, () => tabExitTarget(event, anchor, fallback));
  }
}

/**
 * Espera `popup` sair do documento e pousa o foco no destino, contado nessa hora.
 *
 * Por quadro, com teto: o painel sai quando a animação de saída termina, e
 * painel mantido montado nunca sai — no teto o foco vai ao destino do mesmo
 * jeito, para a tecla nunca terminar sem destino.
 */
function focusWhenGone(popup: HTMLElement, destination: () => HTMLElement, attempt = 0): void {
  const view = popup.ownerDocument.defaultView;
  if (!view) return;
  view.requestAnimationFrame(() => {
    if (popup.isConnected && attempt < TAB_EXIT_FRAMES) {
      focusWhenGone(popup, destination, attempt + 1);
      return;
    }
    destination().focus();
  });
}

/** Quadros que o sub-gatilho espera o painel filho montar antes de desistir. */
const SUBMENU_FOCUS_FRAMES = 10;

/**
 * Os seletores com que o primitivo reconhece um item de menu — os mesmos do
 * `getFocusableMenuItems` dele, que não é exportado.
 */
const MENU_ITEM_SELECTOR =
  '[rdxMenuItem], [rdxMenuCheckboxItem], [rdxMenuRadioItem], [rdxMenuLinkItem], [rdxMenuSubTrigger]';

/**
 * O primeiro item DESTE painel — não o de um painel aninhado que o DOM pusesse
 * dentro dele. A mesma filtragem da lib: o `rdxMenuPopup` mais próximo do item
 * tem de ser o próprio painel.
 */
function firstMenuItemOf(popup: HTMLElement): HTMLElement | null {
  for (const item of popup.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)) {
    if (item.closest('[rdxMenuPopup]') === popup) return item;
  }
  return null;
}

/**
 * A seta para a direita LEVA O FOCO ao submenu.
 *
 * Contrato das cinco stacks (C6 do PRD do dropdown-menu): abrir e pôr o foco no
 * primeiro item do painel filho. O primitivo tenta, mas só quando o submenu
 * estava FECHADO — `onArrowRight` sai sem fazer nada se o painel já está aberto,
 * e é o caso comum de quem passou o ponteiro por cima antes de apertar a seta: a
 * pessoa via um painel que o teclado não alcançava.
 *
 * Entra como host directive do sub-gatilho, DEPOIS do `RdxMenuSubTrigger` na
 * lista — o ouvinte daqui roda depois do da lib e garante o destino nos dois
 * casos. Nunca rouba o foco: se ele já está dentro do painel filho, não faz
 * nada. Enter e Espaço não precisam dela: o `onEnter` da lib foca o primeiro
 * item com o painel aberto ou fechado.
 */
@Directive({
  standalone: true,
  host: {
    '(keydown.arrowright)': 'enterSubmenu()',
  },
})
export class NdsSubmenuKeyboardEntry {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** A raiz do SUBMENU — a mesma fonte de estado do `aria-expanded` da lib. */
  private readonly submenu = injectRdxMenuRootContext();

  // PATCH: a11y — a seta direita leva o foco ao submenu mesmo já aberto (ver PATCHES.md#angular-dropdown-menu-submenu-entry)
  protected enterSubmenu(): void {
    // Em RTL a seta que abre é a esquerda, e a lib nem reage a esta.
    if (this.submenu.dir() === 'rtl') return;
    this.focusFirstSubmenuItem(0);
  }

  /**
   * Espera o painel filho montar e pousa o foco no primeiro item dele.
   *
   * Por quadro de animação, e com teto: o painel entra pelo portal na detecção
   * de mudança seguinte, então no instante da tecla ele ainda não existe. A cada
   * quadro, três saídas — o submenu fechou (desiste), o foco já está lá dentro
   * (a lib chegou primeiro, nada a fazer) ou o foco pousou no item.
   */
  private focusFirstSubmenuItem(attempt: number): void {
    const doc = this.host.nativeElement.ownerDocument;
    doc.defaultView?.requestAnimationFrame(() => {
      if (!this.submenu.isOpen()) return;
      const popup = this.submenu.popupElement();
      const first = popup ? firstMenuItemOf(popup) : null;
      if (popup && first) {
        if (popup.contains(doc.activeElement)) return;
        first.focus({ preventScroll: true });
        if (doc.activeElement === first) return;
      }
      if (attempt < SUBMENU_FOCUS_FRAMES) this.focusFirstSubmenuItem(attempt + 1);
    });
  }
}

/**
 * O painel de um submenu, visto do sub-gatilho: o `id` que ele carrega.
 *
 * Fornecido pela raiz do SUBMENU de cada menu — `nds-dropdown-menu-sub`,
 * `nds-menubar-sub`, `div[ndsContextMenuSub]` —, que é quem monta o painel e o
 * marca com este `id`. O sub-gatilho mora dentro dela, e a injeção o acha no
 * degrau de cima — o mesmo elemento de onde a lib tira o contexto do submenu.
 * No DropdownMenu e no Menubar a raiz do submenu é o mesmo componente do menu
 * de topo, e o de topo também fornece o token; o sub-gatilho nunca chega a ele,
 * porque há sempre uma raiz de submenu mais perto.
 *
 * Único e gerado pelo `RdxIdGenerator` (`injectId`) em cada raiz: a mesma docs
 * page monta vários menus, e `id` repetido faria a ligação apontar para o
 * painel errado.
 */
export interface NdsSubmenuPanel {
  readonly panelId: string;
}

export const NDS_SUBMENU_PANEL = new InjectionToken<NdsSubmenuPanel>('NDS_SUBMENU_PANEL');

/**
 * O sub-gatilho diz QUAL painel abre: `aria-owns` apontando para o painel filho.
 *
 * ─── A ligação com o painel, e por que ela é do design system ─────────────────
 *
 * `RdxMenuSubTrigger` liga `aria-haspopup="menu"` e `aria-expanded`, e para por
 * aí: ele diz que HÁ um menu filho e que ele está aberto, mas não diz QUAL. Como
 * o painel é portalado para o `<body>`, não sobra nem a relação de ancestral
 * para o leitor de tela inferir — o menu filho fica solto no documento, longe do
 * item que o abriu. É a única das quatro libs de cabeçalho que não escreve essa
 * ligação, então quem a escreve é o wrapper — aqui, uma vez, para os três menus.
 *
 * `aria-owns`, e NÃO `aria-controls`. Não são alternativas de gosto:
 *
 *   · `aria-controls` é a ligação de quem CONTROLA um painel que já está no seu
 *     lugar na árvore — vale para o submenu aninhado;
 *   · `aria-owns` REPARENTA na árvore de acessibilidade um nó que o DOM pôs em
 *     outro canto, que é exatamente o caso aqui.
 *
 * O painel do `@radix-ng/primitives` sai no `<body>` (o container padrão do
 * `RdxPortalPresence`), medido antes de escolher — mesma colocação, e por isso
 * mesma escolha, do `aria-owns` que o Vanilla escreve em `src/lib/submenu.ts`.
 *
 * A ligação só vale enquanto o painel EXISTE: fechado, o `id` aponta para um nó
 * que saiu do documento, e apontar para o nada é pior que não apontar. Por isso
 * o valor é `null` com o menu fechado, na mesma fonte (`isOpen()`) de que a lib
 * tira o `aria-expanded` — os dois nunca se contradizem.
 *
 * Escrito por HOST BINDING, e não por `[attr.aria-owns]` no template de quem
 * compõe: neste stack o host binding de diretiva vence o atributo do template, e
 * a ligação escrita lá fora não pintaria (a mesma raiz dos 19 `data-slot` que
 * renderizaram errado). Aqui não há disputa — nenhuma diretiva da lib escreve
 * `aria-owns` neste elemento —, mas o lugar continua sendo o host.
 *
 * Entra como host directive do sub-gatilho dos três menus. O token é opcional
 * para que um gatilho montado fora da tríade não derrube a página: sem raiz não
 * há painel, e sem painel não há ligação a escrever.
 */
@Directive({
  standalone: true,
  host: {
    '[attr.aria-owns]': 'ownedPanelId()',
  },
})
export class NdsSubmenuOwnsPanel {
  private readonly panel = inject(NDS_SUBMENU_PANEL, { optional: true });

  /** A raiz do SUBMENU — a mesma fonte de estado do `aria-expanded` da lib. */
  private readonly submenu = injectRdxMenuRootContext();

  // PATCH: a11y — sub-gatilho liga o painel portalado por aria-owns (ver PATCHES.md#angular-menu-submenu-aria-owns)
  protected readonly ownedPanelId = computed<string | null>(() =>
    this.submenu.isOpen() ? (this.panel?.panelId ?? null) : null,
  );
}
