import type { CSSProperties } from "react"
import type { VariantProps } from "class-variance-authority"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TokenUsage } from "@shared/primitives/chat-protocol"
import {
  budgetLevel,
  usedPercent,
  usedTokens,
  type BudgetLevel,
} from "@shared/primitives/token-budget"

/**
 * Quanto da janela de contexto já foi usada.
 *
 * Desenho em `nds/medicao.css`, no bloco "Uso da janela de contexto", que
 * também guarda as cinco decisões de acessibilidade. A CONTA — fração, limiar
 * de aviso, nível — vem de `@shared/primitives/token-budget`; o dado vem de
 * `TokenUsage`, em `@shared/primitives/chat-protocol`.
 *
 * É A PEÇA QUE DÁ NOME AO EIXO DA FAMÍLIA 5: o mesmo número em formas
 * diferentes. Anel, barra e texto desenham a MESMA medição, e a forma é
 * escolha de espaço, não de significado — quem troca de forma não troca de
 * informação.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: o que muda a cada quadro é DECORATIVO, e o
 * número é TEXTO. O medidor não tem papel ARIA nem valor, não há `aria-live` em
 * lugar nenhum, e nada aqui se reanuncia — um contador que se reanuncia torna a
 * tela impossível de ouvir. É a mesma decisão do contador do campo de mensagem,
 * do relógio do reprodutor de mídia e do medidor de voz.
 *
 * SEM TETO NÃO HÁ FRAÇÃO, SÓ CONTAGEM. O `limit` é opcional no vocabulário
 * porque nem sempre se sabe qual é, e a peça desenha os dois casos: com teto
 * mostra a fração e o nível; sem teto mostra a contagem e diz que não há teto
 * conhecido — e NÃO desenha medidor nenhum, porque um anel vazio lê como zero
 * por cento, que é o oposto de "não se sabe quanto cabe".
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar consumo, contar token, formatar duração,
 * decidir o que fazer quando a janela enche. Ele recebe a medição e desenha —
 * §2 da guideline 17.
 *
 * A API NÃO DIVERGE do resto do sistema: os quatro nomes são os mesmos em todas
 * as stacks. A peça é só leitura — não há evento nem retorno para traduzir —, e
 * é por isso que a página de documentação não sobrescreve nenhuma linha da
 * tabela de propriedades.
 */

/**
 * A forma com que o mesmo número se apresenta.
 *
 * `ring` cabe num trilho estreito ao lado de outros controles; `bar` toma a
 * largura e serve a um painel; `text` some com o desenho e fica só com o
 * número, para quando o espaço é uma linha de rodapé. Nenhuma das três muda o
 * que é dito, nem o que é lido em voz.
 */
export type ContextDisplayForm = "ring" | "bar" | "text"

/** Na ordem do mais compacto para o mais nu. */
export const CONTEXT_DISPLAY_FORMS: readonly ContextDisplayForm[] = [
  "ring",
  "bar",
  "text",
] as const

export interface ContextDisplayLabels {
  /**
   * De que número se trata.
   *
   * "62%" sozinho não diz de quê. O título não aparece na tela — o desenho já
   * dá o contexto a quem vê — e é o que responde a pergunta para quem ouve.
   */
  title: string
  /**
   * A palavra de cada nível.
   *
   * É ela que descreve, e não a cor do medidor: cor sozinha não descreve estado
   * (WCAG 1.4.1). `Record` completo de propósito — nível novo no primitivo
   * compartilhado reprova a compilação aqui, em vez de desenhar uma etiqueta em
   * branco que ninguém repara.
   */
  level: Record<BudgetLevel, string>
  /** Liga o consumido ao teto: dezenove mil DE trinta e dois mil. */
  of: string
  /** O que está sendo contado. */
  unit: string
  /**
   * Quando não se sabe o teto.
   *
   * Sem esta palavra o caso sem teto pareceria uma medição incompleta. Com ela,
   * a ausência de fração vira informação: o número é uma contagem, e não uma
   * fração que ficou pela metade.
   */
  unbounded: string
}

export interface ContextDisplayProps {
  /** A medição. Quem conta é quem sabe, e é quem passa. */
  usage: TokenUsage
  /** Como desenhar o mesmo número. */
  form?: ContextDisplayForm
  labels: ContextDisplayLabels
  className?: string
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do `badge`: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
  normal: "default",
  warning: "warning",
  critical: "destructive",
}

