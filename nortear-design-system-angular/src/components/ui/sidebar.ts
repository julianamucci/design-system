import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  type OnInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  NdsSheet,
  NdsSheetContent,
  NdsSheetHeader,
  NdsSheetTitle,
  NdsSheetDescription,
} from './sheet';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-sidebar-* (docs/shared/styles/nds/sidebar.css).
//
// SEM primitivo do Radix NG: não existe `@radix-ng/primitives/sidebar`. A peça é
// do design system, não da lib headless — as outras quatro stacks também a
// escrevem à mão.
//
// O estado (aberto/recolhido, móvel, atalho de teclado) mora num serviço de
// signals fornecido pelo Provider, e não em input espalhado pelas peças: o
// gatilho fica longe do painel na árvore, e passar `open` de mão em mão faria
// quem compõe costurar o que o componente já sabe fazer.
//
// Nenhuma medida vem daqui. `--sidebar-width` e `--sidebar-width-icon` já são
// declaradas em `.nds-sidebar-wrapper` no CSS compartilhado — o React as repete
// em `style` inline sem precisar.

const ATALHO = 'b';
const COOKIE = 'sidebar_state';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // uma semana
/** Abaixo disto a sidebar vira gaveta sobreposta em vez de coluna. */
const LARGURA_MOVEL = '(max-width: 767px)';

/**
 * A media query que decide se a barra é coluna ou gaveta.
 *
 * Injetável porque o ponto de virada é do produto, não do design system: uma
 * aplicação com sidebar mais estreita vira mais tarde. Também é o que permite
 * exercitar o caminho móvel sem redimensionar o navegador.
 */
export const NDS_SIDEBAR_MOBILE_QUERY = new InjectionToken<string>(
  'nds-sidebar-mobile-query',
  { providedIn: 'root', factory: () => LARGURA_MOVEL },
);

export type SidebarState = 'expanded' | 'collapsed';
export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';
export type SidebarMenuButtonVariant = 'default' | 'outline';
export type SidebarMenuButtonSize = 'default' | 'sm' | 'lg';

/**
 * Estado compartilhado por toda a árvore da sidebar.
 *
 * Fornecido pelo `NdsSidebarProvider`, nunca em `root`: duas sidebars na mesma
 * página — o que a docs page faz, com um exemplo por variante — precisam de
 * estados independentes.
 */
@Injectable()
export class NdsSidebarStore {
  private readonly _open = signal(true);
  private readonly _openMobile = signal(false);
  private readonly _isMobile = signal(false);

  readonly open = this._open.asReadonly();
  readonly openMobile = this._openMobile.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();

  /** O que o CSS lê em `data-state`. */
  readonly state = computed<SidebarState>(() => (this._open() ? 'expanded' : 'collapsed'));

