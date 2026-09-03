/**
 * Dados que a story e a transform do painel Code do AspectRatio dividem.
 *
 * A proporção chega ao control como NÚMERO, e é assim que o componente a
 * recebe; o snippet, porém, precisa mostrar `16 / 9` e não `1.7777777777777777`.
 * A tabela abaixo é a ponte entre as duas leituras, e mora aqui — e não no
 * `.source.ts` — porque o `source-snippets.test.ts` cobra que todo export
 * daquele módulo seja construtor de snippet. Isto é dado, então tem casa
 * própria, como já fazem `chart.fixtures.ts` e `code-block.fixtures.ts`.
 */

/** Proporções com a expressão legível, para o snippet não mostrar 1.7777. */
export const RATIOS = [
  { value: 16 / 9, expr: '16 / 9' },
  { value: 4 / 3,  expr: '4 / 3'  },
  { value: 1,      expr: '1'      },
  { value: 3 / 4,  expr: '3 / 4'  },
  { value: 21 / 9, expr: '21 / 9' },
];
