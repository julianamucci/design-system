import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  RdxCheckboxRootDirective,
  RdxCheckboxButtonDirective,
} from '@radix-ng/primitives/checkbox';

// ─── Checkbox ─────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-checkbox e .nds-checkbox-indicator.
//
// COM `RdxCheckbox*`, ao contrário de input/label/separator. Aqui o primitivo
// entrega o que eu reimplementaria pior: estado tri-valorado (checked,
// unchecked, indeterminate), `aria-checked="mixed"`, ativação por Space, o
// input nativo escondido para participação em formulário, e o `aria-controls`
// ligando o botão ao input.
//
// O Vanilla resolve o mesmo problema com um <div role="checkbox"> + input
// irmão, justamente para evitar `nested-interactive`. O primitivo já nasce com
// `button[rdxCheckboxButton]`, que é elemento interativo de verdade — então o
// markup fica mais simples E mais correto.
//
// Desabilitado: nada a fazer aqui, e isso é um resultado, não uma omissão. O
// `RdxCheckboxButton` já escreve `aria-disabled="true"` sem escrever o `disabled`
// nativo, então a caixa continua na ordem de tabulação, e ele guarda a ativação
// no próprio `clicked()` (`if (… rootContext.disabled() …) return`). É o
// comportamento que a dona decidiu para as cinco, e esta stack já o cumpria: a
// sonda mediu Tab alcançando a caixa desabilitada só aqui.
//
// `data-state` além do que o primitivo emite: o Radix NG usa `data-checked` /
// `data-unchecked` (convenção do Base UI) e as outras quatro stacks emitem
// `data-state="checked|unchecked"`. O CSS compartilhado aceita os dois, mas a
// paridade de markup é o que a auditoria cross-stack compara — então emitimos
// os dois de propósito.
//
// SEM `RdxCheckboxIndicator`, e isso é medido. O seletor real da diretiva é
// `[rdxCheckboxIndicator]`; o indicador aqui trazia `ndsCheckboxIndicator`, que
// não casa com diretiva nenhuma — nem da lib, nem nossa. Import e atributo
// estavam mortos juntos, e o `ngc` acusava NG8113.
//
// O que a diretiva entregaria: os atributos `data-checked` / `data-unchecked` /
// `data-indeterminate` no indicador, `style.pointer-events: none`, e o
// `keepMounted` — manter o indicador no DOM quando desmarcado para uma animação
// de SAÍDA em CSS. Ligá-la não acrescenta nada:
//
//   · a visibilidade já é decidida aqui pelo `@if (checked() || indeterminate())`;
//   · `docs/shared/styles/nds/checkbox.css` NÃO tem regra de saída — a única
//     animação é `nds-indicator-pop`, de ENTRADA, disparada na montagem do svg;
//     não há `data-ending-style`, `nds-animate-out` nem transição de opacidade
//     no indicador (o vocabulário `data-ending-style` existe na folha, mas só
//     nas famílias de overlay: alert-dialog, popover, sheet, accordion…);
//   · o estado do indicador já sai em `data-state`, que é o que as outras
//     quatro stacks emitem e o que a folha compartilhada lê.
//
// Ou seja, ligar acrescentaria markup e estilo inline sem efeito, e ainda
// afastaria o DOM do Vanilla, que é a referência. Se um dia a folha ganhar
// animação de saída no indicador, o caminho é `[rdxCheckboxIndicator]
// keepMounted` — não o atributo inerte que estava aqui.

@Component({
  selector: 'button[ndsCheckbox]',
  standalone: true,
  template: `
    <span
      class="nds-checkbox-indicator"
      data-slot="checkbox-indicator"
      [attr.data-state]="state()"
    >
      @if (checked() || indeterminate()) {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          @if (indeterminate()) {
            <line x1="5" y1="12" x2="19" y2="12" />
          } @else {
            <polyline points="20 6 9 20 4 15" />
          }
        </svg>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxCheckboxRootDirective,
      // `invalid` entra na lista porque o RdxCheckboxButton é DONO de
      // `aria-invalid`: ele liga o atributo a `displayValid()` e apaga um
      // aria-invalid estático escrito no elemento. Quem compõe tem que passar
      // pelo input do primitivo, não pelo atributo.
      inputs: ['checked', 'indeterminate', 'disabled', 'required', 'invalid', 'name', 'value'],
      outputs: ['checkedChange', 'indeterminateChange'],
    },
    RdxCheckboxButtonDirective,
  ],
  host: {
    class: 'nds-checkbox',
    type: 'button',
    '[attr.data-slot]': '"checkbox"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsCheckbox {
  private readonly root = inject(RdxCheckboxRootDirective, { self: true });

  /** Espelha o estado do primitivo para o `data-state` das outras stacks. */
  protected readonly checked = computed(() => this.root.checked());
  protected readonly indeterminate = computed(() => this.root.indeterminate());

  protected readonly state = computed(() =>
    this.indeterminate() ? 'indeterminate' : this.checked() ? 'checked' : 'unchecked',
  );
}
