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
import { ChevronLeft, ChevronRight } from 'lucide';
import { btnClass, type ButtonSize } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Pagination ───────────────────────────────────────────────────────────────
//
// Visual: `.nds-pagination` + `.nds-pagination-list` + as classes de botão
// (docs/shared/styles/nds/pagination.css e button.css).
//
// SEM primitivo do @radix-ng/primitives: o pacote não publica um `pagination`
// (conferido em node_modules/@radix-ng/primitives). E não haveria o que compor:
// a paginação não guarda estado próprio, não gerencia foco e não tem interação
// de teclado além da que `<a>` já traz. O que a torna acessível é markup nativo
// (`nav` + `ul` + `li` + `a`) mais três atributos ARIA.
//
// O visual de cada link é o do Button — é o que o conteúdo compartilhado
// documenta (a prop `size` fala em "tamanho do botão subjacente", o estado
// ativo em "borda visível" = variante outline, o hover em `accent`) e é o que
// react, vue e svelte fazem. Aqui isso vira uma chamada a `btnClass()`, a mesma
// função pura que o `NdsButton` usa: sem herdar componente, sem wrapper no DOM.
//
// Cada subcomponente é seletor de ATRIBUTO no elemento nativo correspondente,
// então o DOM sai com a mesma estrutura das outras stacks e o CSS `.nds-*` casa
// sem wrapper. `@Directive` em tudo que não tem template próprio.

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Pacote `lucide` (agnóstico), não `lucide-angular` — este declara peer
// `@angular/core: 13.x - 21.x` e conflita com o Angular 22.
//
// Sem classe própria no `<svg>`: o host de Previous/Next carrega `.nds-button`,
// e `.nds-button > svg` já dimensiona o filho direto em 1rem. Uma classe aqui
// seria invenção — não existe regra `.nds-pagination-*-svg` no CSS.
//
// Declarado antes de quem o usa de propósito: `imports:` é avaliado quando a
// classe é decorada, então uma referência a símbolo declarado abaixo cairia na
// zona morta do `class` e quebraria em runtime.

export type PaginationIconKind = 'chevron-left' | 'chevron-right';

type LucideIconNode = [string, Record<string, string>];

const PAGINATION_ICON_MAP: Record<PaginationIconKind, LucideIconNode[]> = {
  'chevron-left':  ChevronLeft  as unknown as LucideIconNode[],
  'chevron-right': ChevronRight as unknown as LucideIconNode[],
};

/**
 * SVG direcional de Previous/Next.
 *
 * Os filhos são criados por `createElementNS` num `effect`, não pelo template:
 * cada ícone do lucide é uma lista `[tag, attrs]` com tag variável
 * (`path`/`circle`), e template Angular exige tag estática. Construir nós é
 * imune a XSS — não há `innerHTML` no caminho.
 */
