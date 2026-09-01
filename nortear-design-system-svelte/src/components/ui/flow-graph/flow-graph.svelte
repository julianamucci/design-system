<script lang="ts" module>
  // ─── FlowGraph ─────────────────────────────────────────────────────────────
  //
  // O trabalho que se ramifica e volta a se juntar: um nó por passo, na casa da
  // grade que quem monta escolheu, e uma curva por dependência.
  //
  // Desenho em `nds/resposta-estruturada.css`, no bloco "Grafo de fluxo", que
  // também guarda as oito decisões de acessibilidade e as seis regras da
  // família. O vocabulário — `FlowNode`, `FlowEdge`, `ToolCallState` — vem de
  // `@shared/primitives/chat-protocol`, e a conta de
  // `@shared/primitives/flow-graph-edges`.
  //
  // POR QUE ELA É PEÇA, e não o plano do agente com coordenadas. O que decide
  // não é a posição — é a ARESTA. `FlowEdge` é `{ from, to }`: uma relação
  // entre dois itens, e este vocabulário não tinha como dizer "este depende
  // daquele". `PlanStep` é fila ordenada, e ordem não é dependência porque fila
  // não se ramifica nem se reencontra, que é literalmente o assunto desta peça.
  // Medido antes de construir: o único conector do design system é
  // `.nds-stepper-separator`, uma linha de 1 px entre etapas ADJACENTES de uma
  // fila linear, e `chart` tem oito tipos e nenhum deles é grafo.
  //
  // A PEÇA NÃO CALCULA DISPOSIÇÃO. `column` e `row` chegam prontos — quem monta
  // o grafo é quem sabe a forma dele —, e o que a peça faz com eles é deslocar
  // o conjunto para a origem e desenhar. Calcular traria algoritmo de layout
  // para dentro do design system, e algoritmo de layout envelhece por produto
  // (§2 da guideline 17).
  //
  // O ESTADO É `ToolCallState` INTEIRO, e não os três da fonte. Lá `done`,
  // `active` e `pending` são três desenhos, e o que se perde é `failed`: um nó
  // de trabalho que quebrou desenha igual a um que terminou. É o mesmo
  // movimento que a família 2 já fez sete vezes.
  //
  // NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família (regra 6 da
  // folha). A fonte declara um `visibleCount` que fatia os nós e acende as
  // arestas cujas duas pontas já entraram; o dono disso é `13-animacao.md`, e a
  // §2 decide o resto — o componente desenha o que recebe. Quem quer revelar
  // aos poucos passa MENOS nós, e a aresta que perde uma ponta some sozinha.
  //
  // O QUE O COMPONENTE NÃO FAZ: dispor, medir elemento, animar entrada, contar
  // tempo, avançar sozinho, buscar nada. Ele desenha os nós que recebe nas
  // casas que recebe e as arestas que têm as duas pontas.
  //
  // DIVERGÊNCIA DE API, em relação à referência, e ela se REGISTRA em vez de se
  // "alinhar" (§4.1 da guideline 17): lá a peça é uma fábrica que recebe um
  // objeto de opções e devolve o elemento — ou `null`, quando não há nó. Aqui
  // ela é um componente, as opções são props com os MESMOS nomes, e o "devolve
  // nada" vira um `{#if}` que não desenha marcação nenhuma. Markup, classes
  // `.nds-*`, `data-slot`, ARIA e comportamento são os mesmos.
  import type { ToolCallState } from '@shared/primitives/chat-protocol';

  export interface FlowGraphLabels {
    /**
     * O nome da camada que rola.
     *
     * OBRIGATÓRIO, e é decisão. O grafo é mais largo que a conversa, então ele
     * rola, e o que rola é parada de teclado com `tabindex="0"` — sem nome,
     * quem chega ali ouvindo não sabe onde entrou (regra 6 da §8 da guideline
     * 17). Quem monta é quem sabe o nome: duas peças destas na mesma tela com o
     * mesmo nome são duas paradas indistinguíveis. Um padrão silencioso
     * pareceria gentileza e produziria exatamente isso — o que faz alguém
     * pensar é a chamada não compilar sem ela.
     */
    region: string;
    /**
     * O molde da dependência. `{sources}` vira a lista de rótulos dos nós de
     * que este depende.
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
     * lista, com largura de sobra; aqui o nó é uma caixa numa grade cuja
     * largura é a do rótulo, e uma etiqueta por nó dobraria a largura de toda
     * coluna. Ver a decisão 6 da folha.
     */
    state: Record<ToolCallState, string>;
  }
