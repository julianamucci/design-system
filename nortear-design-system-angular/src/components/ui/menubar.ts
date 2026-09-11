import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { injectId } from '@radix-ng/primitives/core';
import { RdxMenubarRoot } from '@radix-ng/primitives/menubar';
import {
  RdxMenuRoot,
  RdxMenuTrigger,
  RdxMenuPortal,
  RdxMenuPositioner,
  RdxMenuPopup,
  RdxMenuItem,
  RdxMenuGroup,
  RdxMenuSeparator,
  RdxMenuSubTrigger,
  RdxMenuCheckboxItem,
  RdxMenuCheckboxItemIndicator,
  RdxMenuRadioGroup,
  RdxMenuRadioItem,
  RdxMenuRadioItemIndicator,
  injectRdxMenuGroupContext,
  injectRdxMenuRootContext,
  isIndeterminate,
} from '@radix-ng/primitives/menu';
import { ChevronRight, Check, Minus } from 'lucide';
import {
  NDS_MENU_TAB_ANCHOR,
  NDS_SUBMENU_PANEL,
  NdsMenuPopupScope,
  NdsSubmenuKeyboardEntry,
  NdsSubmenuOwnsPanel,
  type NdsMenuTabAnchor,
  type NdsSubmenuPanel,
} from './menu-popup-scope';

// ─── Menubar ──────────────────────────────────────────────────────────────────
//
// Visual: `.nds-menubar` e `.nds-menubar-trigger` (docs/shared/styles/nds/
// menubar.css) na barra; do popup para dentro reusa `.nds-dropdown-menu-*`, que
// é o que o React também faz — a folha do menubar só descreve a barra e o
// gatilho, e o bloco de painel dela é o do Vanilla, que posiciona em `absolute`
// dentro do wrapper. Aqui o painel vai para portal, então quem o descreve é o
// bloco composto do dropdown. Os `data-slot`, esses são `menubar-*`: é por eles
// que a auditoria compara markup entre as cinco stacks.
//
// ─── O que distingue o menubar de uma fileira de dropdowns ────────────────────
//
// Tudo o que o `@radix-ng/primitives/menu` entrega no DropdownMenu vale aqui sem
// alteração (papéis ARIA, foco no primeiro item, roving tabindex dentro do
// popup, typeahead, Escape com devolução do foco, submenu em diagonal). O que o
// `RdxMenubarRoot` acrescenta é a COORDENAÇÃO entre os menus, e é o que precisa
// existir para isto ser uma barra e não quatro botões vizinhos:
//
//   · `role="menubar"` na barra, com `aria-orientation`;
//   · ← → andam entre os gatilhos; com um menu ABERTO, andar já abre o vizinho
//     (o mesmo vale de dentro do popup — a seta atravessa para o menu ao lado);
//   · Home/End vão ao primeiro/último gatilho;
//   · UMA parada de tabulação para a barra inteira: os gatilhos entram numa
//     lista composta com roving tabindex, então só o gatilho realçado tem
//     `tabindex="0"` e o Tab seguinte sai da barra;
//   · trocar de menu com o ponteiro (hover) quando um já está aberto, sem
//     precisar clicar de novo;
//   · uma única árvore flutuante para os menus irmãos, para o motor de dispensa
//     enxergar a relação entre eles em vez de cada menu viver isolado.
//
// ─── Por que o conteúdo é um `<ng-template>` ──────────────────────────────────
//
//   <nds-menubar>                          barra: role=menubar + navegação
//     <nds-menubar-menu>                   um menu: estado + portal + posição
//       <button ndsMenubarTrigger>         gatilho na barra
//       <ng-template ndsMenubarContent>    o miolo do menu
//         <div ndsMenubarItem>             item
//
// Mesma razão do DropdownMenu: um nó PROJETADO pertence à view de quem consome,
// então fechar o menu remove os elementos do DOM mas não destrói as diretivas —
// e é a destruição que devolve o foco ao gatilho. Com `<ng-template>` quem monta
// e desmonta é o portal, e o ciclo inteiro volta a valer.
//
// E o miolo é instanciado com o injetor do POPUP (`NdsMenuPopupScope`, em
// `menu-popup-scope.ts`, a mesma peça do DropdownMenu e do ContextMenu). A view
// de um `<ng-template>` resolve injeção pela árvore de declaração: sem isto os
// itens não achavam a lista do painel em que estão, e o painel do submenu nascia
// como raiz solta na árvore flutuante em vez de filho do menu que o abriu — a
// seta direita abria o submenu e o foco não entrava, e a seta esquerda e o
// Escape lá dentro não tinham o que fechar (WCAG 2.1.1). Fechado em 2026-09-10.
//
// Da mesma peça sai o `aria-owns` do sub-gatilho (`NdsSubmenuOwnsPanel`): o
// painel do submenu é portalado para o `<body>`, e sem a ligação o leitor de
// tela ouvia que ALGUM menu abriu, sem saber qual.

