import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { RdxSwitchRoot, RdxSwitchThumb } from '@radix-ng/primitives/switch';

// ─── Switch ───────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-switch e .nds-switch-thumb.
//
// COM `RdxSwitchRoot`: ele entrega `role="switch"`, `aria-checked`, ativação
// por Space e Enter, e a integração com formulário. O Vanilla reimplementa isso
// à mão porque não tem lib headless — aqui não precisa.
//
// `data-state` além do `data-checked` do primitivo, pela mesma razão do
// Checkbox: as outras quatro stacks emitem `data-state="checked|unchecked"` e o
// CSS compartilhado aceita ambos, mas o markup é o que a auditoria compara.

@Component({
  selector: 'button[ndsSwitch]',
  standalone: true,
  template: `
    <span
      ndsSwitchThumb
      class="nds-switch-thumb"
      data-slot="switch-thumb"
      [attr.data-state]="estado()"
    ></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxSwitchThumb],
  hostDirectives: [
    {
      directive: RdxSwitchRoot,
      inputs: ['checked', 'disabled', 'required', 'readonly', 'name', 'form'],
      outputs: ['checkedChange'],
    },
  ],
  host: {
    class: 'nds-switch',
    type: 'button',
    '[attr.data-slot]': '"switch"',
    '[attr.data-state]': 'estado()',
  },
})
export class NdsSwitch {
  private readonly raiz = inject(RdxSwitchRoot, { self: true });

  protected readonly estado = computed(() => (this.raiz.checked() ? 'checked' : 'unchecked'));
}
