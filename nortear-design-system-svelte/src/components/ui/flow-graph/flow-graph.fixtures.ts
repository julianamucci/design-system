/**
 * Andaime das demonstrações do grafo de fluxo.
 *
 * Existe pelo mesmo motivo do andaime da tela do computador: num
 * `*.stories.ts` todo export nomeado vira story, então o andaime não pode
 * morar lá, e a saída fácil — copiar a constante para cada arquivo — produz
 * cópias que divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, o molde da dependência e a palavra de cada estado.
 * Os NÓS e as LIGAÇÕES do exemplo saem de
 * `@shared/primitives/flow-graph-examples`, porque não são idioma: a forma do
 * grafo é a mesma nos três, e escrever coordenadas diferentes por idioma faria
 * as fotos mostrarem desenhos diferentes.
 *
 * O que fica AQUI são os três grafos que existem só para as fotos de borda — o
 * largo, o de rótulos longos e o do ramo que volta. Eles não estão no
 * compartilhado porque não são o exemplo da peça: são o caso que cada foto
 * precisa exercitar, e cada stack fotografa os seus.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import flowGraphTranslations from '@shared/content/flow-graph/translations.json';
import type { FlowEdge, FlowNode } from '@shared/primitives/chat-protocol';
import type { FlowGraphLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção é lida em CADA idioma, então rótulo
 * que sumir do JSON — ou idioma que ficar para trás — reprova no type-check, e
 * não na tela. Uma camada que rola sem nome deixaria quem chega ali por teclado
 * numa parada anônima, que é exatamente o que a obrigatoriedade de `region`
 * existe para não acontecer.
 */
const CONTENT: Record<Locale, { labels: FlowGraphLabels }> = flowGraphTranslations;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function flowGraphLabelsFor(target: Locale): FlowGraphLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function flowGraphLabels(): FlowGraphLabels {
  return flowGraphLabelsFor(get(locale));
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
export const LONG_LABEL_EDGES: readonly FlowEdge[] = [
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
export const REJOIN_EDGES: readonly FlowEdge[] = [
  { from: 'entrada', to: 'analise' },
  { from: 'analise', to: 'revisao' },
  { from: 'revisao', to: 'ajuste' },
  { from: 'ajuste', to: 'analise' },
];

/**
 * O nó de REENCONTRO do grafo que volta, e o endereço dele.
 *
 * Mora aqui porque a asserção da foto e o dado que a produz não podem divergir:
 * a `play` procura o nó por `data-node-id`, e um endereço escrito à mão no
 * arquivo de story é a cópia que envelhece sozinha no dia em que o exemplo
 * muda de nome.
 */
export const REJOIN_MERGE_ID = 'analise';
