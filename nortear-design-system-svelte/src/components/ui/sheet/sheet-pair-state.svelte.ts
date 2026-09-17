/**
 * O estado do SEGUNDO painel da story `SecondPanelClosesFirst`, num módulo.
 *
 * Existe para a `play` poder abrir o painel por ESTADO, sem clicar em nada — e
 * isso não é preferência de escrita, é a única forma de exercitar a modalidade
 * com uma lib no meio:
 *
 *  · enquanto um painel modal está aberto, a lib deixa `pointer-events: none` no
 *    `body`, e o `userEvent` recusa o clique no gatilho do outro;
 *  · e se o clique fosse forçado, ele seria um ponteiro FORA do primeiro painel
 *    — a lib o dispensaria como clique fora, e o fechamento sairia `overlay`.
 *    O que esta story mede é o contrário disso: o painel recolhido pela
 *    modalidade do componente, que relata `api`.
 *
 * Mora num `.svelte.ts` porque o arquivo de story é TS puro e não compila runas;
 * é o mesmo desenho do `ref` de módulo que a stack irmã usa.
 */
export const secondPanelState = $state({ open: false });