/** Lado preferido de abertura do popup em relação ao gatilho. */
export type MenubarSide = 'top' | 'bottom' | 'left' | 'right';

/** Alinhamento do popup no eixo perpendicular ao `side`. */
export type MenubarAlign = 'start' | 'center' | 'end';

/** Ênfase visual do item. `destructive` é para ação irreversível. */
export type MenubarItemVariant = 'default' | 'destructive';

// ─── Root da barra ────────────────────────────────────────────────────────────

/**
 * A barra — `role="menubar"`.
 *
 * Só três inputs entram na lista, e todos são PRÓPRIOS do `RdxMenubarRoot`:
 * listar input de host directive aninhada quebra com NG0311, e nem é preciso
 * (armadilha 7 do CLAUDE.md deste stack). `orientation` fica de fora de
 * propósito: a folha compartilhada só desenha a barra horizontal, e expor um
 * input que não muda nada visualmente seria promessa falsa.
 *
 * É também a âncora do Tab que sai de um menu aberto (`NDS_MENU_TAB_ANCHOR`):
 * a barra é UMA parada de tabulação, então o foco segue para o que vem depois
 * dela (Shift+Tab: antes dela), e nunca para um gatilho vizinho — é a mesma
 * âncora do Vanilla.
 */
@Component({
  selector: 'nds-menubar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    { directive: RdxMenubarRoot, inputs: ['disabled', 'modal', 'loopFocus'] },
  ],
  providers: [{ provide: NDS_MENU_TAB_ANCHOR, useExisting: forwardRef(() => NdsMenubar) }],
  host: {
    class: 'nds-menubar',
    '[attr.data-slot]': '"menubar"',
  },
  template: '<ng-content />',
})
export class NdsMenubar implements NdsMenuTabAnchor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  tabAnchor(): HTMLElement {
    return this.host.nativeElement;
  }
}

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * O miolo de um menu, guardado até a abertura.
 *
 * Guarda também as preferências de posicionamento, que o menu lê e repassa ao
 * positioner. Elas moram aqui, e não no menu, porque é do popup que se fala ao
 * dizer "abre para a direita" — é o contrato das outras quatro stacks.
 *
 * Os quatro nascem indefinidos de propósito: quem resolve o padrão é o menu,
 * que sabe se este é um submenu — e submenu abre ao lado, não embaixo.
 */
@Directive({
  selector: 'ng-template[ndsMenubarContent], ng-template[ndsMenubarSubContent]',
  standalone: true,
})
export class NdsMenubarContent {
  readonly side = input<MenubarSide | undefined>(undefined);
  readonly align = input<MenubarAlign | undefined>(undefined);
  readonly sideOffset = input<number | undefined>(undefined);
  readonly alignOffset = input<number | undefined>(undefined);

  /** O template em si — o menu o instancia dentro do popup ao abrir. */
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}

// ─── Um menu da barra (e o submenu) ───────────────────────────────────────────

/**
 * Um menu — estado de abertura, portal e posicionamento.
 *
 * O mesmo componente serve ao menu de topo (`<nds-menubar-menu>`) e ao submenu
 * (`<nds-menubar-sub>`): o primitivo usa uma diretiva só para os dois casos e é
 * o `SubTrigger` quem marca a raiz como submenu, ao ser construído. Um segundo
 * componente só para trocar o seletor duplicaria portal e positioner.
 *
 * A barra encontra os menus de topo por uma content query de `RdxMenuRoot` — e
 * ela alcança host directives, que é o que faz este desenho funcionar. Os
 * submenus caem na mesma query, e o primitivo os descarta sozinho: o gatilho
 * deles vive DENTRO de um popup, e é esse o teste que ele aplica.
 */
