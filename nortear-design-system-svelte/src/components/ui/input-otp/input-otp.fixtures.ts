// Fixture compartilhada pelas quatro stories do InputOTP.
//
// Existiam QUATRO cópias de `campo` — uma por arquivo de story. Elas já tinham
// começado a divergir: a de estados precisou trocar `Error` por
// `globalThis.Error` e as outras três ficaram para trás, então o mesmo helper
// falhava de jeitos diferentes conforme o arquivo. Um construtor só, aqui.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story: um
// helper exportado apareceria na sidebar como se fosse um exemplo.

/**
 * O `<input>` REAL do OTP — único, recortado atrás das caixas.
 *
 * Conferir só o valor dele deixaria a story verde mesmo com ZERO caixas
 * pintadas — foi assim que o defeito equivalente sobreviveu noutra stack. Toda
 * asserção olha as CAIXAS (`[data-slot="input-otp-slot"]`); o input só recebe a
 * digitação, o foco e a colagem.
 *
 * Aqui o `Error` é o global de verdade. Dentro de `input-otp-estados.stories.ts`
 * ele não era: aquele arquivo exporta uma story chamada `Error` — o estado de
 * erro do componente —, e o nome dela sombreava o construtor no escopo do
 * módulo, obrigando aquela cópia a escrever `globalThis.Error`. Fora do arquivo
 * de story o sombreamento não existe, e a gambiarra sai junto.
 */
export function campo(raiz: HTMLElement): HTMLInputElement {
  const el = raiz.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]');
  if (!el) throw new Error('input do OTP não encontrado');
  return el;
}