  /** Avisa quem controla de fora; o Provider liga isto ao próprio model. */
  aoMudar: ((aberto: boolean) => void) | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Ctrl/Cmd+B. No `document` e não no elemento: o atalho vale de qualquer
    // lugar da página, inclusive com o foco no conteúdo principal.
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === ATALHO && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.alternar();
      }
    };
    document.addEventListener('keydown', aoTeclar);

    const consulta = window.matchMedia(inject(NDS_SIDEBAR_MOBILE_QUERY));
    const aoMudarLargura = () => this._isMobile.set(consulta.matches);
    aoMudarLargura();
    consulta.addEventListener('change', aoMudarLargura);

    destroyRef.onDestroy(() => {
      document.removeEventListener('keydown', aoTeclar);
      consulta.removeEventListener('change', aoMudarLargura);
    });
  }

  definir(aberto: boolean): void {
    this._open.set(aberto);
    this.aoMudar?.(aberto);
    // Persistência entre visitas. Falha em silêncio onde cookie não é gravável
    // (iframe de terceiro, modo restrito) — é preferência, não dado.
    try {
      document.cookie = `${COOKIE}=${aberto}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    } catch {
      /* preferência perdida, sidebar funcionando */
    }
  }

  definirMovel(aberto: boolean): void {
    this._openMobile.set(aberto);
  }

  alternar(): void {
    if (this._isMobile()) this.definirMovel(!this._openMobile());
    else this.definir(!this._open());
  }
}

/**
 * Raiz. Envolve a sidebar e o conteúdo principal, e é quem fornece o estado.
 *
 * Também é onde o CSS declara `--sidebar-width` e `--sidebar-width-icon`, então
 * nenhuma peça abaixo precisa saber medida.
 */
@Component({
  selector: 'div[ndsSidebarProvider]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [NdsSidebarStore],
  host: {
    class: 'nds-sidebar-wrapper',
    '[attr.data-slot]': '"sidebar-wrapper"',
  },
})
export class NdsSidebarProvider implements OnInit {
  /** Estado inicial quando ninguém controla de fora. */
  readonly defaultOpen = input<boolean>(true);

  /** Controle de fora. É um `model`, então `[(open)]` funciona. */
  readonly open = model<boolean | undefined>(undefined);

  private readonly store = inject(NdsSidebarStore);

  ngOnInit(): void {
    // No `ngOnInit` e NÃO no construtor: no construtor um `input()` ainda
    // devolve o valor declarado no componente, não o que quem consome ligou.
    // Ler `defaultOpen()` lá dá `true` sempre, e a sidebar nasce aberta mesmo
    // com `[defaultOpen]="false"` — sem erro, só com o estado errado.
    this.store.definir(this.open() ?? this.defaultOpen());

    // O store avisa quem controla; sem isto um `[(open)]` nunca receberia de
    // volta o efeito do atalho de teclado nem do clique no gatilho.
    this.store.aoMudar = (aberto) => this.open.set(aberto);
  }

  constructor() {
    effect(() => {
      const deFora = this.open();
      // A leitura de comparação vai em `untracked`: como dependência, ela
      // faria o effect acordar da própria escrita do `aoMudar` acima.
      if (deFora !== undefined && deFora !== untracked(this.store.open)) this.store.definir(deFora);
    });
  }
}

/** O painel em si. */
@Component({
  selector: 'div[ndsSidebar]',
  standalone: true,
  imports: [NgTemplateOutlet, NdsSheet, NdsSheetContent, NdsSheetHeader, NdsSheetTitle, NdsSheetDescription],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classeDoHost()',
    '[attr.data-slot]': '"sidebar"',
    '[attr.data-state]': 'store.state()',
    '[attr.data-side]': 'side()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-collapsible]': 'colapsavelAtivo()',
    '[attr.data-mobile]': 'store.isMobile() ? "true" : null',
  },
  template: `
    <!-- UMA <ng-content> só, guardada aqui e instanciada onde faz falta.
         Duas <ng-content> em ramos exclusivos de @if não funcionam: o Angular
         resolve a projeção em tempo de compilação, e com dois destinos padrão o
         conteúdo não chega a NENHUM dos dois. O sintoma é a sidebar renderizar
         vazia, sem erro. O <ng-container> não deixa elemento no DOM. -->
    <ng-template #conteudo><ng-content /></ng-template>

    @if (store.isMobile() && collapsible() !== 'none') {
      <!-- Em tela estreita a barra deixa de ser coluna e vira gaveta sobreposta.
           Não é escolha estética: 16rem numa tela de 360px não deixa conteúdo.
           O Sheet traz foco preso, Escape, devolução de foco e trava de rolagem,
           que uma gaveta modal precisa ter e ninguém escreve certo à mão.

           O X embutido fica desligado porque o CSS compartilhado já o esconde
           dentro de .nds-sidebar-mobile — o gatilho continua sendo a saída. -->
      <nds-sheet
        [open]="store.openMobile()"
        (openChange)="store.definirMovel($event)"
      >
        <ng-template
          ndsSheetContent
          [side]="side()"
          panelClass="nds-sidebar-mobile"
          [showCloseButton]="false"
        >
          <!-- Título só para leitor de tela: um diálogo sem nome é anunciado
               como "diálogo" e mais nada. O mesmo par que o React escreve. -->
          <div ndsSheetHeader class="nds-sr-only">
            <h2 ndsSheetTitle>{{ mobileTitle() }}</h2>
            <p ndsSheetDescription>{{ mobileDescription() }}</p>
          </div>
          <div class="nds-sidebar-mobile-inner">
            <ng-container [ngTemplateOutlet]="conteudo" />
          </div>
        </ng-template>
      </nds-sheet>
    } @else if (collapsible() === 'none') {
      <!-- Sem recolhimento não há vão a reservar nem painel flutuante: o
           conteúdo é a própria coluna. -->
      <ng-container [ngTemplateOutlet]="conteudo" />
    } @else {
      <!-- O vão reserva a largura no fluxo enquanto o painel fica fixo por
           cima. Sem ele o conteúdo principal pularia a cada recolhimento. -->
      <div class="nds-sidebar-gap" [attr.data-state]="store.state()" data-slot="sidebar-gap">
        <div class="nds-sidebar-gap-inner"></div>
      </div>
      <div class="nds-sidebar-panel" data-slot="sidebar-container">
        <div class="nds-sidebar-inner" data-sidebar="sidebar" data-slot="sidebar-inner">
          <ng-container [ngTemplateOutlet]="conteudo" />
        </div>
      </div>
    }
  `,
})
export class NdsSidebar {
  readonly side = input<SidebarSide>('left');
  readonly variant = input<SidebarVariant>('sidebar');
  readonly collapsible = input<SidebarCollapsible>('offcanvas');

  /**
   * Nome do painel na versão móvel, só para leitor de tela.
   *
   * Default em inglês para bater com o que as outras quatro stacks já escrevem
   * — lá é literal cravado no componente; aqui pelo menos dá para traduzir.
   */
  readonly mobileTitle = input('Sidebar');
  readonly mobileDescription = input('Displays the mobile sidebar.');

  protected readonly store = inject(NdsSidebarStore);

  protected readonly classeDoHost = computed(() =>
    this.collapsible() === 'none' ? 'nds-sidebar-static' : 'nds-sidebar-root',
  );

  /** Quem tinha o foco quando a gaveta móvel abriu. */
  private focoAntesDaGaveta: HTMLElement | null = null;

  constructor() {
    // Devolver o foco é trabalho de quem abriu.
    //
    // O Sheet restaura sozinho quando o gatilho é um `ndsSheetTrigger` — aqui
    // não é: a gaveta abre pelo store, a partir do `ndsSidebarTrigger`, que o
    // primitivo nunca vê. Sem isto o Escape fecha o painel e o foco cai no
    // <body>: quem navega por teclado volta ao começo da página.
    effect(() => {
      const aberta = this.store.openMobile();
      if (aberta) {
        this.focoAntesDaGaveta = document.activeElement as HTMLElement | null;
        return;
      }
      const alvo = this.focoAntesDaGaveta;
      this.focoAntesDaGaveta = null;
      // Adiado de propósito: o painel ainda está saindo, e o gerenciador de
      // foco do primitivo mexe no foco durante a animação de saída.
      if (alvo?.isConnected) setTimeout(() => alvo.focus());
    });
  }

  /**
   * `data-collapsible` só existe enquanto a sidebar está recolhida.
   *
   * É assim que as outras stacks emitem, e o CSS depende disso: as regras de
   * `[data-collapsible="icon"]` encolhem o painel e escondem rótulos — se o
   * atributo ficasse fixo, a sidebar nasceria encolhida.
   */
  protected readonly colapsavelAtivo = computed(() =>
    this.store.state() === 'collapsed' && this.collapsible() !== 'none' ? this.collapsible() : null,
  );
}

/** Botão que alterna a sidebar. */
@Directive({
  selector: 'button[ndsSidebarTrigger]',
  standalone: true,
  host: {
    type: 'button',
    'data-sidebar': 'trigger',
    '[attr.data-slot]': '"sidebar-trigger"',
    '[attr.aria-expanded]': 'store.open()',
    '(click)': 'store.alternar()',
  },
})
export class NdsSidebarTrigger {
  protected readonly store = inject(NdsSidebarStore);
}

/**
 * Faixa clicável na borda do painel.
 *
 * `tabindex="-1"` de propósito: ela faz o mesmo que o gatilho, que já está na
 * ordem de tabulação. Duas paradas de teclado para uma ação só é ruído para
 * quem navega sem mouse — e o `aria-hidden` completa, tirando a duplicata
 * também do leitor de tela.
 */
@Directive({
  selector: 'button[ndsSidebarRail]',
  standalone: true,
  host: {
    class: 'nds-sidebar-rail',
    type: 'button',
    tabindex: '-1',
    'aria-hidden': 'true',
    'data-sidebar': 'rail',
    '[attr.data-slot]': '"sidebar-rail"',
    '(click)': 'store.alternar()',
  },
})
export class NdsSidebarRail {
  protected readonly store = inject(NdsSidebarStore);
}

/** Conteúdo principal ao lado da sidebar. `<main>` porque é o marco da página. */
@Directive({
  selector: 'main[ndsSidebarInset]',
  standalone: true,
  host: { class: 'nds-sidebar-inset', '[attr.data-slot]': '"sidebar-inset"' },
})
export class NdsSidebarInset {}

@Directive({
  selector: 'input[ndsSidebarInput]',
  standalone: true,
  host: {
    class: 'nds-sidebar-input',
    'data-sidebar': 'input',
    '[attr.data-slot]': '"sidebar-input"',
  },
})
export class NdsSidebarInput {}

@Directive({
  selector: 'div[ndsSidebarHeader]',
  standalone: true,
  host: { class: 'nds-sidebar-header', 'data-sidebar': 'header', '[attr.data-slot]': '"sidebar-header"' },
})
export class NdsSidebarHeader {}

@Directive({
  selector: 'div[ndsSidebarFooter]',
  standalone: true,
  host: { class: 'nds-sidebar-footer', 'data-sidebar': 'footer', '[attr.data-slot]': '"sidebar-footer"' },
})
export class NdsSidebarFooter {}

@Directive({
  selector: 'div[ndsSidebarContent]',
  standalone: true,
  host: { class: 'nds-sidebar-content', 'data-sidebar': 'content', '[attr.data-slot]': '"sidebar-content"' },
})
export class NdsSidebarContent {}

@Directive({
  selector: 'div[ndsSidebarSeparator]',
  standalone: true,
  host: {
    class: 'nds-sidebar-separator',
    role: 'separator',
    'aria-orientation': 'horizontal',
    'data-sidebar': 'separator',
    '[attr.data-slot]': '"sidebar-separator"',
  },
})
export class NdsSidebarSeparator {}

@Directive({
  selector: 'div[ndsSidebarGroup]',
  standalone: true,
  host: { class: 'nds-sidebar-group', 'data-sidebar': 'group', '[attr.data-slot]': '"sidebar-group"' },
})
export class NdsSidebarGroup {}

/**
 * Rótulo do grupo.
 *
 * Some da tela quando a sidebar recolhe para ícones (o CSS zera a opacidade),
 * mas continua no DOM — é ele que dá nome ao grupo para quem usa leitor de
 * tela, e recolher a coluna não deveria apagar essa informação.
 */
@Directive({
  selector: 'div[ndsSidebarGroupLabel]',
  standalone: true,
  host: {
    class: 'nds-sidebar-group-label',
    'data-sidebar': 'group-label',
    '[attr.data-slot]': '"sidebar-group-label"',
  },
})
export class NdsSidebarGroupLabel {}

@Directive({
  selector: 'button[ndsSidebarGroupAction]',
  standalone: true,
  host: {
    class: 'nds-sidebar-group-action',
    type: 'button',
    'data-sidebar': 'group-action',
    '[attr.data-slot]': '"sidebar-group-action"',
  },
})
export class NdsSidebarGroupAction {}

@Directive({
  selector: 'div[ndsSidebarGroupContent]',
  standalone: true,
  host: {
    class: 'nds-sidebar-group-content',
    'data-sidebar': 'group-content',
    '[attr.data-slot]': '"sidebar-group-content"',
  },
})
export class NdsSidebarGroupContent {}

@Directive({
  selector: 'ul[ndsSidebarMenu]',
  standalone: true,
  host: { class: 'nds-sidebar-menu', 'data-sidebar': 'menu', '[attr.data-slot]': '"sidebar-menu"' },
})
export class NdsSidebarMenu {}

@Directive({
  selector: 'li[ndsSidebarMenuItem]',
  standalone: true,
  host: {
    class: 'nds-sidebar-menu-item',
    'data-sidebar': 'menu-item',
    '[attr.data-slot]': '"sidebar-menu-item"',
  },
})
export class NdsSidebarMenuItem {}

/**
 * O item de navegação.
 *
 * Serve tanto `<button>` quanto `<a href>` — quem navega para outra rota merece
 * um link de verdade, que abre em nova aba e aparece no histórico.
 *
 * `aria-current="page"` além do `data-active`: o data-attribute é para o CSS,
 * o ARIA é o que o leitor de tela anuncia como "página atual". As outras stacks
 * emitem os dois.
 */
@Directive({
  selector: 'button[ndsSidebarMenuButton], a[ndsSidebarMenuButton]',
  standalone: true,
  host: {
    '[class]': 'classeDoHost()',
    'data-sidebar': 'menu-button',
    '[attr.data-slot]': '"sidebar-menu-button"',
    '[attr.data-active]': 'active() ? "true" : null',
    '[attr.data-size]': 'size() === "default" ? null : size()',
    '[attr.aria-current]': 'active() && ehLink ? "page" : null',
  },
})
export class NdsSidebarMenuButton {
  readonly variant = input<SidebarMenuButtonVariant>('default');
  readonly size = input<SidebarMenuButtonSize>('default');
  readonly active = input<boolean>(false);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ehLink = this.hostRef.nativeElement.tagName === 'A';

  // A variante `outline` tem classe própria em vez de `data-variant`, que é
  // como o CSS compartilhado a escreve. Só as classes deste componente entram
  // aqui: o `class` que quem consome escrever no elemento o Angular já mescla.
  protected readonly classeDoHost = computed(() =>
    this.variant() === 'outline'
      ? 'nds-sidebar-menu-button nds-sidebar-menu-button-outline'
      : 'nds-sidebar-menu-button',
  );
}

@Directive({
  selector: 'button[ndsSidebarMenuAction]',
  standalone: true,
  host: {
    class: 'nds-sidebar-menu-action',
    type: 'button',
    'data-sidebar': 'menu-action',
    '[attr.data-slot]': '"sidebar-menu-action"',
  },
})
export class NdsSidebarMenuAction {}

/**
 * Contador ao lado do item.
 *
 * `aria-hidden` porque o número sozinho não diz nada: quem compõe põe a
 * contagem no nome acessível do item ("Notificações, 3 não lidas"), e sem isto
 * o leitor leria um "3" solto depois do rótulo.
 */
@Directive({
  selector: 'span[ndsSidebarMenuBadge]',
  standalone: true,
  host: {
    class: 'nds-sidebar-menu-badge',
    'aria-hidden': 'true',
    'data-sidebar': 'menu-badge',
    '[attr.data-slot]': '"sidebar-menu-badge"',
  },
})
export class NdsSidebarMenuBadge {}

@Directive({
  selector: 'ul[ndsSidebarMenuSub]',
  standalone: true,
  host: {
    class: 'nds-sidebar-menu-sub',
    'data-sidebar': 'menu-sub',
    '[attr.data-slot]': '"sidebar-menu-sub"',
  },
})
export class NdsSidebarMenuSub {}

@Directive({
  selector: 'li[ndsSidebarMenuSubItem]',
  standalone: true,
  host: {
    class: 'nds-sidebar-menu-sub-item',
    'data-sidebar': 'menu-sub-item',
    '[attr.data-slot]': '"sidebar-menu-sub-item"',
  },
})
export class NdsSidebarMenuSubItem {}

@Directive({
  selector: 'a[ndsSidebarMenuSubButton], button[ndsSidebarMenuSubButton]',
  standalone: true,
  host: {
    class: 'nds-sidebar-menu-sub-button',
    'data-sidebar': 'menu-sub-button',
    '[attr.data-slot]': '"sidebar-menu-sub-button"',
    '[attr.data-active]': 'active() ? "true" : null',
    '[attr.data-size]': 'size() === "default" ? null : size()',
    '[attr.aria-current]': 'active() && ehLink ? "page" : null',
  },
})
export class NdsSidebarMenuSubButton {
  readonly size = input<SidebarMenuButtonSize>('default');
  readonly active = input<boolean>(false);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ehLink = this.hostRef.nativeElement.tagName === 'A';
}

/**
 * Espaço reservado enquanto o menu carrega.
 *
 * `role="status"` com `aria-label`: um bloco cinza pulsando não diz nada para
 * quem não o vê, e um `aria-label` num elemento sem papel seria atributo
 * proibido (axe aria-prohibited-attr).
 */
@Component({
  selector: 'div[ndsSidebarMenuSkeleton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-sidebar-menu-skeleton',
    role: 'status',
    'data-sidebar': 'menu-skeleton',
    '[attr.data-slot]': '"sidebar-menu-skeleton"',
    '[attr.aria-label]': 'loadingLabel()',
  },
  template: `
    @if (showIcon()) {
      <div class="nds-sidebar-menu-skeleton-icon" data-sidebar="menu-skeleton-icon"></div>
    }
    <div class="nds-sidebar-menu-skeleton-text" data-sidebar="menu-skeleton-text"></div>
  `,
})
export class NdsSidebarMenuSkeleton {
  readonly showIcon = input<boolean>(false);
  readonly loadingLabel = input<string>('Carregando menu');
}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_SIDEBAR = [
  NdsSidebarProvider, NdsSidebar, NdsSidebarTrigger, NdsSidebarRail, NdsSidebarInset,
  NdsSidebarInput, NdsSidebarHeader, NdsSidebarFooter, NdsSidebarContent, NdsSidebarSeparator,
  NdsSidebarGroup, NdsSidebarGroupLabel, NdsSidebarGroupAction, NdsSidebarGroupContent,
  NdsSidebarMenu, NdsSidebarMenuItem, NdsSidebarMenuButton, NdsSidebarMenuAction,
  NdsSidebarMenuBadge, NdsSidebarMenuSub, NdsSidebarMenuSubItem, NdsSidebarMenuSubButton,
  NdsSidebarMenuSkeleton,
] as const;