@Component({
  selector: 'nds-menubar-menu, nds-menubar-sub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuPortal, RdxMenuPositioner, RdxMenuPopup, NdsMenuPopupScope, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'loopFocus'],
      outputs: ['openChange'],
    },
  ],
  // O `id` do painel do submenu, para o sub-gatilho apontar
  // (`NdsSubmenuOwnsPanel`). O menu da barra também fornece, e ninguém o lê:
  // todo sub-gatilho acha antes a raiz do próprio submenu.
  providers: [{ provide: NDS_SUBMENU_PANEL, useExisting: forwardRef(() => NdsMenubarMenu) }],
  host: {
    class: 'nds-menubar-menu',
    '[attr.data-slot]': 'slot()',
  },
  template: `
    <!--
      Uma \`<ng-content>\` só, sem seletor: o que precisa aparecer na página é o
      gatilho. O \`<ng-template>\` do conteúdo passa por aqui e não deixa nó
      nenhum — ele é instanciado lá embaixo, dentro do popup.
    -->
    <ng-content />

    <!--
      O portal teleporta o popup para o \`body\` ao abrir e o DESMONTA ao fechar.
      É o desmonte que devolve o foco ao gatilho.
    -->
    <ng-template rdxMenuPortal>
      <div
        rdxMenuPositioner
        class="nds-dropdown-menu-positioner"
        [side]="side()"
        [align]="alinhamento()"
        [sideOffset]="deslocamentoDoLado()"
        [alignOffset]="deslocamentoDoAlinhamento()"
      >
        <div
          rdxMenuPopup
          ndsMenuPopupScope
          #scope="ndsMenuPopupScope"
          class="nds-dropdown-menu-content"
          [attr.data-slot]="slotDoPopup()"
          [attr.id]="submenuPanelId()"
        >
          <!--
            O injetor DESTE painel, para o miolo dele: os itens se registram na
            lista deste painel (e não na da barra, que é a dos gatilhos), e um
            submenu declarado aqui dentro acha este painel como pai na árvore
            flutuante. Serve ao menu da barra e ao submenu, que são o mesmo
            componente.
          -->
          <ng-container
            [ngTemplateOutlet]="templateDoConteudo()!"
            [ngTemplateOutletInjector]="scope.injector"
          />
        </div>
      </div>
    </ng-template>
  `,
})
export class NdsMenubarMenu implements NdsSubmenuPanel {
  private readonly root = inject(RdxMenuRoot, { self: true });

  /** O `<ng-template>` que quem consome declarou dentro deste menu. */
  private readonly content = contentChild(NdsMenubarContent);

  /**
   * `id` do painel do SUBMENU — existe para o sub-gatilho ter para onde apontar.
   *
   * O painel é portalado para o `<body>`: não é descendente do item que o
   * abriu, e sem este `id` nada no documento liga um ao outro. O menu da barra
   * não o usa — o gatilho dele não aponta para o painel —, então o painel de
   * topo segue sem `id`.
   */
  readonly panelId = injectId('nds-menubar-sub-content-');

  protected readonly submenuPanelId = computed<string | null>(() =>
    this.root.isSubmenu() ? this.panelId : null,
  );

  protected readonly templateDoConteudo = computed<TemplateRef<unknown> | null>(
    () => this.content()?.tpl ?? null,
  );

  protected readonly slot = computed(() =>
    this.root.isSubmenu() ? 'menubar-sub' : 'menubar-menu',
  );

  protected readonly slotDoPopup = computed(() =>
    this.root.isSubmenu() ? 'menubar-sub-content' : 'menubar-content',
  );

  /** Submenu abre ao lado do item que o dispara; menu da barra, abaixo do gatilho. */
  protected readonly side = computed<MenubarSide>(
    () => this.content()?.side() ?? (this.root.isSubmenu() ? 'right' : 'bottom'),
  );

  protected readonly alinhamento = computed<MenubarAlign>(
    () => this.content()?.align() ?? 'start',
  );

  // 8px reproduzem o vão do Vanilla: 4px de padding da barra mais 4px de
  // margem do painel. Submenu nasce encostado, para o cursor cruzar do item
  // para ele sem atravessar um vão.
  protected readonly deslocamentoDoLado = computed<number>(
    () => this.content()?.sideOffset() ?? (this.root.isSubmenu() ? 0 : 8),
  );

