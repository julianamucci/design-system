import type { FlowEdge, FlowNode, RunStatus, ToolCallState } from '@shared/primitives/chat-protocol';
import { resolveFlowGraph } from '@shared/primitives/flow-graph-edges';

/**
 * O trabalho que se ramifica e volta a se juntar: um nó por passo, na casa da
 * grade que quem monta escolheu, e uma curva por dependência.
 *
 * Desenho em `nds/resposta-estruturada.css`, no bloco "Grafo de fluxo", que
 * também guarda as oito decisões de acessibilidade e as seis regras da família.
 * O vocabulário — `FlowNode`, `FlowEdge`, `ToolCallState` — vem de
 * `@shared/primitives/chat-protocol`, e a conta de
 * `@shared/primitives/flow-graph-edges`.
 *
 * POR QUE ELA É PEÇA, e não o plano do agente com coordenadas. O que decide não
 * é a posição — é a ARESTA. `FlowEdge` é `{ from, to }`: uma relação entre dois
 * itens, e este vocabulário não tinha como dizer "este depende daquele".
 * `PlanStep` é fila ordenada, e ordem não é dependência porque fila não se
 * ramifica nem se reencontra, que é literalmente o assunto desta peça. Medido
 * antes de construir: o único conector do design system é
 * `.nds-stepper-separator`, uma linha de 1 px entre etapas ADJACENTES de uma
 * fila linear, e `chart` tem oito tipos e nenhum deles é grafo.
 *
 * A PEÇA NÃO CALCULA DISPOSIÇÃO. `column` e `row` chegam prontos — quem monta o
 * grafo é quem sabe a forma dele —, e o que a peça faz com eles é deslocar o
 * conjunto para a origem e desenhar. Calcular traria algoritmo de layout para
 * dentro do design system, e algoritmo de layout envelhece por produto (§2 da
 * guideline 17).
 *
 * O ESTADO É `ToolCallState` INTEIRO, e não os três da fonte. Lá `done`,
 * `active` e `pending` são três desenhos, e o que se perde é `failed`: um nó de
 * trabalho que quebrou desenha igual a um que terminou. É o mesmo movimento que
 * a família 2 já fez sete vezes.
 *
 * NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família (regra 6 da folha).
 * A fonte declara um `visibleCount` que fatia os nós e acende as arestas cujas
 * duas pontas já entraram; o dono disso é `13-animacao.md`, e a §2 decide o
 * resto — o componente desenha o que recebe. Quem quer revelar aos poucos passa
 * MENOS nós, e a aresta que perde uma ponta some sozinha. Tirado o contador,
 * some junto o segundo tom de traço que existia só para mostrar a aresta
 * ADIANTE da revelação: sem revelação não há adiante, e todas as arestas
 * desenham iguais.
 *
 * O QUE O COMPONENTE NÃO FAZ: dispor, medir elemento, animar entrada, contar
 * tempo, avançar sozinho, buscar nada. Ele desenha os nós que recebe nas casas
 * que recebe e as arestas que têm as duas pontas.
 */

export interface FlowGraphLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão. O grafo é mais largo que a conversa, então ele
   * rola, e o que rola é parada de teclado com `tabindex="0"` — sem nome, quem
   * chega ali ouvindo não sabe onde entrou (regra 6 da §8 da guideline 17).
   * Quem monta é quem sabe o nome: duas peças destas na mesma tela com o mesmo
   * nome são duas paradas indistinguíveis. Um padrão silencioso pareceria
   * gentileza e produziria exatamente isso — a lição da conversa é que ninguém
   * pensa em nomear uma camada que não se vê, e o que faz alguém pensar é a
   * chamada não compilar sem ela.
   */
  region: string;
  /**
   * O molde da dependência. `{sources}` vira a lista de rótulos dos nós de que
   * este depende.
   *
   * Molde, e não texto pronto: a palavra que apresenta a lista é do idioma, e
   * os rótulos são dado.
   */
  dependsOn: string;
  /**
   * A palavra de cada estado, que é o que chega a quem ouve.
   *
   * Só quem ouve a recebe, e essa é a divergência deliberada em relação ao
   * plano do agente, que a mostra numa etiqueta. Ali o passo é uma linha de
   * lista, com largura de sobra; aqui o nó é uma caixa numa grade cuja largura
   * é a do rótulo, e uma etiqueta por nó dobraria a largura de toda coluna. Ver
   * a decisão 6 da folha.
   */
  state: Record<ToolCallState, string>;
}

export interface FlowGraphOptions {
  /**
   * Os nós, NA ORDEM EM QUE DEVEM SER OUVIDOS.
   *
   * A posição na grade é livre; a ordem nesta lista não é, porque ela é a ordem
   * de leitura (WCAG 1.3.2, decisão 3 da folha). Sem nó nenhum não há grafo, e
   * a fábrica devolve `null`.
   */
  nodes: readonly FlowNode[];
  /**
   * As dependências. Aresta cuja ponta não veio na lista de nós é descartada —
   * não é erro, é o grafo mostrado pela metade.
   */
  edges?: readonly FlowEdge[];
  /**
   * Em que pé está a execução que escreve o grafo.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça se
   * declara ocupada. Receber as cinco palavras e perguntar uma coisa só não é
   * achatamento de dado — é a mesma decisão da tela do computador: um booleano
   * na assinatura obrigaria quem consome a traduzir cinco palavras em duas no
   * ponto da chamada, que é onde a perda aconteceria.
   */
  status?: RunStatus;
  labels: FlowGraphLabels;
  class?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createFlowGraph(options: FlowGraphOptions): HTMLElement | null {
  const { nodes, edges = [], status = 'idle', labels } = options;

