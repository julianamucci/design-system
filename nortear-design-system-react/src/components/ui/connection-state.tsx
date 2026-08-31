import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  isRetryScheduled,
  // O VOCABULÁRIO CHEGA COM OUTRO NOME, e é obrigação desta stack: o
  // componente publicado se chama `ConnectionState`, e um import homônimo
  // conflita com a declaração local. Mesmo recurso de `data-table.tsx`, que
  // renomeia `Table` do TanStack pelo mesmo motivo. É apelido de MÓDULO — a
  // prop, o tipo publicado na tabela e o nome que quem consome escreve
  // continuam sendo os do vocabulário compartilhado.
  type ConnectionState as ConnectionStateValue,
} from "@shared/primitives/chat-protocol"

/**
 * A linha que diz se ainda há por onde pedir.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Estado da ligação", que também
 * guarda as seis decisões de acessibilidade. O vocabulário — `ConnectionState`,
 * `isRetryScheduled` — vem de `@shared/primitives/chat-protocol`.
 *
 * NÃO É O ESTADO DA EXECUÇÃO, e a diferença não é de aparência: as duas linhas
 * se parecem de propósito. Aquela descreve o que o agente está fazendo com o
 * que se pediu; esta descreve se ainda há por onde pedir. Uma execução
 * concluída sobre uma ligação caída é um par perfeitamente possível, e é por
 * isso que os dois vocabulários são separados.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: aqui EXISTE região viva, e é a segunda exceção
 * da folha. A regra da família proíbe por padrão, e a proibição vale — um
 * estado que se reanuncia corta a leitura da resposta. Perder a ligação é de
 * outra natureza: não é o passo seguinte de algo que ia bem, é o chão saindo, e
 * tudo o que for escrito daqui em diante não vai a lugar nenhum. Quem não vê a
 * tela não tem outro jeito de descobrir — o silêncio é indistinguível de uma
 * resposta demorada.
 *
 * E A REGIÃO ENVOLVE SÓ A PALAVRA, nunca a raiz. O rótulo carrega uma coisa só
 * e muda no máximo quando o estado muda; a contagem, que se reescreve a cada
 * segundo, fica FORA da região por construção. Região viva na raiz reanunciaria
 * o relógio, que é exatamente a armadilha com que a folha desta família abre.
 *
 * O QUE O COMPONENTE NÃO FAZ: abrir ligação, reconectar, contar o tempo,
 * formatá-lo ou reagendar tentativa. Ele desenha o estado que recebe e avisa
 * que alguém pediu para tentar de novo — mesma divisão de `approval` no
 * `chat-thread` e do estado da execução.
 *
 * A API NÃO DIVERGE do vanilla: os quatro nomes são os mesmos, porque aqui não
 * há estado imperativo para traduzir. O estado entra como dado e sai como
 * desenho.
 */

export interface ConnectionStateLabels {
  /**
   * A palavra de cada estado.
   *
   * É ela que descreve, e não a cor do ponto (decisão 4 da folha): cor sozinha
   * não descreve estado (WCAG 1.4.1), e aqui a cor é a ÚNICA diferença visual
   * entre os três. `Record` completo de propósito — estado novo no vocabulário
   * compartilhado reprova a compilação aqui, em vez de desenhar uma linha em
   * branco que ninguém repara.
   */
  state: Record<ConnectionStateValue, string>
  /**
   * O rótulo da ação em cada estado. Estado sem entrada não oferece ação.
   *
   * Cada um diz O QUE FAZ naquele estado (decisão 5 da folha): apressar a
   * tentativa que já está marcada é outra coisa que começar uma quando não há
   * nenhuma. Botão que troca de função sem trocar de nome é o mesmo botão
   * fazendo coisas diferentes, e quem chega nele por tabulação não tem como
   * saber qual das duas.
   *
   * A ligação de pé fica de fora nas cinco stacks, e é decisão: sobre uma
   * ligação que está funcionando não há o que fazer aqui.
   */
  action?: Partial<Record<ConnectionStateValue, string>>
}

export interface ConnectionStateProps {
  /** Em que pé está a ligação. Quem abre o transporte é quem sabe, e é quem passa. */
  state?: ConnectionStateValue
  /**
   * Quanto falta para a próxima tentativa, JÁ ESCRITO.
   *
   * String, e não segundos: formato de duração é decisão de idioma, e um
   * componente que o formatasse decidiria idioma em cinco lugares diferentes.
   * É a mesma escolha do relógio do estado da execução, com um motivo a mais
   * aqui — ela é vizinha de uma região viva.
   */
  countdown?: string
  labels: ConnectionStateLabels
  /** Alguém pediu para tentar de novo. Abrir a ligação é de quem consome. */
  onRetry?: () => void
  className?: string
}

function ConnectionState({
  state = "connected",
  countdown,
  labels,
  onRetry,
  className,
}: ConnectionStateProps) {
  const actionLabel = labels.action?.[state]

  return (
    // `<p>`, e não `<div>`: é uma frase sobre o que está acontecendo, e o botão
    // é conteúdo de frase. Nenhum papel ARIA na raiz — a região viva é do
    // rótulo, e só dele (decisão 1).
    <p
      data-slot="connection-state"
      className={cn("nds-connection-state", className)}
      data-state={state}
    >
      {/* O PONTO É DECORATIVO (decisão 4). Ele é a leitura rápida para quem vê,
          e sai inteiro do que é lido em voz: a palavra ao lado já diz tudo. */}
      <span
        className="nds-connection-state-dot"
        data-slot="connection-state-dot"
        aria-hidden="true"
      />

      {/* A PALAVRA É A REGIÃO VIVA, e é a única parte que se anuncia (decisão
          1). `role="status"` é polido: entra na fila e nunca corta o que
          estiver sendo lido. E ele está AQUI, e não na raiz, porque este
          elemento carrega uma coisa só — a palavra — e ela muda no máximo
          quando o estado muda. */}
      <span
        className="nds-connection-state-label"
        data-slot="connection-state-label"
        role="status"
      >
        {labels.state[state]}
      </span>

      {/* A CONTAGEM SÓ EXISTE ENQUANTO ALGO TENTA (decisão 3), e quem responde
          é `isRetryScheduled`, do vocabulário compartilhado — não um `if` desta
          stack. "em 5 s" ao lado de "Sem ligação" é um relógio que não corre, e
          quem lê fica esperando por algo que ninguém agendou.

          E ELA NÃO SE ANUNCIA (decisão 2): fica FORA da região viva por
          construção, e ainda leva `aria-hidden`, porque é vizinha dela. */}
      {countdown && isRetryScheduled(state) ? (
        <span
          className="nds-connection-state-countdown"
          data-slot="connection-state-countdown"
          aria-hidden="true"
        >
          {countdown}
        </span>
      ) : null}

      {/* A AÇÃO DIZ O QUE FAZ (decisão 5), e o rótulo é o nome acessível: não há
          `aria-label` separado, porque o texto que se vê já diz o que o botão
          faz — e nome acessível que diverge do texto visível quebra WCAG 2.5.3
          pelo caminho. */}
      {actionLabel ? (
        <Button
          className="nds-connection-state-action"
          data-slot="connection-state-action"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRetry?.()}
        >
          {actionLabel}
        </Button>
      ) : null}
    </p>
  )
}

export { ConnectionState }
