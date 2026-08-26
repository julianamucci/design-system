// ARQUIVO GERADO — não edite à mão.
//
// Fonte: `scripts/gerar-agrupamento-scatter.mjs`. Para regravar:
//
//   node scripts/gerar-agrupamento-scatter.mjs --write
//
// Sem argumento, o mesmo script CONFERE que este arquivo é o que ele geraria e
// reprova se alguém o editou à mão.
//
// ─── Por que o agrupamento vem pronto ────────────────────────────────────────
//
// Os grupos saem de um k-means, e k-means sorteia o início: medido, a partição
// se repete de 92 a 98 vezes em 100, e a numeração dos grupos, 4 em 100. Rodado
// no momento de pintar, o desenho mudaria sozinho entre rodadas — o Chromatic
// acusaria diferença sem ninguém ter mexido, e a tabela equivalente, que nasce
// de função pura, descreveria um agrupamento diferente do que está na tela.
//
// Vindo pronto, os dois saem da mesma conta, e as cinco stacks não carregam um
// algoritmo de estatística no pacote que entregam.
//
// O dado de entrada são sessões de leitura: minutos na página (x) por páginas
// vistas (y). Cada grupo é um comportamento que o algoritmo separou.

/** Um grupo do agrupamento: o nome, o centro e os pontos que caíram nele. */
export interface ChartScatterCluster {
  name: string;
  /** O centro que o k-means calculou — o que ORDENA os grupos, da esquerda para a direita. */
  centroid: number[];
  /** Os pontos, em pares `[x, y]`. */
  points: [number, number][];
}

export const CHART_SCATTER_CLUSTERS: ChartScatterCluster[] = [
  {
    name: 'Grupo 1',
    centroid: [2.16, 1.91],
    points: [
      [1.3, 2.3],
      [1.5, 1.1],
      [1.6, 2.7],
      [1.8, 1.6],
      [1.9, 1.8],
      [2.1, 1.8],
      [3, 1.6],
      [4.1, 2.4],
    ],
  },
  {
    name: 'Grupo 2',
    centroid: [8.01, 4.31],
    points: [
      [6.4, 4.8],
      [7, 4.1],
      [7.7, 3.9],
      [8, 4.8],
      [8.5, 3.9],
      [8.5, 5.1],
      [9, 3.8],
      [9, 4.1],
    ],
  },
  {
    name: 'Grupo 3',
    centroid: [13.8, 2.5],
    points: [
      [12.5, 2.6],
      [12.7, 2.4],
      [13, 3],
      [13.4, 2.7],
      [14.3, 2.5],
      [14.6, 2.3],
      [14.9, 1.9],
      [15, 2.6],
    ],
  },
];

/** Todos os pontos, sem grupo — a nuvem que entrou no algoritmo. */
export const CHART_SCATTER_POINTS: [number, number][] =
  CHART_SCATTER_CLUSTERS.flatMap((c) => c.points);