/**
 * O medidor daquela forma, ou nada quando a forma não desenha medidor.
 *
 * O MEDIDOR É DECORATIVO (decisão 1 da folha), e sai inteiro do que é lido em
 * voz: o número ao lado já diz tudo, e repeti-lo em desenho não acrescenta nada
 * a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um segundo portador do
 * mesmo número o faria ser lido duas vezes.
 */
function ContextDisplayMeter({
  form,
  percent,
}: {
  form: ContextDisplayForm
  percent: number
}) {
  if (form === "text") return null

  // Valor de RUNTIME por custom property, como o progresso do anexo já faz. O
  // que entra é o mesmo inteiro que o texto mostra, e não a fração crua: um
  // anel cheio ao lado de "99%" seriam duas respostas para uma pergunta.
  //
  // A propriedade fica no MEDIDOR nas duas formas, e na barra ela fica no
  // TRILHO e não no preenchimento — custom property herda, e o preenchimento a
  // lê de graça. Com ela sempre no mesmo elemento, quem lê o desenho não
  // precisa saber qual forma está montada para achar o número.
  const style = { "--nds-context-used": String(percent) } as CSSProperties

  if (form === "ring") {
    return (
      <span
        className="nds-context-display-ring"
        data-slot="context-display-meter"
        aria-hidden="true"
        style={style}
      />
    )
  }

  return (
    <span
      className="nds-context-display-bar"
      data-slot="context-display-meter"
      aria-hidden="true"
      style={style}
    >
      <span className="nds-context-display-bar-fill" />
    </span>
  )
}

function ContextDisplay({
  usage,
  form = "ring",
  labels,
  className,
}: ContextDisplayProps) {
  // A CONTA SAI DO PRIMITIVO, e não de um `if` daqui: `null` é a resposta de
  // que não há teto, e é a mesma resposta nas cinco stacks. Escrita aqui, uma
  // delas trataria teto zero como teto e desenharia uma fração infinita.
  const percent = usedPercent(usage)
  const level = budgetLevel(usage)
  const used = usedTokens(usage)

  return (
    // `<p>`, e não `<div>`: é uma frase sobre uma medição, e a etiqueta de nível
    // é conteúdo de frase. Nenhum papel ARIA, nenhuma região viva (decisão 1).
    <p
      data-slot="context-display"
      className={cn("nds-context-display", className)}
      data-form={form}
      // Sem teto não há nível, e o atributo fica FORA — em vez de sair como uma
      // palavra vazia que a folha ainda tentaria colorir.
      data-level={level ?? undefined}
    >
      {/* O NÚMERO TEM NOME (decisão 4). Ele não aparece na tela: quem vê já sabe
          do que se trata pelo lugar em que a peça está, e quem ouve não sabe. */}
      <span className="nds-sr-only" data-slot="context-display-title">
        {labels.title}
      </span>

      {/* SEM TETO NÃO SE DESENHA MEDIDOR (decisão 5). */}
      {percent === null ? null : (
        <ContextDisplayMeter form={form} percent={percent} />
      )}

      {/* O VALOR é sempre o maior número disponível: a fração quando há teto, a
          contagem quando não há. O que muda entre os dois casos é o que se pode
          dizer, e não o lugar onde se diz. */}
      <span
        className="nds-context-display-value"
        data-slot="context-display-value"
      >
        {percent === null
          ? `${used.toLocaleString()} ${labels.unit}`
          : `${percent}%`}
      </span>

      {/* E O DETALHE é sempre o que qualifica o valor: o teto quando ele existe,
          e a notícia de que não existe quando não existe. */}
      <span
        className="nds-context-display-detail"
        data-slot="context-display-detail"
      >
        {percent === null
          ? labels.unbounded
          : `${used.toLocaleString()} ${labels.of} ${usage.limit!.toLocaleString()} ${labels.unit}`}
      </span>

      {/* O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir.
          Ele aparece SEMPRE que há teto, inclusive com folga: uma peça que só
          falasse quando a notícia é ruim deixaria a boa notícia indistinguível
          de uma medição que não chegou.

          O `data-slot` da etiqueta é sobrescrito para o desta peça, como o
          plano do agente e a fila de envio já fazem. */}
      {level ? (
        <Badge
          className="nds-context-display-level"
          data-slot="context-display-level"
          variant={LEVEL_VARIANT[level]}
        >
          {labels.level[level]}
        </Badge>
      ) : null}
    </p>
  )
}

export { ContextDisplay }
