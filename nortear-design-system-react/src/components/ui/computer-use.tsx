import type * as React from "react"

import { cn } from "@/lib/utils"
import type { ComputerStep, RunStatus } from "@shared/primitives/chat-protocol"

/**
 * A tela que o agente está dirigindo, com a marca da ação em curso e o rastro
 * de onde ela veio.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Tela do computador", que também
 * guarda as nove decisões de acessibilidade. O vocabulário — `ComputerStep`,
 * `RunStatus` — vem de `@shared/primitives/chat-protocol`.
 *
 * POR QUE ELA É PEÇA, e não composição das irmãs. É a primeira da família cujo
 * eixo é o ESPAÇO. `tool-group` desenha uma lista, `agent-plan` desenha uma
 * lista, `terminal-block` desenha linhas: todas ordenam no tempo, e a posição
 * de cada item é consequência da ordem. Aqui a posição é DADO — o ponto que o
 * agente clicou —, e nada no design system posiciona dado em coordenada sobre
 * uma superfície que ele não conhece. O que falta para compor isto não é uma
 * classe, é um sistema de coordenadas.
 *
 * A TELA É ESPAÇO, e a peça nunca a cria. Captura de tela de sistema real traz
 * marca registrada e conteúdo de terceiro (§1 da guideline 17), que é a mesma
 * razão pela qual os logotipos de modelo não entram no repositório. Quem
 * consome passa o nó, como `avatar` já faz na mensagem — e o TEXTO ALTERNATIVO
 * dele é de quem consome, porque a peça não é dona daquele elemento. A
 * orientação está escrita na decisão 6 da folha: com a legenda ao lado dizendo
 * o que está acontecendo, a captura é decorativa e vai com texto alternativo
 * vazio; quando ela carrega o que a legenda não diz, o texto é obrigatório.
 *
 * O ESTADO É `RunStatus`, INTEIRO, e é usado para uma pergunta só: a execução
 * ainda corre? É ela que decide se a peça se declara ocupada e se a marca ativa
 * pulsa — marca que pulsa depois do fim é o cursor que fica mentindo do bloco
 * de terminal. Receber as cinco palavras e perguntar uma coisa só NÃO é o
 * achatamento que a §5.3 da guideline condena: aquele critério é sobre o modelo
 * de DADOS, e o que ele condena é a informação se perder na entrada. Aqui ela
 * entra inteira, vinda do mesmo `RunStatus` que alimenta o estado da execução
 * logo acima na tela; um booleano na assinatura obrigaria quem consome a
 * traduzir cinco palavras em duas no ponto da chamada, que é exatamente onde a
 * perda aconteceria.
 *
 * O PASSO NÃO TEM ESTADO, e isso é do vocabulário: o que está acontecendo vale
 * para a SESSÃO, não por passo. Um passo com estado próprio faria a peça
 * desenhar cinco marcas diferentes sobre uma tela que ela não conhece — cor
 * sobre conteúdo de terceiro, que é a codificação que a legenda existe para não
 * precisar.
 *
 * O QUE O COMPONENTE NÃO FAZ: dirigir, clicar, avançar sozinho, capturar tela,
 * agendar quadro, contar tempo, rolar. Ele desenha o endereço, a tela que
 * recebe, as marcas dos passos que recebe e a legenda do passo ativo. Avançar é
 * de quem consome — a peça não agenda nada (§2 da guideline 17).
 *
 * A API DIVERGE NUM NOME SÓ, e a divergência é de FRAMEWORK: a tela entra como
 * `React.ReactNode`, e não como `HTMLElement`. Não há fonte de verdade para
 * escolher entre as duas — `HTMLElement` é o que existe onde não há renderer, e
 * `ReactNode` é o que existe aqui, pelo mesmo precedente do `avatar` da
 * mensagem. `url`, `steps`, `activeIndex`, `status` e `labels` são os mesmos
 * das outras stacks; `className` é a convenção do renderer, e não uma
 * propriedade desta peça.
 */

/**
 * Quantas marcas o rastro mostra, contando a ativa.
 *
 * Três, e o número tem motivo: duas marcas são um segmento, e um segmento é uma
 * direção — com duas não dá para saber se o agente estava subindo ou descendo a
 * tela. Com três há duas pernas, que é o mínimo que desenha um caminho. Mais do
 * que isso e o rastro passa a cobrir a tela que ele deveria estar apontando.
 *
 * Não é opção: o número é desenho, e quem consome que quisesse outro estaria
 * pedindo outra peça. Quem tiver menos de três passos vê menos marcas, que é o
 * começo de toda sessão.
 */
