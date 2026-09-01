<script lang="ts">
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
 * A CONTA INTEIRA É DE `resolveFlowGraph`, e nada dela é refeito aqui: nem a
 * normalização, nem o descarte de aresta órfã, nem a curva. Cinco stacks
 * escrevendo o próprio Bézier é cinco desenhos diferentes para o mesmo grafo, e
 * geometria que discorda não aparece em teste — aparece como foto torta.
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
 * A DIVERGÊNCIA DE API DE FRAMEWORK, e ela é uma só: a CLASSE EXTRA entra por
 * atributo de repasse, e não por uma propriedade `class` declarada. É a forma
 * desta stack — o Vue funde `class` e `style` de quem chama na raiz do
 * componente sozinho —, e declarar a propriedade tiraria a fusão em vez de
 * acrescentar coisa alguma. É o mesmo caminho por onde a story dos limites
 * aperta `--flow-graph-column-min` no próprio elemento. O resto do contrato —
 * os nós, as ligações, o estado e os rótulos — não diverge.
 *
 * O QUE O COMPONENTE NÃO FAZ: dispor, medir elemento, animar entrada, contar
 * tempo, avançar sozinho, buscar nada. Ele desenha os nós que recebe nas casas
 * que recebe e as arestas que têm as duas pontas.
 */
import type { ToolCallState } from '@shared/primitives/chat-protocol'

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
  region: string
  /**
   * O molde da dependência. `{sources}` vira a lista de rótulos dos nós de que
   * este depende.
   *
   * Molde, e não texto pronto: a palavra que apresenta a lista é do idioma, e
   * os rótulos são dado.
   */
  dependsOn: string
  /**
   * A palavra de cada estado, que é o que chega a quem ouve.
   *
   * Só quem ouve a recebe, e essa é a divergência deliberada em relação ao
   * plano do agente, que a mostra numa etiqueta. Ali o passo é uma linha de
   * lista, com largura de sobra; aqui o nó é uma caixa numa grade cuja largura
   * é a do rótulo, e uma etiqueta por nó dobraria a largura de toda coluna. Ver
   * a decisão 6 da folha.
   */
  state: Record<ToolCallState, string>
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { FlowEdge, FlowNode, RunStatus } from '@shared/primitives/chat-protocol'
import {
  resolveFlowGraph,
  type FlowGraphNodeDrawing,
} from '@shared/primitives/flow-graph-edges'

const props = withDefaults(
  defineProps<{
    /**
     * Os nós, NA ORDEM EM QUE DEVEM SER OUVIDOS.
     *
     * A posição na grade é livre; a ordem nesta lista não é, porque ela é a
     * ordem de leitura (WCAG 1.3.2, decisão 3 da folha). Sem nó nenhum não há
     * grafo, e a peça não desenha nada.
     */
    nodes: readonly FlowNode[]
    /**
     * As dependências. Aresta cuja ponta não veio na lista de nós é descartada
     * — não é erro, é o grafo mostrado pela metade.
     */
    edges?: readonly FlowEdge[]
    /**
     * Em que pé está a execução que escreve o grafo.
     *
     * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça
     * se declara ocupada. Receber as cinco palavras e perguntar uma coisa só
     * não é achatamento de dado — é a mesma decisão da tela do computador: um
     * booleano na assinatura obrigaria quem consome a traduzir cinco palavras
     * em duas no ponto da chamada, que é onde a perda aconteceria.
     */
    status?: RunStatus
    labels: FlowGraphLabels
  }>(),
  { edges: () => [], status: 'idle' },
)

/**
 * O grafo pronto para desenhar, ou nada quando não há nó.
 *
 * SEM NÓ NÃO HÁ GRAFO, e devolver moldura vazia seria pior que devolver nada: a
 * camada que rola é parada de teclado, e uma parada de teclado que leva a uma
 * caixa vazia é ruído com nome.
 */
const drawing = computed(() => resolveFlowGraph(props.nodes, props.edges))

/**
 * As quatro leituras do desenho, já resolvidas fora do template.
 *
 * O `v-if` da raiz garante que nenhuma delas chega à tela com o grafo ausente;
 * elas existem separadas para que o template não dependa de estreitamento de
 * tipo dentro de expressão de atributo, que é onde uma mudança de versão da
 * ferramenta de tipos custa um build.
 */
const drawnNodes = computed(() => drawing.value?.nodes ?? [])
const drawnEdges = computed(() => drawing.value?.edges ?? [])

/**
 * AS DUAS CONTAGENS SÃO DADO, e entram por propriedade personalizada: não
 * existe token de "quatro colunas", e `repeat()` aceita a substituição de
 * propriedade personalizada no contador mas não aceita `calc()` — o número tem
 * de chegar pronto.
 */
const canvasStyle = computed(() => ({
  '--flow-graph-columns': String(drawing.value?.columns ?? 0),
  '--flow-graph-rows': String(drawing.value?.rows ?? 0),
}))

