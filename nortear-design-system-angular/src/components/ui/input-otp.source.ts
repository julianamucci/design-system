/**
 * Transform do painel Code do InputOTP.
 *
 * Módulo à parte porque a guarda `source-snippets.test.ts` só chama o que um
 * `*.source.ts` exporta — e é ela quem confere que o snippet importa só o que o
 * componente exporta de fato, e que nenhum andaime de story vaza para o texto
 * copiado.
 *
 * O snippet ensina o que o campo de código exige para ser acessível: um rótulo
 * visível ligado por `aria-labelledby`, o `maxLength` explícito, o valor em
 * signal com `[(value)]` e o `(complete)` que dispara quando o último dígito
 * entra.
 */
import type { InputOtpMode } from './input-otp';
export type InputOtpArgs = {
  maxLength: number;
  mode: InputOtpMode;
  disabled: boolean;
  invalid: boolean;
  label: string;
  onComplete: (code: string) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o binding de
 * arg e o rótulo de teste. Ver a armadilha 3 do CLAUDE.md deste stack.
 */
export function inputOtpPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<InputOtpArgs> } = {},
): string {
  const {
    maxLength = 6,
    mode = 'numeric',
    disabled = false,
    invalid = false,
    label = 'Código de verificação',
  } = ctx.args ?? {};

  const attrs = [
    `[maxLength]="${maxLength}"`,
    mode === 'alphanumeric' ? `mode="alphanumeric"` : '',
    disabled ? '[disabled]="true"' : '',
    invalid ? '[invalid]="true"' : '',
    'aria-labelledby="otp-label"',
    '[(value)]="codigo"',
    '(complete)="verificar($event)"',
  ].filter(Boolean).join('\n      ');

  return `import { Component, signal } from '@angular/core';
import { NdsInputOtp } from '@/components/ui/input-otp';

@Component({
  imports: [NdsInputOtp],
  template: \`
    <span id="otp-label" class="nds-text-label">${label}</span>
    <nds-input-otp
      ${attrs}
    ></nds-input-otp>
  \`,
})
export class Exemplo {
  readonly codigo = signal('');
  verificar(codigo: string): void {
    console.log(codigo);
  }
}`;
}
