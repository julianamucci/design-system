/**
 * CONTRATO DE ACESSIBILIDADE DO MENU — versão curta; o bloco canônico, com a
 * medição das cinco stacks, está no cabeçalho do `dropdown-menu` do Vanilla.
 *
 * Cumprido igual em todas: `aria-haspopup="menu"` + `aria-expanded` no gatilho;
 * `role="menu"` no painel e `menuitem` / `menuitemcheckbox` / `menuitemradio`
 * nos itens; setas, `Home`/`End` e typeahead; `Escape` fecha e devolve o foco ao
 * gatilho; nenhuma região viva.
 *
 * O item DESABILITADO: a seta POUSA nele. Decisão do design system tomada em
 * 2026-09-02 e válida nas cinco stacks — a WAI-ARIA APG pede que o item
 * desabilitado siga alcançável pela seta para ser ANUNCIADO, porque tirá-lo da
 * roda esconde de quem navega de ouvido que a opção existe e está indisponível.
 * O que ele não faz é ATIVAR.
 *
 * MECANISMO DESTA STACK: nada a alterar, ela já cumpria a decisão. O
 * `handleKeydown` de `RdxMenuPopup` percorre a lista de `menuItems()`, e
 * `getCompositeMenuItems()` filtra essa lista só por VISIBILIDADE — `disabled`
 * não tira o item dela. A story `ItemDisabled` aperta a seta e verifica onde o
 * foco pousa. Medido na fonte em 2026-09-02.
 */
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { injectId } from '@radix-ng/primitives/core';
import {
  RdxMenuRoot,
  RdxMenuTrigger,
  RdxMenuPortal,
  RdxMenuPositioner,
  RdxMenuPopup,
  RdxMenuItem,
  RdxMenuLinkItem,
  RdxMenuGroup,
  RdxMenuSeparator,
  RdxMenuSubTrigger,
  RdxMenuCheckboxItem,
  RdxMenuCheckboxItemIndicator,
  RdxMenuRadioGroup,
  RdxMenuRadioItem,
  RdxMenuRadioItemIndicator,
  injectRdxMenuGroupContext,
  isIndeterminate,
} from '@radix-ng/primitives/menu';
import {
  NDS_SUBMENU_PANEL,
  NdsMenuPopupScope,
  NdsSubmenuKeyboardEntry,
  NdsSubmenuOwnsPanel,
  type NdsSubmenuPanel,
} from './menu-popup-scope';