/**
 * O `viewBox` trabalha em CASAS da grade, e é esticado sobre ela. É o que
 * permite a conta das curvas ser feita sem medir elemento nenhum.
 */
const viewBox = computed(
  () => `0 0 ${drawing.value?.columns ?? 0} ${drawing.value?.rows ?? 0}`,
)

/**
 * OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
 * fluxo troca de nó mais depressa do que se lê, e narrar cada troca é a mesma
 * armadilha do relógio ao vivo. `undefined` remove o atributo, porque
 * `aria-busy="false"` é uma afirmação a mais que ninguém pediu.
 */
const busy = computed(() => (props.status === 'running' ? 'true' : undefined))

/**
 * A LEITURA DO GRAFO: a palavra do estado e os nós de que este depende.
 *
 * É o que faz o grafo inteiro se reconstruir de ouvido, porque cada aresta é
 * dita exatamente uma vez — só as que CHEGAM (decisões 1 e 2).
 */
function readingOf(drawn: FlowGraphNodeDrawing): string {
  const parts = [props.labels.state[drawn.node.state]]
  if (drawn.dependsOn.length > 0) {
    parts.push(props.labels.dependsOn.replace('{sources}', drawn.dependsOn.join(', ')))
  }
  return parts.join(' ')
}
</script>

<template>
  <div
    v-if="drawing"
    class="nds-flow-graph"
    data-slot="flow-graph"
    :aria-busy="busy"
  >
    <!-- ── A camada que rola ────────────────────────────────────────
         O PAR COMPLETO, e ele é o par: `tabindex` sem papel deixaria uma parada
         de teclado anônima, e `aria-label` sobre um `div` sem papel é
         DESCARTADO pelo navegador (`aria-prohibited-attr`) — que foi exatamente
         o defeito de duas peças desta casa. `group` e não `region`: uma página
         de documentação tem dezenas destas, e `region` com nome vira dezenas de
         marcos homônimos. -->
    <div
      class="nds-flow-graph-viewport"
      data-slot="flow-graph-viewport"
      tabindex="0"
      role="group"
      :aria-label="labels.region"
    >
      <div
        class="nds-flow-graph-canvas"
        data-slot="flow-graph-canvas"
        :style="canvasStyle"
      >
        <!-- ── As arestas ─────────────────────────────────────────
             FORA DO QUE É LIDO EM VOZ, numa camada só (decisão 1). Curva não se
             lê; o que se lê é a frase dentro de cada nó, e ela diz a mesma
             relação em palavras. `focusable="false"` porque o `<svg>` ainda é
             parada de tabulação em motores antigos mesmo escondido. -->
        <svg
          class="nds-flow-graph-edges"
          data-slot="flow-graph-edges"
          :viewBox="viewBox"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <!-- Em espessura de tela, apesar da distorção do `viewBox`
               esticado. -->
          <path
            v-for="(edge, index) in drawnEdges"
            :key="index"
            class="nds-flow-graph-edge"
            data-slot="flow-graph-edge"
            :d="edge.path"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <!-- ── Os nós ─────────────────────────────────────────────
             `<ol>` e não `<ul>`: a ordem de declaração é a ordem de leitura, e
             é ela que quem monta escolheu (decisão 3). A posição na grade não é
             lida por ninguém. -->
        <ol
          class="nds-flow-graph-nodes"
          data-slot="flow-graph-nodes"
        >
          <!-- A CHAVE É A POSIÇÃO, e não o endereço do nó. Endereço repetido é
               dado ruim, e a conta compartilhada decidiu o que fazer com ele: a
               primeira declaração vence a ligação, e as DUAS caixas continuam
               desenhadas. Uma chave derivada do endereço faria a segunda caixa
               sumir — o componente reescrevendo o grafo de quem monta, que é
               justamente o que aquela decisão recusa. -->
          <li
            v-for="(drawn, index) in drawnNodes"
            :key="index"
            class="nds-flow-graph-node"
            data-slot="flow-graph-node"
            :data-state="drawn.node.state"
            :data-node-id="drawn.node.id"
            :style="{
              '--flow-graph-node-column': String(drawn.columnLine),
              '--flow-graph-node-row': String(drawn.rowLine),
            }"
          >
            <!-- A MARCA É DECORATIVA e carrega FORMA, não só cor (decisão 5):
                 cheia, anel, anel interrompido, cruz. A palavra do estado está
                 logo abaixo, para quem não vê nenhuma das quatro. -->
            <span
              class="nds-flow-graph-node-marker"
              data-slot="flow-graph-node-marker"
              aria-hidden="true"
            />

            <!-- O rótulo inteiro, sem corte. A folha resolve a quebra — um nó
                 pela metade é uma instrução pela metade, e reticências escondem
                 justamente o que distingue dois ramos. -->
            <span
              class="nds-flow-graph-node-label"
              data-slot="flow-graph-node-label"
            >{{ drawn.node.label }}</span>

            <span
              class="nds-sr-only"
              data-slot="flow-graph-node-reading"
            >{{ readingOf(drawn) }}</span>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
