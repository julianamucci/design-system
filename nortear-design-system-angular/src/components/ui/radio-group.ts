import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  RdxRadioGroupDirective,
  RdxRadioIndicatorDirective,
  RdxRadioItemDirective,
} from '@radix-ng/primitives/radio';

// ─── RadioGroup ───────────────────────────────────────────────────────────────
//
// Visual: classes .nds-radio-group, .nds-radio-row, .nds-radio-item e
// .nds-radio-indicator (docs/shared/styles/nds/radio-group.css).
//
// COM `RdxRadio*`. No Radix NG o primitivo se chama `radio`, não `radio-group`,
// e entrega exatamente o que eu reimplementaria pior:
//
//   · roving tabindex + navegação por setas (via `RdxCompositeRoot`), com a
//     seleção acompanhando o foco — é o padrão WAI-ARIA de radiogroup e é a
//     parte que o Vanilla precisa escrever à mão, tecla por tecla;
//   · `role="radiogroup"` / `role="radio"` e `aria-checked` em cada item;
//   · `type="button"` e o atributo `disabled` nativo, detectados a partir da
//     tag do host;
//   · participação em formulário: quando o grupo tem `name`, o primitivo
//     mantém um `<input type="hidden">` IRMÃO do host com o valor selecionado,
//     então `new FormData(form)` funciona sem nenhum input dentro dos itens;
//   · `ControlValueAccessor`, o que faz `formControlName` funcionar direto.
//
// O `RdxRadioItemInputDirective` (o `<input type="radio">` escondido DENTRO do
// item) ficou de fora de propósito: um input focável dentro de um elemento com
// `role="radio"` é exatamente o que a regra `nested-interactive` do axe proíbe,
// e o Vanilla já resolve o mesmo problema deixando o input fora do botão. Como
// o hidden input do grupo cobre o FormData, nada se perde.
//
// `data-state` além do que o primitivo emite: o Radix NG usa `data-checked` /
// `data-unchecked` (convenção do Base UI) e as outras quatro stacks emitem
// `data-state="checked|unchecked"`. O CSS compartilhado aceita os dois — o
// `[data-state="checked"]` é o seletor da animação do dot — e a paridade de
// markup é o que a auditoria cross-stack compara. Emitimos os dois de propósito.
//
// Sem input de orientação: o composite do Radix NG navega nas quatro setas
// (↑ ↓ ← →), que é o que a seção de acessibilidade do conteúdo descreve. A
// orientação aqui é LAYOUT, e layout é de quem compõe — envolva as linhas num
// `.nds-cluster` para a versão horizontal (ver `notes` na docs page).

@Directive({
  selector: 'fieldset[ndsRadioGroup], div[ndsRadioGroup]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxRadioGroupDirective,
      // `invalid` entra na lista porque o primitivo é DONO de `aria-invalid` no
      // host: ele liga o atributo a `displayValid()` e apaga um `aria-invalid`
      // estático escrito no elemento. Quem compõe passa pelo input, não pelo
      // atributo.
      inputs: [
        'value',
        'defaultValue',
        'name',
        'form',
        'disabled',
        'readOnly',
        'required',
        'invalid',
      ],
      outputs: ['valueChange', 'onValueChange'],
    },
  ],
  host: {
    class: 'nds-radio-group',
    '[attr.data-slot]': '"radio-group"',
  },
})
export class NdsRadioGroup {}

@Component({
  selector: 'button[ndsRadioGroupItem]',
  standalone: true,
  template: `
    <span
      rdxRadioIndicator
      class="nds-radio-indicator"
      data-slot="radio-group-indicator"
      [attr.data-state]="estado()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="6" />
      </svg>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxRadioIndicatorDirective],
  hostDirectives: [
    {
      directive: RdxRadioItemDirective,
      inputs: ['value', 'required', 'disabled', 'readOnly'],
    },
  ],
  host: {
    class: 'nds-radio-item',
    '[attr.data-slot]': '"radio-group-item"',
    '[attr.data-state]': 'estado()',
  },
})
export class NdsRadioGroupItem {
  private readonly item = inject(RdxRadioItemDirective, { self: true });

  /**
   * Espelha o estado do primitivo para o `data-state` das outras stacks.
   *
   * Quem esconde o dot quando desmarcado é o próprio `rdxRadioIndicator`, que
   * escreve `display: none` no style do span. É style inline — do PRIMITIVO,
   * não deste componente: quem compõe não é dono do que o primitivo liga.
   */
  protected readonly estado = computed(() => (this.item.checkedState() ? 'checked' : 'unchecked'));
}
