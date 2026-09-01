import type * as React from "react"

import { cn } from "@/lib/utils"
import type {
  FlowEdge,
  FlowNode,
  RunStatus,
  ToolCallState,
} from "@shared/primitives/chat-protocol"
import { resolveFlowGraph } from "@shared/primitives/flow-graph-edges"

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
 * ramifica nem se reencontra, que é literalmente o assunto desta peça.
 *
 * A PEÇA NÃO CALCULA DISPOSIÇÃO. `column` e `row` chegam prontos — quem monta o
 * grafo é quem sabe a forma dele —, e o que a peça faz com eles é deslocar o
 * conjunto para a origem e desenhar. Calcular traria algoritmo de layout para
 * dentro do design system, e algoritmo de layout envelhece por produto (§2 da
 * guideline 17).
 *
 * A CONTA INTEIRA É DE `resolveFlowGraph`, e nada dela é reescrito aqui — nem a
 * normalização, nem o descarte de aresta órfã, nem a curva. Cinco stacks
 * escrevendo o próprio Bézier são cinco desenhos diferentes para o mesmo grafo,
 * e geometria que discorda não aparece em teste: aparece como foto torta.
 *
 * O ESTADO É `ToolCallState` INTEIRO, e não os três da fonte. Lá `done`,
 * `active` e `pending` são três desenhos, e o que se perde é `failed`: um nó de
 * trabalho que quebrou desenha igual a um que terminou.
 *
 * NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família (regra 6 da folha).
 * Quem quer revelar aos poucos passa MENOS nós, e a aresta que perde uma ponta
 * some sozinha. Tirado o contador, some junto o segundo tom de traço que
 * existia só para mostrar a aresta ADIANTE da revelação: sem revelação não há
 * adiante, e todas as arestas desenham iguais.
 *
 * O QUE O COMPONENTE NÃO FAZ: dispor, medir elemento, animar entrada, contar
 * tempo, avançar sozinho, buscar nada. Ele desenha os nós que recebe nas casas
 * que recebe e as arestas que têm as duas pontas.
 *
 * A API NÃO DIVERGE EM NOME NENHUM: `nodes`, `edges`, `status` e `labels` são
 * os mesmos das outras stacks. `className` é a convenção do renderer, e não uma
 * propriedade desta peça — é a forma que esta stack dá ao mesmo `class` que a
 * fonte de verdade já aceita.
 */

export interface FlowGraphLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão. O grafo é mais largo que a conversa, então ele
   * rola, e o que rola é parada de teclado com `tabIndex={0}` — sem nome, quem
   * chega ali ouvindo não sabe onde entrou (regra 6 da §8 da guideline 17).
   * Quem monta é quem sabe o nome: duas peças destas na mesma tela com o mesmo
   * nome são duas paradas indistinguíveis. Um padrão silencioso pareceria
   * gentileza e produziria exatamente isso — o que faz alguém pensar em nomear
   * uma camada que não se vê é a chamada não compilar sem ela.
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
   * é a do rótulo, e uma etiqueta por nó dobraria a largura de toda coluna.
   */
  state: Record<ToolCallState, string>
}

export interface FlowGraphProps {
  /**
   * Os nós, NA ORDEM EM QUE DEVEM SER OUVIDOS.
   *
   * A posição na grade é livre; a ordem nesta lista não é, porque ela é a ordem
   * de leitura (WCAG 1.3.2, decisão 3 da folha). Sem nó nenhum não há grafo, e
   * a peça não desenha coisa alguma.
   */
  nodes: readonly FlowNode[]
  /**
   * As dependências. Aresta cuja ponta não veio na lista de nós é descartada —
   * não é erro, é o grafo mostrado pela metade.
   */
  edges?: readonly FlowEdge[]
  /**
   * Em que pé está a execução que escreve o grafo.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça se
   * declara ocupada. Receber as cinco palavras e perguntar uma coisa só não é
   * achatamento de dado — é a mesma decisão da tela do computador: um booleano
   * na assinatura obrigaria quem consome a traduzir cinco palavras em duas no
   * ponto da chamada, que é onde a perda aconteceria.
   */
  status?: RunStatus
  labels: FlowGraphLabels
  className?: string
}

