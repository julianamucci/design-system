import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { RdxButtonDirective } from '@radix-ng/primitives/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize =
  | 'default' | 'xs' | 'sm' | 'lg'
  | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

// ─── btnClass ─────────────────────────────────────────────────────────────────
//
// Retorna a lista de classes .nds-button-* aplicáveis. Sempre inclui .nds-button
// (base) + variante + (opcional) modificador de tamanho/ícone.
//
// Exemplos:
//   btnClass('default', 'default')  → 'nds-button nds-button-default'
//   btnClass('outline', 'sm')       → 'nds-button nds-button-sm nds-button-outline'
//   btnClass('ghost',   'icon-lg')  → 'nds-button nds-button-icon-lg nds-button-ghost'
//
// `default` não tem classe de tamanho: o dimensionamento base vive em
// `.nds-button`. Os demais são modificadores.
//
// Função pura e idêntica à do Vanilla de propósito — Vanilla é a referência
// cross-stack para markup e classes.

export function btnClass(
  variant: ButtonVariant | string = 'default',
  size: ButtonSize | string = 'default',
): string {
  const base = 'nds-button';
  const sizeClass =
    size === 'icon'    ? 'nds-button-icon' :
    size === 'icon-xs' ? 'nds-button-icon-xs' :
    size === 'icon-sm' ? 'nds-button-icon-sm' :
    size === 'icon-lg' ? 'nds-button-icon-lg' :
    size === 'xs'      ? 'nds-button-xs' :
    size === 'sm'      ? 'nds-button-sm' :
    size === 'lg'      ? 'nds-button-lg' :
                         '';
  const variantClass = `nds-button-${variant}`;
  return [base, sizeClass, variantClass].filter(Boolean).join(' ');
}

// ─── NdsButton ────────────────────────────────────────────────────────────────
//
// Seletor de atributo em `button`/`a`: o host É o elemento nativo, então não há
// wrapper extra no DOM e o markup fica idêntico ao das outras stacks.
//
// `hostDirectives` aplica o RdxButtonDirective sem exigir que o call site o
// importe — o comportamento headless (semântica de botão, disabled focável,
// teclado em hosts não-nativos) vem junto do componente estilizado.
//
// encapsulation None: o componente não declara `styles` próprios — todo o
// visual vem de `@shared/styles/nds/button.css`, que é global. None deixa
// explícito que este componente não introduz escopo de estilo; sem isso o
// Angular emitiria atributos `_ngcontent-*` inúteis no host.

@Component({
  selector: 'button[ndsButton], a[ndsButton]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxButtonDirective,
      inputs: ['disabled', 'focusableWhenDisabled', 'type'],
    },
  ],
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': 'slotDoHost',
    // O RdxButtonDirective marca `role="button"` em qualquer host que não seja
    // um <button> nativo. Num <a href> isso é perda de semântica: o leitor
    // anuncia "botão" para algo que NAVEGA, e o Ctrl+clique deixa de abrir em
    // outra aba. Aqui devolvemos o papel de link — a aparência é do design
    // system, a semântica é do elemento que quem escreve escolheu.
    '[attr.role]': 'papel()',
    '[attr.tabindex]': 'tabIndexDoHost()',
  },
})
export class NdsButton {
  /** Variante visual do botão. */
  readonly variant = input<ButtonVariant>('default');

  /** Tamanho do botão. Variantes `icon-*` são quadradas e exigem `ariaLabel`. */
  readonly size = input<ButtonSize>('default');

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** `<a href>` já é link e já é focável — não precisa de role nem tabindex. */
  private readonly ehAncora = this.hostRef.nativeElement.tagName === 'A';

  /**
   * Nome do slot deste botão.
   *
   * Quem COMPÕE nomeia a própria peça — `data-slot="composer-voice-toggle"` no
   * botão que o ditado usa —, e é esse nome que a folha e a suíte procuram. Mas
   * host binding VENCE atributo estático do template, e vence também binding de
   * template: medido, `[attr.data-slot]="'…'"` no call site continuou perdendo
   * para o `"button"` daqui. O nome específico sumia dos dezenove pontos em que
   * a família conversacional compõe sobre este botão, e só nesta stack.
   *
   * Lido UMA vez, na construção: atributo estático já está no elemento quando a
   * diretiva é instanciada, e o binding passa a devolver o que o template
   * escreveu. Sem nome no call site, segue `button` — que é o padrão das outras
   * quatro stacks.
   */
  protected readonly slotDoHost =
    this.hostRef.nativeElement.getAttribute('data-slot') ?? 'button';

  protected readonly papel = computed(() => (this.ehAncora ? null : undefined));
  protected readonly tabIndexDoHost = computed(() => (this.ehAncora ? null : undefined));

  protected readonly hostClass = computed(() =>
    btnClass(this.variant(), this.size()),
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
//
// Usa o pacote `lucide` (agnóstico de framework), não `lucide-angular`: este
// declara peer `@angular/core: 13.x - 21.x` e conflitaria com o Angular 22.
// O Vanilla já monta os SVGs assim — mesma fonte de ícones, sem wrapper.

import { Plus, Trash2, Pencil, ChevronRight, Download, Loader2, X, Copy, Check } from 'lucide';

export type ButtonIconKind =
  | 'plus' | 'trash' | 'pencil' | 'chevron-right' | 'download' | 'loader' | 'x'
  // `copy`/`check` servem ao botão de copiar do CodeBlock, que é um NdsButton
  // ghost/icon-sm — manter um mapa só evita duplicar a montagem de SVG.
  | 'copy' | 'check';

type LucideIconNode = [string, Record<string, string>];

const BUTTON_ICON_MAP: Record<ButtonIconKind, LucideIconNode[]> = {
  'plus':          Plus         as unknown as LucideIconNode[],
  'trash':         Trash2       as unknown as LucideIconNode[],
  'pencil':        Pencil       as unknown as LucideIconNode[],
  'chevron-right': ChevronRight as unknown as LucideIconNode[],
  'download':      Download     as unknown as LucideIconNode[],
  'loader':        Loader2      as unknown as LucideIconNode[],
  'x':             X            as unknown as LucideIconNode[],
  'copy':          Copy         as unknown as LucideIconNode[],
  'check':         Check        as unknown as LucideIconNode[],
};

export type ButtonIconSize = 'sm' | 'md' | 'lg';

/**
 * SVG de ícone para dentro de um NdsButton.
 *
 * Seletor `svg[ndsButtonIcon]`: o host é o próprio `<svg>`, então o CSS
 * `.nds-button-icon-svg` dimensiona o elemento real e não sobra wrapper.
 *
 * Os filhos são criados por `createElementNS` num `effect`, não pelo template:
 * cada ícone do lucide é uma lista `[tag, attrs]` com tag variável
 * (`path`/`circle`/`line`/`rect`), e template Angular exige tag estática.
 * Construir nós é imune a XSS — não há `innerHTML` no caminho.
 */
@Component({
  selector: 'svg[ndsButtonIcon]',
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
    '[attr.class]': 'svgClass()',
  },
})
export class NdsButtonIcon {
  readonly kind = input.required<ButtonIconKind>();
  readonly size = input<ButtonIconSize>('md');
  readonly spin = input<boolean>(false);
  readonly class = input<string>('');

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  protected readonly svgClass = computed(() =>
    cn(
      'nds-button-icon-svg',
      `nds-button-icon-svg-${this.size()}`,
      this.spin() && 'nds-spin',
      this.class(),
    ),
  );

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of BUTTON_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}
