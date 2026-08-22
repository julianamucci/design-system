import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { ChevronRight, MoreHorizontal, Slash } from 'lucide';

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
//
// Visual: classes .nds-breadcrumb-* (docs/shared/styles/nds/breadcrumb.css).
//
// SEM primitivo do @radix-ng/primitives: o pacote não publica um `breadcrumb`
// (conferido em node_modules/@radix-ng/primitives — há accordion, menu, tabs…,
// não há breadcrumb). E não haveria o que compor mesmo se houvesse: a trilha
// não guarda estado, não gerencia foco e não tem interação de teclado própria —
// o que a torna acessível é markup nativo (`nav` + `ol` + `li` + `a`) mais dois
// atributos ARIA fixos. Um primitivo aqui só acrescentaria camada sem
// contribuir com ARIA nem comportamento.
//
// Cada subcomponente é seletor de ATRIBUTO no elemento nativo correspondente,
// então o DOM sai idêntico ao do Vanilla (a referência cross-stack) e o CSS
// `.nds-*` casa sem wrapper.
//
// `@Directive` em tudo que não precisa de template: Breadcrumb, List, Item,
// Link e Page só carimbam classe e atributo no elemento que o consumidor já
// escreveu — o conteúdo é filho dele, no template de quem usa. Só Separator e
// Ellipsis viram `@Component`, porque têm desenho padrão a renderizar.

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Pacote `lucide` (agnóstico), não `lucide-angular` — este declara peer
// `@angular/core: 13.x - 21.x` e conflita com o Angular 22. Mesma fonte de
// ícones do Vanilla, sem wrapper.
//
// Sem classe própria no `<svg>`: o CSS compartilhado dimensiona por
// `.nds-breadcrumb-separator > svg` e `.nds-breadcrumb-ellipsis > svg`. Uma
// classe aqui seria invenção — não existe no CSS.
//
// Declarado antes de quem o usa de propósito: `imports:` é avaliado quando a
// classe é decorada, então uma referência a um símbolo declarado abaixo cairia
// na zona morta do `class` e quebraria em runtime.

export type BreadcrumbIconKind = 'chevron-right' | 'more-horizontal' | 'slash';

type LucideIconNode = [string, Record<string, string>];

const BREADCRUMB_ICON_MAP: Record<BreadcrumbIconKind, LucideIconNode[]> = {
  'chevron-right':   ChevronRight   as unknown as LucideIconNode[],
  'more-horizontal': MoreHorizontal as unknown as LucideIconNode[],
  // `slash` não é desenho padrão de nada: existe para o separador customizado
  // que o conteúdo compartilhado documenta (`/`), e é o mesmo que react, vue e
  // svelte usam nessa configuração.
  'slash':           Slash          as unknown as LucideIconNode[],
};

/**
 * SVG de ícone da trilha.
 *
 * Os filhos são criados por `createElementNS` num `effect`, não pelo template:
 * cada ícone do lucide é uma lista `[tag, attrs]` com tag variável
 * (`path`/`circle`), e template Angular exige tag estática. Construir nós é
 * imune a XSS — não há `innerHTML` no caminho.
 */
@Component({
  selector: 'svg[ndsBreadcrumbIcon]',
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
    'aria-hidden': 'true',
  },
})
export class NdsBreadcrumbIcon {
  readonly kind = input.required<BreadcrumbIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of BREADCRUMB_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

/**
 * Container da trilha — `<nav aria-label="breadcrumb">`.
 *
 * O nome acessível é configurável porque a página pode ter mais de uma
 * navegação; sem nomes distintos o axe acusa `landmark-unique` e o leitor de
 * tela anuncia "navegação" duas vezes sem dizer qual é qual.
 *
 * O `aria-label` escrito direto no elemento também vale: ele é lido na criação
 * e vira o default. Sem essa leitura o host binding sobrescreveria em silêncio
 * o rótulo que a pessoa escreveu — binding roda depois de atributo estático.
 */
@Directive({
  selector: 'nav[ndsBreadcrumb]',
  standalone: true,
  host: {
    class: 'nds-breadcrumb',
    '[attr.data-slot]': '"breadcrumb"',
    '[attr.aria-label]': 'accessibleName()',
  },
})
export class NdsBreadcrumb {
  /** Nome acessível do landmark. Padrão: `breadcrumb`. */
  readonly label = input<string | undefined>(undefined);

