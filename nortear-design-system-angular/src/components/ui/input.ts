import { Directive } from '@angular/core';

// ─── Input ────────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-input (docs/shared/styles/nds/input.css).
//
// Sem inputs próprios. `type`, `placeholder`, `disabled`, `id`, `name`, `value`
// e todo o resto já são atributos nativos do <input>; recriá-los como signal
// input só reimplementaria HTML e brigaria com `formControlName`.
//
// SEM `RdxInputDirective`, apesar de ele ser o primitivo mais rico deste
// pacote. Ele é um controlador de CAMPO, não um input estilizado: emite
// `aria-invalid`, `aria-required`, `aria-disabled` e `aria-describedby`, e
// escuta focus/blur/input/change para manter estado próprio de touched, dirty,
// pending e errors — a abstração que no Radix NG se chama Field.
//
// Duas razões para não compor:
//   1. Nenhuma das outras quatro stacks emite esses atributos. O Input do design
//      system é um <input> estilizado; a validação é responsabilidade do Form.
//   2. O estado de formulário no Angular já vem de Reactive Forms. Ter um
//      segundo modelo de touched/dirty ao lado do `formControlName` daria dois
//      donos para a mesma informação — e é o `formControlName` que quem escreve
//      Angular espera encontrar aqui.
//
// Se o design system decidir adotar a semântica de Field, ela entra nas cinco
// stacks de uma vez, no componente Form.

@Directive({
  selector: 'input[ndsInput]',
  standalone: true,
  host: {
    class: 'nds-input',
    '[attr.data-slot]': '"input"',
  },
})
export class NdsInput {}