  const drawing = resolveFlowGraph(nodes, edges);
  // SEM NÓ NÃO HÁ GRAFO, e devolver moldura vazia seria pior que devolver nada:
  // a camada que rola é parada de teclado, e uma parada de teclado que leva a
  // uma caixa vazia é ruído com nome.
  if (!drawing) return null;

  const root = document.createElement('div');
  root.dataset.slot = 'flow-graph';
  root.className = ['nds-flow-graph', options.class].filter(Boolean).join(' ');

  // OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
  // fluxo troca de nó mais depressa do que se lê, e narrar cada troca é a mesma
  // armadilha do relógio ao vivo.
  if (status === 'running') root.setAttribute('aria-busy', 'true');

  // ── A camada que rola ───────────────────────────────────────────────────────
  //
  // O PAR COMPLETO, e ele é o par: `tabindex` sem papel deixaria uma parada de
  // teclado anônima, e `aria-label` sobre um `div` sem papel é DESCARTADO pelo
  // navegador (`aria-prohibited-attr`) — que foi exatamente o defeito de duas
  // peças desta casa. `group` e não `region`: uma página de documentação tem
  // dezenas destas, e `region` com nome vira dezenas de marcos homônimos.
  const viewport = document.createElement('div');
  viewport.className = 'nds-flow-graph-viewport';
  viewport.dataset.slot = 'flow-graph-viewport';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-label', labels.region);

  const canvas = document.createElement('div');
  canvas.className = 'nds-flow-graph-canvas';
  canvas.dataset.slot = 'flow-graph-canvas';
  // AS DUAS CONTAGENS SÃO DADO, e entram por propriedade personalizada: não
  // existe token de "quatro colunas", e `repeat()` aceita a substituição de
  // propriedade personalizada no contador mas não aceita `calc()` — o número
  // tem de chegar pronto.
  canvas.style.setProperty('--flow-graph-columns', String(drawing.columns));
  canvas.style.setProperty('--flow-graph-rows', String(drawing.rows));

  // ── As arestas ──────────────────────────────────────────────────────────────
  //
  // FORA DO QUE É LIDO EM VOZ, numa camada só (decisão 1). Curva não se lê; o
  // que se lê é a frase dentro de cada nó, e ela diz a mesma relação em
  // palavras. `focusable="false"` porque o `<svg>` ainda é parada de tabulação
  // em motores antigos mesmo escondido.
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'nds-flow-graph-edges');
  svg.dataset.slot = 'flow-graph-edges';
  // O `viewBox` trabalha em CASAS da grade, e é esticado sobre ela. É o que
  // permite a conta das curvas ser feita sem medir elemento nenhum.
  svg.setAttribute('viewBox', `0 0 ${drawing.columns} ${drawing.rows}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  for (const edge of drawing.edges) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'nds-flow-graph-edge');
    path.dataset.slot = 'flow-graph-edge';
    path.setAttribute('d', edge.path);
    // Em espessura de tela, apesar da distorção do `viewBox` esticado.
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
  }
  canvas.appendChild(svg);

  // ── Os nós ──────────────────────────────────────────────────────────────────
  //
  // `<ol>` e não `<ul>`: a ordem de declaração é a ordem de leitura, e é ela
  // que quem monta escolheu (decisão 3). A posição na grade não é lida por
  // ninguém.
  const list = document.createElement('ol');
  list.className = 'nds-flow-graph-nodes';
  list.dataset.slot = 'flow-graph-nodes';

  for (const drawn of drawing.nodes) {
    const item = document.createElement('li');
    item.className = 'nds-flow-graph-node';
    item.dataset.slot = 'flow-graph-node';
    item.dataset.state = drawn.node.state;
    item.dataset.nodeId = drawn.node.id;
    // A CASA É DADO, e o que entra é o número da linha de grade — a conta que o
    // transforma em posição mora na folha, onde pode mudar sem tocar nas cinco
    // stacks. Mesma decisão de `--computer-use-mark-x`.
    item.style.setProperty('--flow-graph-node-column', String(drawn.columnLine));
    item.style.setProperty('--flow-graph-node-row', String(drawn.rowLine));

    // A MARCA É DECORATIVA e carrega FORMA, não só cor (decisão 5): cheia,
    // anel, anel interrompido, cruz. A palavra do estado está logo abaixo, para
    // quem não vê nenhuma das quatro.
    const marker = document.createElement('span');
    marker.className = 'nds-flow-graph-node-marker';
    marker.dataset.slot = 'flow-graph-node-marker';
    marker.setAttribute('aria-hidden', 'true');
    item.appendChild(marker);

    // O rótulo inteiro, sem corte. A folha resolve a quebra — um nó pela metade
    // é uma instrução pela metade, e reticências escondem justamente o que
    // distingue dois ramos.
    const label = document.createElement('span');
    label.className = 'nds-flow-graph-node-label';
    label.dataset.slot = 'flow-graph-node-label';
    label.textContent = drawn.node.label;
    item.appendChild(label);

    // A LEITURA DO GRAFO: a palavra do estado e os nós de que este depende. É o
    // que faz o grafo inteiro se reconstruir de ouvido, porque cada aresta é
    // dita exatamente uma vez — só as que CHEGAM (decisões 1 e 2).
    const reading = document.createElement('span');
    reading.className = 'nds-sr-only';
    reading.dataset.slot = 'flow-graph-node-reading';
    const parts = [labels.state[drawn.node.state]];
    if (drawn.dependsOn.length > 0) {
      parts.push(labels.dependsOn.replace('{sources}', drawn.dependsOn.join(', ')));
    }
    reading.textContent = parts.join(' ');
    item.appendChild(reading);

    list.appendChild(item);
  }

  canvas.appendChild(list);
  viewport.appendChild(canvas);
  root.appendChild(viewport);
  return root;
}
