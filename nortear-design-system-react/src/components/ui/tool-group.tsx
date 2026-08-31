import { useRef } from "react"

import { cn } from "@/lib/utils"
import type { ChatToolCall, ToolCallState } from "@shared/primitives/chat-protocol"
import {
  summarizeToolCalls,
  toolCallBadgeClass,
} from "@shared/primitives/tool-group-summary"

/**
 * O que o agente fez para responder, reunido num bloco só.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Grupo de chamadas de ferramenta",
 * que também guarda as cinco decisões de acessibilidade. O vocabulário —
 * `ChatToolCall`, `ToolCallState` — vem de `@shared/primitives/chat-protocol`;
 * o que o resumo diz sai de `@shared/primitives/tool-group-summary`.
 *
 * AS DECISÕES QUE GOVERNAM A PEÇA
 *
 * 1. É UM `<details>` DE VERDADE, e não uma caixa imitada com `aria-expanded`.
 *    O navegador já dá o botão, o estado de expansão e o teclado — e dá tudo
 *    isso de graça, sem uma linha de ARIA escrita à mão que possa envelhecer
 *    errado.
 * 2. NASCE RECOLHIDO, e o resumo diz em palavra o que há dentro, inclusive que
 *    algo falhou. Um grupo fechado que esconde uma falha é uma falha que
 *    ninguém vê. A saída NÃO é forçar a abertura: isso brigaria com quem
 *    acabou de fechar, e ninguém fecha uma caixa duas vezes de bom humor.
 * 3. NÃO É REGIÃO VIVA. As chamadas chegam enquanto a resposta é gerada logo
 *    abaixo, e anunciar cada uma corta a leitura do que importa.
 * 4. O ESTADO É PALAVRA, em `.nds-badge`, nunca só cor ou ícone (WCAG 1.4.1).
 *    A cor da etiqueta é reforço, e some para quem não a percebe.
 * 5. A CHAMADA QUE ESPERA UMA PESSOA NÃO FICA AQUI DENTRO. Pedir autorização
 *    dentro de uma caixa fechada é pedir sem mostrar. Quem separa é quem
 *    consome — `splitWaitingCalls` faz a conta —, e não este componente: um
 *    componente que filtrasse sozinho apagaria da tela um dado que recebeu.
 *
 * `tool-error` DO CATÁLOGO É UM ESTADO DAQUI, e não outra peça: `ToolCallState`
 * já separa `failed`, e a chamada que falhou desenha diferente sem virar outro
 * componente.
 *
 * O QUE O COMPONENTE NÃO FAZ: executar ferramenta, repetir chamada, decidir o
 * que uma falha significa ou tirar alguém da lista. Ele desenha as chamadas que
 * recebe e avisa quando alguém abre ou fecha.
 */

export interface ToolGroupLabels {
  /**
   * O título do resumo, a partir da contagem.
   *
   * FUNÇÃO, e não texto pronto: plural é decisão de idioma, e o componente que
   * escolhesse entre singular e plural escolheria por cinco idiomas de uma vez.
   * É a mesma razão pela qual o relógio do estado da execução chega já escrito.
   */
  title: (count: number) => string
  /**
   * A palavra que o RESUMO mostra sobre o conjunto.
   *
   * `Record` completo de propósito — estado novo no vocabulário compartilhado
   * reprova a compilação aqui, em vez de desenhar uma etiqueta em branco que
   * ninguém repara.
   */
  summary: Record<ToolCallState, string>
  /** A palavra de cada chamada na lista. Mesmas quatro chaves, outra escala. */
  call: Record<ToolCallState, string>
}

export interface ToolGroupProps {
  /** As chamadas que o grupo desenha, na ordem em que aconteceram. */
  calls: ChatToolCall[]
  labels: ToolGroupLabels
  /**
   * A caixa começa aberta.
   *
   * O padrão é fechada (decisão 2): são detalhes de execução, e não a resposta.
   */
  open?: boolean
  /** Alguém abriu ou fechou a caixa, e o novo estado vem junto. */
  onOpenChange?: (open: boolean) => void
  className?: string
}

function ToolGroup({
  calls,
  labels,
  open = false,
  onOpenChange,
  className,
}: ToolGroupProps) {
  // O RESUMO DIZ O QUE HÁ DENTRO (decisão 2), e quem decide o quê é o primitivo
  // compartilhado: se a escolha morasse aqui, as cinco stacks escreveriam cinco
  // versões dela, e uma discordaria justamente no caso em que a resposta é
  // menos óbvia — uma falha ao lado de algo que ainda corre.
  const summaryState = summarizeToolCalls(calls).state

  // O ÚLTIMO VALOR RELATADO, e a guarda não é zelo: o navegador enfileira um
  // `toggle` quando o atributo `open` é escrito, e aqui a marcação é
  // declarativa, então isso acontece no PRIMEIRO QUADRO. Sem a guarda, um grupo
  // que nasce aberto avisaria que alguém o abriu — e ninguém abriu. Começa no
  // valor com que a caixa nasceu, que é exatamente o estado que não se relata.
  const lastReported = useRef(open)

  return (
    // `<details>` (decisão 1). Nenhum papel ARIA e nenhuma região viva
    // (decisão 3) — quem quiser anunciar põe a região por fora.
    <details
      data-slot="tool-group"
      className={cn("nds-tool-group", className)}
      open={open}
      // O evento do próprio elemento, e não um `click` no resumo: o navegador
      // abre e fecha a caixa por teclado, por busca na página e por script, e
      // só o `toggle` vê os três.
      onToggle={(event) => {
        const next = event.currentTarget.open
        if (next === lastReported.current) return
        lastReported.current = next
        onOpenChange?.(next)
      }}
    >
      <summary
        className="nds-tool-group-summary"
        data-slot="tool-group-summary"
      >
        {/* A SETA QUE GIRA COM O ESTADO DA CAIXA. Ela existe porque o
            `display: flex` do resumo tira o marcador que o navegador daria — e
            tira em engine, não em todas. O ícone do sistema entra no lugar,
            `aria-hidden` porque repete em desenho o que o próprio controle já
            anuncia. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="nds-icon nds-tool-group-icon"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>

        <span className="nds-tool-group-title" data-slot="tool-group-title">
          {labels.title(calls.length)}
        </span>

        <span
          className={toolCallBadgeClass(summaryState)}
          data-slot="tool-group-state"
        >
          {labels.summary[summaryState]}
        </span>
      </summary>

      <ol className="nds-tool-group-list" data-slot="tool-group-list">
        {calls.map((call, index) => (
          <li
            key={call.id ?? `${call.name}-${index}`}
            className="nds-tool-call"
            data-slot="tool-call"
            data-state={call.state}
            // O endereço vai para o DOM quando existe: é por ele que quem
            // atualiza uma chamada em andamento acha a linha certa quando duas
            // têm o mesmo nome.
            data-call-id={call.id}
          >
            <span className="nds-tool-call-name" data-slot="tool-call-name">
              {call.name}
            </span>

            <span
              className={toolCallBadgeClass(call.state)}
              data-slot="tool-call-state"
            >
              {labels.call[call.state]}
            </span>

            {/* Sem detalhe não há parágrafo: um `<p>` vazio ocuparia a linha
                inteira da grade e abriria um vão que parece defeito de
                espaçamento. */}
            {call.detail ? (
              <p
                className="nds-tool-call-detail"
                data-slot="tool-call-detail"
              >
                {call.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </details>
  )
}

export { ToolGroup }
