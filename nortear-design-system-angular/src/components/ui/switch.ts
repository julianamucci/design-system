import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
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
//
// `id` ENTRA na lista de inputs do host directive. Não é adorno: o
// `RdxSwitchRoot` liga `[id]="id()"` no host e o valor default é um id gerado
// (`rdx-switch-N`). Sem repassar, um `id="notificacoes"` escrito no elemento é
// sobrescrito na primeira detecção de mudanças e o `<label for>` deixa de
// alcançar o controle — em silêncio, porque o rótulo continua na tela. Mesma
// regra do `invalid` no Checkbox: quem compõe não é dono do atributo que o
// primitivo liga.

export type SwitchSize = 'default' | 'sm';

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
      inputs: [
        'id',
        'checked',
        'defaultChecked',
        'disabled',
        'required',
        'readonly',
        'invalid',
        'name',
        'form',
        'value',
      ],
      outputs: ['checkedChange'],
    },
  ],
  host: {
    class: 'nds-switch',
    type: 'button',
    '[attr.data-slot]': '"switch"',
    '[attr.data-state]': 'estado()',
    '[attr.data-size]': 'size()',
  },
})
export class NdsSwitch {
  /**
   * Degrau de tamanho. Vira `data-size`, que é onde o CSS compartilhado guarda
   * a medida do trilho e do knob — peça sem texto tem medida explícita
   * (guideline 12), e ela mora no CSS, não aqui.
   */
  readonly size = input<SwitchSize>('default');

  private readonly raiz = inject(RdxSwitchRoot, { self: true });

  /**
   * Espelha o estado do primitivo para o `data-state` das outras stacks.
   *
   * Lê `checkedState`, e não o model `checked`: é `checkedState` que alimenta
   * o `aria-checked` do primitivo. Ler o model deixaria os dois atributos
   * podendo divergir — e o que a tela mostra sairia do que o leitor anuncia.
   */
  protected readonly estado = computed(() =>
    this.raiz.checkedState() ? 'checked' : 'unchecked',
  );
}
