/**
 * Andaime das demonstrações do grafo de fluxo.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, o molde da dependência e a palavra de cada estado.
 * Os NÓS e as LIGAÇÕES saem de `@shared/primitives/flow-graph-examples`, porque
 * não são idioma: a forma do grafo é a mesma nos três, e escrever coordenadas
 * diferentes por idioma faria as fotos mostrarem desenhos diferentes.
 *
 * Diferente da tela do computador, aqui NADA do andaime é `HTMLElement`: o
 * grafo não tem espaço de quem consome, então tudo o que a demonstração precisa
 * é dado, e dado inteiro cabe no compartilhado.
 */

import { createTranslation } from '@/lib/i18n';
import flowGraphTranslations from '@shared/content/flow-graph/translations.json';
import type { FlowEdge, FlowNode, RunStatus } from '@shared/primitives/chat-protocol';
import { createFlowGraph, type FlowGraphLabels } from './flow-graph';

const { t } = createTranslation(flowGraphTranslations as Record<string, unknown>);

/** O nome da camada que rola, o molde da dependência e as quatro palavras. */
export function flowGraphLabels(): FlowGraphLabels {
  return {
    region: t('labels.region'),
    dependsOn: t('labels.dependsOn'),
    state: {
      pending: t('labels.state.pending'),
      running: t('labels.state.running'),
      done: t('labels.state.done'),
      failed: t('labels.state.failed'),
    },
  };
}

/**
 * Um grafo largo, para o caso em que ele não cabe na conversa.
 *
 * Oito colunas, e é o número que faz a camada rolar em qualquer largura
 * razoável de tela: com a largura mínima de coluna que a folha declara, oito
 * colunas passam de qualquer conversa. Gerado, e não escrito à mão, porque o
 * que a story fotografa é a rolagem — e uma lista de oito nós escritos um a um
 * só acrescentaria linhas para ler.
 */
export function wideFlowNodes(): FlowNode[] {
  return Array.from({ length: 8 }, (_, index): FlowNode => ({
    id: `passo-${index}`,
    label: `Etapa ${index + 1}`,
    column: index,
    row: index % 2,
    state: index < 3 ? 'done' : index === 3 ? 'running' : 'pending',
  }));
}

/** As ligações do grafo largo: cada etapa depende da anterior. */
export function wideFlowEdges(): FlowEdge[] {
  return Array.from({ length: 7 }, (_, index) => ({
    from: `passo-${index}`,
    to: `passo-${index + 1}`,
  }));
}

/**
 * Um grafo com rótulos longos.
 *
 * O rótulo do nó nunca é cortado — ele quebra —, e é isso que esta fotografia
 * guarda: reticências num grafo esconderiam justamente o que distingue dois
 * ramos que começam igual.
 */
export const LONG_LABEL_NODES: readonly FlowNode[] = [
  {
    id: 'coleta',
    label: 'Coletar os documentos que o cliente anexou ao pedido',
    column: 0,
    row: 0,
    state: 'done',
  },
  {
    id: 'conferencia',
    label: 'Conferir cada documento contra a lista de exigências do contrato',
    column: 1,
    row: 0,
    state: 'running',
  },
  {
    id: 'resumo',
    label: 'Escrever o resumo do que falta',
    column: 2,
    row: 0,
    state: 'pending',
  },
];

/** As ligações do grafo de rótulos longos. */
export const LONG_LABEL_EDGES = [
  { from: 'coleta', to: 'conferencia' },
  { from: 'conferencia', to: 'resumo' },
];

/**
 * Um ramo que VOLTA: a última etapa depende de uma que está à esquerda dela.
 *
 * A curva sai para a direita e chega pela esquerda mesmo assim, e o laço que
 * isso desenha é a informação — ele mostra que o fluxo voltou. É o caso que uma
 * fila ordenada não consegue nem escrever.
 */
export const REJOIN_NODES: readonly FlowNode[] = [
  { id: 'entrada', label: 'Receber o caso', column: 0, row: 1, state: 'done' },
  { id: 'analise', label: 'Analisar', column: 1, row: 0, state: 'done' },
  { id: 'revisao', label: 'Pedir revisão', column: 2, row: 1, state: 'failed' },
  { id: 'ajuste', label: 'Ajustar a análise', column: 1, row: 2, state: 'running' },
];

/** As ligações do ramo que volta. */
export const REJOIN_EDGES = [
  { from: 'entrada', to: 'analise' },
  { from: 'analise', to: 'revisao' },
  { from: 'revisao', to: 'ajuste' },
  { from: 'ajuste', to: 'analise' },
];

/**
 * O invólucro das demonstrações: um `div` com o grafo dentro, quando há grafo.
 *
 * MORA AQUI, e não em cada arquivo de story, porque a fábrica pode devolver
 * `null` — e o `if` que trata isso é a única linha que os três arquivos
 * precisariam repetir. Duas cópias do mesmo nome com corpos diferentes é o
 * defeito que `fixture_duplicada_entre_stories` existe para pegar: corrigir uma
 * não corrige a outra.
 *
 * O invólucro também é o que permite afirmar que NADA foi desenhado — sem ele,
 * a story sem nó não teria elemento nenhum a que a asserção pudesse apontar.
 */
export function mountFlowGraph(options: {
  nodes: readonly FlowNode[];
  edges?: readonly FlowEdge[];
  status?: RunStatus;
  /** Teto de largura, quando o assunto da story é a rolagem. */
  hostClass?: string;
  testid?: string;
}): HTMLElement {
  const host = document.createElement('div');
  if (options.hostClass) host.className = options.hostClass;
  if (options.testid) host.dataset.testid = options.testid;

  const piece = createFlowGraph({
    nodes: options.nodes,
    edges: options.edges ?? [],
    status: options.status ?? 'running',
    labels: flowGraphLabels(),
  });
  if (piece) host.appendChild(piece);
  return host;
}
