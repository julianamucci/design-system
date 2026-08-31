import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * O lugar da resposta enquanto ela não chegou.
 *
 * Desenho em `nds/agent-run.css`, no bloco do indicador de geração, que também
 * guarda as três decisões de acessibilidade.
 *
 * NÃO É O ESTADO DA EXECUÇÃO, e a diferença é de lugar antes de ser de desenho.
 * Aquela é uma linha de informação com ação — diz em que pé está a resposta e
 * oferece o que fazer a respeito —, e mora FORA da resposta. Este é o lugar da
 * resposta enquanto ela não chegou, e mora ONDE o texto vai aparecer. Quem
 * escolhe entre os dois escolhe pelo lugar, não pela aparência.
 *
 * A EXCEÇÃO DA FAMÍLIA: aqui existe região viva. A folha inteira proíbe região
 * viva porque um número que se reanuncia torna a tela impossível de ouvir; aqui
 * vale porque o indicador anuncia UMA vez que a resposta começou a vir, e
 * depois some. É a diferença entre avisar que algo começou e narrar cada passo.
 *
 * O MOVIMENTO REDUZIDO é da folha, e só dela. A camada de tokens zera a duração
 * e o bloco de mídia deixa os pontos parados e visíveis. Reimplementar isso aqui
 * seria uma segunda verdade sobre a mesma preferência, e as duas divergiriam.
 *
 * O QUE O COMPONENTE NÃO FAZ: aparecer, sumir, contar o tempo ou oferecer o que
 * interromper. Ele não sabe quando o primeiro trecho de texto chegou — só quem
 * monta a conversa sabe —, e por isso sumir é responsabilidade de quem consome.
 * Indicador que fica é indicador que mente.
 */

/**
 * Três, e não uma opção.
 *
 * O atraso escalonado que faz três pontos parecerem uma ONDA — em vez de três
 * pontos piscando juntos — está escrito na folha para o segundo e o terceiro
 * filho. Um quarto ponto pulsaria junto com o primeiro, e a opção existiria
 * para produzir um desenho que o sistema não desenha.
 */
const DOT_COUNT = 3

export interface ThinkingIndicatorProps
  extends Omit<React.ComponentProps<"p">, "children"> {
  /**
   * A frase que diz o que está acontecendo.
   *
   * Sem valor padrão de propósito: o padrão escondido seria uma frase numa
   * língua só, e esta é a única coisa que chega a quem ouve a tela.
   */
  label: string
}

function ThinkingIndicator({ label, className, ...props }: ThinkingIndicatorProps) {
  return (
    // Os atributos fixos vêm DEPOIS do repasse: `data-slot` endereça a peça nas
    // stories e nas docs, e a região de estado é a decisão da peça — nenhum dos
    // dois é de quem consome.
    <p
      {...props}
      data-slot="thinking-indicator"
      className={cn("nds-thinking", className)}
      // Região de estado: anuncia uma vez, sem cortar o que estiver sendo lido.
      role="status"
    >
      {/* Os pontos são DESENHO, e saem do que é lido em voz: animação não se
          lê, e três pontos anunciados a cada quadro tornariam a tela
          impossível de ouvir. */}
      <span className="nds-thinking-dots" aria-hidden="true">
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <span key={index} />
        ))}
      </span>

      {/* A frase, escondida do olho e presente para o ouvido. Ela é o conteúdo
          da região, e não um rótulo dela: rótulo substituiria o conteúdo no
          anúncio, e aqui o conteúdo é a informação inteira. */}
      <span className="nds-sr-only">{label}</span>
    </p>
  )
}

export { ThinkingIndicator }