// ─── DropdownMenu ─────────────────────────────────────────────────────────────
//
// Visual: classes .nds-dropdown-menu-* (docs/shared/styles/nds/dropdown-menu.css),
// bloco "composite" da folha — o mesmo que React, Vue e Svelte consomem. O bloco
// standalone do topo da folha é o do Vanilla, que monta `<ul>/<li>` à mão; as
// stacks com lib headless renderizam `<div role="menu">` e é esse markup que o
// CSS composto (positioner, data-highlighted, submenu, indicador) descreve.
//
// ─── O que o primitivo entrega ────────────────────────────────────────────────
//
// `@radix-ng/primitives/menu` cobre praticamente todo o comportamento, e nada
// disso é reescrito aqui:
//
//   · `aria-haspopup="menu"` e `aria-expanded` no gatilho, derivados do estado;
//   · `role="menu"` + `tabindex="-1"` no popup, com foco no primeiro item ao
//     abrir por teclado e devolução do foco ao gatilho ao fechar;
//   · roving tabindex entre os itens (`tabindex` 0 só no item destacado),
//     setas ↑ ↓, Home/End, laço no fim da lista e TYPEAHEAD por letra digitada;
//   · `role="menuitem" | "menuitemcheckbox" | "menuitemradio"` com `aria-checked`
//     e `aria-disabled` acompanhando o estado;
//   · Escape fecha e devolve o foco ao gatilho; clique fora fecha; `modal`
//     bloqueia a rolagem da página;
//   · posicionamento por floating-ui (`side`/`align`/`sideOffset`/`alignOffset`)
//     com fuga de colisão, portal para o `body` e desmonte ao fechar;
//   · submenu com abertura por hover em "safe polygon" (o cursor pode cruzar na
//     diagonal sem que o irmão roube o menu), setas → ← e fechamento em cadeia.
//
// ─── Por que o conteúdo é um `<ng-template>` ──────────────────────────────────
//
//   <nds-dropdown-menu>                       raiz: estado + portal + positioner
//     <button ndsDropdownMenuTrigger>         gatilho (âncora do posicionamento)
//     <ng-template ndsDropdownMenuContent>    o miolo do menu
//       <div ndsDropdownMenuItem>             item
//
// A raiz é `@Component` porque precisa de template: é ela que declara o portal,
// o positioner e o popup (`role="menu"`). O miolo chega como `TemplateRef` e é
// instanciado DENTRO do popup, a cada abertura.
//
// A alternativa — o consumidor escrever o popup como elemento e a raiz projetá-lo
// para dentro do positioner — foi tentada e descartada por um motivo concreto: o
// nó projetado pertence à view de quem consome, então FECHAR o menu remove os
// elementos do DOM mas NÃO destrói as diretivas. O escopo de foco da lib devolve
// o foco ao gatilho no desmonte, e o desmonte nunca acontecia: escolher um item
// fechava o menu e deixava o foco no `<body>` — WCAG 2.4.3 quebrado, sem erro
// nenhum na tela. Com `<ng-template>`, quem monta e desmonta é o portal, e todo
// o ciclo (foco inicial, devolução do foco, dispensa) volta a valer.
//
// O preço, e como está pago: a injeção de dependência de uma view embutida sobe
// pela árvore de DECLARAÇÃO, não pela de inserção — os itens procuravam a lista
// composta (`RdxCompositeList`) e o nó da árvore flutuante, que vivem no POPUP, a
// partir de `<nds-dropdown-menu>`. Setas e typeahead sobreviviam pela varredura
// do DOM, mas o painel do submenu nascia como raiz solta, e não como filho do
// menu que o abriu: a seta direita abria o submenu e o foco não entrava, e a
// seta esquerda e o Escape lá dentro não tinham o que fechar (WCAG 2.1.1,
// registrado em 2026-09-02).
//
// Fechado em 2026-09-10, em duas partes, com as peças de `menu-popup-scope.ts`
// que o ContextMenu e o Menubar também usam:
//
//   · o popup entrega o PRÓPRIO injetor ao miolo (`NdsMenuPopupScope` +
//     `[ngTemplateOutletInjector]`, no template da raiz abaixo) — os itens se
//     registram na lista do painel em que estão, e o painel do submenu acha o
//     painel pai na árvore flutuante. Com isso a seta esquerda e o Escape dentro
//     do submenu fecham SÓ o submenu e devolvem o foco ao sub-gatilho, que é o
//     que o Vanilla faz;
//   · o sub-gatilho leva o foco ao primeiro item do submenu na seta direita
//     (`NdsSubmenuKeyboardEntry`), também quando o ponteiro já tinha aberto o
//     painel — caso em que a lib abre mão de mover o foco.
//
// E o sub-gatilho diz QUAL painel abre: `aria-owns` apontando para o painel
// portalado, só enquanto ele está aberto (`NdsSubmenuOwnsPanel`, com o `id` que
// a raiz do submenu dá ao painel). A lib escreve `aria-haspopup` e
// `aria-expanded`, e para aí.
//
// A story `WithSubmenu` aperta as três teclas, confere onde o foco pousa e para
// onde o `aria-owns` aponta.
//
// E o Tab (C2), na mesma peça do popup: fecha o menu INTEIRO, também de dentro
// do submenu, e o foco segue a página a partir do gatilho — o próximo ponto de
// tabulação (Shift+Tab: o anterior), ou o próprio gatilho se ele for a última
// parada. A lib fechava só o nível em foco e devolvia o foco ao gatilho, então
// Tab e Shift+Tab davam no mesmo lugar. Stories `TabLeavesMenu` e
// `TabAtPageEnd`.

/** Lado preferido de abertura do popup em relação ao gatilho. */
export type DropdownMenuSide = 'top' | 'bottom' | 'left' | 'right';

/** Alinhamento do popup no eixo perpendicular ao `side`. */
export type DropdownMenuAlign = 'start' | 'center' | 'end';

/** Ênfase visual do item. `destructive` é para ação irreversível. */
export type DropdownMenuItemVariant = 'default' | 'destructive';

