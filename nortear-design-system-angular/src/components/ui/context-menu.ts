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
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { injectId } from '@radix-ng/primitives/core';
import {
  RdxContextMenuRoot,
  RdxContextMenuTrigger,
} from '@radix-ng/primitives/context-menu';
import {
  RdxMenuRoot,
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
  isIndeterminate,
} from '@radix-ng/primitives/menu';
import { ChevronRight, Check, Minus } from 'lucide';

// ─── ContextMenu ──────────────────────────────────────────────────────────────
//
// Visual: reusa as classes `.nds-dropdown-menu-*` — é o que React, Vue e Svelte
// fazem, e a folha compartilhada só define `.nds-context-menu-trigger` de
// próprio. Os `data-slot`, esses SIM são `context-menu-*`: é por eles que a
// auditoria compara markup entre stacks, e é assim que as outras quatro emitem.
//
// ─── O que muda em relação ao DropdownMenu ────────────────────────────────────
//
// Só a abertura. O popup não é ancorado num botão: ele nasce no ponto do
// ponteiro, e é o `RdxContextMenuTrigger` que captura o gesto — clique direito,
// toque longo, e também a tecla Menu / Shift+F10, porque o navegador dispara o
// mesmo evento `contextmenu` para elas. Quem não usa mouse alcança o menu.
//
// Do popup para dentro é tudo idêntico: as peças de `@radix-ng/primitives/menu`
// valem sem alteração, com roving tabindex, typeahead, submenu e teclado.
//
// Um menu de contexto NUNCA é o único caminho para uma ação. O que está aqui
// dentro precisa existir em outro lugar — uma barra de ações, um menu de
// cabeçalho —, senão a funcionalidade some para quem não conhece o gesto.
//
// ─── A forma da API ───────────────────────────────────────────────────────────
//
//   <div ndsContextMenu>                       raiz: estado, portal, posição
//     <div ndsContextMenuTrigger>              a área que responde ao gesto
//     <ng-template ndsContextMenuContent>      o miolo do menu
//
// O miolo é `<ng-template>` pela mesma razão do DropdownMenu: nó projetado
// pertence à view de quem consome, o portal removeria o DOM sem destruir as
// diretivas, e o foco nunca voltaria.

export type ContextMenuSide = 'top' | 'bottom' | 'left' | 'right';
export type ContextMenuAlign = 'start' | 'center' | 'end';
export type ContextMenuItemVariant = 'default' | 'destructive';

/** Guarda o miolo do menu até a abertura. */
@Directive({
  selector: 'ng-template[ndsContextMenuContent], ng-template[ndsContextMenuSubContent]',
  standalone: true,
})
export class NdsContextMenuContent {
  readonly side = input<ContextMenuSide | undefined>(undefined);
  readonly align = input<ContextMenuAlign | undefined>(undefined);
  readonly sideOffset = input<number | undefined>(undefined);
  readonly alignOffset = input<number | undefined>(undefined);

  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}

@Component({
  selector: 'div[ndsContextMenu]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuPortal, RdxMenuPositioner, RdxMenuPopup, NgTemplateOutlet],
  // Sem lista de inputs: o `RdxContextMenuRoot` não declara nenhum de próprio —
  // `open`, `modal`, `loopFocus` e os outputs vêm do `RdxMenuRoot` que ELE traz
  // como host directive. Listá-los aqui quebra na hora (NG0311), e não é
  // preciso: input de host directive aninhada já é ligável no elemento
  // (armadilha 7 no CLAUDE.md deste stack).
  hostDirectives: [RdxContextMenuRoot],
  host: {
    '[attr.data-slot]': '"context-menu"',
  },
  template: `
    <ng-content />

    <ng-template rdxMenuPortal>
      <div
        rdxMenuPositioner
        class="nds-dropdown-menu-positioner"
        [side]="side()"
        [align]="alinhamento()"
        [sideOffset]="deslocamentoDoLado()"
        [alignOffset]="deslocamentoDoAlinhamento()"
      >
        <div rdxMenuPopup class="nds-dropdown-menu-content" [attr.data-slot]="slotDoPopup()">
          <ng-container [ngTemplateOutlet]="templateDoConteudo()!" />
        </div>
      </div>
    </ng-template>
  `,
})
export class NdsContextMenu {
  private readonly root = inject(RdxMenuRoot, { self: true });

