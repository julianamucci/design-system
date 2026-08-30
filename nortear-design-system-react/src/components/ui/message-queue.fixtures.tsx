/**
 * Andaime das demonstrações da fila — um construtor por caso.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * TEXTO das mensagens é fala, e fica igual nos três idiomas: traduzi-lo faria
 * as cinco stories fotografarem filas de larguras diferentes conforme o idioma
 * da foto, e a fala não é o que a peça documenta.
 *
 * UM acesso só ao dicionário, e é uma divergência anotada em relação ao
 * `composer-context` desta stack: lá há um par hook/função pura, aqui só a
 * função pura, porque é a lista fechada que as cinco stacks compartilham. Ela
 * lê o idioma corrente da loja e serve tanto à `play` — onde não existe
 * componente em que pendurar um hook — quanto ao desenho. Quem desenha
 * subscreve a loja no ponto de uso e passa o idioma adiante, e é isso que faz a
 * story se redesenhar quando o idioma muda.
 *
 * Os rótulos do CAMPO não são escritos de novo aqui: eles já vivem em
 * `composer.fixtures.tsx`, e uma segunda cópia divergiria da primeira sem
 * nenhum sinal. O que existe abaixo é o REPASSE do nome, para quem monta a
 * fila acima do campo achar as duas coisas no mesmo lugar.
 */
import { useI18nStore, type Locale } from "@/lib/i18n"
import queueTranslations from "@shared/content/message-queue/translations.json"
import type { QueuedMessage } from "@shared/primitives/chat-protocol"
import type { MessageQueueLabels } from "./message-queue"

export { composerLabels } from "./composer.fixtures"

type QueueContent = { labels: MessageQueueLabels }

const CONTENT = queueTranslations as unknown as Record<string, QueueContent>

/**
 * Os rótulos da fila.
 *
 * O idioma entra por parâmetro quando quem chama já o tem à mão — é o caso de
 * quem desenha, que subscreveu a loja e precisa redesenhar quando ele muda. Sem
 * argumento, a função lê o idioma corrente, que é o que a `play` compara.
 */
export function queueLabels(locale?: Locale): MessageQueueLabels {
  const current = locale ?? useI18nStore.getState().locale
  return (CONTENT[current] ?? CONTENT["pt-BR"]).labels
}

/**
 * As três falas de exemplo, em ordem de escrita.
 *
 * São dado, e por isso ficam fora da tradução. Três porque a fila só ensina
 * alguma coisa a partir do terceiro item: com dois, "a segunda" e "a última"
 * são a mesma coisa, e a posição deixa de ser informação.
 */
const SAMPLE_TEXTS = [
  "Manda o resumo de ontem",
  "E o prazo?",
  "Inclui o gráfico de custo",
]

/** O texto da mensagem que o Playground desenha. */
export const SAMPLE_TEXT = SAMPLE_TEXTS[1]!

/** Três esperando a vez — nenhuma saiu ainda, e todas se retiram. */
export function waiting(): QueuedMessage[] {
  return SAMPLE_TEXTS.map((text, i): QueuedMessage => ({
    id: `m${i + 1}`,
    text,
    state: "waiting",
  }))
}

/**
 * A primeira já está indo, e as outras duas esperam.
 *
 * É o par que a peça existe para desenhar: uma sem botão de retirar e marcada
 * como ocupada, duas com o botão à mão.
 */
export function sending(): QueuedMessage[] {
  return SAMPLE_TEXTS.map((text, i): QueuedMessage => ({
    id: `m${i + 1}`,
    text,
    state: i === 0 ? "sending" : "waiting",
  }))
}

/**
 * Uma fila que passa de nove.
 *
 * Doze porque é onde a posição ganha dois dígitos: é o único caso em que o
 * alinhamento dos números tem o que provar, e ele não aparece em fila curta.
 */
export function longQueue(): QueuedMessage[] {
  return Array.from({ length: 12 }, (_, i): QueuedMessage => ({
    id: `m${i + 1}`,
    text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length]!,
    state: i === 0 ? "sending" : "waiting",
  }))
}