// O motivo do fechamento no vocabulário da família — a MESMA tradução nos três
// membros, e por isso num arquivo só. O evento nasce na camada de produto.
export {
  menuCloseReason,
  MenuCloseTracker,
  type MenuCloseReason,
} from './menu-close-reason';

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * O miolo do menu, guardado até a abertura.
 *
 * Guarda também as preferências de posicionamento (`side`, `align`,
 * `sideOffset`, `alignOffset`), que a raiz lê e repassa ao positioner. Elas
 * moram aqui, e não na raiz, porque é do popup que se fala ao dizer "abre para
 * a direita": é o contrato das outras quatro stacks.
 *
 * Todos os quatro inputs nascem indefinidos de propósito. Quem resolve o padrão
 * é a raiz, que sabe se este menu é um submenu — e submenu abre à direita, não
 * embaixo.
 */
@Directive({
  selector: 'ng-template[ndsDropdownMenuContent], ng-template[ndsDropdownMenuSubContent]',
  standalone: true,
})
export class NdsDropdownMenuContent {
  readonly side = input<DropdownMenuSide | undefined>(undefined);
  readonly align = input<DropdownMenuAlign | undefined>(undefined);
  readonly sideOffset = input<number | undefined>(undefined);
  readonly alignOffset = input<number | undefined>(undefined);

  /** O template em si — a raiz o instancia dentro do popup ao abrir. */
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/**
 * Raiz do menu — estado de abertura, portal e posicionamento.
 *
 * O mesmo componente serve à raiz e ao submenu (`<nds-dropdown-menu-sub>`): o
 * primitivo usa uma diretiva só para os dois casos e é o `SubTrigger` quem
 * marca a raiz como submenu, ao ser construído. Um segundo componente só para
 * trocar o seletor duplicaria o portal e o positioner.
 */
@Component({
  selector: 'nds-dropdown-menu, nds-dropdown-menu-sub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuPortal, RdxMenuPositioner, RdxMenuPopup, NdsMenuPopupScope, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'modal', 'loopFocus'],
      // `onOpenChange` traz o MOTIVO junto do estado (`{ open, reason }`) — é
      // dele que sai o `reason` do `dropdown_menu_close` (escape · overlay ·
      // api). `openChange` sozinho diz que fechou, não por quê. Mesmo par que o
      // ContextMenu já expõe.
      outputs: ['openChange', 'onOpenChange'],
    },
  ],
  // O `id` do painel do submenu, para o sub-gatilho apontar
  // (`NdsSubmenuOwnsPanel`). O menu de topo também fornece, e ninguém o lê: todo
  // sub-gatilho acha antes a raiz do próprio submenu.
  providers: [{ provide: NDS_SUBMENU_PANEL, useExisting: forwardRef(() => NdsDropdownMenu) }],
  host: {
    '[attr.data-slot]': '"dropdown-menu"',
  },
  template: `
    <!--
      Uma \`<ng-content>\` só, sem seletor: o que precisa aparecer na página é o
      gatilho (um \`<button>\` na raiz, o item de menu no submenu). O
      \`<ng-template>\` do conteúdo passa por aqui e não deixa nó nenhum — ele é
      instanciado lá embaixo, dentro do popup.
    -->
    <ng-content />

    <!--
      O portal teleporta o popup para o \`body\` ao abrir e o DESMONTA ao fechar.
      É o desmonte que devolve o foco ao gatilho: o escopo de foco da lib faz
      isso na limpeza da view.
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
            lista deste painel, e um submenu declarado aqui dentro acha este
            painel como pai na árvore flutuante. Serve à raiz e ao submenu, que
            são o mesmo componente.
          -->
          <ng-container
            [ngTemplateOutlet]="contentTemplate()"
            [ngTemplateOutletInjector]="scope.injector"
          />
        </div>
      </div>
    </ng-template>
  `,
})
export class NdsDropdownMenu implements NdsSubmenuPanel {
  private readonly root = inject(RdxMenuRoot, { self: true });

  /** O `<ng-template>` que quem consome declarou dentro desta raiz. */
  private readonly content = contentChild(NdsDropdownMenuContent);

  /**
   * `id` do painel do SUBMENU — existe para o sub-gatilho ter para onde apontar.
   *
   * O painel é portalado para o `<body>`: não é descendente do item que o
   * abriu, e sem este `id` nada no documento liga um ao outro. O menu de topo
   * não o usa — o gatilho dele não aponta para o painel —, então o painel de
   * topo segue sem `id`.
   */
  readonly panelId = injectId('nds-dropdown-menu-sub-content-');

  protected readonly submenuPanelId = computed<string | null>(() =>
    this.root.isSubmenu() ? this.panelId : null,
  );

