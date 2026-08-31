import { useMemo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import approvalTranslations from "@shared/content/approval-card/translations.json"
import {
  APPROVAL_EXAMPLE_CHOICES,
  APPROVAL_SCOPE_PUBLISH,
  APPROVAL_SCOPE_SPEND,
  APPROVAL_SCOPE_WRITE_FILE,
  type ApprovalScopeExample,
} from "@shared/primitives/approval-card-examples"
import type { ChatToolCall } from "@shared/primitives/chat-protocol"
import type { ApprovalScopeItem } from "./approval-card"

/**
 * Andaime das demonstrações do cartão de autorização.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * ALCANCES saem de `@shared/primitives/approval-card-examples`, porque são
 * dado — e dado é o mesmo nos três idiomas e nas cinco stacks. Se cada stack
 * escrevesse os próprios, as cinco stories deixariam de fotografar a mesma tela
 * e a divergência só apareceria no Chromatic, como diferença de largura que
 * ninguém consegue atribuir a nada.
 *
 * ESTE ARQUIVO É QUEM CONSOME, e é por isso que os controles nascem aqui e não
 * dentro da peça: a §7 da guideline 17 deixa o desenho dos controles, a ênfase
 * de cada escolha e o significado de cada uma do lado de fora do design system.
 * O que a peça conhece é o atributo que marca qual controle conta como
 * resposta.
 *
 * DOIS acessos ao mesmo dicionário, como em `connection-state.fixtures.tsx`, e
 * a duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */

/** Os rótulos de interface do cartão, no idioma da foto. */
export interface ApprovalCardLabels {
  /** A pergunta de cada exemplo, mais a genérica do contraexemplo. */
  question: Record<string, string>
  /** O termo de cada linha do alcance, pela chave que o exemplo compartilhado guarda. */
  scope: Record<string, string>
  /** O rótulo de cada escolha, pelo identificador que o produto do exemplo usa. */
  choice: Record<string, string>
  /** O rótulo do controle que NÃO se declara resposta. */
  learnMore: string
}

type ApprovalContent = { labels: ApprovalCardLabels }

const CONTENT = approvalTranslations as unknown as Record<string, ApprovalContent>

/**
 * Os três tipos de pergunta que a família encontra: usar uma ferramenta que
 * escreve fora, gastar, tocar um arquivo.
 */
export type ApprovalExampleName = "publish" | "spend" | "writeFile"

/**
 * A lista mora aqui e não nas stories: é dela que sai a grade da demonstração e
 * a lista de opções do control, e duas listas escritas à mão discordariam no
 * dia em que um exemplo entrasse.
 */
export const APPROVAL_EXAMPLE_NAMES: readonly ApprovalExampleName[] = [
  "publish",
  "spend",
  "writeFile",
] as const

const SCOPE_BY_NAME: Record<ApprovalExampleName, ApprovalScopeExample[]> = {
  publish: APPROVAL_SCOPE_PUBLISH,
  spend: APPROVAL_SCOPE_SPEND,
  writeFile: APPROVAL_SCOPE_WRITE_FILE,
}

function read(locale: Locale): ApprovalCardLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos do cartão, no idioma corrente. Para dentro de um componente. */
export function useApprovalCardLabels(): ApprovalCardLabels {
  const { locale } = useTranslation(approvalTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function approvalCardLabels(): ApprovalCardLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * Junta a CHAVE do termo ao texto do idioma da foto.
 *
 * O exemplo compartilhado guarda a chave, e não a palavra, porque o termo é
 * rótulo de interface e muda com o idioma; o valor ao lado é dado, e não muda.
 */
export function approvalScope(
  labels: ApprovalCardLabels,
  name: ApprovalExampleName,
): ApprovalScopeItem[] {
  return SCOPE_BY_NAME[name].map((item) => ({
    term: labels.scope[item.termKey] ?? "",
    detail: item.detail,
  }))
}

/** A pergunta daquele exemplo, no idioma da foto. */
export function approvalQuestion(
  labels: ApprovalCardLabels,
  name: ApprovalExampleName,
): string {
  return labels.question[name] ?? ""
}

/**
 * O alcance montado a partir da execução que espera por uma pessoa.
 *
 * Quem monta é QUEM CONSOME, e é o ponto da composição: a execução sai da caixa
 * recolhida com `splitWaitingCalls`, e o que ela carrega — o nome da ferramenta
 * e o que ela vai fazer — vira o alcance da pergunta. A peça não faz essa
 * tradução: ela receberia um dado do vocabulário de outra peça e passaria a
 * conhecer as duas.
 */
export function approvalScopeOfWaiting(
  labels: ApprovalCardLabels,
  call: ChatToolCall,
): ApprovalScopeItem[] {
  const items: ApprovalScopeItem[] = [{ term: labels.scope.tool, detail: call.name }]
  if (call.detail) items.push({ term: labels.scope.effect, detail: call.detail })
  return items
}

/** A pergunta daquela execução, escrita por quem consome. */
export function approvalWaitingQuestion(labels: ApprovalCardLabels): string {
  return labels.question.grant
}

/** A pergunta que não diz nada, usada só como contraexemplo na página. */
export function approvalVagueQuestion(labels: ApprovalCardLabels): string {
  return labels.question.vague
}

/**
 * Os controles da resposta, todos com a MESMA ênfase.
 *
 * Nenhum deles é destacado, e isso é decisão: qual resposta o produto recomenda
 * é política dele, e uma peça que trouxesse a recomendação embutida traria
 * política junto — que é exatamente o que a §7 da guideline 17 mantém do lado
 * de fora. Aqui as três escolhas apenas existem, para que a demonstração tenha
 * o que apertar.
 *
 * E HÁ UM SEGUNDO MOTIVO, mais forte que o primeiro, porque não depende de
 * onde a guideline traçou a fronteira: num cartão que pede autorização, dar
 * ênfase visual a "Aprovar" EMPURRA para aprovar. É padrão escuro conhecido em
 * diálogo de permissão, e um design system que o embarcasse na demonstração o
 * espalharia por todo produto que copiasse o exemplo.
 *
 * A demonstração fica visualmente lisa por causa disso, e é para ficar. Quem
 * consome passa os próprios controles por `actions` e escolhe a ênfase que
 * quiser — a fronteira já é dele. O que não se faz é ENSINAR a escolha aqui.
 * Este parágrafo existe para que "deixar bonito" não desfaça a decisão depois.
 *
 * `data-approval-choice` é escrito AQUI, por quem monta os controles. É o único
 * pedaço do contrato que atravessa a fronteira do que a peça desenha.
 */
export function approvalChoices(
  labels: ApprovalCardLabels,
  choices: readonly string[] = APPROVAL_EXAMPLE_CHOICES,
): ReactNode[] {
  return choices.map((choice) => (
    <Button
      key={choice}
      type="button"
      variant="outline"
      size="sm"
      data-approval-choice={choice}
    >
      {labels.choice[choice]}
    </Button>
  ))
}

/**
 * Um controle que NÃO se declara resposta.
 *
 * Existe para provar a fronteira nos dois sentidos: a peça não relata escolha
 * nenhuma quando o controle acionado não traz o atributo, porque inventar uma
 * escolha que ninguém marcou seria decidir por quem consome.
 */
export function approvalAside(labels: ApprovalCardLabels): ReactNode {
  return (
    <Button key="aside" type="button" variant="ghost" size="sm">
      {labels.learnMore}
    </Button>
  )
}