  // -4px devolvem o padding lateral do popup, alinhando o texto do primeiro
  // item com o texto do gatilho. No submenu o alvo é o item que o abriu, cujo
  // recuo é 3px.
  protected readonly deslocamentoDoAlinhamento = computed<number>(
    () => this.content()?.alignOffset() ?? (this.root.isSubmenu() ? -3 : -4),
  );
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * O gatilho de um menu na barra.
 *
 * Recebe `role="menuitem"` do primitivo (e não o papel implícito de botão): num
 * menubar o gatilho é item DA BARRA, e é assim que o Vanilla também o emite.
 * `aria-haspopup="menu"` e `aria-expanded` vêm junto, derivados do estado.
 *
 * O `data-state` é escrito aqui porque a folha compartilhada realça o gatilho
 * aberto por `.nds-menubar-trigger[data-state="open"]` — o marcador do Vanilla.
 * O primitivo publica o mesmo estado como `data-popup-open`, que a folha não
 * conhece; escrever `data-state` alinha o markup ao Vanilla, que é a referência,
 * em vez de inventar uma regra CSS. Nenhuma outra diretiva liga `data-state`
 * neste elemento, então não há disputa de atributo.
 */
@Directive({
  selector: 'button[ndsMenubarTrigger]',
  standalone: true,
  hostDirectives: [{ directive: RdxMenuTrigger, inputs: ['disabled'] }],
  host: {
    class: 'nds-menubar-trigger',
    '[attr.data-slot]': '"menubar-trigger"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsMenubarTrigger {
  private readonly menu = injectRdxMenuRootContext();

  readonly state = computed(() => (this.menu.isOpen() ? 'open' : 'closed'));
}

// ─── Group + Label ────────────────────────────────────────────────────────────

/** Agrupa itens relacionados — `role="group"`, nomeado pelo Label irmão. */
@Directive({
  selector: 'div[ndsMenubarGroup]',
  standalone: true,
  hostDirectives: [RdxMenuGroup],
  host: {
    '[attr.data-slot]': '"menubar-group"',
  },
})
export class NdsMenubarGroup {}

/**
 * Cabeçalho de um grupo — não é interativo.
 *
 * O `RdxMenuGroupLabel` do primitivo faz o mesmo (gera um id e o publica no
 * grupo, para o `aria-labelledby`), mas EXIGE um grupo ancestral: sem ele a
 * injeção do contexto lança. Rótulo solto é uso legítimo — o menu Exibir do
 * conteúdo compartilhado tem um —, então a ligação usa o contexto opcional.
 */
@Directive({
  selector: 'div[ndsMenubarLabel]',
  standalone: true,
  host: {
    class: 'nds-dropdown-menu-label',
    '[attr.id]': 'id',
    '[attr.data-slot]': '"menubar-label"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsMenubarLabel {
  /** Recua o rótulo para alinhá-lo com itens que têm ícone à esquerda. */
  readonly inset = input(false);

  protected readonly id = injectId('nds-menubar-label-');

  private readonly group = injectRdxMenuGroupContext(true);

  constructor() {
    this.group?.labelId.set(this.id);
  }
}

// ─── Separator ────────────────────────────────────────────────────────────────

/** Divide grupos de itens — `role="separator"`. */
@Directive({
  selector: 'div[ndsMenubarSeparator]',
  standalone: true,
  hostDirectives: [RdxMenuSeparator],
  host: {
    class: 'nds-dropdown-menu-separator',
    '[attr.data-slot]': '"menubar-separator"',
  },
})
export class NdsMenubarSeparator {}

// ─── Item ─────────────────────────────────────────────────────────────────────

/**
 * Ação executável — `role="menuitem"`.
 *
 * É um `<div>` e não um `<button>`: a folha `.nds-dropdown-menu-item` não zera
 * a aparência nativa de botão, e um `<button>` ali apareceria com fundo e borda
 * do navegador. O que a semântica pede não é a TAG e sim papel, foco e teclado —
 * e o primitivo entrega os três.
 *
 * Nenhum `(click)` é declarado neste host: um listener de host corre DEPOIS do
 * `(click)` que quem consome escreve no mesmo elemento. Para reagir à escolha,
 * use `(onSelect)` ou o próprio `(click)`.
 */
@Directive({
  selector: 'div[ndsMenubarItem]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuItem,
      inputs: ['disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'],
    },
  ],
  host: {
    // O primitivo acha os itens por `querySelectorAll('[rdxMenuItem]')`, e
    // hostDirective NÃO escreve o atributo no DOM — sem esta linha o item fica
    // fora do roving tabindex e do typeahead, em silêncio.
    rdxMenuItem: '',
    class: 'nds-dropdown-menu-item',
    '[attr.data-slot]': '"menubar-item"',
    '[attr.data-variant]': 'variant()',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsMenubarItem {
  /** `destructive` pinta o item com a cor de perigo — só para ação irreversível. */
  readonly variant = input<MenubarItemVariant>('default');

  /** Recua o item para alinhá-lo com irmãos que têm ícone à esquerda. */
  readonly inset = input(false);
}

// ─── Shortcut ─────────────────────────────────────────────────────────────────

/**
 * Atalho de teclado exibido à direita do item.
 *
 * É apenas visual: registrar a tecla é do consumidor. O texto NÃO recebe
 * `aria-hidden` — ele faz parte do nome do item ("Salvar, Control S"), que é o
 * que o leitor de tela precisa anunciar para o atalho ter serventia.
 */
@Directive({
  selector: 'span[ndsMenubarShortcut]',
  standalone: true,
  host: {
    class: 'nds-dropdown-menu-shortcut',
    '[attr.data-slot]': '"menubar-shortcut"',
  },
})
export class NdsMenubarShortcut {}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Host é o próprio `<svg>`, então a regra `.nds-dropdown-menu-item svg`
// dimensiona o elemento real e não sobra wrapper. Os filhos nascem de
// `createElementNS` porque cada ícone do lucide é uma lista `[tag, attrs]` com
// tag variável, e template Angular exige tag estática. Construir nós é imune a
// XSS: não há `innerHTML` no caminho.
//
// Não é exportado — serve só ao chevron do sub-gatilho e ao indicador de
// marcação, ambos montados aqui dentro.

type LucideIconNode = [string, Record<string, string>];

const MENUBAR_ICON_MAP = {
  chevron: ChevronRight as unknown as LucideIconNode[],
  check: Check as unknown as LucideIconNode[],
  // O traço do estado misto. Não é desenho novo: `Minus` do lucide é
  // `M5 12h14`, o MESMO segmento que `<line x1="5" y1="12" x2="19" y2="12" />`
  // da caixa de seleção desta stack — mesma geometria, entrando pelo mesmo
  // mecanismo de ícone que o resto do menu já usa.
  minus: Minus as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsMenubarIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    // O ícone acompanha um texto que já nomeia a ação (ou um estado que o
    // `aria-checked` já anuncia). Repeti-lo viraria eco no leitor de tela.
    'aria-hidden': 'true',
  },
})
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera precisa IMPORTAR a classe, e símbolo não exportado quebra a
// geração (NG3004). Não é API pública — nenhum barril a reexporta.
export class NdsMenubarIcon {
  readonly kind = input.required<keyof typeof MENUBAR_ICON_MAP>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of MENUBAR_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── Submenu ──────────────────────────────────────────────────────────────────

/**
 * Item que abre um submenu — `role="menuitem"` com `aria-haspopup="menu"` e
 * `aria-expanded`.
 *
 * O chevron entra pelo template do componente para quem escreve não precisar
 * lembrar de colocá-lo.
 *
 * Teclado, pelo contrato do Vanilla: seta direita, Enter e Espaço abrem o
 * submenu e põem o foco no primeiro item dele. Enter e Espaço são da lib; a seta
 * direita tem a garantia de `NdsSubmenuKeyboardEntry`, que vem DEPOIS do
 * `RdxMenuSubTrigger` na lista para o ouvinte dela rodar depois do da lib. A
 * seta direita no sub-gatilho não troca de menu na barra: a lib interrompe a
 * propagação ali, antes de o painel pai vê-la.
 *
 * E o `aria-owns` que liga o item ao painel portalado, só com ele aberto, vem de
 * `NdsSubmenuOwnsPanel` — a lib não escreve essa ligação.
 */
@Component({
  selector: 'div[ndsMenubarSubTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsMenubarIcon],
  hostDirectives: [
    { directive: RdxMenuSubTrigger, inputs: ['disabled', 'openOnHover', 'label'] },
    NdsSubmenuKeyboardEntry,
    NdsSubmenuOwnsPanel,
  ],
  host: {
    // Ver a nota do item: o primitivo varre `[rdxMenuSubTrigger]` no DOM para
    // fechar os submenus irmãos ao abrir este.
    rdxMenuSubTrigger: '',
    class: 'nds-dropdown-menu-sub-trigger',
    '[attr.data-slot]': '"menubar-sub-trigger"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
  template: `
    <ng-content />
    <svg ndsMenubarIcon kind="chevron" class="nds-dropdown-menu-sub-trigger-chevron"></svg>
  `,
})
export class NdsMenubarSubTrigger {
  readonly inset = input(false);
}

// ─── CheckboxItem ─────────────────────────────────────────────────────────────

/**
 * Item com estado de marcação — `role="menuitemcheckbox"` e `aria-checked`.
 *
 * O estado é TRI-VALORADO: `true`, `false` e `'indeterminate'` (o misto,
 * "alguns dos filhos"). O primitivo já anuncia os três — `aria-checked="mixed"`
 * no misto —, mas quem desenha o glifo é este componente.
 *
 * Não fecha o menu ao alternar (padrão do primitivo): quem liga a régua costuma
 * querer ligar a grade logo em seguida.
 */
@Component({
  selector: 'div[ndsMenubarCheckboxItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuCheckboxItemIndicator, NdsMenubarIcon],
  hostDirectives: [
    {
      directive: RdxMenuCheckboxItem,
      inputs: ['checked', 'disabled', 'closeOnClick', 'label'],
      outputs: ['checkedChange'],
    },
  ],
  host: {
    rdxMenuCheckboxItem: '',
    class: 'nds-dropdown-menu-checkbox-item',
    '[attr.data-slot]': '"menubar-checkbox-item"',
  },
  template: `
    <span class="nds-dropdown-menu-item-indicator" data-slot="menubar-checkbox-item-indicator">
      <span rdxMenuCheckboxItemIndicator>
        <svg ndsMenubarIcon [kind]="misto() ? 'minus' : 'check'"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsMenubarCheckboxItem {
  private readonly item = inject(RdxMenuCheckboxItem, { self: true });

  /**
   * O símbolo do estado misto é TRAÇO, não tique.
   *
   * Tique quer dizer "marcado", e misto não é isso. O desenho vem da caixa de
   * seleção desta stack, que já resolve o misto com um traço horizontal.
   *
   * A ramificação mora aqui, no markup, e não numa regra sobre
   * `[data-indeterminate]`, por duas medições:
   *
   * 1. O indicador da lib não entrega o estado ao conteúdo projetado — a fonte
   *    é o `checked` do próprio item, lido do host directive.
   * 2. Por CSS os dois glifos precisariam existir no markup com um deles
   *    oculto — ou seja, um tique presente num estado que não é "marcado" —, e
   *    a regra moraria na folha compartilhada pelas cinco stacks, cujas árvores
   *    diferem. As demais resolvem ramificando; uma regra só de CSS criaria um
   *    segundo vocabulário para o mesmo estado.
   */
  protected readonly misto = computed(() => isIndeterminate(this.item.checked()));
}

// ─── RadioGroup + RadioItem ───────────────────────────────────────────────────

/** Grupo de escolha única dentro do menu — `role="group"` com valor comum. */
@Directive({
  selector: 'div[ndsMenubarRadioGroup]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuRadioGroup,
      inputs: ['value', 'defaultValue', 'disabled'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    '[attr.data-slot]': '"menubar-radio-group"',
  },
})
export class NdsMenubarRadioGroup {}

/** Opção de escolha única — `role="menuitemradio"` e `aria-checked`. */
@Component({
  selector: 'div[ndsMenubarRadioItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuRadioItemIndicator, NdsMenubarIcon],
  hostDirectives: [
    {
      directive: RdxMenuRadioItem,
      inputs: ['value', 'disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'],
    },
  ],
  host: {
    rdxMenuRadioItem: '',
    class: 'nds-dropdown-menu-radio-item',
    '[attr.data-slot]': '"menubar-radio-item"',
  },
  template: `
    <span class="nds-dropdown-menu-item-indicator" data-slot="menubar-radio-item-indicator">
      <span rdxMenuRadioItemIndicator>
        <svg ndsMenubarIcon kind="check"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsMenubarRadioItem {}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/** A família inteira — para o `imports` de quem compõe. */
export const NDS_MENUBAR = [
  NdsMenubar,
  NdsMenubarMenu,
  NdsMenubarContent,
  NdsMenubarTrigger,
  NdsMenubarGroup,
  NdsMenubarLabel,
  NdsMenubarSeparator,
  NdsMenubarItem,
  NdsMenubarShortcut,
  NdsMenubarSubTrigger,
  NdsMenubarCheckboxItem,
  NdsMenubarRadioGroup,
  NdsMenubarRadioItem,
] as const;