  private readonly content = contentChild(NdsContextMenuContent);

  protected readonly templateDoConteudo = computed<TemplateRef<unknown> | null>(
    () => this.content()?.tpl ?? null,
  );

  protected readonly slotDoPopup = computed(() =>
    this.root.isSubmenu() ? 'context-menu-sub-content' : 'context-menu-content',
  );

  // O menu de raiz é ancorado no PONTEIRO, então `side`/`align` valem pouco
  // aqui — o primitivo posiciona a partir das coordenadas do gesto. Os padrões
  // servem ao submenu, que continua ancorado no item que o abre.
  protected readonly side = computed<ContextMenuSide>(
    () => this.content()?.side() ?? (this.root.isSubmenu() ? 'right' : 'bottom'),
  );

  protected readonly alinhamento = computed<ContextMenuAlign>(
    () => this.content()?.align() ?? 'start',
  );

  protected readonly deslocamentoDoLado = computed<number>(
    () => this.content()?.sideOffset() ?? (this.root.isSubmenu() ? 0 : 0),
  );

  protected readonly deslocamentoDoAlinhamento = computed<number>(
    () => this.content()?.alignOffset() ?? (this.root.isSubmenu() ? -3 : 0),
  );
}

/**
 * Raiz de um SUBMENU dentro do menu de contexto.
 *
 * Componente separado, e não o mesmo seletor da raiz, porque a âncora é outra:
 * o menu de topo nasce no ponto do ponteiro (`RdxContextMenuRoot`), o submenu
 * nasce colado ao item que o abre (`RdxMenuRoot` comum). Reaproveitar a raiz de
 * contexto aqui faria o submenu pular para onde o clique direito aconteceu.
 */
@Component({
  selector: 'div[ndsContextMenuSub]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuPortal, RdxMenuPositioner, RdxMenuPopup, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: RdxMenuRoot,
      inputs: ['open', 'modal', 'loopFocus'],
      outputs: ['openChange', 'onOpenChange'],
    },
  ],
  host: {
    '[attr.data-slot]': '"context-menu-sub"',
  },
  template: `
    <ng-content />

    <ng-template rdxMenuPortal>
      <div
        rdxMenuPositioner
        class="nds-dropdown-menu-positioner"
        [side]="content()?.side() ?? 'right'"
        [align]="content()?.align() ?? 'start'"
        [sideOffset]="content()?.sideOffset() ?? 0"
        [alignOffset]="content()?.alignOffset() ?? -3"
      >
        <div rdxMenuPopup class="nds-dropdown-menu-content" data-slot="context-menu-sub-content">
          <ng-container [ngTemplateOutlet]="content()!.tpl" />
        </div>
      </div>
    </ng-template>
  `,
})
export class NdsContextMenuSub {
  protected readonly content = contentChild(NdsContextMenuContent);
}

/**
 * A área que responde ao gesto.
 *
 * Recebe `.nds-context-menu-trigger` — a única classe própria do componente na
 * folha compartilhada. O popup não é ancorado neste elemento: ele nasce onde o
 * ponteiro estava.
 *
 * ─── Acessibilidade — versão curta ────────────────────────────────────────────
 *
 * Bloco canônico das cinco stacks: cabeçalho de `context-menu.ts` no Vanilla.
 * Do popup para dentro vale o contrato do DropdownMenu inteiro, porque aqui as
 * peças SÃO as de `@radix-ng/primitives/menu`. O que diverge é a abertura:
 *
 *   1. O gatilho NÃO se anuncia. `RdxContextMenuTrigger` só liga
 *      `data-popup-open`, `data-pressed` e `data-disabled` — nada de
 *      `aria-haspopup` nem `aria-expanded`, ao contrário do gatilho do
 *      DropdownMenu, que é um botão e carrega os dois. É escolha das quatro
 *      libs e está certa: `aria-haspopup` não vale em `generic`, o papel
 *      implícito desta `<div>`. O preço está pago por escrito no conteúdo
 *      compartilhado (`accessibility.warning`, `notes.tip5`).
 *   2. `tabindex="0"` é REQUISITO, não enfeite: a tecla Menu e Shift+F10
 *      disparam `contextmenu` no elemento FOCADO — sem parada de tabulação o
 *      menu não existe para quem não usa mouse. `RdxContextMenuTrigger` ainda
 *      separa os dois caminhos: sem `pointerdown` recente ele abre com o
 *      primeiro item destacado, e não só o popup. As cinco stacks põem o
 *      `tabindex`; o texto que dizia haver lacuna nas outras quatro estava
 *      vencido e saiu nesta passada.
 *   3. É também para este `tabindex` que o foco volta ao fechar. Sem ele o
 *      `focus()` é no-op e o foco cai no `<body>`, contra o que
 *      `testes.functional.item2` promete.
 */