  protected readonly contentTemplate = computed<TemplateRef<unknown> | null>(
    () => this.content()?.tpl ?? null,
  );

  /** Submenu e menu de raiz têm `data-slot` distintos, como nas outras stacks. */
  protected readonly slotDoPopup = computed(() =>
    this.root.isSubmenu() ? 'dropdown-menu-sub-content' : 'dropdown-menu-content',
  );

  /** Submenu abre ao lado do item que o dispara; menu de raiz, abaixo do botão. */
  protected readonly side = computed<DropdownMenuSide>(
    () => this.content()?.side() ?? (this.root.isSubmenu() ? 'right' : 'bottom'),
  );

  protected readonly alinhamento = computed<DropdownMenuAlign>(
    () => this.content()?.align() ?? 'start',
  );

  // 4px afastam o popup do gatilho sem soltá-lo; encostado no submenu, para o
  // cursor cruzar do item para o submenu sem atravessar um vão.
  protected readonly deslocamentoDoLado = computed<number>(
    () => this.content()?.sideOffset() ?? (this.root.isSubmenu() ? 0 : 4),
  );

  // -4px são o `--spacing-1` de padding do painel pai, devolvido: é ele que faz
  // o primeiro item do submenu alinhar com o SUB-GATILHO que o abriu, em vez de
  // alinhar com a borda da caixa. Valor de design system, não da lib (D15 do PRD
  // do dropdown-menu, decisão da dona em 2026-09-18) — até essa data era -3, que
  // não saía de token nenhum.
  protected readonly deslocamentoDoAlinhamento = computed<number>(
    () => this.content()?.alignOffset() ?? (this.root.isSubmenu() ? -4 : 0),
  );
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Botão que abre o menu.
 *
 * Vive num `<button>` nativo e é combinado com `ndsButton` no mesmo elemento —
 * é o equivalente, neste stack, à composição que as outras usam para delegar a
 * renderização ao filho. Sem isso sobraria um botão dentro de outro, que é
 * violação de ARIA (NestedInteractive) e quebra o teclado.
 */
@Directive({
  selector: 'button[ndsDropdownMenuTrigger]',
  standalone: true,
  hostDirectives: [
    { directive: RdxMenuTrigger, inputs: ['disabled', 'openOnHover'] },
  ],
  host: {
    '[attr.data-slot]': '"dropdown-menu-trigger"',
  },
})
export class NdsDropdownMenuTrigger {}

// ─── Group + Label ────────────────────────────────────────────────────────────

/** Agrupa itens relacionados — `role="group"`, nomeado pelo Label irmão. */
@Directive({
  selector: 'div[ndsDropdownMenuGroup]',
  standalone: true,
  hostDirectives: [RdxMenuGroup],
  host: {
    '[attr.data-slot]': '"dropdown-menu-group"',
  },
})
export class NdsDropdownMenuGroup {}

/**
 * Cabeçalho de um grupo — não é interativo.
 *
 * O `RdxMenuGroupLabel` do primitivo faz exatamente o que está aqui (gerar um
 * id e publicá-lo no grupo, para o `aria-labelledby`), mas EXIGE um grupo
 * ancestral: sem ele a injeção do contexto lança. Um rótulo solto é uso legítimo
 * — o exemplo básico do conteúdo compartilhado tem um —, então a ligação é feita
 * com o contexto injetado em modo opcional.
 */
@Directive({
  selector: 'div[ndsDropdownMenuLabel]',
  standalone: true,
  host: {
    class: 'nds-dropdown-menu-label',
    '[attr.id]': 'id',
    '[attr.data-slot]': '"dropdown-menu-label"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsDropdownMenuLabel {
  /** Recua o rótulo para alinhá-lo com itens que têm ícone à esquerda. */
  readonly inset = input(false);

  protected readonly id = injectId('nds-dropdown-menu-label-');

  private readonly group = injectRdxMenuGroupContext(true);

  constructor() {
    this.group?.labelId.set(this.id);
  }
}

// ─── Separator ────────────────────────────────────────────────────────────────

/** Divide grupos de itens — `role="separator"`. */
@Directive({
  selector: 'div[ndsDropdownMenuSeparator]',
  standalone: true,
  hostDirectives: [RdxMenuSeparator],
  host: {
    class: 'nds-dropdown-menu-separator',
    '[attr.data-slot]': '"dropdown-menu-separator"',
  },
})
export class NdsDropdownMenuSeparator {}

// ─── Item ─────────────────────────────────────────────────────────────────────

/**
 * Ação executável — `role="menuitem"`.
 *
 * É um `<div>` e não um `<button>`, como nas outras stacks com lib headless: a
 * folha `.nds-dropdown-menu-item` não zera a aparência nativa de botão, e um
 * `<button>` ali apareceria com fundo e borda do navegador. O que a semântica
 * pede não é a TAG e sim papel, foco e teclado — e o primitivo entrega os três:
 * `role="menuitem"`, roving tabindex, Enter/Space, e o menu fechando com o foco
 * de volta no gatilho.
 *
 * Nenhum `(click)` é declarado neste host: um listener de host corre DEPOIS do
 * `(click)` que quem consome escreve no mesmo elemento, e o do primitivo já
 * fecha o menu. Para reagir à escolha, use `(onSelect)` ou o próprio `(click)`.
 */
@Directive({
  selector: 'div[ndsDropdownMenuItem]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuItem,
      inputs: ['disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'],
    },
  ],
  host: {
    rdxMenuItem: '',
    class: 'nds-dropdown-menu-item',
    '[attr.data-slot]': '"dropdown-menu-item"',
    '[attr.data-variant]': 'variant()',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsDropdownMenuItem {
  /** `destructive` pinta o item com a cor de perigo — só para ação irreversível. */
  readonly variant = input<DropdownMenuItemVariant>('default');

  /** Recua o item para alinhá-lo com irmãos que têm ícone à esquerda. */
  readonly inset = input(false);
}

/**
 * Item que NAVEGA — um `<a href>` de verdade dentro do menu.
 *
 * Existe porque menu nem sempre é lista de comandos: uma trilha de navegação
 * colapsada põe destinos ali dentro, e destino quer link. Com `div` mais
 * `(onSelect)` a pessoa perde o que o navegador dá de graça — abrir em nova
 * aba, copiar o endereço, ver para onde vai na barra de status.
 *
 * `closeOnClick` nasce `false` no primitivo, e é o certo: quem fecha o menu é a
 * navegação. Forçar o fechamento antes dela correria com o roteador.
 */
@Directive({
  selector: 'a[ndsDropdownMenuLinkItem]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuLinkItem,
      inputs: ['disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'],
    },
  ],
  host: {
    // O primitivo acha os itens por `querySelectorAll('[rdxMenuLinkItem]')`, e
    // hostDirective NÃO escreve o atributo no DOM — sem esta linha o link fica
    // fora do roving tabindex e do typeahead, em silêncio.
    rdxMenuLinkItem: '',
    class: 'nds-dropdown-menu-item',
    '[attr.data-slot]': '"dropdown-menu-item"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsDropdownMenuLinkItem {
  /** Recua o item para alinhá-lo com irmãos que têm ícone à esquerda. */
  readonly inset = input(false);
}

// ─── Shortcut ─────────────────────────────────────────────────────────────────

/**
 * Atalho de teclado exibido à direita do item.
 *
 * É apenas visual: registrar a tecla é do consumidor. O texto NÃO recebe
 * `aria-hidden` — ele faz parte do nome do item ("Copiar, Control C"), que é o
 * que o leitor de tela precisa anunciar para o atalho ter serventia.
 */
@Directive({
  selector: 'span[ndsDropdownMenuShortcut]',
  standalone: true,
  host: {
    class: 'nds-dropdown-menu-shortcut',
    '[attr.data-slot]': '"dropdown-menu-shortcut"',
  },
})
export class NdsDropdownMenuShortcut {}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Mesmo desenho do `NdsTabsIcon`: o host é o próprio `<svg>`, então a regra
// `.nds-dropdown-menu-item svg` dimensiona o elemento real e não sobra wrapper.
// Os filhos nascem de `createElementNS` porque cada ícone do lucide é uma lista
// `[tag, attrs]` com tag variável, e template Angular exige tag estática.
// Construir nós é imune a XSS: não há `innerHTML` no caminho.
//
// Não são exportados — servem só ao chevron do sub-gatilho e ao indicador de
// marcação, ambos montados aqui dentro.

import { ChevronRight, Check, Minus } from 'lucide';

type LucideIconNode = [string, Record<string, string>];

const DROPDOWN_ICON_MAP = {
  chevron: ChevronRight as unknown as LucideIconNode[],
  check: Check as unknown as LucideIconNode[],
  // O traço do estado misto. Não é desenho novo: `Minus` do lucide é
  // `M5 12h14`, o MESMO segmento que `<line x1="5" y1="12" x2="19" y2="12" />`
  // da caixa de seleção desta stack — mesma geometria, entrando pelo mesmo
  // mecanismo de ícone que o resto do menu já usa.
  minus: Minus as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsDropdownMenuIcon]',
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
export class NdsDropdownMenuIcon {
  readonly kind = input.required<keyof typeof DROPDOWN_ICON_MAP>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of DROPDOWN_ICON_MAP[this.kind()]) {
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
 * O chevron entra pelo template do componente, como no React, para quem escreve
 * não precisar lembrar de colocá-lo.
 *
 * Teclado, pelo contrato do Vanilla: seta direita, Enter e Espaço abrem o
 * submenu e põem o foco no primeiro item dele. Enter e Espaço são da lib; a seta
 * direita tem a garantia de `NdsSubmenuKeyboardEntry`, que vem DEPOIS do
 * `RdxMenuSubTrigger` na lista para o ouvinte dela rodar depois do da lib.
 *
 * E o `aria-owns` que liga o item ao painel portalado, só com ele aberto, vem de
 * `NdsSubmenuOwnsPanel` — a lib não escreve essa ligação.
 */
@Component({
  selector: 'div[ndsDropdownMenuSubTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsDropdownMenuIcon],
  hostDirectives: [
    { directive: RdxMenuSubTrigger, inputs: ['disabled', 'openOnHover', 'label'] },
    NdsSubmenuKeyboardEntry,
    NdsSubmenuOwnsPanel,
  ],
  host: {
    // Ver a nota do popup: o primitivo varre `[rdxMenuSubTrigger]` no DOM para
    // fechar os submenus irmãos ao abrir este.
    rdxMenuSubTrigger: '',
    class: 'nds-dropdown-menu-sub-trigger',
    '[attr.data-slot]': '"dropdown-menu-sub-trigger"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
  template: `
    <ng-content />
    <svg ndsDropdownMenuIcon kind="chevron" class="nds-dropdown-menu-sub-trigger-chevron"></svg>
  `,
})
export class NdsDropdownMenuSubTrigger {
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
 * Não fecha o menu ao alternar (padrão do primitivo): quem marca uma coluna
 * costuma querer marcar a próxima logo em seguida.
 */
@Component({
  selector: 'div[ndsDropdownMenuCheckboxItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuCheckboxItemIndicator, NdsDropdownMenuIcon],
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
    '[attr.data-slot]': '"dropdown-menu-checkbox-item"',
  },
  template: `
    <span
      class="nds-dropdown-menu-item-indicator"
      data-slot="dropdown-menu-checkbox-item-indicator"
    >
      <span rdxMenuCheckboxItemIndicator>
        <svg ndsDropdownMenuIcon [kind]="misto() ? 'minus' : 'check'"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsDropdownMenuCheckboxItem {
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
  selector: 'div[ndsDropdownMenuRadioGroup]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuRadioGroup,
      inputs: ['value', 'defaultValue', 'disabled'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    '[attr.data-slot]': '"dropdown-menu-radio-group"',
  },
})
export class NdsDropdownMenuRadioGroup {}

/** Opção de escolha única — `role="menuitemradio"` e `aria-checked`. */
@Component({
  selector: 'div[ndsDropdownMenuRadioItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuRadioItemIndicator, NdsDropdownMenuIcon],
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
    '[attr.data-slot]': '"dropdown-menu-radio-item"',
  },
  template: `
    <span
      class="nds-dropdown-menu-item-indicator"
      data-slot="dropdown-menu-radio-item-indicator"
    >
      <span rdxMenuRadioItemIndicator>
        <svg ndsDropdownMenuIcon kind="check"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsDropdownMenuRadioItem {}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/** A família inteira — para o `imports` de quem compõe. */
export const NDS_DROPDOWN_MENU = [
  NdsDropdownMenu,
  NdsDropdownMenuTrigger,
  NdsDropdownMenuContent,
  NdsDropdownMenuGroup,
  NdsDropdownMenuLabel,
  NdsDropdownMenuSeparator,
  NdsDropdownMenuItem,
  NdsDropdownMenuLinkItem,
  NdsDropdownMenuShortcut,
  NdsDropdownMenuSubTrigger,
  NdsDropdownMenuCheckboxItem,
  NdsDropdownMenuRadioGroup,
  NdsDropdownMenuRadioItem,
] as const;