  private readonly rotuloEscrito = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement.getAttribute('aria-label');

  protected readonly accessibleName = computed(
    () => this.label() ?? this.rotuloEscrito ?? 'breadcrumb',
  );
}

/** Lista ordenada que agrupa os níveis — a ordem é o que dá sentido ao caminho. */
@Directive({
  selector: 'ol[ndsBreadcrumbList]',
  standalone: true,
  host: {
    class: 'nds-breadcrumb-list',
    '[attr.data-slot]': '"breadcrumb-list"',
  },
})
export class NdsBreadcrumbList {}

/** Um nível da hierarquia — `<li>`. */
@Directive({
  selector: 'li[ndsBreadcrumbItem]',
  standalone: true,
  host: {
    class: 'nds-breadcrumb-item',
    '[attr.data-slot]': '"breadcrumb-item"',
  },
})
export class NdsBreadcrumbItem {}

/**
 * Link para um nível anterior — `<a href>`.
 *
 * Diretiva de atributo, e não componente com prop de render: é assim que a
 * integração com router acontece em Angular. O `<a routerLink="…">` do
 * consumidor recebe `ndsBreadcrumbLink` e ganha a classe do design system sem
 * virar um segundo elemento — o equivalente ao `render`/`asChild` das outras
 * stacks.
 */
@Directive({
  selector: 'a[ndsBreadcrumbLink]',
  standalone: true,
  host: {
    class: 'nds-breadcrumb-link',
    '[attr.data-slot]': '"breadcrumb-link"',
  },
})
export class NdsBreadcrumbLink {}

/**
 * Página atual — último item, nunca navegável.
 *
 * A anatomia documentada é literal: "último item com aria-current='page'; nunca
 * é link". O `role="link"` com `aria-disabled` fazia o leitor de tela anunciar
 * justamente o contrário — "link, desabilitado" — para um texto que nunca foi
 * navegável. Quem marca a página atual é o `aria-current`, e ele vale em
 * qualquer elemento.
 */
@Directive({
  selector: 'span[ndsBreadcrumbPage]',
  standalone: true,
  host: {
    class: 'nds-breadcrumb-page',
    '[attr.data-slot]': '"breadcrumb-page"',
    '[attr.aria-current]': '"page"',
  },
})
export class NdsBreadcrumbPage {}

/**
 * Separador decorativo entre dois níveis — `<li aria-hidden>`.
 *
 * O desenho padrão é o `ChevronRight`, como manda a anatomia compartilhada e
 * como fazem react, vue e svelte. Escrever conteúdo dentro do `<li>` substitui
 * o chevron (conteúdo de fallback do `<ng-content>`) sem devolver o separador à
 * árvore de acessibilidade: `role` e `aria-hidden` moram no host, fora do
 * alcance de quem customiza.
 */
@Component({
  selector: 'li[ndsBreadcrumbSeparator]',
  standalone: true,
  imports: [NdsBreadcrumbIcon],
  template: '<ng-content><svg ndsBreadcrumbIcon kind="chevron-right"></svg></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-breadcrumb-separator',
    '[attr.data-slot]': '"breadcrumb-separator"',
    role: 'presentation',
    'aria-hidden': 'true',
  },
})
export class NdsBreadcrumbSeparator {}

/**
 * Indicador de níveis ocultos — reticências.
 *
 * O texto sr-only morava DENTRO de um `aria-hidden`: nenhum leitor de tela
 * chegava nele, então o rótulo não existia na prática. Com `label` as
 * reticências são anunciadas (`role="img"`); sem ele ficam decorativas — que é
 * o certo quando um gatilho as envolve e já carrega o próprio nome.
 */
@Component({
  selector: 'span[ndsBreadcrumbEllipsis]',
  standalone: true,
  imports: [NdsBreadcrumbIcon],
  template: '<svg ndsBreadcrumbIcon kind="more-horizontal"></svg>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-breadcrumb-ellipsis',
    '[attr.data-slot]': '"breadcrumb-ellipsis"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class NdsBreadcrumbEllipsis {
  /**
   * Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências
   * são anunciadas; sem ele, ficam decorativas.
   */
  readonly label = input<string | undefined>(undefined);
}
