// Fixture compartilhada pelas stories do InputOTP.
//
// Fica fora dos `*.stories.tsx` porque no CSF todo export nomeado é lido como
// story: um helper exportado de um arquivo de story apareceria na sidebar como
// se fosse um exemplo.
//
// O `<input>` da lib é único e fica recortado atrás das caixas. Buscá-lo pelo
// papel não serve — ele não é o que a pessoa vê —, e é justamente por conferir
// só o valor dele que uma play pode ficar verde com ZERO caixas pintadas. Toda
// asserção olha as CAIXAS (`[data-slot="input-otp-slot"]`); o input só recebe a
// digitação.

/** O campo escondido que recebe a digitação, achado pelo contrato de markup. */
export function field(canvasElement: HTMLElement): HTMLInputElement {
  const el = canvasElement.querySelector<HTMLInputElement>(
    'input[autocomplete="one-time-code"]'
  );
  // `globalThis.Error`, e não `Error`: `input-otp-estados.stories.tsx` exporta
  // uma story chamada `Error` — o estado de erro do componente —, e o nome dela
  // sombreava o construtor global quando esta função morava lá dentro. Escrito
  // `new Error(...)`, o TypeScript acusava "expression is not constructable" e
  // em runtime a linha só quebraria no dia em que o campo faltasse, que é
  // justamente o dia em que ela precisa falar. Aqui fora não há sombra, mas a
  // forma imune é a que fica: a função não depende de quem a importa.
  if (!el) throw new globalThis.Error("input do OTP não encontrado");
  return el;
}
