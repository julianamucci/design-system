/**
 * Andaime de leitura do Tooltip — um helper, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As quatro cópias eram idênticas — o que é justamente o risco: o caminho até o
 * balão é o CONTRATO de acessibilidade do componente, e trocá-lo numa cópia
 * (por um `data-slot`, por um papel) deixaria os outros três arquivos provando
 * um contrato que o componente não cumpre mais. Só `tooltip.stories.ts`
 * carregava a explicação; ela veio junto.
 */

/**
 * O balão de um gatilho.
 *
 * Ele vive num portal no `body`, fora do `canvasElement`, e o caminho até ele é
 * o `aria-describedby` — o mesmo elo que o leitor de tela percorre. Procurar
 * pelo markup acharia o balão mesmo com a descrição desligada; por aqui, um
 * balão sem elo não é encontrado, que é o resultado certo.
 */
export function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}
