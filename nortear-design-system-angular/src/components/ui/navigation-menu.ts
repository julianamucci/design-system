import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  RdxNavigationMenuRoot,
  RdxNavigationMenuList,
  RdxNavigationMenuItem,
  RdxNavigationMenuTrigger,
  RdxNavigationMenuContent,
  RdxNavigationMenuLink,
  RdxNavigationMenuPortal,
  RdxNavigationMenuPositioner,
  RdxNavigationMenuPopup,
  RdxNavigationMenuViewport,
  RdxNavigationMenuArrow,
  injectNavigationMenuRootContext,
} from '@radix-ng/primitives/navigation-menu';
import { ChevronDown } from 'lucide';

// ─── NavigationMenu ───────────────────────────────────────────────────────────
//
// Visual: classes .nds-navigation-menu-* (docs/shared/styles/nds/navigation-menu.css).
// A folha tem dois blocos: o do topo descreve o painel absoluto que o Vanilla
// monta à mão, e o de baixo ("composite") descreve o que uma lib headless
// renderiza — positioner, popup e viewport num portal. Este stack consome o
// segundo, como React, Vue e Svelte.
//
// ─── Isto é NAVEGAÇÃO, não menu de comandos ───────────────────────────────────
//
// A distinção manda no ARIA inteiro e é a razão de o markup daqui divergir do
// Vanilla em três pontos:
//
//   · o item é um `<a href>` de verdade, não um `role="menuitem"`. Quem navega
//     quer abrir em nova aba, copiar o endereço e ver o destino na barra de
//     status — tudo isso o papel de menu apaga;
//   · o painel NÃO recebe `role="menu"`: é uma lista de destinos, e um leitor
//     de tela que ouve "menu, 4 itens" espera comandos, não páginas;
//   · o gatilho NÃO recebe `aria-haspopup`. A guideline 01 é explícita: se o
//     gatilho anuncia um popup, o painel precisa ter o papel correspondente.
//     Como o painel é navegação e não menu, anunciar `aria-haspopup` seria
//     prometer um papel que não existe. Sobram `aria-expanded` e
//     `aria-controls`, que é o padrão de divulgação (disclosure) do APG.
//
// O `<nav>` é o host da raiz — não um wrapper `<nds-*>` em volta dele — para o
// markup ficar igual ao do Vanilla e para quem consome escrever o `aria-label`
// no elemento que de fato o exige. Sem nome acessível, o leitor anuncia só
// "navegação"; com dois `<nav>` sem nome distinto na mesma página, o axe reprova
// em `landmark-unique`.
//
// ─── O que o primitivo entrega ────────────────────────────────────────────────
//
// `@radix-ng/primitives/navigation-menu` cobre, e nada disso é reescrito aqui:
//
//   · estado compartilhado (`value` identifica o item aberto) com abertura por
//     ponteiro (`delay`) e fechamento com carência (`closeDelay`);
//   · `aria-expanded` e `aria-controls` no gatilho, `aria-labelledby` no painel;
//   · roving tabindex entre os gatilhos da barra, setas conforme a orientação,
//     Home/End — via `RdxCompositeRoot` na lista;
//   · dentro do painel aberto: setas em ordem de DOM, Home/End, Seta-para-cima
//     no primeiro item devolvendo o foco ao gatilho, e TAB saindo do painel
//     portalizado pela ordem lógica da barra;
//   · Escape fecha e devolve o foco ao gatilho; clique fora e foco fora fecham;
//   · posicionamento por floating-ui com fuga de colisão, portal para o `body`
//     e desmonte ao fechar;
//   · "grace area": o ponteiro atravessa o vão entre gatilho e painel sem que o
//     painel feche no caminho.
//
// ─── Por que o conteúdo é um `<ng-template>` ──────────────────────────────────
//
//   <nav ndsNavigationMenu>                    raiz: estado + portal + popup
//     <ul ndsNavigationMenuList>               barra
//       <li ndsNavigationMenuItem>             item
//         <button ndsNavigationMenuTrigger>    gatilho
//         <ng-template ndsNavigationMenuContent>   o miolo do painel
//           <ul ndsNavigationMenuPanel>            raiz visual do painel
//             <li><a ndsNavigationMenuChild>       destino
//
// O painel é compartilhado: um positioner, um popup e um viewport para a barra
// inteira. O viewport instancia o `TemplateRef` do item ativo lá dentro e
// destrói ao trocar — é isso que dá a transição de tamanho entre um painel e o
// seguinte. Conteúdo projetado como ELEMENTO não serviria: o nó pertenceria à
// view de quem consome, e fechar o painel o removeria do DOM sem destruir as
// diretivas (mesmo defeito já pago no DropdownMenu).