</script>

<script lang="ts">
  import type { FlowEdge, FlowNode, RunStatus } from '@shared/primitives/chat-protocol';
  import {
    resolveFlowGraph,
    type FlowGraphNodeDrawing,
  } from '@shared/primitives/flow-graph-edges';
  import { cn } from '@/lib/utils.js';

  const {
    nodes,
    edges = [],
    status = 'idle',
    labels,
    class: className,
  }: {
    /**
     * Os nós, NA ORDEM EM QUE DEVEM SER OUVIDOS.
     *
     * A posição na grade é livre; a ordem nesta lista não é, porque ela é a
     * ordem de leitura (WCAG 1.3.2, decisão 3 da folha). Sem nó nenhum não há
     * grafo, e a peça não desenha nada.
     */
    nodes: readonly FlowNode[];
    /**
     * As dependências. Aresta cuja ponta não veio na lista de nós é descartada
     * — não é erro, é o grafo mostrado pela metade.
     */
    edges?: readonly FlowEdge[];
    /**
     * Em que pé está a execução que escreve o grafo.
     *
     * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça
     * se declara ocupada. Receber as cinco palavras e perguntar uma coisa só
     * não é achatamento de dado — é a mesma decisão da tela do computador: um
     * booleano na assinatura obrigaria quem consome a traduzir cinco palavras
     * em duas no ponto da chamada, que é onde a perda aconteceria.
     */
    status?: RunStatus;
    labels: FlowGraphLabels;
    class?: string;
  } = $props();

  /**
   * A conta inteira, e ela mora no compartilhado.
   *
   * Normalização, descarte de aresta órfã e curva saem de
   * `resolveFlowGraph` — cinco stacks fazendo cada uma a sua dariam cinco
   * desenhos diferentes para o mesmo grafo, e a divergência só apareceria como
   * foto torta.
   *
   * SEM NÓ NÃO HÁ GRAFO, e a conta devolve `null`. Devolver moldura vazia seria
   * pior que não desenhar nada: a camada que rola é parada de teclado, e uma
   * parada de teclado que leva a uma caixa vazia é ruído com nome.
   */
  const drawing = $derived(resolveFlowGraph(nodes, edges));

  /**
   * A LEITURA DO GRAFO: a palavra do estado e os nós de que este depende.
   *
   * É o que faz o grafo inteiro se reconstruir de ouvido, porque cada aresta é
   * dita exatamente uma vez — só as que CHEGAM (decisões 1 e 2).
   */
  function readingOf(drawn: FlowGraphNodeDrawing): string {
    const parts = [labels.state[drawn.node.state]];
    if (drawn.dependsOn.length > 0) {
      parts.push(labels.dependsOn.replace('{sources}', drawn.dependsOn.join(', ')));
    }
    return parts.join(' ');
  }
</script>

