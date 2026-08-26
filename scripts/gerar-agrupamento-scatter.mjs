#!/usr/bin/env node
/**
 * Gera, UMA VEZ, o agrupamento do exemplo de dispersão do Chart.
 *
 * ─── Por que isto é um script, e não código do componente ────────────────────
 *
 * O agrupamento sai de um k-means (`echarts-stat`), e k-means SORTEIA o início.
 * Medido nesta máquina, contra o `hierarchicalKMeans` da versão 1.2.0:
 *
 *   partição idêntica entre rodadas · 92 a 98 em cada 100
 *   rótulo (qual grupo recebe qual índice) · 4 em cada 100
 *
 * Rodando no momento de pintar, isso significaria de duas a oito rodadas em
 * cem desenhando um agrupamento diferente: o Chromatic acusaria diferença
 * sozinho, a play function pareceria intermitente, e — o pior — a tabela
 * equivalente descreveria um agrupamento que não é o da tela, porque ela nasce
 * de uma função PURA e a lib teria agrupado por conta própria.
 *
 * Rodando aqui, uma vez, o resultado é dado versionado: a tabela e o desenho
 * saem da mesma conta, cada grupo vira série de verdade — com forma, nome e
 * legenda —, e as cinco stacks não carregam um algoritmo de estatística no
 * pacote que entregam.
 *
 * `echarts-stat` é devDependency DA RAIZ por isso. Ele não entra em stack
 * nenhuma.
 *
 * ─── Rodar ───────────────────────────────────────────────────────────────────
 *
 *   node scripts/gerar-agrupamento-scatter.mjs           # confere e não escreve
 *   node scripts/gerar-agrupamento-scatter.mjs --write   # regrava o módulo
 *
 * Sem `--write` ele apenas COMPARA o que geraria com o que está versionado, e
 * sai com código 1 se divergirem — serve de portão barato contra edição à mão
 * do arquivo gerado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ecStat = require('echarts-stat');

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'docs/shared/primitives/chart-scatter-clusters.ts');

const GRUPOS = 3;
const POR_GRUPO = 8;

/**
 * Sorteio determinístico (congruência linear), para o DADO DE ENTRADA ser
 * sempre o mesmo.
 *
 * `Math.random` daria uma nuvem diferente a cada regeneração, e aí o portão de
 * conferência acima acusaria diferença toda vez sem nada ter mudado.
 */
function sorteio(semente) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

/**
 * A nuvem de entrada: sessões de leitura, por minutos na página e páginas
 * vistas.
 *
 * Os três centros são plantados de propósito e razoavelmente separados — o
 * exemplo existe para mostrar o TIPO de gráfico, não para exercitar o pior caso
 * do algoritmo. Nuvens que se tocam produziriam um agrupamento discutível, e
 * uma documentação não é lugar de discutir k-means.
 */
function nuvem() {
  const rnd = sorteio(20260826);
  const centros = [
    [2.5, 1.8],
    [7.5, 4.5],
    [14, 2.6],
  ];
  const pontos = [];
  for (const [cx, cy] of centros) {
    for (let i = 0; i < POR_GRUPO; i++) {
      pontos.push([
        Number((cx + (rnd() - 0.5) * 3.2).toFixed(1)),
        Number((cy + (rnd() - 0.5) * 1.9).toFixed(1)),
      ]);
    }
  }
  return pontos;
}

function agrupar(pontos) {
  const { pointsInCluster, centroids } = ecStat.clustering.hierarchicalKMeans(
    pontos,
    GRUPOS,
    false,
  );

  // ORDEM CANÔNICA. O k-means devolve os grupos numa ordem que muda a cada
  // rodada — foi o que mediu 4 em 100 —, e sem fixá-la o "Grupo 1" trocaria de
  // lugar, junto com a cor e a forma dele. Ordenar pelo centro no eixo x deixa
  // a numeração seguindo a leitura, da esquerda para a direita.
  const ordenados = centroids
    .map((centro, i) => ({ centro, pontos: pointsInCluster[i] }))
    .sort((a, b) => a.centro[0] - b.centro[0] || a.centro[1] - b.centro[1]);

  return ordenados.map((g, i) => ({
    name: `Grupo ${i + 1}`,
    centroid: g.centro.map((n) => Number(n.toFixed(2))),
    // Dentro do grupo a ordem também é fixada, pelo mesmo motivo.
    points: g.pontos
      .map((p) => [p[0], p[1]])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]),
  }));
}

function conferir(pontos, grupos) {
  const total = grupos.reduce((n, g) => n + g.points.length, 0);
  if (total !== pontos.length) {
    throw new Error(`o agrupamento perdeu ponto: ${total} de ${pontos.length}`);
  }
  if (grupos.some((g) => g.points.length === 0)) {
    throw new Error('algum grupo saiu vazio');
  }
  // Cada ponto de entrada tem de aparecer exatamente uma vez na saída.
  const entrada = pontos.map((p) => p.join(',')).sort();
  const saida = grupos.flatMap((g) => g.points.map((p) => p.join(','))).sort();
  if (entrada.join(' | ') !== saida.join(' | ')) {
    throw new Error('o conjunto de pontos da saída não é o da entrada');
  }
}

function modulo(grupos) {
  const corpo = grupos
    .map(
      (g) =>
        `  {\n` +
        `    name: '${g.name}',\n` +
        `    centroid: [${g.centroid.join(', ')}],\n` +
        `    points: [\n` +
        g.points.map((p) => `      [${p[0]}, ${p[1]}],`).join('\n') +
        `\n    ],\n` +
        `  },`,
    )
    .join('\n');

  return `// ARQUIVO GERADO — não edite à mão.
//
// Fonte: \`scripts/gerar-agrupamento-scatter.mjs\`. Para regravar:
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
  /** Os pontos, em pares \`[x, y]\`. */
  points: [number, number][];
}

export const CHART_SCATTER_CLUSTERS: ChartScatterCluster[] = [
${corpo}
];

/** Todos os pontos, sem grupo — a nuvem que entrou no algoritmo. */
export const CHART_SCATTER_POINTS: [number, number][] =
  CHART_SCATTER_CLUSTERS.flatMap((c) => c.points);
`;
}

const pontos = nuvem();
const grupos = agrupar(pontos);
conferir(pontos, grupos);
const gerado = modulo(grupos);

const escrever = process.argv.includes('--write');
const atual = fs.existsSync(DESTINO) ? fs.readFileSync(DESTINO, 'utf8') : null;

if (escrever) {
  fs.writeFileSync(DESTINO, gerado);
  console.log(
    `escrito ${path.relative(RAIZ, DESTINO)} — ${grupos.length} grupos, ` +
      `${grupos.map((g) => g.points.length).join('/')} pontos`,
  );
} else if (atual === null) {
  console.error(`${path.relative(RAIZ, DESTINO)} não existe — rode com --write`);
  process.exit(1);
} else if (atual !== gerado) {
  console.error(
    `${path.relative(RAIZ, DESTINO)} DIVERGE do que este script geraria.\n` +
      'Ou alguém editou o arquivo gerado à mão, ou o gerador mudou. ' +
      'Rode com --write para regravar.',
  );
  process.exit(1);
} else {
  console.log(
    `ok — ${path.relative(RAIZ, DESTINO)} é exatamente o que o gerador produz ` +
      `(${grupos.length} grupos, ${grupos.map((g) => g.points.length).join('/')} pontos)`,
  );
}
