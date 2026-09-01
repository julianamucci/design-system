import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type {
  FlowEdge,
  FlowNode,
  RunStatus,
  ToolCallState,
} from '@shared/primitives/chat-protocol';
import { resolveFlowGraph } from '@shared/primitives/flow-graph-edges';

// ─── FlowGraph ────────────────────────────────────────────────────────────────
//
// O trabalho que se ramifica e volta a se juntar: um nó por passo, na casa da
// grade que quem monta escolheu, e uma curva por dependência.
//
// Desenho em docs/shared/styles/nds/resposta-estruturada.css, no bloco "Grafo de
// fluxo", que também guarda as oito decisões de acessibilidade e as seis regras
// da família. O vocabulário — FlowNode, FlowEdge, ToolCallState — vem de
// `@shared/primitives/chat-protocol`, e a conta de
// `@shared/primitives/flow-graph-edges`.
//
// POR QUE ELA É PEÇA, e não o plano do agente com coordenadas. O que decide não
// é a posição — é a ARESTA. `FlowEdge` é um par de endereços: uma relação entre
// dois itens, e o vocabulário do plano não tinha como dizer "este depende
// daquele". Fila ordenada não se ramifica nem se reencontra, que é literalmente
// o assunto desta peça.
//
// A PEÇA NÃO CALCULA DISPOSIÇÃO. `column` e `row` chegam prontos — quem monta o
// grafo é quem sabe a forma dele —, e o que a peça faz com eles é deslocar o
// conjunto para a origem e desenhar. Calcular traria algoritmo de layout para
// dentro do design system, e algoritmo de layout envelhece por produto (§2 da
// guideline 17).
//
// A CONTA INTEIRA É DO PRIMITIVO COMPARTILHADO, e nada dela é refeito aqui: nem
// a normalização, nem o descarte da aresta órfã, nem a curva. Cinco stacks
// escrevendo o próprio Bézier são cinco desenhos diferentes para o mesmo grafo,
// e geometria que discorda não aparece em teste — aparece como foto torta.
//
// NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família (regra 6 da folha).
// Quem quer revelar aos poucos passa MENOS nós, e a aresta que perde uma ponta
// some sozinha.
//
// O QUE O COMPONENTE NÃO FAZ: dispor, medir elemento, animar entrada, contar
// tempo, avançar sozinho, buscar nada. Ele desenha os nós que recebe nas casas
// que recebe e as arestas que têm as duas pontas.
//
// A RAIZ É UM `div`, e por isso o seletor é de ATRIBUTO. A escolha do elemento é
// da folha e não desta stack: um seletor de elemento (`<nds-flow-graph>`) somaria
// uma caixa sem papel entre a pilha e a peça, e as cinco stacks deixariam de
// renderizar a mesma árvore. Mesma escolha do `figure[ndsComputerUse]` e do
// `div[ndsTerminalBlock]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - SEM NÓ, A PEÇA NÃO DESENHA NADA — mas o host continua no documento, e é
//     divergência de framework, não de markup. Onde a fábrica devolve `null` e
//     quem monta não chega a inserir elemento nenhum, aqui quem escreve o
//     `<div ndsFlowGraph>` é quem consome, e nenhum componente do Angular pode
//     recusar o próprio host. O que a peça faz é não desenhar NADA dentro: sem
//     moldura, sem camada que rola, sem parada de teclado e sem `aria-busy`.
//     Sobra um bloco vazio de altura zero, que é o mesmo nada visto da tela — e
//     a razão da guarda continua valendo por inteiro, porque o que ela existe
//     para evitar é a parada de teclado que leva a uma caixa vazia.
//   - as entradas são `input()` de signal, então os nós chegam por
//     `[nodes]="nos"` e o padrão vazio das arestas mora na própria declaração.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. Mesma escolha do bloco de terminal.
//   - não há saída nenhuma: a peça não oferece ação, e não há o que avisar.

export interface FlowGraphLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão. O grafo é mais largo que a conversa, então ele
   * rola, e o que rola é parada de teclado com `tabindex="0"` — sem nome, quem
   * chega ali ouvindo não sabe onde entrou (regra 6 da §8 da guideline 17).
   * Quem monta é quem sabe o nome: duas peças destas na mesma tela com o mesmo
   * nome são duas paradas indistinguíveis. Um padrão silencioso pareceria
   * gentileza e produziria exatamente isso — o que faz alguém pensar no nome é
   * a chamada não compilar sem ele.
   */
  region: string;
  /**
   * O molde da dependência. O lugar marcado vira a lista de rótulos dos nós de
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
   * lista, com largura de sobra; aqui o nó é uma caixa numa grade cuja largura
   * é a do rótulo, e uma etiqueta por nó dobraria a largura de toda coluna.
   */
  state: Record<ToolCallState, string>;
}