const TRAIL_LENGTH = 3

export interface ComputerUseLabels {
  /**
   * A palavra que apresenta o endereço, e que só quem ouve recebe.
   *
   * Sem os pontos de janela — que a folha recusou, e diz por quê —, o que diz
   * "isto é um endereço" é a posição e o tratamento, e nada disso chega a quem
   * não vê a barra. Uma cadeia solta no começo da figura seria texto sem
   * assunto (decisão 8 da folha).
   */
  address: string
  /**
   * O molde da contagem. `{index}` vira a posição do passo e `{total}` vira
   * quantos são.
   *
   * Molde, e não texto pronto, pela mesma divisão do código de saída do bloco
   * de terminal: a palavra que liga os dois números é do idioma, e os números
   * são dado. O `{index}` já chega contado a partir de um — quem lê conta a
   * partir de um, e deixar a conversão para o molde a espalharia por três
   * idiomas.
   */
  position: string
}

export interface ComputerUseProps {
  /** O endereço da tela que está sendo dirigida. */
  url: string
  /**
   * A tela, que é ESPAÇO de quem consome.
   *
   * Obrigatória, e é o que a fonte também decide: a moldura não tem nada para
   * mostrar por baixo do rastro até que alguém a passe. A peça não cria imagem
   * nenhuma (§1 da guideline 17), e não escreve nem apaga o texto alternativo
   * do que recebe.
   */
  screen: React.ReactNode
  /**
   * Os passos da sessão, na ordem em que aconteceram.
   *
   * Sem passo nenhum não há rastro nem legenda: sobra a moldura com o endereço
   * e a tela, que é o que existe antes de o agente tocar em qualquer coisa.
   */
  steps?: readonly ComputerStep[]
  /**
   * Qual passo está acontecendo agora.
   *
   * Índice, e não fatia — e a diferença importa. A revelação aos poucos é
   * recorte de quem consome, como em toda esta família; mas a legenda diz
   * "3 de 6", e o total não sobrevive a uma fatia. Fora de alcance é preso ao
   * alcance, para que incrementar além do último passo continue apontando para
   * um passo de verdade.
   */
  activeIndex?: number
  /**
   * Em que pé está a sessão. Quem dirige é quem sabe, e é quem passa.
   *
   * Decide se a peça se declara ocupada e se a marca ativa pulsa. Não decide
   * cor de marca: estado por cor sobre uma tela de terceiro é a codificação que
   * a legenda substitui.
   */
  status?: RunStatus
  labels: ComputerUseLabels
  className?: string
}

