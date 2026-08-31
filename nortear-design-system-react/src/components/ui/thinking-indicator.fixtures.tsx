/**
 * Andaime das demonstrações do indicador de geração.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface e têm
 * três idiomas. A FALA — a pergunta e a resposta — sai de
 * `@shared/primitives/chat-examples`, que as cinco stacks já compartilham: se
 * cada uma escrevesse a própria conversa, as cinco stories deixariam de
 * fotografar a mesma tela e a divergência só apareceria no Chromatic.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import indicatorTranslations from "@shared/content/thinking-indicator/translations.json"
import { CHAT_CONVERSA } from "@shared/primitives/chat-examples"
import type { ChatMessage } from "./chat-thread"
import { paraMensagens } from "./chat-thread.fixtures"

/**
 * As frases do andaime.
 *
 * Não são props da peça: ela recebe UMA frase e desenha os mesmos três pontos.
 * São as frases que as demonstrações mandam dizer — e a terceira nem é dela, é
 * do controle que faz o texto chegar.
 */
export interface IndicatorLabels {
  /** A frase padrão da espera. É ela que chega a quem ouve a tela. */
  generating: string
  /**
   * Outra frase para a mesma espera.
   *
   * Existe porque o Playground precisa mostrar que a frase é do consumidor: o
   * componente desenha os mesmos três pontos e diz o que lhe mandarem dizer.
   */
  searching: string
  /** O rótulo do controle que faz o texto chegar, na composição da troca. */
  reveal: string
}

type IndicatorContent = { labels: IndicatorLabels }

const CONTENT = indicatorTranslations as unknown as Record<string, IndicatorContent>

function read(locale: Locale): IndicatorLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** As frases do andaime, no idioma corrente. Para dentro de um componente. */
export function useIndicatorLabels(): IndicatorLabels {
  const { locale } = useTranslation(indicatorTranslations)
  return useMemo(() => read(locale), [locale])
}

/** As mesmas frases, fora de React — é o que a `play` compara. */
export function indicatorLabels(): IndicatorLabels {
  return read(useI18nStore.getState().locale)
}

/** A pergunta, em Markdown. */
export function questionText(): string {
  return CHAT_CONVERSA[0]!.content
}

/** A resposta, em Markdown — a mesma que a conversa de exemplo já traz. */
export function answerText(): string {
  return CHAT_CONVERSA[1]!.content
}

/**
 * A conversa com a pergunta feita e nada respondido ainda.
 *
 * É o estado exato em que o indicador existe: há o que responder, e a resposta
 * ainda não começou a vir.
 */
export function askedMessages(): ChatMessage[] {
  return paraMensagens([CHAT_CONVERSA[0]!])
}