/** O lugar marcado no molde da dependência. */
const SOURCES_PLACEHOLDER = '{sources}';

/**
 * Uma aresta já pronta para o template.
 *
 * A chave inclui a POSIÇÃO na lista porque o mesmo par de endereços pode ser
 * declarado duas vezes, e duas chaves iguais num laço rastreado é erro de
 * execução do Angular — não um desenho a menos.
 */
interface EdgeView {
  key: string;
  path: string;
}

/**
 * Um nó já pronto para o template.
 *
 * As coordenadas saem daqui como CADEIA, e não como número: `[style.--custom]`
 * com valor numérico faz o Angular anexar "px" à propriedade personalizada, e o
 * `grid-column-start: var(--flow-graph-node-column)` da folha passaria a receber
 * "2px". É a mesma nota do `NdsComputerUse`, do `NdsProgressIndicator` e do
 * `NdsAspectRatio`, e o defeito é silencioso: o nó simplesmente não aparece na
 * casa em que deveria.
 */
interface NodeView {
  key: string;
  id: string;
  state: ToolCallState;
  label: string;
  column: string;
  row: string;
  /** A palavra do estado e, quando há, de quem este nó depende. */
  reading: string;
}

/** O grafo pronto para desenhar, ou nada quando não há nó. */
interface GraphView {
  columns: string;
  rows: string;
  viewBox: string;
  edges: readonly EdgeView[];
  nodes: readonly NodeView[];
}

@Component({
  selector: 'div[ndsFlowGraph]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-flow-graph',
    '[attr.data-slot]': '"flow-graph"',
    // OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
    // fluxo troca de nó mais depressa do que se lê, e narrar cada troca é a
    // mesma armadilha do relógio ao vivo.
    '[attr.aria-busy]': 'busy()',
  },
  template: `
    <!-- SEM NÓ NÃO HÁ GRAFO, e nada é desenhado: nem moldura, nem camada que
         rola. Uma parada de teclado que leva a uma caixa vazia é ruído com
         nome, e por isso a peça prefere não desenhar. -->
    @if (view(); as drawn) {
      <!-- A CAMADA QUE ROLA, com o PAR COMPLETO: a parada de tabulação sem
           papel deixaria uma parada de teclado anônima, e o nome acessível sobre
           um div sem papel é DESCARTADO pelo navegador (regra
           aria-prohibited-attr) — que foi exatamente o defeito de duas peças
           desta casa. Papel de grupo e não de região: uma página de documentação
           tem dezenas destas, e região com nome vira dezenas de marcos
           homônimos. -->
      <div
        class="nds-flow-graph-viewport"
        data-slot="flow-graph-viewport"
        tabindex="0"
        role="group"
        [attr.aria-label]="labels().region"
      >
        <!-- AS DUAS CONTAGENS SÃO DADO, e entram por propriedade personalizada:
             não existe token de "quatro colunas", e a repetição da grade aceita
             a substituição de propriedade personalizada no contador mas não
             aceita conta — o número tem de chegar pronto. -->
        <div
          class="nds-flow-graph-canvas"
          data-slot="flow-graph-canvas"
          [style.--flow-graph-columns]="drawn.columns"
          [style.--flow-graph-rows]="drawn.rows"
        >
          <!-- AS ARESTAS FICAM FORA DO QUE É LIDO EM VOZ, numa camada só
               (decisão 1). Curva não se lê; o que se lê é a frase dentro de cada
               nó, e ela diz a mesma relação em palavras. O desenho também sai da
               tabulação, porque ele ainda é parada em motores antigos mesmo
               escondido.

               A caixa de visão trabalha em CASAS da grade, e é esticada sobre
               ela. É o que permite a conta das curvas ser feita sem medir
               elemento nenhum. -->
          <svg
            class="nds-flow-graph-edges"
            data-slot="flow-graph-edges"
            [attr.viewBox]="drawn.viewBox"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            @for (edge of drawn.edges; track edge.key) {
              <!-- Em espessura de tela, apesar da distorção da caixa de visão
                   esticada. -->
              <path
                class="nds-flow-graph-edge"
                data-slot="flow-graph-edge"
                [attr.d]="edge.path"
                vector-effect="non-scaling-stroke"
              />
            }
          </svg>

          <!-- LISTA ORDENADA e não lista simples: a ordem de declaração é a
               ordem de leitura, e é ela que quem monta escolheu (decisão 3). A
               posição na grade não é lida por ninguém. -->
          <ol class="nds-flow-graph-nodes" data-slot="flow-graph-nodes">
            @for (node of drawn.nodes; track node.key) {
              <li
                class="nds-flow-graph-node"
                data-slot="flow-graph-node"
                [attr.data-state]="node.state"
                [attr.data-node-id]="node.id"
                [style.--flow-graph-node-column]="node.column"
                [style.--flow-graph-node-row]="node.row"
              >
                <!-- A MARCA É DECORATIVA e carrega FORMA, não só cor (decisão
                     5): cheia, anel, anel interrompido, cruz. A palavra do
                     estado está logo abaixo, para quem não vê nenhuma das
                     quatro. -->
                <span
                  class="nds-flow-graph-node-marker"
                  data-slot="flow-graph-node-marker"
                  aria-hidden="true"
                ></span>

                <!-- O rótulo inteiro, sem corte. A folha resolve a quebra — um
                     nó pela metade é uma instrução pela metade, e reticências
                     escondem justamente o que distingue dois ramos. -->
                <span
                  class="nds-flow-graph-node-label"
                  data-slot="flow-graph-node-label"
                >{{ node.label }}</span>

                <!-- A LEITURA DO GRAFO: a palavra do estado e os nós de que este
                     depende. É o que faz o grafo inteiro se reconstruir de
                     ouvido, porque cada aresta é dita exatamente uma vez — só as
                     que CHEGAM (decisões 1 e 2). -->
                <span
                  class="nds-sr-only"
                  data-slot="flow-graph-node-reading"
                >{{ node.reading }}</span>
              </li>
            }
          </ol>
        </div>
      </div>
    }
  `,
})
export class NdsFlowGraph {
  /**
   * Os nós, NA ORDEM EM QUE DEVEM SER OUVIDOS.
   *
   * A posição na grade é livre; a ordem nesta lista não é, porque ela é a ordem
   * de leitura (WCAG 1.3.2, decisão 3 da folha). Sem nó nenhum não há grafo, e a
   * peça não desenha nada.
   */
  readonly nodes = input.required<readonly FlowNode[]>();