@Directive({
  selector: 'div[ndsContextMenuTrigger]',
  standalone: true,
  hostDirectives: [
    { directive: RdxContextMenuTrigger, inputs: ['disabled', 'longPressDelay'] },
  ],
  host: {
    class: 'nds-context-menu-trigger',
    tabindex: '0',
    '[attr.data-slot]': '"context-menu-trigger"',
  },
})
export class NdsContextMenuTrigger {}

@Directive({
  selector: 'div[ndsContextMenuGroup]',
  standalone: true,
  hostDirectives: [RdxMenuGroup],
  host: { '[attr.data-slot]': '"context-menu-group"' },
})
export class NdsContextMenuGroup {}

/** Cabeçalho de grupo — não interativo. Ver a nota gêmea no dropdown-menu. */
@Directive({
  selector: 'div[ndsContextMenuLabel]',
  standalone: true,
  host: {
    class: 'nds-dropdown-menu-label',
    '[attr.id]': 'id',
    '[attr.data-slot]': '"context-menu-label"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsContextMenuLabel {
  readonly inset = input(false);

  protected readonly id = injectId('nds-context-menu-label-');

  private readonly group = injectRdxMenuGroupContext(true);

  constructor() {
    this.group?.labelId.set(this.id);
  }
}

@Directive({
  selector: 'div[ndsContextMenuSeparator]',
  standalone: true,
  hostDirectives: [RdxMenuSeparator],
  host: {
    class: 'nds-dropdown-menu-separator',
    '[attr.data-slot]': '"context-menu-separator"',
  },
})
export class NdsContextMenuSeparator {}

/**
 * Ação executável.
 *
 * `<div>` e não `<button>`, como no DropdownMenu: a folha não zera a aparência
 * nativa de botão. O que a semântica pede é papel, foco e teclado — e o
 * primitivo entrega os três.
 */
@Directive({
  selector: 'div[ndsContextMenuItem]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuItem,
      inputs: ['disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'],
    },
  ],
  host: {
    // O primitivo varre `[rdxMenuItem]` no DOM, e hostDirective não escreve o
    // atributo — sem esta linha o item fica fora do teclado, em silêncio.
    rdxMenuItem: '',
    class: 'nds-dropdown-menu-item',
    '[attr.data-slot]': '"context-menu-item"',
    '[attr.data-variant]': 'variant()',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
})
export class NdsContextMenuItem {
  readonly variant = input<ContextMenuItemVariant>('default');
  readonly inset = input(false);
}

/** Atalho exibido à direita. Sem `aria-hidden`: faz parte do nome do item. */
@Directive({
  selector: 'span[ndsContextMenuShortcut]',
  standalone: true,
  host: {
    class: 'nds-dropdown-menu-shortcut',
    '[attr.data-slot]': '"context-menu-shortcut"',
  },
})
export class NdsContextMenuShortcut {}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Host é o próprio `<svg>`, então a regra `.nds-dropdown-menu-item svg`
// dimensiona o elemento real. Os filhos nascem de `createElementNS` porque cada
// ícone do lucide é uma lista `[tag, attrs]` com tag variável, e template
// Angular exige tag estática. Não há `innerHTML` no caminho.

type LucideIconNode = [string, Record<string, string>];

const CONTEXT_ICON_MAP = {
  chevron: ChevronRight as unknown as LucideIconNode[],
  check: Check as unknown as LucideIconNode[],
  // O traço do estado misto. Não é desenho novo: `Minus` do lucide é
  // `M5 12h14`, o MESMO segmento que `<line x1="5" y1="12" x2="19" y2="12" />`
  // da caixa de seleção desta stack — mesma geometria, entrando pelo mesmo
  // mecanismo de ícone que o resto do menu já usa.
  minus: Minus as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsContextMenuIcon]',
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
    // O ícone acompanha texto que já nomeia a ação, ou um estado que o
    // `aria-checked` já anuncia. Repeti-lo viraria eco.
    'aria-hidden': 'true',
  },
})
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera precisa IMPORTAR a classe, e símbolo não exportado quebra a
// geração (NG3004). Não é API pública — nenhum barril a reexporta.
export class NdsContextMenuIcon {
  readonly kind = input.required<keyof typeof CONTEXT_ICON_MAP>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of CONTEXT_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

@Component({
  selector: 'div[ndsContextMenuSubTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsContextMenuIcon],
  hostDirectives: [{ directive: RdxMenuSubTrigger, inputs: ['disabled', 'openOnHover', 'label'] }],
  host: {
    rdxMenuSubTrigger: '',
    class: 'nds-dropdown-menu-sub-trigger',
    '[attr.data-slot]': '"context-menu-sub-trigger"',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
  template: `
    <ng-content />
    <svg ndsContextMenuIcon kind="chevron" class="nds-dropdown-menu-sub-trigger-chevron"></svg>
  `,
})
export class NdsContextMenuSubTrigger {
  readonly inset = input(false);
}

@Component({
  selector: 'div[ndsContextMenuCheckboxItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuCheckboxItemIndicator, NdsContextMenuIcon],
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
    '[attr.data-slot]': '"context-menu-checkbox-item"',
  },
  template: `
    <span class="nds-dropdown-menu-item-indicator" data-slot="context-menu-checkbox-item-indicator">
      <span rdxMenuCheckboxItemIndicator>
        <svg ndsContextMenuIcon [kind]="misto() ? 'minus' : 'check'"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsContextMenuCheckboxItem {
  private readonly item = inject(RdxMenuCheckboxItem, { self: true });

  /**
   * O símbolo do estado misto é TRAÇO, não tique.
   *
   * Tique quer dizer "marcado", e o misto ("alguns dos filhos") não é isso. O
   * desenho vem da caixa de seleção desta stack, que já resolve o misto com um
   * traço horizontal. Mesma razão do item de marcação do menubar: o indicador
   * da lib não entrega o estado ao conteúdo projetado, então a fonte é o
   * `checked` do próprio item; e resolver por CSS exigiria os dois glifos no
   * markup com um oculto — um tique presente num estado que não é "marcado".
   */
  protected readonly misto = computed(() => isIndeterminate(this.item.checked()));
}

@Directive({
  selector: 'div[ndsContextMenuRadioGroup]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxMenuRadioGroup,
      inputs: ['value', 'defaultValue', 'disabled'],
      outputs: ['valueChange'],
    },
  ],
  host: { '[attr.data-slot]': '"context-menu-radio-group"' },
})
export class NdsContextMenuRadioGroup {}

@Component({
  selector: 'div[ndsContextMenuRadioItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxMenuRadioItemIndicator, NdsContextMenuIcon],
  hostDirectives: [
    { directive: RdxMenuRadioItem, inputs: ['value', 'disabled', 'closeOnClick', 'label'] },
  ],
  host: {
    rdxMenuRadioItem: '',
    class: 'nds-dropdown-menu-radio-item',
    '[attr.data-slot]': '"context-menu-radio-item"',
  },
  template: `
    <span class="nds-dropdown-menu-item-indicator" data-slot="context-menu-radio-item-indicator">
      <span rdxMenuRadioItemIndicator>
        <svg ndsContextMenuIcon kind="check"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsContextMenuRadioItem {}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_CONTEXT_MENU = [
  NdsContextMenu, NdsContextMenuSub, NdsContextMenuContent, NdsContextMenuTrigger, NdsContextMenuGroup,
  NdsContextMenuLabel, NdsContextMenuSeparator, NdsContextMenuItem, NdsContextMenuShortcut,
  NdsContextMenuSubTrigger, NdsContextMenuCheckboxItem, NdsContextMenuRadioGroup,
  NdsContextMenuRadioItem,
] as const;