@Component({
  selector: 'svg[ndsPaginationIcon]',
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
export class NdsPaginationIcon {
  readonly kind = input.required<PaginationIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of PAGINATION_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── Container ────────────────────────────────────────────────────────────────

/**
 * Container da paginação — `<nav aria-label="Paginação">`.
 *
 * O nome acessível é configurável porque a página pode ter mais de uma
 * navegação; sem nomes distintos o axe acusa `landmark-unique` e o leitor de
 * tela anuncia "navegação" várias vezes sem dizer qual é qual. Uma docs page de
 * paginação mostra a peça meia dúzia de vezes — ali isso não é hipótese.
 *
 * O `aria-label` escrito direto no elemento também vale: ele é lido na criação
 * e vira o default. Sem essa leitura o host binding sobrescreveria em silêncio
 * o rótulo que a pessoa escreveu — binding roda depois de atributo estático.
 */
@Directive({
  selector: 'nav[ndsPagination]',
  standalone: true,
  host: {
    class: 'nds-pagination',
    role: 'navigation',
    '[attr.data-slot]': '"pagination"',
    '[attr.aria-label]': 'accessibleName()',
  },
})
export class NdsPagination {
  /** Nome acessível do landmark. Padrão: `Paginação`. */
  readonly label = input<string | undefined>(undefined);

  private readonly rotuloEscrito = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement.getAttribute('aria-label');

  protected readonly accessibleName = computed(
    () => this.label() ?? this.rotuloEscrito ?? 'Paginação',
  );
}

/** Lista que agrupa os controles horizontalmente — `<ul>`. */
@Directive({
  selector: 'ul[ndsPaginationContent]',
  standalone: true,
  host: {
    class: 'nds-pagination-list',
    '[attr.data-slot]': '"pagination-content"',
  },
})
export class NdsPaginationContent {}

/**
 * Wrapper de um controle — `<li>`.
 *
 * Sem classe: o CSS compartilhado estiliza o item por `.nds-pagination-list > li`.
 * Uma classe aqui seria invenção.
 */
@Directive({
  selector: 'li[ndsPaginationItem]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"pagination-item"',
  },
})
export class NdsPaginationItem {}

// ─── Link numerado ────────────────────────────────────────────────────────────

/**
 * Link de uma página — `<a href>`.
 *
 * Diretiva-componente de atributo, e não componente com prop de render: é assim
 * que a integração com router acontece em Angular. O `<a routerLink="…">` do
 * consumidor recebe `ndsPaginationLink` e ganha a aparência do design system sem
 * virar um segundo elemento — o equivalente ao `render`/`asChild` das outras
 * stacks.
 *
 * `@Component` (e não `@Directive`) porque o número da página é conteúdo
 * projetado: uma `<ng-content>` só, fora de qualquer `@if`.
 */
@Component({
  selector: 'a[ndsPaginationLink]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"pagination-link"',
    '[attr.data-active]': 'isActive() ? "true" : null',
    '[attr.aria-current]': 'isActive() ? "page" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    // Sem tabindex negativo o link desabilitado continua na ordem de tabulação
    // e o Enter navega — `pointer-events: none` só barra o mouse.
    '[attr.tabindex]': 'disabled() ? "-1" : null',
  },
})
export class NdsPaginationLink {
  /** Marca o link como página atual: aplica `aria-current="page"` e variante outline. */
  readonly isActive = input<boolean>(false);

  /** Tamanho do botão subjacente. Previous e Next usam `default`. */
  readonly size = input<ButtonSize>('icon');

  /**
   * Desabilita o link. Em `<a>` não existe `disabled` — o par correto é
   * `aria-disabled` mais a supressão do clique e da tabulação.
   */
  readonly disabled = input<boolean>(false);

  protected readonly hostClass = computed(() =>
    btnClass(this.isActive() ? 'outline' : 'ghost', this.size()),
  );

  constructor() {
    barrarClickQuandoDisabled(this);
  }
}

/**
 * Barra o clique enquanto o controle está desabilitado.
 *
 * Registrado no CONSTRUTOR com `addEventListener`, e não por
 * `host: { '(click)': … }`: medido neste projeto, o binding de host entra
 * DEPOIS do `(click)` que o consumidor escreveu no mesmo elemento, e aí
 * `stopImmediatePropagation` já não alcança ninguém — o handler de quem usa
 * disparava com o controle desabilitado. O construtor roda antes do
 * `ɵɵlistener` do template, então esta ordem é a que vale.
 *
 * Só o listener é registrado aqui; `disabled()` é lido na hora do clique. Ler
 * um `input()` dentro do construtor devolveria o default (armadilha 9 do
 * CLAUDE.md deste stack).
 *
 * `pointer-events: none` do CSS já barra o mouse; isto fecha os outros caminhos
 * — Enter num `<a>` que alguém tenha tornado focável, clique disparado por
 * script, e o `click()` de um teste.
 */
function barrarClickQuandoDisabled(control: { disabled: () => boolean }): void {
  const host = inject<ElementRef<HTMLAnchorElement>>(ElementRef).nativeElement;
  host.addEventListener(
    'click',
    (evento) => {
      if (!control.disabled()) return;
      evento.preventDefault();
      evento.stopImmediatePropagation();
    },
    { capture: true },
  );
}

// ─── Previous / Next ──────────────────────────────────────────────────────────
//
// Sem `<ng-content>`: o contrato compartilhado é `<a ndsPaginationPrevious></a>`
// — elemento vazio, com o desenho e o rótulo vindo do componente. Quem precisa
// de conteúdo próprio usa o `ndsPaginationLink` direto.
//
// O rótulo textual fica em `.nds-pagination-label`, que o CSS esconde abaixo de
// 40rem: em tela estreita sobra o ícone, e o nome acessível continua no
// `aria-label` do `<a>`.

/** Link para a página anterior — ícone à esquerda do rótulo. */
@Component({
  selector: 'a[ndsPaginationPrevious]',
  standalone: true,
  imports: [NdsPaginationIcon],
  template: `
    <svg ndsPaginationIcon kind="chevron-left"></svg>
    <span class="nds-pagination-label">{{ text() }}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"pagination-previous"',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? "-1" : null',
  },
})
export class NdsPaginationPrevious {
  /** Texto visível do controle. Traduzível. */
  readonly text = input<string>('Anterior');

  /** Nome acessível. Sem ele, o rótulo visível é usado. */
  readonly label = input<string | undefined>(undefined);

  /** Desabilita o controle — o caso da primeira página. */
  readonly disabled = input<boolean>(false);

  protected readonly accessibleName = computed(() => this.label() ?? this.text());

  protected readonly hostClass = computed(() =>
    cn(btnClass('ghost', 'default'), 'nds-pagination-prev'),
  );

  constructor() {
    barrarClickQuandoDisabled(this);
  }
}

/** Link para a próxima página — ícone à direita do rótulo. */
@Component({
  selector: 'a[ndsPaginationNext]',
  standalone: true,
  imports: [NdsPaginationIcon],
  template: `
    <span class="nds-pagination-label">{{ text() }}</span>
    <svg ndsPaginationIcon kind="chevron-right"></svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"pagination-next"',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? "-1" : null',
  },
})
export class NdsPaginationNext {
  /** Texto visível do controle. Traduzível. */
  readonly text = input<string>('Próxima');