function ComputerUse({
  url,
  screen,
  steps = [],
  activeIndex: requestedIndex = 0,
  status = "idle",
  labels,
  className,
}: ComputerUseProps) {
  // O ÍNDICE É PRESO AO ALCANCE, e não recusado: quem avança uma sessão
  // incrementa um número, e o passo seguinte ao último é o último. Recusar
  // deixaria a tela sem marca justamente quando a sessão acabou de terminar.
  const activeIndex = Math.min(Math.max(requestedIndex, 0), Math.max(steps.length - 1, 0))

  const from = Math.max(activeIndex - (TRAIL_LENGTH - 1), 0)
  const trail = steps.slice(from, activeIndex + 1)
  const activeStep = steps.length > 0 ? steps[activeIndex] : undefined

  return (
    // OCUPADO ENQUANTO CORRE, e só (decisão 1, regra 1 da §8 da guideline 17).
    // Nada aqui é `aria-live`: a legenda troca a cada passo, e uma tela dirigida
    // por agente troca de passo mais depressa do que se lê — anunciar cada uma
    // seria a rajada da saída de terminal com outro nome.
    //
    // `<figure>` e `<figcaption>`, e nunca `role="region"` (decisão 4): marco de
    // página por tela numa conversa é uma lista de marcos que ninguém navega, e
    // figura ainda amarra a legenda à imagem que ela descreve.
    <figure
      data-slot="computer-use"
      className={cn("nds-computer-use", className)}
      data-status={status}
      aria-busy={status === "running" ? true : undefined}
    >
      {/* O ENDEREÇO.

          A monoespaçada vem de `.nds-font-mono`, a utilitária que já existe em
          `typography.css`. Ela ANDA NA MARCAÇÃO, e por isso some em silêncio
          quando alguém copia a árvore pela metade: a `play` a afirma. */}
      <p
        className="nds-computer-use-address nds-font-mono"
        data-slot="computer-use-address"
      >
        {/* A PALAVRA QUE SÓ QUEM OUVE RECEBE (decisão 8). Ela não é enfeite de
            leitor de tela: é o que a barra diz pelo desenho e não conseguiria
            dizer em voz. */}
        <span className="nds-sr-only">{labels.address}</span>

        {/* `lang="en"`: um endereço é máquina — servidor, caminho, parâmetro.
            Sem isto, a voz do leitor em pt-BR tenta pronunciá-lo como português
            (WCAG 3.1.2). Mesma decisão do comando no bloco de terminal. */}
        <span
          className="nds-computer-use-url nds-truncate"
          data-slot="computer-use-url"
          lang="en"
        >
          {url}
        </span>
      </p>

      {/* O QUADRO. Ele RECORTA, e não rola (decisão 5): uma tela que rolasse
          seria uma segunda camada rolável dentro de uma conversa que já rola. */}
      <div className="nds-computer-use-screen" data-slot="computer-use-screen">
        {/* A tela chega montada por quem consome, e entra como NÓ. Sem marcação
            em cadeia não há o que sanitizar. */}
        <div className="nds-computer-use-surface" data-slot="computer-use-surface">
          {screen}
        </div>

        {/* O RASTRO É UMA CAMADA SÓ, e é ela que sai inteira do que é lido em
            voz (decisão 2) — um `aria-hidden` para a camada, e não um por
            marca. Posição numa imagem não chega a quem não a vê; o que chega é
            a legenda, logo abaixo. */}
        {steps.length > 0 ? (
          <span
            className="nds-computer-use-trail"
            data-slot="computer-use-trail"
            aria-hidden="true"
          >
            {trail.map((step, i) => (
              <span
                key={step.id ?? String(from + i)}
                className="nds-computer-use-mark"
                data-slot="computer-use-mark"
                data-active={from + i === activeIndex ? "true" : undefined}
                // O PONTO É DADO, e entra em propriedade personalizada: não
                // existe token de "62%", e a regra do repositório reserva
                // `style` para mecânica e para propriedade personalizada. A
                // conta de porcentagem fica na folha, que é onde ela pode mudar
                // sem tocar nas cinco stacks.
                style={
                  {
                    "--computer-use-mark-x": step.x,
                    "--computer-use-mark-y": step.y,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        ) : null}
      </div>

      {/* A LEGENDA.

          Ela é a peça para quem ouve (decisão 2), e é `<figcaption>` porque a
          legenda de uma figura É o nome dela: sem isso a tela seria uma imagem
          anônima no meio da conversa. Sem passo nenhum não há legenda — não há
          o que dizer, e uma legenda vazia daria à figura um nome em branco. */}
      {activeStep ? (
        <figcaption
          className="nds-computer-use-caption"
          data-slot="computer-use-caption"
        >
          {/* O VERBO É O QUE DESCREVE, e por isso carrega o peso e a cor de
              texto — mesma divisão do nome e do detalhe da chamada de
              ferramenta. */}
          <span className="nds-computer-use-action" data-slot="computer-use-action">
            {activeStep.action}
          </span>

          <span
            className="nds-computer-use-target nds-truncate"
            data-slot="computer-use-target"
          >
            {activeStep.target}
          </span>

          {/* A CONTAGEM É NÚMERO, e chega a quem ouve: ela não se reescreve
              sozinha — quem a muda é um passo novo —, então não é o relógio de
              que esta folha se defende. É também a única parte da peça que diz
              que existe uma SEQUÊNCIA: o rastro diz isso pelo desenho, e o
              desenho não é lido. */}
          <span
            className="nds-computer-use-position"
            data-slot="computer-use-position"
          >
            {labels.position
              .replace("{index}", String(activeIndex + 1))
              .replace("{total}", String(steps.length))}
          </span>
        </figcaption>
      ) : null}
    </figure>
  )
}

export { ComputerUse }