  /**
   * As dependências. Aresta cuja ponta não veio na lista de nós é descartada —
   * não é erro, é o grafo mostrado pela metade.
   */
  readonly edges = input<readonly FlowEdge[]>([]);

  /**
   * Em que pé está a execução que escreve o grafo.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça se
   * declara ocupada. Receber as cinco palavras e perguntar uma coisa só não é
   * achatamento de dado — um booleano na assinatura obrigaria quem consome a
   * traduzir cinco palavras em duas no ponto da chamada, que é onde a perda
   * aconteceria.
   */
  readonly status = input<RunStatus>('idle');

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<FlowGraphLabels>();

  /**
   * O grafo pronto para o template, ou nada.
   *
   * A conta inteira sai de `resolveFlowGraph`, e o que este `computed` faz com o
   * resultado é só o que é DESTA stack: virar cadeia o que entra em propriedade
   * personalizada, e escrever a frase de cada nó.
   */
  protected readonly view = computed<GraphView | null>(() => {
    const drawing = resolveFlowGraph(this.nodes(), this.edges());
    if (!drawing) return null;

    const labels = this.labels();

    return {
      columns: String(drawing.columns),
      rows: String(drawing.rows),
      viewBox: `0 0 ${drawing.columns} ${drawing.rows}`,
      edges: drawing.edges.map((edge, index) => ({
        key: `${index}-${edge.from}-${edge.to}`,
        path: edge.path,
      })),
      nodes: drawing.nodes.map((drawn, index) => {
        const parts = [labels.state[drawn.node.state]];
        if (drawn.dependsOn.length > 0) {
          parts.push(
            labels.dependsOn.replace(SOURCES_PLACEHOLDER, drawn.dependsOn.join(', ')),
          );
        }
        return {
          // O ENDEREÇO PODE SE REPETIR — a conta compartilhada decide que a
          // primeira declaração vence e continua desenhando as duas caixas —,
          // então a chave do laço leva a posição junto. Sem isso, duas caixas
          // com o mesmo endereço derrubariam a renderização inteira.
          key: `${index}-${drawn.node.id}`,
          id: drawn.node.id,
          state: drawn.node.state,
          label: drawn.node.label,
          // A CASA É DADO, e o que entra é o número da linha de grade — a conta
          // que o transforma em posição mora na folha, onde pode mudar sem tocar
          // nas cinco stacks. Mesma decisão de `--computer-use-mark-x`.
          column: String(drawn.columnLine),
          row: String(drawn.rowLine),
          reading: parts.join(' '),
        };
      }),
    };
  });

  /**
   * A peça se declara ocupada enquanto a execução corre, e em nenhum outro
   * momento — nem quando não há grafo, porque aí não há peça a declarar.
   */
  protected readonly busy = computed(() =>
    this.status() === 'running' && this.view() !== null ? 'true' : null,
  );
}