function FlowGraph({
  nodes,
  edges = [],
  status = "idle",
  labels,
  className,
}: FlowGraphProps) {
  const drawing = resolveFlowGraph(nodes, edges)
  // SEM NÓ NÃO HÁ GRAFO, e devolver moldura vazia seria pior que devolver nada:
  // a camada que rola é parada de teclado, e uma parada de teclado que leva a
  // uma caixa vazia é ruído com nome.
  if (!drawing) return null

  return (
    // OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
    // fluxo troca de nó mais depressa do que se lê, e narrar cada troca é a
    // mesma armadilha do relógio ao vivo.
    <div
      className={cn("nds-flow-graph", className)}
      data-slot="flow-graph"
      aria-busy={status === "running" ? true : undefined}
    >
      {/* A CAMADA QUE ROLA, com o PAR COMPLETO — e ele é o par: `tabIndex` sem
          papel deixaria uma parada de teclado anônima, e `aria-label` sobre um
          `div` sem papel é DESCARTADO pelo navegador (`aria-prohibited-attr`),
          que foi exatamente o defeito de duas peças desta casa. `group` e não
          `region`: uma página de documentação tem dezenas destas, e `region`
          com nome vira dezenas de marcos homônimos. */}
      <div
        className="nds-flow-graph-viewport"
        data-slot="flow-graph-viewport"
        tabIndex={0}
        role="group"
        aria-label={labels.region}
      >
        <div
          className="nds-flow-graph-canvas"
          data-slot="flow-graph-canvas"
          // AS DUAS CONTAGENS SÃO DADO, e entram por propriedade personalizada:
          // não existe token de "quatro colunas", e `repeat()` aceita a
          // substituição de propriedade personalizada no contador mas não
          // aceita `calc()` — o número tem de chegar pronto.
          style={
            {
              "--flow-graph-columns": drawing.columns,
              "--flow-graph-rows": drawing.rows,
            } as React.CSSProperties
          }
        >
          {/* AS ARESTAS, fora do que é lido em voz e numa camada só (decisão
              1). Curva não se lê; o que se lê é a frase dentro de cada nó, e
              ela diz a mesma relação em palavras. `focusable="false"` porque o
              `<svg>` ainda é parada de tabulação em motores antigos mesmo
              escondido. O `viewBox` trabalha em CASAS da grade e é esticado
              sobre ela: é o que permite a conta das curvas ser feita sem medir
              elemento nenhum. */}
          <svg
            className="nds-flow-graph-edges"
            data-slot="flow-graph-edges"
            viewBox={`0 0 ${drawing.columns} ${drawing.rows}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {drawing.edges.map((edge, index) => (
              <path
                // O endereço de uma aresta é o par, e o índice desempata o par
                // repetido: quem declara a mesma dependência duas vezes recebe
                // as duas curvas, e não um aviso do renderer.
                key={`${edge.from}-${edge.to}-${index}`}
                className="nds-flow-graph-edge"
                data-slot="flow-graph-edge"
                d={edge.path}
                // Em espessura de tela, apesar da distorção do `viewBox`
                // esticado.
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* OS NÓS. `<ol>` e não `<ul>`: a ordem de declaração é a ordem de
              leitura, e é ela que quem monta escolheu (decisão 3). A posição na
              grade não é lida por ninguém. */}
          <ol className="nds-flow-graph-nodes" data-slot="flow-graph-nodes">
            {drawing.nodes.map((drawn, index) => {
              // A LEITURA DO GRAFO: a palavra do estado e os nós de que este
              // depende. É o que faz o grafo inteiro se reconstruir de ouvido,
              // porque cada aresta é dita exatamente uma vez — só as que
              // CHEGAM (decisões 1 e 2).
              const reading = [labels.state[drawn.node.state]]
              if (drawn.dependsOn.length > 0) {
                reading.push(
                  labels.dependsOn.replace("{sources}", drawn.dependsOn.join(", ")),
                )
              }

              return (
                <li
                  // Id repetido é dado ruim, e a conta compartilhada já decidiu
                  // que a PRIMEIRA declaração vence sem sumir com a segunda
                  // caixa. O índice é o que impede as duas caixas de
                  // disputarem a mesma chave.
                  key={`${drawn.node.id}-${index}`}
                  className="nds-flow-graph-node"
                  data-slot="flow-graph-node"
                  data-state={drawn.node.state}
                  data-node-id={drawn.node.id}
                  // A CASA É DADO, e o que entra é o número da linha de grade —
                  // a conta que o transforma em posição mora na folha, onde
                  // pode mudar sem tocar nas cinco stacks. Mesma decisão de
                  // `--computer-use-mark-x`.
                  style={
                    {
                      "--flow-graph-node-column": drawn.columnLine,
                      "--flow-graph-node-row": drawn.rowLine,
                    } as React.CSSProperties
                  }
                >
                  {/* A MARCA É DECORATIVA e carrega FORMA, não só cor (decisão
                      5): cheia, anel, anel interrompido, cruz. A palavra do
                      estado está logo abaixo, para quem não vê nenhuma das
                      quatro. */}
                  <span
                    className="nds-flow-graph-node-marker"
                    data-slot="flow-graph-node-marker"
                    aria-hidden="true"
                  />

                  {/* O rótulo inteiro, sem corte. A folha resolve a quebra — um
                      nó pela metade é uma instrução pela metade, e reticências
                      escondem justamente o que distingue dois ramos. */}
                  <span
                    className="nds-flow-graph-node-label"
                    data-slot="flow-graph-node-label"
                  >
                    {drawn.node.label}
                  </span>

                  <span className="nds-sr-only" data-slot="flow-graph-node-reading">
                    {reading.join(" ")}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}

export { FlowGraph }
