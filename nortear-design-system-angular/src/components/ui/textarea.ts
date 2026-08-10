import { Directive } from '@angular/core';

// ─── Textarea ─────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-textarea (docs/shared/styles/nds/textarea.css).
//
// Mesma decisão do Input, e pelo mesmo motivo: sem inputs próprios, porque
// `rows`, `placeholder`, `maxlength`, `disabled` e `readonly` já são atributos
// nativos do <textarea>, e o estado de formulário vem de Reactive Forms.
//
// O Radix NG não tem primitivo de textarea — o `RdxInputDirective` cobre
// `input` e `textarea` juntos, e é a abstração de Field que o Input recusa.

@Directive({
  selector: 'textarea[ndsTextarea]',
  standalone: true,
  host: {
    class: 'nds-textarea',
    '[attr.data-slot]': '"textarea"',
  },
})
export class NdsTextarea {}
