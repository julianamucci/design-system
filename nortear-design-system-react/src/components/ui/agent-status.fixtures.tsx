/**
 * Andaime das demonstrações do estado da execução.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * RELÓGIO é dado de exemplo e fica igual nos três idiomas: ele já chega escrito
 * ao componente, e traduzi-lo aqui faria as cinco stories fotografarem linhas
 * de larguras diferentes conforme o idioma da foto.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer-context.fixtures.tsx`, e
 * a duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import statusTranslations from "@shared/content/agent-status/translations.json"
import { RUN_STATUSES, type RunStatus } from "@shared/primitives/chat-protocol"
import type { AgentStatusLabels } from "./agent-status"

type StatusContent = {
  labels: {
    status: Record<string, string>
    action?: Record<string, string>
  }
}

const CONTENT = statusTranslations as unknown as Record<string, StatusContent>

/**
 * A palavra de cada estado, e o rótulo da ação onde ela existe.
 *
 * O mapa de estados sai de `RUN_STATUSES`, e não de cinco linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
function read(locale: Locale): AgentStatusLabels {
  const raw = (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

  const status = {} as Record<RunStatus, string>
  for (const item of RUN_STATUSES) status[item] = raw.status[item] ?? ""

  const action: Partial<Record<RunStatus, string>> = {}
  // Em espera e concluída ficam sem ação de propósito: começar uma execução é
  // do campo de mensagem, e sobre uma resposta pronta não há o que fazer aqui.
  for (const item of RUN_STATUSES) {
    const label = raw.action?.[item]
    if (label) action[item] = label
  }

  return { status, action }
}

/** Os rótulos da linha, no idioma corrente. Para dentro de um componente. */
export function useAgentStatusLabels(): AgentStatusLabels {
  const { locale } = useTranslation(statusTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function agentStatusLabels(): AgentStatusLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * O relógio de exemplo em cada estado.
 *
 * `idle` não tem relógio, e é a única razão de este mapa ser parcial: nada
 * começou, então não há o que contar. Nos outros quatro o número é o mesmo em
 * toda foto, para que a diferença entre elas seja o estado e não a largura.
 */
const ELAPSED: Partial<Record<RunStatus, string>> = {
  running: "1:04",
  stopped: "0:42",
  complete: "2:11",
  failed: "0:08",
}

/** Quanto tempo mostrar naquele estado, ou nada quando não há o que contar. */
export function elapsedOf(status: RunStatus): string | undefined {
  return ELAPSED[status]
}
