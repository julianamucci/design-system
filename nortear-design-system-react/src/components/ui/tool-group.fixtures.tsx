/**
 * Andaime das demonstrações do grupo de ferramentas.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. As
 * CHAMADAS saem de `@shared/primitives/tool-group-examples`, porque são fala —
 * e fala é a mesma nos três idiomas e nas cinco stacks. Se cada stack
 * escrevesse as próprias chamadas, as cinco stories deixariam de fotografar a
 * mesma tela e a divergência só apareceria no Chromatic, como diferença de
 * largura que ninguém consegue atribuir a nada.
 *
 * DOIS acessos ao mesmo dicionário, como em `agent-status.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import groupTranslations from "@shared/content/tool-group/translations.json"
import { TOOL_CALL_STATES, type ToolCallState } from "@shared/primitives/chat-protocol"
import type { ToolGroupLabels } from "./tool-group"

type GroupContent = {
  labels: {
    title: { one: string; other: string }
    summary: Record<string, string>
    call: Record<string, string>
  }
}

const CONTENT = groupTranslations as unknown as Record<string, GroupContent>

/**
 * O título do resumo, a palavra do conjunto e a palavra de cada chamada.
 *
 * Os dois mapas de estado saem de `TOOL_CALL_STATES`, e não de quatro linhas
 * escritas à mão: estado novo no vocabulário compartilhado entra aqui sozinho,
 * e a story que percorre os estados passa a cobri-lo sem que ninguém lembre de
 * mexer no andaime.
 */
function read(locale: Locale): ToolGroupLabels {
  const raw = (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

  const summary = {} as Record<ToolCallState, string>
  const call = {} as Record<ToolCallState, string>
  for (const state of TOOL_CALL_STATES) {
    summary[state] = raw.summary[state] ?? ""
    call[state] = raw.call[state] ?? ""
  }

  return {
    // O plural mora na `translations.json` e o número entra por substituição:
    // "1 ferramenta" e "{n} ferramentas" são duas frases diferentes em cada
    // idioma, e escolher entre elas aqui é o que impede o componente de
    // escolher por cinco idiomas de uma vez.
    title: (count: number) =>
      count === 1 ? raw.title.one : raw.title.other.replace("{n}", String(count)),
    summary,
    call,
  }
}

/** Os rótulos do grupo, no idioma corrente. Para dentro de um componente. */
export function useToolGroupLabels(): ToolGroupLabels {
  const { locale } = useTranslation(groupTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function toolGroupLabels(): ToolGroupLabels {
  return read(useI18nStore.getState().locale)
}
