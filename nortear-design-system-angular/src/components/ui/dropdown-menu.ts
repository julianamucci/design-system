import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  computed,
  contentChild,
  effect,
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
} from '@radix-ng/primitives/menu';

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
// O preço, conhecido e registrado: a injeção de dependência de uma view
// embutida sobe pela árvore de DECLARAÇÃO, não pela de inserção — então os itens
// procuram a lista composta (`RdxCompositeList`, que vive no popup) a partir de
// `<nds-dropdown-menu>` e não a encontram. O primitivo tem caminho para isso: o
// popup cai na varredura do DOM (`getDomMenuItems`) e setas, Home/End e
// typeahead continuam funcionando, com o realce vindo do foco em vez do índice.

/** Lado preferido de abertura do popup em relação ao gatilho. */
export type DropdownMenuSide = 'top' | 'bottom' | 'left' | 'right';

/** Alinhamento do popup no eixo perpendicular ao `side`. */
export type DropdownMenuAlign = 'start' | 'center' | 'end';

/** Ênfase visual do item. `destructive` é para ação irreversível. */
export type DropdownMenuItemVariant = 'default' | 'destructive';

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
  imports: [RdxMenuPortal, RdxMenuPositioner, RdxMenuPopup, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'modal', 'loopFocus'],
      outputs: ['openChange'],
    },
  ],
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
        [side]="lado()"
        [align]="alinhamento()"
        [sideOffset]="deslocamentoDoLado()"
        [alignOffset]="deslocamentoDoAlinhamento()"
      >
        <div
          rdxMenuPopup
          class="nds-dropdown-menu-content"
          [attr.data-slot]="slotDoPopup()"
        >
          <ng-container [ngTemplateOutlet]="templateDoConteudo()" />
        </div>
      </div>
    </ng-template>
  `,
})
export class NdsDropdownMenu {
  private readonly raiz = inject(RdxMenuRoot, { self: true });

  /** O `<ng-template>` que quem consome declarou dentro desta raiz. */
  private readonly conteudo = contentChild(NdsDropdownMenuContent);

  protected readonly templateDoConteudo = computed<TemplateRef<unknown> | null>(
    () => this.conteudo()?.tpl ?? null,
  );

  /** Submenu e menu de raiz têm `data-slot` distintos, como nas outras stacks. */
  protected readonly slotDoPopup = computed(() =>
    this.raiz.isSubmenu() ? 'dropdown-menu-sub-content' : 'dropdown-menu-content',
  );

  /** Submenu abre ao lado do item que o dispara; menu de raiz, abaixo do botão. */
  protected readonly lado = computed<DropdownMenuSide>(
    () => this.conteudo()?.side() ?? (this.raiz.isSubmenu() ? 'right' : 'bottom'),
  );

  protected readonly alinhamento = computed<DropdownMenuAlign>(
    () => this.conteudo()?.align() ?? 'start',
  );

  // 4px afastam o popup do gatilho sem soltá-lo; encostado no submenu, para o
  // cursor cruzar do item para o submenu sem atravessar um vão.
  protected readonly deslocamentoDoLado = computed<number>(
    () => this.conteudo()?.sideOffset() ?? (this.raiz.isSubmenu() ? 0 : 4),
  );

  // -3px compensam o padding do popup pai, alinhando o primeiro item do submenu
  // com o item que o abriu.
  protected readonly deslocamentoDoAlinhamento = computed<number>(
    () => this.conteudo()?.alignOffset() ?? (this.raiz.isSubmenu() ? -3 : 0),
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

  private readonly grupo = injectRdxMenuGroupContext(true);

  constructor() {
    this.grupo?.labelId.set(this.id);
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

import { ChevronRight, Check } from 'lucide';

type LucideIconNode = [string, Record<string, string>];

const DROPDOWN_ICON_MAP = {
  chevron: ChevronRight as unknown as LucideIconNode[],
  check: Check as unknown as LucideIconNode[],
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
class NdsDropdownMenuIcon {
  readonly kind = input.required<keyof typeof DROPDOWN_ICON_MAP>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of DROPDOWN_ICON_MAP[this.kind()]) {
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
 * O chevron entra pelo template do componente, como no React, para quem escreve
 * não precisar lembrar de colocá-lo.
 */
@Component({
  selector: 'div[ndsDropdownMenuSubTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsDropdownMenuIcon],
  hostDirectives: [
    { directive: RdxMenuSubTrigger, inputs: ['disabled', 'openOnHover', 'label'] },
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
 * Item com estado booleano — `role="menuitemcheckbox"` e `aria-checked`.
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
        <svg ndsDropdownMenuIcon kind="check"></svg>
      </span>
    </span>
    <ng-content />
  `,
})
export class NdsDropdownMenuCheckboxItem {}

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
