// Utilitários de medição do Chart, compartilhados pelos arquivos de story.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: uma
// função auxiliar exportada apareceria na barra lateral do Storybook como se
// fosse um exemplo do componente.

/**
 * O elemento em que a lib desenha.
 *
 * É ele — e não o bloco `.nds-chart` em volta — que leva `role="img"` e o
 * rótulo. O papel PODA a subárvore da árvore de acessibilidade: no bloco, ele
 * podaria também a tabela de dados, e a alternativa textual sumiria. Medir o
 * papel no bloco, portanto, seria medir o contrato errado.
 *
 * Serve também de recorte para qualquer sonda de TEXTO do desenho: a tabela
 * escreve os mesmos números, e uma busca no bloco inteiro passaria mesmo com o
 * desenho mudo — portão sem dentes.
 */
export function drawingOf(root: HTMLElement): HTMLElement {
  const drawing = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!drawing) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  return drawing;
}

/** O bloco da alternativa textual — `.nds-sr-only` ou `.nds-table-wrapper`. */
export function dataOf(root: HTMLElement): HTMLElement {
  const data = root.querySelector<HTMLElement>('[data-slot="chart-data"]');
  if (!data) throw new Error('nenhum [data-slot="chart-data"] dentro do .nds-chart');
  return data;
}