/** Alinhamento do painel no eixo perpendicular ao lado de abertura. */
export type NavigationMenuAlign = 'start' | 'center' | 'end';

/** Direção da barra. Vertical serve a barras laterais e gavetas móveis. */
export type NavigationMenuOrientation = 'horizontal' | 'vertical';

// ─── Chevron ──────────────────────────────────────────────────────────────────
//
// Mesmo desenho do ícone do DropdownMenu: o host é o próprio `<svg>`, então a
// regra `.nds-navigation-menu-chevron` dimensiona o elemento real e não sobra
// wrapper. Os filhos nascem de `createElementNS` porque cada ícone do lucide é
// uma lista `[tag, attrs]` com tag variável, e template Angular exige tag
// estática. Construir nós é imune a XSS: não há `innerHTML` no caminho.
//
// Não é exportado — serve só ao gatilho, que o monta sozinho para quem escreve
// não precisar lembrar dele.

type LucideIconNode = [string, Record<string, string>];

const CHEVRON: LucideIconNode[] = ChevronDown as unknown as LucideIconNode[];

@Component({
  selector: 'svg[ndsNavigationMenuChevron]',
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
    class: 'nds-navigation-menu-chevron',
    // O texto do gatilho já nomeia a categoria e o `aria-expanded` já anuncia o
    // estado. Ler a seta seria eco.
    'aria-hidden': 'true',
  },
})
class NdsNavigationMenuChevron {
  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of CHEVRON) {
        const filho = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) filho.setAttribute(k, v);
        svg.appendChild(filho);
      }
    });
  }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/**
 * A barra de navegação. Guarda o estado e declara o painel compartilhado.
 *
 * `aria-label` é responsabilidade de quem consome e não tem padrão: um rótulo
 * genérico embutido ("Navegação") seria pior que nenhum, porque duas barras na
 * mesma página nasceriam com o MESMO nome — que é exatamente o que o
 * `landmark-unique` do axe reprova.
 */
