// Medição de proporção compartilhada pelas stories do Resizable.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado vira story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Eram DUAS cópias com o mesmo nome e corpos diferentes: a do arquivo principal
// recebia a direção, a de estados media largura direto. A divergência tinha
// motivo — todas as stories daquele arquivo são horizontais —, e é por isso que
// o eixo vira PARÂMETRO COM PADRÃO em vez de uma segunda função: o arquivo que
// precisa de menos continua chamando com um argumento, e o arquivo que oferece
// `direction` como control passa a direção que o arg trouxe.

/**
 * Fração do grupo ocupada pelo primeiro painel, de 0 a 1.
 *
 * Geometria real; `style.width` não decide nada num item de `flex-basis: 0` —
 * quem manda no tamanho é o cálculo do flex, e é a caixa renderizada que a
 * story afirma. A fração (e não o pixel) é o que permite comparar com o
 * `aria-valuenow`, que o separator publica em porcentagem.
 *
 * @param horizontal Eixo do grupo. O padrão é `true` porque um grupo horizontal
 * divide LARGURA, que é o arranjo de toda story que não oferece `direction`.
 * Com `false` a mesma conta roda sobre a altura.
 */
export function firstFraction(canvasElement: HTMLElement, horizontal = true): number {
  const panels = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const measurements = panels.map((p) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height,
  );
  return measurements[0] / measurements.reduce((a, b) => a + b, 0);
}
