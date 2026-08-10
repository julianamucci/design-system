import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
      inputs: ['pressed', 'disabled', 'value'],
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

  protected readonly estado = computed(() => (this.raiz.pressed() ? 'on' : 'off'));
}
