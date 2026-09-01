/**
 * A conta do grafo de fluxo, em nó.
 *
 * Ela mora em `@shared/primitives/flow-graph-edges` justamente para poder ser
 * medida sem navegador: nada nela lê o DOM, e por isso as três decisões que
 * cinco stacks reescreveriam — deslocar para a origem, descartar aresta órfã,
 * desenhar a curva — se verificam aqui, uma vez, e não cinco vezes numa suíte
 * de navegador.
 */

import { describe, expect, it } from 'vitest';
import type { FlowEdge, FlowNode } from '@shared/primitives/chat-protocol';
import { resolveFlowGraph } from '@shared/primitives/flow-graph-edges';

function node(id: string, column: number, row: number): FlowNode {
  return { id, label: id.toUpperCase(), column, row, state: 'pending' };
}

describe('resolveFlowGraph', () => {
  it('sem nó nenhum não devolve grafo', () => {
    // Moldura vazia seria pior que nada: a camada que rola é parada de teclado,
    // e uma parada que leva a uma caixa vazia é ruído com nome.
    expect(resolveFlowGraph([], [])).toBeNull();
  });

  it('desloca o grafo inteiro para a origem', () => {
    // As coordenadas de `FlowNode` são RELATIVAS entre si. Um grafo declarado a
    // partir da coluna 3 não abre três colunas vazias à esquerda: ele encosta.
    const grafo = resolveFlowGraph([node('a', 3, 5), node('b', 4, 7)], [])!;

    expect(grafo.columns).toBe(2);
    expect(grafo.rows).toBe(3);
    expect(grafo.nodes[0].columnLine).toBe(1);
    expect(grafo.nodes[0].rowLine).toBe(1);
    expect(grafo.nodes[1].columnLine).toBe(2);
    expect(grafo.nodes[1].rowLine).toBe(3);
  });

  it('aceita coordenada negativa, porque a base da contagem não importa', () => {
    const grafo = resolveFlowGraph([node('a', -2, -1), node('b', 0, 0)], [])!;

    expect(grafo.columns).toBe(3);
    expect(grafo.nodes[0].columnLine).toBe(1);
    expect(grafo.nodes[1].columnLine).toBe(3);
  });

  it('a linha de grade sai contada a partir de um, e não de zero', () => {
    // `grid-column-start` conta a partir de um, e a conversão mora aqui porque
    // `calc()` dentro de número de linha de grade não é confiável: a folha lê a
    // propriedade personalizada como ela chega.
    const grafo = resolveFlowGraph([node('a', 0, 0)], [])!;

    expect(grafo.nodes[0].columnLine).toBe(1);
    expect(grafo.nodes[0].rowLine).toBe(1);
  });

  it('descarta a aresta que perdeu uma ponta, e não quebra', () => {
    // Ponta que falta não é erro: é o grafo mostrado pela metade, que é como se
    // revela um fluxo aos poucos — quem quer revelar passa MENOS nós.
    const edges: FlowEdge[] = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'fantasma' },
      { from: 'fantasma', to: 'a' },
    ];
    const grafo = resolveFlowGraph([node('a', 0, 0), node('b', 1, 0)], edges)!;

    expect(grafo.edges).toHaveLength(1);
    expect(grafo.edges[0]).toMatchObject({ from: 'a', to: 'b' });
  });

  it('descarta a aresta de um nó para ele mesmo', () => {
    // Não é relação — depender de si não diz nada sobre a ordem — e a curva
    // dela seria um ponto.
    const grafo = resolveFlowGraph([node('a', 0, 0)], [{ from: 'a', to: 'a' }])!;

    expect(grafo.edges).toEqual([]);
    expect(grafo.nodes[0].dependsOn).toEqual([]);
  });

  it('a leitura de um nó lista só as arestas que CHEGAM, na ordem declarada', () => {
    // Cada aresta é dita exatamente uma vez. Listar também as que saem
    // anunciaria cada ligação duas vezes sem acrescentar relação nenhuma.
    const nodes = [node('a', 0, 0), node('b', 0, 1), node('c', 1, 0)];
    const edges: FlowEdge[] = [
      { from: 'b', to: 'c' },
      { from: 'a', to: 'c' },
    ];
    const grafo = resolveFlowGraph(nodes, edges)!;

    const c = grafo.nodes.find((n) => n.node.id === 'c')!;
    expect(c.dependsOn).toEqual(['B', 'A']);
    const a = grafo.nodes.find((n) => n.node.id === 'a')!;
    expect(a.dependsOn).toEqual([]);
  });

  it('a curva sai do centro de uma casa e chega ao centro da outra', () => {
    // O centro da casa `(c, r)` é `(c + 0,5; r + 0,5)`, e é essa igualdade que
    // faz o `<svg>` esticado fechar com a grade — ela só vale porque a grade
    // não tem vão entre as casas.
    const grafo = resolveFlowGraph([node('a', 0, 0), node('b', 2, 1)], [{ from: 'a', to: 'b' }])!;

    expect(grafo.edges[0].path).toBe('M 0.5 0.5 C 1.5 0.5 1.5 1.5 2.5 1.5');
  });

  it('a aresta entre casas da mesma coluna ainda se abre', () => {
    // Com abertura proporcional à distância, um ramo que desce sem avançar
    // viraria um segmento de reta vertical atravessando a caixa dos nós entre
    // as duas pontas. O mínimo é o que a faz desviar.
    const grafo = resolveFlowGraph([node('a', 0, 0), node('b', 0, 2)], [{ from: 'a', to: 'b' }])!;

    expect(grafo.edges[0].path).toBe('M 0.5 0.5 C 1 0.5 0 2.5 0.5 2.5');
  });

  it('id repetido: a primeira declaração vence, e as duas caixas ficam', () => {
    // Endereço repetido é dado ruim. Sumir com uma caixa reescreveria o grafo
    // de quem monta; vencer o primeiro pelo menos é previsível.
    const nodes = [node('a', 0, 0), node('a', 1, 0), node('b', 2, 0)];
    const grafo = resolveFlowGraph(nodes, [{ from: 'a', to: 'b' }])!;

    expect(grafo.nodes).toHaveLength(3);
    expect(grafo.edges[0].path.startsWith('M 0.5 0.5')).toBe(true);
  });
});