  /** Nome acessível. Sem ele, o rótulo visível é usado. */
  readonly label = input<string | undefined>(undefined);

  /** Desabilita o controle — o caso da última página. */
  readonly disabled = input<boolean>(false);

  protected readonly accessibleName = computed(() => this.label() ?? this.text());

  protected readonly hostClass = computed(() =>
    cn(btnClass('ghost', 'default'), 'nds-pagination-next'),
  );

  constructor() {
    barrarClickQuandoDisabled(this);
  }
}

// ─── Ellipsis ─────────────────────────────────────────────────────────────────

/**
 * Indicador de páginas omitidas — reticências tipográficas.
 *
 * O caractere `…` (U+2026), não três pontos e não um ícone: é o que as notas de
 * implementação e a tabela de UX writing do conteúdo compartilhado pedem, é o
 * que o Vanilla (a referência cross-stack de markup) renderiza, e é o que o
 * comentário de estrutura do próprio `pagination.css` documenta.
 *
 * Decorativo por padrão — o número que ele esconde já está nos links vizinhos.
 * Com `label`, passa a ser anunciado (`role="img"`), para quando o vão precisar
 * ser dito. Um texto sr-only DENTRO de um `aria-hidden` não seria lido por
 * leitor de tela nenhum, que foi o defeito corrigido no Breadcrumb.
 */
@Component({
  selector: 'span[ndsPaginationEllipsis]',
  standalone: true,
  template: '…',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-pagination-ellipsis',
    '[attr.data-slot]': '"pagination-ellipsis"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class NdsPaginationEllipsis {
  /**
   * Nome acessível do indicador de páginas omitidas. Com rótulo, as reticências
   * são anunciadas; sem ele, ficam decorativas.
   */
  readonly label = input<string | undefined>(undefined);
}
