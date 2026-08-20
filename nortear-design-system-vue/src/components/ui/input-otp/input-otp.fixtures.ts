// Acesso ao campo real, compartilhado pelas stories do InputOTP.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado vira story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Eram TRÊS cópias, e a divergência entre elas era só a mensagem de erro e o
// construtor usado — mesma árvore consultada, mesma promessa. O custo estava em
// outro lugar: a explicação de POR QUE olhar as caixas em vez do valor do input
// morava numa cópia só, e as outras duas pareciam simples demais para merecer
// cuidado.

/**
 * O `<input>` único da lib, recortado atrás das caixas.
 *
 * Conferir só o valor dele foi exatamente o que deixou uma story verde enquanto
 * o campo montava com ZERO caixas: `:max-length` caía em `$attrs` e a lista de
 * slots chegava vazia. Este helper serve para DIGITAR e para conferir foco; o
 * que a asserção olha depois é sempre a fileira de caixas.
 *
 * `globalThis.Error`, e não `Error`: um dos arquivos de story exporta uma story
 * chamada `Error` — o estado de erro do componente —, e o nome dela sombreia o
 * construtor global no escopo do módulo. Escrito `new Error(...)` lá, o
 * TypeScript acusava "expression is not constructable". Aqui não há sombra
 * nenhuma, mas a forma que não pode ser sombreada é a que continua certa se
 * este módulo um dia ganhar um export com esse nome.
 */
export function campo(raiz: HTMLElement): HTMLInputElement {
  const el = raiz.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]');
  if (!el) throw new globalThis.Error('input do OTP não encontrado');
  return el;
}
