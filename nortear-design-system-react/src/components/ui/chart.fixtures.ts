import { expect, waitFor } from 'storybook/test';
import { getInstanceByDom } from 'echarts/core';
import { designPintado, exigirRoot } from '@shared/testing/chart-probe';

/**
 * Andaime de espera do Chart — um helper, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.tsx` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As quatro cópias eram idênticas, inclusive no `timeout` de 3000 — o que
 * variava era só o comentário: três traziam uma linha e `chart-variantes`
 * carregava a explicação inteira. Ela veio junto.
 */

/**
 * Espera o desenho existir e devolve a raiz do gráfico.
 *
 * É a precondição de qualquer medida, e cada story a repõe por conta própria —
 * o painel Interactions reexecuta a play no MESMO DOM.
 *
 * A raiz sai de `exigirRoot`, que procura pela classe do CSS compartilhado e
 * não pelo `data-slot`: é o que o design system define, e o mesmo seletor serve
 * nas cinco stacks.
 */
export async function designPronto(canvasElement: HTMLElement): Promise<HTMLElement> {
  const root = exigirRoot(canvasElement);
  await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
  return root;
}

/**
 * O elemento em que a lib desenha — o que leva o papel de imagem e o rótulo.
 *
 * O bloco `.nds-chart` NÃO os leva: `role="img"` poda a subárvore da árvore de
 * acessibilidade, e no bloco a tabela de dados ficaria escondida junto.
 */
export function drawingOf(chart: HTMLElement): HTMLElement {
  const drawing = chart.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!drawing) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  return drawing;
}

/** A alternativa textual: a tabela que o container emite sempre. */
export function dataOf(chart: HTMLElement): HTMLElement {
  const data = chart.querySelector<HTMLElement>('[data-slot="chart-data"]');
  if (!data) throw new Error('nenhum [data-slot="chart-data"] dentro do .nds-chart');
  return data;
}

/** Os textos do cabeçalho da tabela, na ordem das colunas. */
export function headerOf(chart: HTMLElement): string[] {
  return [...dataOf(chart).querySelectorAll('thead th')].map((th) => (th.textContent ?? '').trim());
}

/**
 * As linhas da tabela, célula a célula — o `th` de categoria incluído.
 *
 * A célula de categoria é `th scope="row"` e não `td`: é ela que nomeia a
 * linha para quem navega a tabela por leitor de tela. Lê `th, td` na ordem do
 * documento justamente para que uma troca por `td` apareça na comparação.
 */
export function rowsOf(chart: HTMLElement): string[][] {
  return [...dataOf(chart).querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('th, td')].map((cell) => (cell.textContent ?? '').trim()),
  );
}

/**
 * Option já resolvida pela lib, lida da instância montada no desenho.
 *
 * Serve para o que é decisão de configuração e não vira nó do DOM — símbolo de
 * ponto e desenho de traço por série. O que vira pixel continua sendo medido no
 * DOM: option verde com desenho errado é exatamente o portão sem dentes.
 */
export function optionOf(chart: HTMLElement): { series: Record<string, unknown>[] } {
  // A busca desce do elemento do desenho em vez de apontar direto para ele: o
  // wrapper desta stack cria a própria caixa antes de chamar a lib, e a
  // instância fica na caixa de dentro. Perguntar só pelo elemento de fora
  // devolveria `undefined` — e um `optionOf` que explode por procurar no lugar
  // errado desperdiça a story inteira.
  const drawing = drawingOf(chart);
  for (const candidate of [drawing, ...drawing.querySelectorAll<HTMLElement>('div')]) {
    const instance = getInstanceByDom(candidate);
    if (instance) return instance.getOption() as unknown as { series: Record<string, unknown>[] };
  }
  throw new Error('a lib não montou instância dentro do [data-slot="chart-canvas"]');
}
