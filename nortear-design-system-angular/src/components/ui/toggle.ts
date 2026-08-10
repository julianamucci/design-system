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
import { RdxToggle } from '@radix-ng/primitives/toggle';

// ─── Toggle ───────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-toggle, com variante e tamanho por data-attribute.
//
// COM `RdxToggle`: ele entrega `aria-pressed`, a alternância por clique e
// teclado, e o estado desabilitado. Variante e tamanho continuam sendo do
// design system — o primitivo não conhece aparência.
//
// `data-state="on|off"` além do `data-pressed` do primitivo: é o que as outras
// quatro stacks emitem e o que o CSS compartilhado também aceita.

export type ToggleVariant = 'default' | 'outline';
export type ToggleSize = 'default' | 'sm' | 'lg';

@Component({
  selector: 'button[ndsToggle]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxToggle,
      inputs: ['pressed', 'defaultPressed', 'disabled', 'value'],
      outputs: ['pressedChange'],
    },
  ],
  host: {
    class: 'nds-toggle',
    '[attr.data-slot]': '"toggle"',
    '[attr.data-state]': 'estado()',
    // `default` não vira atributo: o CSS trata a ausência como padrão, e emitir
    // `data-variant="default"` divergiria do Vanilla, que também o omite.
    '[attr.data-variant]': 'variant() === "default" ? null : variant()',
    '[attr.data-size]': 'size() === "default" ? null : size()',
  },
})
export class NdsToggle {
  readonly variant = input<ToggleVariant>('default');
  readonly size = input<ToggleSize>('default');

  private readonly raiz = inject(RdxToggle, { self: true });

  // `pressedState()` e não `pressed()`: `pressed` é um `model` que nasce
  // `undefined` e só é escrito no primeiro clique. Lendo `pressed()`, um toggle
  // que começa ligado por `defaultPressed` sairia com `aria-pressed="true"` e
  // `data-state="off"` — o CSS pintaria o estado errado e nada acusaria, porque
  // o atributo ARIA (que os testes olham) estaria certo. `pressedState` é o
  // mesmo signal que o primitivo usa para emitir `aria-pressed`.
  protected readonly estado = computed(() => (this.raiz.pressedState() ? 'on' : 'off'));
}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Mesmo desenho do `NdsButtonIcon`: o host é o próprio `<svg>`, então o CSS
// `.nds-toggle > svg` dimensiona o elemento real e não sobra wrapper. Nenhuma
// classe é declarada aqui — a medida do ícone já vive na regra do toggle.
//
// Os filhos nascem de `createElementNS` num `effect` porque cada ícone do
// lucide é uma lista `[tag, attrs]` com tag variável (`path`/`line`/`circle`),
// e template Angular exige tag estática. Construir nós é imune a XSS: não há
// `innerHTML` no caminho.

import { Bold, Italic, Underline, List, Eye } from 'lucide';

export type ToggleIconKind = 'bold' | 'italic' | 'underline' | 'list' | 'eye';

type LucideIconNode = [string, Record<string, string>];

const TOGGLE_ICON_MAP: Record<ToggleIconKind, LucideIconNode[]> = {
  bold:      Bold      as unknown as LucideIconNode[],
  italic:    Italic    as unknown as LucideIconNode[],
  underline: Underline as unknown as LucideIconNode[],
  list:      List      as unknown as LucideIconNode[],
  eye:       Eye       as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsToggleIcon]',
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
    // O ícone reforça o rótulo, nunca o substitui: quem compõe dá o nome
    // acessível no `aria-label` do botão (icon-only) ou no texto visível.
    'aria-hidden': 'true',
  },
})
export class NdsToggleIcon {
  readonly kind = input.required<ToggleIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of TOGGLE_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}