{#if drawing}
  <!--
    OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
    fluxo troca de nó mais depressa do que se lê, e narrar cada troca é a mesma
    armadilha do relógio ao vivo.
  -->
  <div
    class={cn('nds-flow-graph', className)}
    data-slot="flow-graph"
    aria-busy={status === 'running' ? 'true' : undefined}
  >
    <!--
      A CAMADA QUE ROLA, e o PAR COMPLETO — ele é o par: `tabindex` sem papel
      deixaria uma parada de teclado anônima, e `aria-label` sobre um `div` sem
      papel é DESCARTADO pelo navegador (`aria-prohibited-attr`), que foi
      exatamente o defeito de duas peças desta casa. `group` e não `region`: uma
      página de documentação tem dezenas destas, e `region` com nome vira
      dezenas de marcos homônimos.

      A diretiva abaixo cala um falso positivo conhecido: a regra do compilador
      só aceita papel de widget, e nem `region` nem `group` a dispensam. Aviso
      conhecido convivendo com o build é como o repositório perde o aviso NOVO.
    -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="nds-flow-graph-viewport"
      data-slot="flow-graph-viewport"
      tabindex="0"
      role="group"
      aria-label={labels.region}
    >
      <!--
        AS DUAS CONTAGENS SÃO DADO, e entram por propriedade personalizada: não
        existe token de "quatro colunas", e `repeat()` aceita a substituição de
        propriedade personalizada no contador mas não aceita `calc()` — o número
        tem de chegar pronto.
      -->
      <div
        class="nds-flow-graph-canvas"
        data-slot="flow-graph-canvas"
        style="--flow-graph-columns: {drawing.columns}; --flow-graph-rows: {drawing.rows}"
      >
        <!--
          AS ARESTAS, FORA DO QUE É LIDO EM VOZ, numa camada só (decisão 1).
          Curva não se lê; o que se lê é a frase dentro de cada nó, e ela diz a
          mesma relação em palavras. `focusable="false"` porque o `<svg>` ainda
          é parada de tabulação em motores antigos mesmo escondido.

          O `viewBox` trabalha em CASAS da grade, e é esticado sobre ela. É o
          que permite a conta das curvas ser feita sem medir elemento nenhum.

          A CHAVE DO `{#each}` É O ÍNDICE, e não o par de pontas: duas arestas
          entre os mesmos dois nós são dado repetido, não erro, e chavear pelo
          par faria a peça quebrar em vez de desenhar o que recebeu.
        -->
        <svg
          class="nds-flow-graph-edges"
          data-slot="flow-graph-edges"
          viewBox="0 0 {drawing.columns} {drawing.rows}"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {#each drawing.edges as edge, index (index)}
            <!-- Em espessura de tela, apesar da distorção do `viewBox` esticado. -->
            <path
              class="nds-flow-graph-edge"
              data-slot="flow-graph-edge"
              d={edge.path}
              vector-effect="non-scaling-stroke"
            />
          {/each}
        </svg>

        <!--
          OS NÓS. `<ol>` e não `<ul>`: a ordem de declaração é a ordem de
          leitura, e é ela que quem monta escolheu (decisão 3). A posição na
          grade não é lida por ninguém.

          A chave é o índice pelo mesmo motivo das arestas: `id` repetido é dado
          ruim, e a conta compartilhada decide que a primeira declaração vence e
          as duas caixas continuam desenhadas. Chavear por `id` transformaria
          esse dado ruim em queda.
        -->
        <ol class="nds-flow-graph-nodes" data-slot="flow-graph-nodes">
          {#each drawing.nodes as drawn, index (index)}
            <!--
              A CASA É DADO, e o que entra é o número da linha de grade — a
              conta que o transforma em posição mora na folha, onde pode mudar
              sem tocar nas cinco stacks. Mesma decisão de `--computer-use-mark-x`.
            -->
            <li
              class="nds-flow-graph-node"
              data-slot="flow-graph-node"
              data-state={drawn.node.state}
              data-node-id={drawn.node.id}
              style="--flow-graph-node-column: {drawn.columnLine}; --flow-graph-node-row: {drawn.rowLine}"
            >
              <!--
                A MARCA É DECORATIVA e carrega FORMA, não só cor (decisão 5):
                cheia, anel, anel interrompido, cruz. A palavra do estado está
                logo abaixo, para quem não vê nenhuma das quatro.
              -->
              <span
                class="nds-flow-graph-node-marker"
                data-slot="flow-graph-node-marker"
                aria-hidden="true"
              ></span>
              <!--
                O rótulo inteiro, sem corte. A folha resolve a quebra — um nó
                pela metade é uma instrução pela metade, e reticências escondem
                justamente o que distingue dois ramos.
              -->
              <span
                class="nds-flow-graph-node-label"
                data-slot="flow-graph-node-label">{drawn.node.label}</span
              >
              <span
                class="nds-sr-only"
                data-slot="flow-graph-node-reading">{readingOf(drawn)}</span
              >
            </li>
          {/each}
        </ol>
      </div>
    </div>
  </div>
{/if}
