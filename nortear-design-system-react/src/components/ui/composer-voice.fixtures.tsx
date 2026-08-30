/**
 * Andaime das demonstrações do ditado — os rótulos e os valores de exemplo.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * nível e o tempo decorrido são dado de exemplo e ficam iguais nos três
 * idiomas: são o que a foto do Chromatic compara, e um número diferente por
 * idioma faria as cinco stacks fotografarem barras de alturas diferentes.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 *
 * Os rótulos do CAMPO não moram aqui: eles já vivem em `composer.fixtures.tsx`,
 * nos dois acessos, e uma segunda cópia divergiria da primeira sem nenhum
 * sinal. Quem monta o trilho importa `useComposerLabels`/`composerLabels` de
 * lá — é o que o `composer-context` desta stack já faz.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import voiceTranslations from "@shared/content/composer-voice/translations.json"
import type { ComposerVoiceLabels } from "./composer-voice"

type VoiceContent = { labels: ComposerVoiceLabels }

const CONTENT = voiceTranslations as unknown as Record<string, VoiceContent>

function read(locale: Locale): ComposerVoiceLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos do controle, no idioma corrente. Para dentro de um componente. */
export function useVoiceLabels(): ComposerVoiceLabels {
  const { locale } = useTranslation(voiceTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function voiceLabels(): ComposerVoiceLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * O nível de exemplo enquanto capta.
 *
 * Nem cheio nem no chão: 1 desenharia o mesmo que a ausência de nível, e 0
 * desenharia um medidor apagado no exato estado em que ele deveria estar vivo.
 * Um valor no meio é o único que prova que o número chega ao desenho.
 */
export const SAMPLE_LEVEL = 0.62

/** O tempo decorrido de exemplo, JÁ ESCRITO — quem formata é quem consome. */
export const SAMPLE_ELAPSED = "0:12"

/** O tempo de exemplo quando a captura já acabou e o texto ainda vem. */
export const SAMPLE_ELAPSED_DONE = "0:34"
