/**
 * Andaime das demonstrações do estado da ligação.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. A
 * CONTAGEM é dado de exemplo e fica igual nos três idiomas: ela já chega
 * escrita ao componente, e traduzi-la aqui faria as cinco stories fotografarem
 * linhas de larguras diferentes conforme o idioma da foto.
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
import connectionTranslations from "@shared/content/connection-state/translations.json"
import { CONNECTION_STATES, type ConnectionState } from "@shared/primitives/chat-protocol"
import type { ConnectionStateLabels } from "./connection-state"

type ConnectionContent = {
  labels: {
    state: Record<string, string>
    action?: Record<string, string>
  }
}

const CONTENT = connectionTranslations as unknown as Record<string, ConnectionContent>

/**
 * A palavra de cada estado, e o rótulo da ação onde ela existe.
 *
 * O mapa de estados sai de `CONNECTION_STATES`, e não de três linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
function read(locale: Locale): ConnectionStateLabels {
  const raw = (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

  const state = {} as Record<ConnectionState, string>
  for (const item of CONNECTION_STATES) state[item] = raw.state[item] ?? ""

  const action: Partial<Record<ConnectionState, string>> = {}
  // A ligação de pé fica sem ação de propósito: sobre uma ligação que está
  // funcionando não há o que fazer aqui.
  for (const item of CONNECTION_STATES) {
    const label = raw.action?.[item]
    if (label) action[item] = label
  }

  return { state, action }
}

/** Os rótulos da linha, no idioma corrente. Para dentro de um componente. */
export function useConnectionStateLabels(): ConnectionStateLabels {
  const { locale } = useTranslation(connectionTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function connectionStateLabels(): ConnectionStateLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * A contagem de exemplo, a mesma em toda foto.
 *
 * Uma só, e não um mapa por estado: só `reconnecting` tem tentativa marcada, e
 * um mapa com uma entrada seria uma tabela fingindo escolha. As stories que
 * mostram os outros dois passam esta mesma string de propósito — é assim que
 * elas provam que a peça não a desenha quando nada está agendado.
 */
export const CONNECTION_COUNTDOWN = "em 5 s"