@Component({
  selector: 'nav[ndsNavigationMenu]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RdxNavigationMenuPortal,
    RdxNavigationMenuPositioner,
    RdxNavigationMenuPopup,
    RdxNavigationMenuViewport,
    RdxNavigationMenuArrow,
  ],
  hostDirectives: [
    {
      directive: RdxNavigationMenuRoot,
      // Só os inputs PRÓPRIOS da diretiva entram: `hostDirectives.inputs` é
      // validado contra a lista dela, e um nome de fora quebra com NG0311.
      // `dir` é o nome público de `dirInput`; é por ele que se lista.
      inputs: ['value', 'defaultValue', 'orientation', 'dir', 'delay', 'closeDelay'],
      outputs: ['valueChange', 'onValueChange', 'onOpenChange'],
    },
  ],
  host: {
    class: 'nds-navigation-menu',
    '[attr.data-slot]': '"navigation-menu"',
  },
  template: `
    <!--
      Uma <ng-content> só, sem seletor: o que aparece na página é a barra. Os
      <ng-template> dos painéis passam por aqui e não deixam nó nenhum — quem os
      instancia é o viewport, dentro do popup.
    -->
    <ng-content />

    <!--
      O portal teleporta o painel para o <body> enquanto o menu está aberto e o
      DESMONTA ao fechar — nenhum "overflow: hidden" de ancestral o recorta, e
      fechado ele não é um painel escondido: não existe.
    -->
    <ng-template rdxNavigationMenuPortal>
      <div
        rdxNavigationMenuPositioner
        class="nds-navigation-menu-positioner"
        [side]="lado()"
        [align]="align()"
        [sideOffset]="sideOffset()"
      >
        <div rdxNavigationMenuPopup class="nds-navigation-menu-popup">
          <div
            rdxNavigationMenuViewport
            class="nds-navigation-menu-viewport"
            data-slot="navigation-menu-viewport"
          ></div>

          @if (indicator()) {
            <span
              rdxNavigationMenuArrow
              class="nds-navigation-menu-indicator"
              data-slot="navigation-menu-indicator"
            ></span>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class NdsNavigationMenu {
  /** Alinhamento do painel em relação ao gatilho ativo. */
  readonly align = input<NavigationMenuAlign>('start');

  /** Distância em pixels entre o painel e a barra. */
  readonly sideOffset = input(8);

  /**
   * Seta apontando para o gatilho ativo.
   *
   * Nasce desligada: a folha compartilhada define `.nds-navigation-menu-indicator`
   * sem regra de posicionamento própria — quem posiciona é o floating-ui, e só
   * quando a seta existe. É feedback redundante (o gatilho já muda de fundo e o
   * chevron já gira), então é escolha de quem compõe.
   */
  readonly indicator = input(false, { transform: booleanAttribute });

  private readonly raiz = inject(RdxNavigationMenuRoot, { self: true });

  /**
   * Barra horizontal abre para baixo; barra vertical abre para o lado.
   *
   * Derivado da orientação em vez de virar mais um input: abrir para baixo numa
   * coluna cobriria os próprios itens seguintes, e nunca é o que se quer.
   */
  protected readonly lado = computed(() =>
    this.raiz.orientation() === 'vertical' ? 'right' : 'bottom',
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * A lista de itens da barra — `<ul>` de verdade, com `<li>` dentro.
 *
 * A classe depende da orientação porque a folha compartilhada só descreve a
 * barra horizontal: `.nds-navigation-menu-list` é `display: flex` em linha, sem
 * variação por `data-orientation`. Na vertical a lista usa `.nds-stack`, que é a
 * mesma saída do Vanilla (a story Vertical de lá troca a classe do `<ul>`).
 */
@Directive({
  selector: 'ul[ndsNavigationMenuList]',
  standalone: true,
  // Sem `inputs` aqui: `RdxNavigationMenuList` não declara nenhum, e listar
  // qualquer nome quebraria com NG0311.
  hostDirectives: [RdxNavigationMenuList],
  host: {
    '[class]': 'classeDoHost()',
    '[attr.data-slot]': '"navigation-menu-list"',
    '[attr.data-spacing]': 'vertical() ? "xs" : null',
  },
})
export class NdsNavigationMenuList {
  private readonly contexto = injectNavigationMenuRootContext();

  protected readonly vertical = computed(() => this.contexto.orientation() === 'vertical');

  // Só as classes deste componente entram no computed: o `class` que quem
  // consome escrever no elemento o Angular já mescla sozinho.
  protected readonly classeDoHost = computed(() =>
    this.vertical() ? 'nds-stack nds-list-none' : 'nds-navigation-menu-list',
  );
}

// ─── Item ─────────────────────────────────────────────────────────────────────

/** Um item da barra: gatilho + painel, ou um link direto. */
@Directive({
  selector: 'li[ndsNavigationMenuItem]',
  standalone: true,
  hostDirectives: [{ directive: RdxNavigationMenuItem, inputs: ['value'] }],
  host: {
    class: 'nds-navigation-menu-item',
    '[attr.data-slot]': '"navigation-menu-item"',
  },
})
export class NdsNavigationMenuItem {}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Botão que abre o painel do item.
 *
 * O chevron entra pelo template, como no React: é sinal de que ali há mais
 * conteúdo, e deixá-lo a cargo de quem escreve garantiria barras sem ele.
 * A rotação no estado aberto vem do CSS lendo `data-popup-open` do gatilho, que
 * o primitivo escreve — nenhum estado é duplicado aqui.
 */
@Component({
  selector: 'button[ndsNavigationMenuTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsNavigationMenuChevron],
  hostDirectives: [
    { directive: RdxNavigationMenuTrigger, inputs: ['disabled', 'openOnHover'] },
  ],
  host: {
    class: 'nds-navigation-menu-trigger',
    '[attr.data-slot]': '"navigation-menu-trigger"',
  },
  template: `
    <span><ng-content /></span>
    <svg ndsNavigationMenuChevron></svg>
  `,
})
export class NdsNavigationMenuTrigger {}

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * O miolo do painel, guardado até a abertura.
 *
 * É um `<ng-template>` e não um elemento: quem monta e desmonta é o viewport
 * compartilhado, que instancia o template do item ativo dentro do popup e o
 * destrói na troca. Só assim a transição de tamanho entre dois painéis existe.
 */
@Directive({
  selector: 'ng-template[ndsNavigationMenuContent]',
  standalone: true,
  hostDirectives: [{ directive: RdxNavigationMenuContent, inputs: ['forceMount'] }],
})
export class NdsNavigationMenuContent {}

/**
 * A raiz VISUAL do painel — o elemento que o viewport mede.
 *
 * Separada do `<ng-template>` por uma razão concreta: o viewport mede
 * `firstElementChild` do que instanciou para dar largura e altura ao popup. Essa
 * medida precisa incluir o respiro do painel, então o padding mora aqui, no
 * primeiro elemento, e não no popup (que é dimensionado PELA medida e cortaria).
 */
@Directive({
  selector: '[ndsNavigationMenuPanel]',
  standalone: true,
  host: {
    class: 'nds-navigation-menu-popup-content',
    '[attr.data-slot]': '"navigation-menu-content"',
  },
})
export class NdsNavigationMenuPanel {}

// ─── Link (barra) ─────────────────────────────────────────────────────────────

/**
 * Destino direto na barra — um `<a href>`, sem painel.
 *
 * `active` marca a página atual: o primitivo escreve `aria-current="page"` (o
 * que o leitor de tela anuncia) e `data-active` (o que o CSS pinta). Os dois,
 * porque cor sozinha não informa quem não a distingue.
 */
@Directive({
  selector: 'a[ndsNavigationMenuLink]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxNavigationMenuLink,
      inputs: ['active', 'closeOnClick'],
      outputs: ['onSelect'],
    },
  ],
  host: {
    class: 'nds-navigation-menu-link',
    '[attr.data-slot]': '"navigation-menu-link"',
  },
})
export class NdsNavigationMenuLink {}

// ─── Child (painel) ───────────────────────────────────────────────────────────

/**
 * Destino dentro do painel.
 *
 * Classe diferente da do link da barra porque o desenho é outro: o da barra é
 * uma pílula de uma linha; este é um bloco com título e, às vezes, uma linha de
 * descrição. É a mesma separação que o Vanilla faz
 * (`.nds-navigation-menu-link` × `.nds-navigation-menu-child`).
 *
 * Fecha o painel ao ser escolhido, SEMPRE — navegar é sair da página, e um
 * painel que sobrevive ao clique fica pendurado sobre a página seguinte. O
 * `closeOnClick` do primitivo não é exposto aqui de propósito: dois mecanismos
 * para o mesmo fechamento só criariam a chance de ficarem em desacordo.
 *
 * O fechamento NÃO olha `defaultPrevented`. Quem usa roteador de cliente chama
 * `preventDefault()` para navegar por conta própria — e continua querendo o
 * painel fechado. Amarrar o fechamento ao default do navegador deixaria o
 * painel aberto exatamente no caso mais comum de aplicação real.
 */
@Directive({
  selector: 'a[ndsNavigationMenuChild]',
  standalone: true,
  hostDirectives: [
    { directive: RdxNavigationMenuLink, inputs: ['active'], outputs: ['onSelect'] },
  ],
  host: {
    class: 'nds-navigation-menu-child',
    '[attr.data-slot]': '"navigation-menu-child"',
    '(click)': 'aoClicar($event)',
  },
})
export class NdsNavigationMenuChild {
  private readonly contexto = injectNavigationMenuRootContext();

  protected aoClicar(event: MouseEvent): void {
    this.contexto.close('link-press', event);
  }
}

/** Título do destino dentro do painel. */
@Directive({
  selector: 'div[ndsNavigationMenuChildLabel]',
  standalone: true,
  host: {
    class: 'nds-navigation-menu-child-label',
    '[attr.data-slot]': '"navigation-menu-child-label"',
  },
})
export class NdsNavigationMenuChildLabel {}

/**
 * Uma linha de contexto sob o título.
 *
 * Não recebe `aria-hidden`: ela faz parte do nome acessível do link
 * ("Para Marketing, campanhas e automação"), que é justamente o que o critério
 * 2.4.4 (Link Purpose) pede — um "Saiba mais" solto não diz para onde vai.
 */
@Directive({
  selector: 'p[ndsNavigationMenuChildDescription]',
  standalone: true,
  host: {
    class: 'nds-navigation-menu-child-description',
    '[attr.data-slot]': '"navigation-menu-child-description"',
  },
})
export class NdsNavigationMenuChildDescription {}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/** A família inteira — para o `imports` de quem compõe. */
export const NDS_NAVIGATION_MENU = [
  NdsNavigationMenu,
  NdsNavigationMenuList,
  NdsNavigationMenuItem,
  NdsNavigationMenuTrigger,
  NdsNavigationMenuContent,
  NdsNavigationMenuPanel,
  NdsNavigationMenuLink,
  NdsNavigationMenuChild,
  NdsNavigationMenuChildLabel,
  NdsNavigationMenuChildDescription,
] as const;
