import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { RdxSwitchRoot } from '@radix-ng/primitives/switch';

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
//
// SEM `RdxSwitchThumb`, pelo mesmo diagnóstico do Checkbox e com uma diferença
// medida. O seletor real é `span[rdxSwitchThumb]`; o knob trazia
// `ndsSwitchThumb`, que não casa com diretiva nenhuma — import e atributo
// mortos juntos, NG8113 no `ngc`.
//
// A diretiva NÃO tem `keepMounted`, e nem precisaria: o knob nunca sai do DOM.
// Tudo o que ela faria é escrever `data-checked` / `data-unchecked` /
// `data-disabled` / `data-readonly` / `data-required` no knob. E o movimento
// não depende disso: `docs/shared/styles/nds/switch.css` desloca por
// `.nds-switch-thumb[data-state="checked"]` (e aceita `[data-checked]` como
// alternativa), e o `data-state` já é escrito aqui. A folha também não tem
// animação de saída — o que existe é `transition: transform`, que roda nos dois
// sentidos num nó que sempre esteve montado.
//
// O markup de referência está documentado no topo da própria folha:
// `<span class="nds-switch-thumb" data-state="unchecked">`. É exatamente o que
// sai daqui; ligar a diretiva afastaria o DOM do Vanilla para ganhar nada.

export type SwitchSize = 'default' | 'sm';

@Component({
  selector: 'button[ndsSwitch]',
  standalone: true,
  template: `
    <span
      class="nds-switch-thumb"
      data-slot="switch-thumb"
      [attr.data-state]="state()"
    ></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
    '[attr.data-state]': 'state()',
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

  private readonly root = inject(RdxSwitchRoot, { self: true });

  /**
   * Espelha o estado do primitivo para o `data-state` das outras stacks.
   *
   * Lê `checkedState`, e não o model `checked`: é `checkedState` que alimenta
   * o `aria-checked` do primitivo. Ler o model deixaria os dois atributos
   * podendo divergir — e o que a tela mostra sairia do que o leitor anuncia.
   */
  protected readonly state = computed(() =>
    this.root.checkedState() ? 'checked' : 'unchecked',
  );
}
