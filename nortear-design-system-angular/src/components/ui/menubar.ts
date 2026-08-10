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
} from '@radix-ng/primitives/menu';
import { ChevronRight, Check } from 'lucide';

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
 */
@Component({
  selector: 'nds-menubar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    { directive: RdxMenubarRoot, inputs: ['disabled', 'modal', 'loopFocus'] },
  ],
  host: {
    class: 'nds-menubar',
    '[attr.data-slot]': '"menubar"',
  },
  template: '<ng-content />',
})
export class NdsMenubar {}

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
  imports: [RdxMenuPortal, RdxMenuPositioner, RdxMenuPopup, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'loopFocus'],
      outputs: ['openChange'],
    },
  ],
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
        [side]="lado()"
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
export class NdsMenubarMenu {
  private readonly raiz = inject(RdxMenuRoot, { self: true });

  /** O `<ng-template>` que quem consome declarou dentro deste menu. */
  private readonly conteudo = contentChild(NdsMenubarContent);

  protected readonly templateDoConteudo = computed<TemplateRef<unknown> | null>(
    () => this.conteudo()?.tpl ?? null,
  );

  protected readonly slot = computed(() =>
    this.raiz.isSubmenu() ? 'menubar-sub' : 'menubar-menu',
  );

  protected readonly slotDoPopup = computed(() =>
    this.raiz.isSubmenu() ? 'menubar-sub-content' : 'menubar-content',
  );

  /** Submenu abre ao lado do item que o dispara; menu da barra, abaixo do gatilho. */
  protected readonly lado = computed<MenubarSide>(
    () => this.conteudo()?.side() ?? (this.raiz.isSubmenu() ? 'right' : 'bottom'),
  );

  protected readonly alinhamento = computed<MenubarAlign>(
    () => this.conteudo()?.align() ?? 'start',
  );

  // 8px reproduzem o vão do Vanilla: 4px de padding da barra mais 4px de
  // margem do painel. Submenu nasce encostado, para o cursor cruzar do item
  // para ele sem atravessar um vão.
  protected readonly deslocamentoDoLado = computed<number>(
    () => this.conteudo()?.sideOffset() ?? (this.raiz.isSubmenu() ? 0 : 8),
  );

  // -4px devolvem o padding lateral do popup, alinhando o texto do primeiro
  // item com o texto do gatilho. No submenu o alvo é o item que o abriu, cujo
  // recuo é 3px.
  protected readonly deslocamentoDoAlinhamento = computed<number>(
    () => this.conteudo()?.alignOffset() ?? (this.raiz.isSubmenu() ? -3 : -4),
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
    '[attr.data-state]': 'estado()',
  },
})
export class NdsMenubarTrigger {
  private readonly menu = injectRdxMenuRootContext();

  readonly estado = computed(() => (this.menu.isOpen() ? 'open' : 'closed'));
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

  private readonly grupo = injectRdxMenuGroupContext(true);

  constructor() {
    this.grupo?.labelId.set(this.id);
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
class NdsMenubarIcon {
  readonly kind = input.required<keyof typeof MENUBAR_ICON_MAP>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of MENUBAR_ICON_MAP[this.kind()]) {
        const filho = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) filho.setAttribute(k, v);
        svg.appendChild(filho);
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
 */
@Component({
  selector: 'div[ndsMenubarSubTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsMenubarIcon],
  hostDirectives: [
    { directive: RdxMenuSubTrigger, inputs: ['disabled', 'openOnHover', 'label'] },
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
 * Item com estado booleano — `role="menuitemcheckbox"` e `aria-checked`.
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
        <svg ndsMenubarIcon kind="check"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsMenubarCheckboxItem {}

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
